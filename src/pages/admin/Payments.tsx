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

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]); // now holds service_requests with joined profiles and service_payments
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendingBillId, setSendingBillId] = useState<string | null>(null);
  const { toast } = useToast();
  const [editState, setEditState] = useState<Record<string, {
    amount?: number | null;
    status?: string;
    admin_note?: string | null;
    proof_url?: string | null;
    target_total_amount?: number | null;
    target_currency?: string | null;
  }>>({});

  // Simple debounce hook
  function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }

  // Helper to resolve a user's email from their auth.user_id (RPC is already used elsewhere)
  const resolveEmail = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (!error && data) return data as string;
      return null;
    } catch {
      return null;
    }
  };

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchPayments();
    
    // Set up real-time subscription (service_payments table)
    const channel = supabase
      .channel('service-payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPayments = async () => {
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
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Attach user email via RPC get_user_email per row
      const withEmails = await Promise.all((data || []).map(async (row: any) => {
        try {
          const { data: emailData, error: emailErr } = await (supabase as any).rpc('get_user_email', { p_user_id: row.user_id });
          const email = emailErr ? null : (emailData as string | null);
          return { ...row, profiles: { ...(row.profiles || {}), email } };
        } catch {
          return { ...row, profiles: { ...(row.profiles || {}), email: null } };
        }
      }));
      setPayments(withEmails || []);
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
      // insert new payment row
      const resolvedAmount = (payload.amount ?? defaultAmount);
      if (resolvedAmount == null || Number.isNaN(Number(resolvedAmount))) {
        toast({ title: 'Amount required', description: 'Please enter an amount before creating a payment (defaults to the service price if available).', variant: 'destructive' });
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

    // If target_total_amount or target_currency were edited, persist on parent service_request
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

      // Create notification for student about payment update
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Payment Status Updated',
          type: 'payment',
          ref_id: requestId,
          meta: {
            service_type: serviceType,
            status: payload.status || 'pending',
            amount: payload.amount,
          },
        });
      } catch (notifErr) {
        console.warn('Student notification failed:', notifErr);
      }

      // Fire-and-forget email notifications (user + admin)
      try {
        const userEmail = await resolveEmail(userId);
        // Fetch current stored payment values when updating existing row so emails show accurate, latest info
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

        // Compute totals
        // 1) Received sum for this request (status = 'received')
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
        // 2) Target total from parent service_requests
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

        // Admin notification (include Name, Service, Amount, Date)
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
      } catch {
        // do not block UI on email errors
      }
    }
  };

  const filteredPayments = payments.filter(payment => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    const matchesSearch = !q || (payment.id || '').toLowerCase().includes(q) ||
                         (payment.user_id || '').toLowerCase().includes(q) ||
                         (payment.profiles?.full_name || '').toLowerCase().includes(q) ||
                         (payment.service_type || '').toLowerCase().includes(q);
    const paymentRow = (payment.service_payments || [])[0];
    const matchesStatus = statusFilter === 'all' || (paymentRow?.status || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sendPaymentBill = async (
    row: any,
    payment?: any
  ) => {
    if (!row.profiles?.email) {
      toast({
        title: "Email not found",
        description: "Unable to resolve student email for payment bill",
        variant: "destructive",
      });
      return;
    }

    setSendingBillId(row.id);
    try {
      // Re-fetch to get latest data after save
      const { data: latestPayments } = await supabase
        .from('service_payments' as any)
        .select('amount, status')
        .eq('service_id', row.id);
      
      const receivedSum = (latestPayments || [])
        .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
        .reduce((acc: number, p: any) => acc + (Number(p?.amount) || 0), 0);

      // Re-fetch service request for latest totals
      const { data: latestRequest } = await supabase
        .from('service_requests' as any)
        .select('target_total_amount, target_currency, service_price, service_currency')
        .eq('id', row.id)
        .single();

      const targetTotal = (latestRequest as any)?.target_total_amount ?? (latestRequest as any)?.service_price ?? row.target_total_amount ?? row.service_price ?? 0;
      const currency = (latestRequest as any)?.target_currency ?? (latestRequest as any)?.service_currency ?? row.target_currency ?? row.service_currency ?? 'INR';
      const remaining = Math.max(0, targetTotal - receivedSum);

      const paymentStatus = 
        remaining <= 0 ? 'received' : 
        receivedSum > 0 ? 'partial' : 
        'pending';

      await sendPaymentBillEmail({
        serviceId: row.id,
        userId: row.user_id,
        studentName: row.profiles?.full_name || 'Student',
        studentEmail: row.profiles?.email,
        studentPhone: row.profiles?.phone || 'N/A',
        serviceType: row.service_type,
        serviceName: (row.service_type || '').split('_').join(' '),
        serviceDescription: 'Study abroad service',
        serviceAmount: row.service_price || 0,
        totalAmount: targetTotal,
        amountReceived: receivedSum,
        amountPending: remaining,
        paymentStatus: paymentStatus as any,
        currency,
        includeAdmin: true
      });

      // Create notification for student about the bill
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
        description: `Bill sent successfully to ${row.profiles?.email}`,
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments Management</h1>
            <p className="text-muted-foreground">Monitor and manage all payment transactions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 glass-subtle">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by student name, service type, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <InlineLoader label="Loading payments" />
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Request ID</th>
                      <th className="text-left p-3 font-medium">Student</th>
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
                    {filteredPayments.map((row) => {
                      const payment = (row.service_payments || [])[0];
                      return (
                      <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-sm truncate max-w-[160px] md:max-w-[220px]">{row.id}</td>
                        <td className="p-3 truncate max-w-[260px]">
                          <div className="flex flex-col">
                            {(() => {
                              const email: string | undefined = row.profiles?.email;
                              const inferred = email ? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : '';
                              const name = row.profiles?.full_name || inferred || 'Unknown Student';
                              return (
                                <>
                                  <span className="font-medium truncate">{name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{email || row.user_id}</span>
                                </>
                              );
                            })()}
                          </div>
                        </td>
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
                            disabled={sendingBillId === row.id}
                            onClick={async () => {
                              // Save payment first, then send bill
                              await savePayment(
                                row.id,
                                row.user_id,
                                payment?.id,
                                row.service_price,
                                row.service_currency,
                                row.profiles?.full_name || null,
                                row.service_type || null
                              );
                              // Automatically send bill after saving
                              await sendPaymentBill(row, payment);
                            }}
                          >
                            {sendingBillId === row.id ? 'Sending...' : (payment ? 'Save & Send Bill' : 'Create & Send Bill')}
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
