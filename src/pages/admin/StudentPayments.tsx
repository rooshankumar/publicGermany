import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendEmail } from '@/lib/sendEmail';
import { sendPaymentBillEmail } from '@/lib/paymentBillEmail';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StudentPayments() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string } | null>(null);
  const { toast } = useToast();
  const [editState, setEditState] = useState<Record<string, {
    amount?: number | null;
    status?: string;
    admin_note?: string | null;
    proof_url?: string | null;
    target_total_amount?: number | null;
    target_currency?: string | null;
  }>>({});
  const [sendingBillId, setSendingBillId] = useState<string | null>(null);

  const resolveEmail = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (!error && data) return data as string;
      return null;
    } catch {
      return null;
    }
  };

  const sendPaymentBill = async (row: any, payment?: any) => {
    let email = studentInfo?.email || null;
    if (!email) {
      email = await resolveEmail(row.user_id);
    }

    if (!email) {
      toast({
        title: "Email not found",
        description: "Unable to resolve student email for payment bill",
        variant: "destructive",
      });
      return;
    }

    setSendingBillId(row.id);
    try {
      const paymentsArr = (row.service_payments || []) as any[];
      const receivedSum = paymentsArr
        .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
        .reduce((acc: number, p: any) => acc + (Number(p?.amount) || 0), 0);

      const targetTotal = Number(row.target_total_amount ?? row.service_price ?? 0);
      const currency = row.target_currency || row.service_currency || 'INR';
      const remaining = Math.max(0, targetTotal - receivedSum);

      const paymentStatus =
        remaining <= 0 ? 'received' :
        receivedSum > 0 ? 'partial' :
        'pending';

      await sendPaymentBillEmail({
        serviceId: row.id,
        userId: row.user_id,
        studentName: studentInfo?.name || 'Student',
        studentEmail: email,
        studentPhone: 'N/A',
        serviceType: row.service_type,
        serviceName: (row.service_type || '').split('_').join(' '),
        serviceDescription: 'Study abroad service',
        serviceAmount: row.service_price || 0,
        totalAmount: targetTotal,
        amountReceived: receivedSum,
        amountPending: remaining,
        paymentStatus: paymentStatus as any,
        currency,
        includeAdmin: true,
      });

      try {
        await supabase.from('notifications').insert({
          user_id: row.user_id,
          title: 'Payment Bill Received',
          type: 'payment_bill',
          ref_id: row.id,
          body: `Your payment bill for ${(row.service_type || '').split('_').join(' ')} has been sent. Total: ${currency} ${targetTotal.toLocaleString()}, Paid: ${currency} ${receivedSum.toLocaleString()}, Remaining: ${currency} ${remaining.toLocaleString()}`,
          meta: {
            service_type: row.service_type,
            total_amount: targetTotal,
            amount_received: receivedSum,
            amount_pending: remaining,
            currency,
            status: paymentStatus,
          },
        });
      } catch (notifErr) {
        console.warn('Bill notification failed:', notifErr);
      }

      toast({
        title: "Payment bill sent",
        description: `Bill sent successfully to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending payment bill:', error);
      toast({
        title: "Error sending bill",
        description: error?.message || 'Failed to send payment bill',
        variant: "destructive",
      });
    } finally {
      setSendingBillId(null);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchPayments();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('student-payments-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, () => {
          fetchPayments();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [studentId]);

  const fetchPayments = async () => {
    if (!studentId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests' as any)
      .select(`
        id,
        user_id,
        service_type,
        service_price,
        service_currency,
        target_total_amount,
        target_currency,
        created_at,
        profiles:profiles!inner(user_id, full_name),
        service_payments (
          id,
          amount,
          currency,
          status,
          admin_note,
          proof_url,
          created_at
        )
      `)
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Get email for this student
      const email = await resolveEmail(studentId);
      const typedData = (data || []) as any[];
      const name = typedData[0]?.profiles?.full_name || 'Unknown Student';
      setStudentInfo({ name, email: email || '' });
      setPayments(typedData);
    }
    setLoading(false);
  };

  const savePayment = async (
    requestId: string,
    userId: string,
    existingPaymentId?: string,
    defaultAmount?: number | null,
    defaultCurrency?: string | null,
    studentName?: string | null,
    serviceType?: string | null
  ) => {
    const payload = editState[requestId] || {};
    let error = null as any;
    if (existingPaymentId) {
      const res = await supabase
        .from('service_payments' as any)
        .update(payload)
        .eq('id', existingPaymentId);
      error = res.error;
    } else {
      const resolvedAmount = (payload.amount ?? defaultAmount);
      if (resolvedAmount == null || Number.isNaN(Number(resolvedAmount))) {
        toast({ title: 'Amount required', description: 'Please enter an amount before creating a payment.', variant: 'destructive' });
        return;
      }
      const insertPayload: any = {
        service_id: requestId,
        user_id: userId,
        amount: Number(resolvedAmount),
        status: payload.status || 'pending',
        currency: defaultCurrency || 'INR',
        proof_url: payload.proof_url || null,
        admin_note: payload.admin_note || null,
      };
      const res = await supabase
        .from('service_payments' as any)
        .insert(insertPayload);
      error = res.error;
    }

    if (!error && (typeof payload.target_total_amount === 'number' || typeof payload.target_currency === 'string')) {
      const updateFields: any = {};
      if (typeof payload.target_total_amount === 'number') updateFields.target_total_amount = payload.target_total_amount;
      if (typeof payload.target_currency === 'string') updateFields.target_currency = payload.target_currency;
      if (Object.keys(updateFields).length > 0) {
        const { error: totalErr } = await supabase
          .from('service_requests' as any)
          .update(updateFields)
          .eq('id', requestId);
        if (totalErr) {
          toast({ title: 'Totals not saved', description: totalErr.message, variant: 'destructive' });
        }
      }
    }

    if (error) {
      toast({
        title: "Error updating payment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment updated",
        description: "Payment details updated successfully",
      });
      fetchPayments();

      // Email notifications
      try {
        const userEmail = await resolveEmail(userId);
        let currentAmount: number | null | undefined = undefined;
        let currentCurrency: string | null | undefined = undefined;
        let currentStatus: string | null | undefined = undefined;
        if (existingPaymentId) {
          try {
            const { data: cur } = await supabase
              .from('service_payments' as any)
              .select('amount, currency, status')
              .eq('id', existingPaymentId)
              .single();
            currentAmount = (cur as any)?.amount ?? undefined;
            currentCurrency = (cur as any)?.currency ?? undefined;
            currentStatus = (cur as any)?.status ?? undefined;
          } catch {}
        }

        const statusText = (payload.status ?? currentStatus ?? 'pending') as string;
        const resolvedAmount = (payload.amount ?? currentAmount ?? defaultAmount);
        const resolvedCurrency = (currentCurrency ?? defaultCurrency ?? 'INR');
        const amountText = resolvedAmount != null ? `${resolvedCurrency} ${Number(resolvedAmount).toLocaleString()}` : '—';

        let receivedSum = 0;
        try {
          const { data: rows } = await supabase
            .from('service_payments' as any)
            .select('amount, status')
            .eq('service_id', requestId);
          receivedSum = (rows || [])
            .filter((r: any) => (r.status || '').toLowerCase() === 'received')
            .reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
        } catch {}
        
        let targetTotal: number | null = null;
        let targetCurr: string = resolvedCurrency;
        try {
          const { data: parent } = await supabase
            .from('service_requests' as any)
            .select('target_total_amount, target_currency, service_price, service_currency')
            .eq('id', requestId)
            .single();
          targetTotal = (parent as any)?.target_total_amount ?? (parent as any)?.service_price ?? null;
          targetCurr = (parent as any)?.target_currency ?? (parent as any)?.service_currency ?? resolvedCurrency;
        } catch {}
        const remaining = targetTotal != null ? Math.max(0, Number(targetTotal) - Number(receivedSum)) : null;
        const totalsHtml = `
          <p style="margin-top:8px;color:#444">Totals</p>
          <ul style="margin:4px 0 0 16px;padding:0;color:#444">
            ${targetTotal != null ? `<li><strong>Total Amount:</strong> ${targetCurr} ${Number(targetTotal).toLocaleString()}</li>` : ''}
            <li><strong>Amount Received:</strong> ${targetCurr} ${receivedSum.toLocaleString()}</li>
            ${targetTotal != null ? `<li><strong>Amount Remaining:</strong> ${targetCurr} ${remaining!.toLocaleString()}</li>` : ''}
          </ul>
        `;
        const loginUrl = 'https://publicgermany.vercel.app/';
        const safeName = studentName || 'Student';
        const safeService = (serviceType || '').split('_').join(' ') || 'Service';
        const adminNote = (payload.admin_note || '').toString();
        const buttonHtml = `<a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#D00000;color:#ffffff;text-decoration:none;border-radius:6px;">Open My Account</a>`;

        if (userEmail) {
          await sendEmail(
            userEmail,
            `Payment ${existingPaymentId ? 'updated' : 'created'}: ${statusText}`,
            `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;">
               <p>Your payment status has been <strong>${statusText}</strong>.</p>
               <p><strong>Name:</strong> ${safeName}</p>
               <p><strong>Service:</strong> ${safeService}</p>
               <p><strong>Amount Received (this update):</strong> ${amountText}</p>
               ${totalsHtml}
               ${adminNote ? `<p><strong>Admin Notes:</strong> ${adminNote}</p>` : ''}
               <div style="margin-top:12px;">${buttonHtml}</div>
             </div>`
          );
        }

        const nowText = new Date().toLocaleString();
        await sendEmail(
          'publicgermany@outlook.com',
          `Admin notice: payment ${existingPaymentId ? 'updated' : 'created'} (${statusText})`,
          `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;">
             <p>A payment was <strong>${existingPaymentId ? 'updated' : 'created'}</strong>.</p>
             <p><strong>Name:</strong> ${safeName}</p>
             <p><strong>Service:</strong> ${safeService}</p>
             <p><strong>Amount:</strong> ${amountText}</p>
             <p><strong>Date:</strong> ${nowText}</p>
             <hr style="margin:12px 0;border:none;border-top:1px solid #eee;"/>
             <p style="color:#666"><strong>Request ID:</strong> ${requestId}<br/>
             <strong>User ID:</strong> ${userId}<br/>
             <strong>Status:</strong> ${statusText}</p>
           </div>`
        );
      } catch {}
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  // Calculate totals for this student based on actual payment records
  const studentTotals = payments.reduce(
    (acc, row) => {
      const paymentsArr = (row.service_payments || []) as any[];
      
      paymentsArr.forEach((p: any) => {
        const amount = Number(p.amount) || 0;
        
        // Add to total (all payments)
        acc.total += amount;
        
        // Add to received if status is 'received'
        if (p.status === 'received') {
          acc.received += amount;
        }
        
        // Add to pending if status is 'pending'
        if (p.status === 'pending') {
          acc.pending += amount;
        }
      });
      
      return acc;
    },
    { total: 0, received: 0, pending: 0 }
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/payments')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{studentInfo?.name || 'Student'} - Payments</h1>
            <p className="text-muted-foreground">{studentInfo?.email}</p>
          </div>
        </div>

        {/* Student Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">INR {studentTotals.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                INR {studentTotals.received.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                INR {studentTotals.pending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <InlineLoader label="Loading payments" />
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payments found for this student</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Service</th>
                      <th className="text-left p-3 font-medium">Amount / Totals</th>
                      <th className="text-left p-3 font-medium">Proof</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Admin Note</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((row) => {
                      const payment = (row.service_payments || [])[0];
                      return (
                      <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 capitalize truncate max-w-[200px]">{(row.service_type || '').split('_').join(' ')}</td>
                        <td className="p-3 whitespace-nowrap align-top">
                          <div className="rounded-md border p-2 bg-muted/40">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-xs text-muted-foreground">Amount Received (this update)</label>
                              <div className="ml-auto text-xs text-muted-foreground">{payment?.currency || row.target_currency || row.service_currency || ''}</div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                type="number"
                                defaultValue={payment?.amount ?? row.service_price}
                                onChange={(e) => setEditState((s) => ({
                                  ...s,
                                  [row.id]: { ...s[row.id], amount: Number(e.target.value) }
                                }))}
                                className="w-32"
                              />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-xs text-muted-foreground">Total Amount</label>
                              <Input
                                type="number"
                                defaultValue={row.target_total_amount ?? row.service_price ?? ''}
                                onChange={(e) => setEditState((s) => ({
                                  ...s,
                                  [row.id]: { ...s[row.id], target_total_amount: e.target.value === '' ? null : Number(e.target.value) }
                                }))}
                                className="w-32"
                              />
                              <Select
                                defaultValue={(row.target_currency || row.service_currency || 'INR')}
                                onValueChange={(val) => setEditState((s) => ({
                                  ...s,
                                  [row.id]: { ...s[row.id], target_currency: val }
                                }))}
                              >
                                <SelectTrigger className="w-28 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INR">INR</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {(() => {
                              const paymentsArr = (row.service_payments || []) as any[];
                              const receivedSum = paymentsArr
                                .filter((p) => (p?.status || '').toLowerCase() === 'received')
                                .reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
                              const targetTotal = Number(row.target_total_amount ?? row.service_price ?? 0);
                              const curr = row.target_currency || row.service_currency || '';
                              const remaining = Math.max(0, targetTotal - receivedSum);
                              return (
                                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                  <span><strong>Total Amount:</strong> {curr} {isNaN(targetTotal) ? '-' : targetTotal.toLocaleString()}</span>
                                  <span><strong>Amount Received:</strong> {curr} {receivedSum.toLocaleString()}</span>
                                  <span><strong>Amount Remaining:</strong> {curr} {remaining.toLocaleString()}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="p-3">
                          {payment?.proof_url ? (
                            <a href={payment.proof_url} className="underline" target="_blank" rel="noreferrer">View</a>
                          ) : (
                            <span className="text-muted-foreground">No proof</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(payment?.status || 'pending')}>
                              {payment?.status || 'pending'}
                            </Badge>
                            <Select
                              defaultValue={payment?.status || 'pending'}
                              onValueChange={(v) => setEditState((s) => ({
                                ...s,
                                [row.id]: { ...s[row.id], status: v }
                              }))}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            placeholder="Admin note"
                            defaultValue={payment?.admin_note || ''}
                            onChange={(e) => setEditState((s) => ({
                              ...s,
                              [row.id]: { ...s[row.id], admin_note: e.target.value }
                            }))}
                          />
                        </td>
                        <td className="p-3">{new Date(row.created_at).toLocaleDateString()}</td>
                        <td className="p-3 space-x-2">
                          <Button
                            size="sm"
                            onClick={() => savePayment(
                              row.id,
                              row.user_id,
                              payment?.id,
                              row.service_price,
                              row.service_currency,
                              studentInfo?.name || null,
                              row.service_type || null
                            )}
                          >
                            {payment ? 'Save' : 'Create'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingBillId === row.id}
                            onClick={async () => {
                              await savePayment(
                                row.id,
                                row.user_id,
                                payment?.id,
                                row.service_price,
                                row.service_currency,
                                studentInfo?.name || null,
                                row.service_type || null
                              );
                              await sendPaymentBill(row, payment);
                            }}
                          >
                            {sendingBillId === row.id ? 'Sending...' : 'Send Bill'}
                          </Button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
