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
import { Loader2 } from 'lucide-react';

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
        const loginUrl = 'https://publicgermany.vercel.app/';
        const safeName = studentName || 'Student';
        const safeService = (serviceType || '').split('_').join(' ') || 'Service';
        const adminNote = (payload.admin_note || '').toString();
        const buttonHtml = `<a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#D00000;color:#ffffff;text-decoration:none;border-radius:6px;">Open My Account</a>`;

        if (userEmail) {
          await sendEmail(
            userEmail,
            `Payment ${statusText} for ${safeService}`,
            `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;font-size:14px;">
               <p>Hi ${safeName},</p>
               <p>Your payment for <strong>${safeService}</strong> has been <strong>${statusText}</strong>.</p>
               <p>Amount this update: <strong>${amountText}</strong>.</p>
               <p style="margin-top:8px;">Summary:</p>
               <ul style="margin:4px 0 0 16px;padding:0;">
                 ${targetTotal != null ? `<li>Total amount: <strong>${targetCurr} ${Number(targetTotal).toLocaleString()}</strong></li>` : ''}
                 <li>Total received so far: <strong>${targetCurr} ${receivedSum.toLocaleString()}</strong></li>
                 ${targetTotal != null ? `<li>Pending amount: <strong>${targetCurr} ${remaining!.toLocaleString()}</strong></li>` : ''}
               </ul>
               <p style="margin-top:12px;">You can download your detailed bill anytime from your account:</p>
               <p><a href="${loginUrl}" style="color:#1D4ED8;text-decoration:underline;">Open Payments &amp; Download Bill</a></p>
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Manage student transactions</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchPayments} className="h-8 w-8 p-0 sm:hidden">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Card className="shadow-sm border-none sm:border">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-8 text-xs"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none sm:border shadow-sm">
          <CardHeader className="px-3 py-2 bg-muted/30 hidden sm:flex">
            <CardTitle className="text-sm font-bold flex items-center justify-between w-full">
              <span>Records ({filteredPayments.length})</span>
              <Button size="sm" variant="ghost" onClick={fetchPayments} className="h-7 w-7 p-0">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10"><InlineLoader label="Loading..." /></div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-muted-foreground">No records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="px-2 py-1.5 sm:px-4 sm:py-2">Student / Service</th>
                      <th className="px-2 py-1.5 sm:px-4 sm:py-2">Payment</th>
                      <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayments.map((row) => {
                      const payment = (row.service_payments || [])[0];
                      const status = payment?.status || 'pending';
                      const studentName = row.profiles?.full_name || 'Student';
                      
                      return (
                        <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-2 py-2 sm:px-4 sm:py-3 max-w-[120px] sm:max-w-none">
                            <p className="font-semibold text-foreground truncate">{studentName}</p>
                            <p className="text-[10px] text-muted-foreground truncate capitalize">
                              {(row.service_type || '').split('_').join(' ')}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge className={`${getStatusColor(status)} text-[8px] px-1 py-0 border-none h-3.5`}>
                                {status}
                              </Badge>
                              {payment?.proof_url && (
                                <a href={payment.proof_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  defaultValue={payment?.amount ?? row.service_price}
                                  onChange={(e) => setEditState((s) => ({
                                    ...s,
                                    [row.id]: { ...s[row.id], amount: Number(e.target.value) }
                                  }))}
                                  className="h-6 w-14 sm:w-20 text-[10px] px-1"
                                />
                                <span className="text-[9px] text-muted-foreground uppercase">
                                  {row.target_currency || row.service_currency}
                                </span>
                              </div>
                              <Select
                                defaultValue={payment?.status || 'pending'}
                                onValueChange={(v) => setEditState((s) => ({
                                  ...s,
                                  [row.id]: { ...s[row.id], status: v }
                                }))}
                              >
                                <SelectTrigger className="h-6 w-20 sm:w-28 text-[10px] px-1">
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
                          <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-6 px-2 text-[9px] w-14 sm:w-16"
                                onClick={() => savePayment(row.id, row.user_id, payment?.id, row.service_price, row.service_currency, studentName, row.service_type)}
                              >
                                {payment ? 'Save' : 'Create'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[9px] w-14 sm:w-16"
                                disabled={sendingBillId === row.id}
                                onClick={async () => {
                                  setSendingBillId(row.id);
                                  try {
                                    await savePayment(row.id, row.user_id, payment?.id, row.service_price, row.service_currency, studentName, row.service_type);
                                    await sendPaymentBill(row, payment);
                                  } finally {
                                    setSendingBillId(null);
                                  }
                                }}
                              >
                                {sendingBillId === row.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : 'Bill'}
                              </Button>
                            </div>
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
