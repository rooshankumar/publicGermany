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
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

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
  };

  useEffect(() => {
    if (studentId) {
      fetchPayments();
      
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

    // First handle payment update/insert if anything relevant changed
    if (payload.amount !== undefined || payload.status !== undefined || payload.admin_note !== undefined) {
      if (existingPaymentId) {
        const updatePayload: any = {};
        if (payload.amount !== undefined) updatePayload.amount = payload.amount;
        if (payload.status !== undefined) updatePayload.status = payload.status;
        if (payload.admin_note !== undefined) updatePayload.admin_note = payload.admin_note;

        const res = await supabase
          .from('service_payments' as any)
          .update(updatePayload)
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
    }

    // Then handle target amount/currency update on service_requests
    if (!error && (payload.target_total_amount !== undefined || payload.target_currency !== undefined)) {
      const updateFields: any = {};
      if (payload.target_total_amount !== undefined) updateFields.target_total_amount = payload.target_total_amount;
      if (payload.target_currency !== undefined) updateFields.target_currency = payload.target_currency;
      
      const { error: totalErr } = await supabase
        .from('service_requests' as any)
        .update(updateFields)
        .eq('id', requestId);
      
      if (totalErr) {
        error = totalErr;
        toast({ title: 'Totals not saved', description: totalErr.message, variant: 'destructive' });
      }
    }

    if (error) {
      toast({
        title: "Error updating",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated successfully",
        description: "Details have been saved",
      });
      fetchPayments();
      setEditState(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
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

  const studentTotals = payments.reduce(
    (acc, row) => {
      const paymentsArr = (row.service_payments || []) as any[];
      const receivedSum = paymentsArr
        .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
        .reduce((total: number, p: any) => total + (Number(p?.amount) || 0), 0);
      const targetTotal = Number(row.target_total_amount ?? row.service_price ?? 0) || 0;
      const remaining = Math.max(0, targetTotal - receivedSum);
      acc.total += targetTotal;
      acc.received += receivedSum;
      acc.pending += remaining;
      return acc;
    },
    { total: 0, received: 0, pending: 0 }
  );

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/payments')}
            className="gap-2 text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{studentInfo?.name || 'Student'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{studentInfo?.email}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-sm sm:text-xl font-bold">₹{studentTotals.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Received</p>
              <p className="text-sm sm:text-xl font-bold text-green-600 dark:text-green-400">
                ₹{studentTotals.received.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm col-span-2 md:col-span-1">
            <CardContent className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Pending</p>
              <p className="text-sm sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                ₹{studentTotals.pending.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-none sm:border shadow-sm">
          <CardHeader className="px-4 py-3 bg-muted/30">
            <CardTitle className="text-sm sm:text-base font-bold">Payment Records ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12"><InlineLoader label="Loading payments" /></div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[120px]">Service</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[200px]">Details</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((row) => {
                      const payment = (row.service_payments || [])[0];
                      const receivedSum = (row.service_payments || [])
                        .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
                        .reduce((acc: number, p: any) => acc + (Number(p?.amount) || 0), 0);
                      const targetTotal = row.target_total_amount ?? row.service_price ?? 0;
                      const remaining = Math.max(0, targetTotal - receivedSum);
                      const curr = row.target_currency || row.service_currency || 'INR';

                      return (
                        <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 sm:px-4 sm:py-3">
                            <p className="font-semibold text-foreground line-clamp-1">{(row.service_type || '').split('_').join(' ')}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</p>
                            {payment?.proof_url && (
                              <a href={payment.proof_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-0.5 mt-1">
                                Proof <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10">Recv:</span>
                                <Input
                                  type="number"
                                  defaultValue={payment?.amount ?? row.service_price}
                                  onChange={(e) => setEditState((s) => ({
                                    ...s,
                                    [row.id]: { ...s[row.id], amount: Number(e.target.value) }
                                  }))}
                                  className="h-7 w-20 text-[11px] px-1.5"
                                />
                                <span className="text-[10px] text-muted-foreground">{curr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10 text-primary font-medium">Total:</span>
                                <Input
                                  type="number"
                                  defaultValue={targetTotal}
                                  onChange={(e) => setEditState((s) => ({
                                    ...s,
                                    [row.id]: { ...s[row.id], target_total_amount: Number(e.target.value) }
                                  }))}
                                  className="h-7 w-20 text-[11px] px-1.5 border-primary/50"
                                />
                                <Select
                                  defaultValue={curr}
                                  onValueChange={(v) => setEditState((s) => ({
                                    ...s,
                                    [row.id]: { ...s[row.id], target_currency: v }
                                  }))}
                                >
                                  <SelectTrigger className="h-7 w-16 text-[10px] px-1.5 border-none bg-transparent">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="INR">INR</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Input
                                placeholder="Admin note..."
                                defaultValue={payment?.admin_note || ''}
                                onChange={(e) => setEditState((s) => ({
                                  ...s,
                                  [row.id]: { ...s[row.id], admin_note: e.target.value }
                                }))}
                                className="h-7 text-[11px] px-1.5"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10">Status:</span>
                                <Select
                                  defaultValue={payment?.status || 'pending'}
                                  onValueChange={(v) => setEditState((s) => ({
                                    ...s,
                                    [row.id]: { ...s[row.id], status: v }
                                  }))}
                                >
                                  <SelectTrigger className="h-7 w-28 text-[11px] px-1.5">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="text-[9px] text-muted-foreground flex gap-2 pt-1 border-t border-border/40">
                                <span className={remaining > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                                  Due: {curr}{remaining.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 px-3 text-[10px] w-20"
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
                                className="h-7 px-3 text-[10px] w-20"
                                disabled={sendingBillId === row.id}
                                onClick={async () => {
                                  setSendingBillId(row.id);
                                  try {
                                    await savePayment(row.id, row.user_id, payment?.id, row.service_price, row.service_currency, studentInfo?.name || null, row.service_type);
                                    await sendPaymentBill(row, payment);
                                  } finally {
                                    setSendingBillId(null);
                                  }
                                }}
                              >
                                {sendingBillId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Bill'}
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
