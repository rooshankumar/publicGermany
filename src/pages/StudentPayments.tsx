import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generatePaymentBillPDF } from '@/lib/paymentBillEmail';
import { downloadContractPDF } from '@/lib/contractGenerator';

interface ServicePaymentRow {
  id: string;
  service_type: string | null;
  service_price: number | null;
  service_currency: string | null;
  target_total_amount: number | null;
  target_currency: string | null;
  created_at: string;
  service_payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'received' | 'cancelled';
    paid_at: string | null;
  }>;
}

export default function StudentPayments() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ServicePaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('service_requests' as any)
        .select(`
          id,
          service_type,
          service_price,
          service_currency,
          target_total_amount,
          target_currency,
          created_at,
          service_payments (
            id,
            amount,
            currency,
            status,
            paid_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRows(data as any);
      }
      setLoading(false);
    };

    fetchPayments();
  }, [user?.id]);

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View payments linked to your services and their current status.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading payments…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments found yet.</p>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => {
                  const payments = row.service_payments || [];
                  const latest = payments[0];
                  const totalReceived = payments
                    .filter((p) => (p.status || '').toLowerCase() === 'received')
                    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

                  const targetTotal = Number(row.target_total_amount ?? row.service_price ?? 0) || 0;
                  const displayCurrency = row.target_currency || row.service_currency || 'INR';
                  const remainingTotal = Math.max(0, targetTotal - totalReceived);

                  const canDownloadBill = totalReceived > 0;

                  const handleDownloadBill = async () => {
                    if (!user) return;
                    try {
                      setDownloadingId(row.id);

                      const targetTotalForBill = Number(row.target_total_amount ?? row.service_price ?? 0) || 0;
                      const serviceAmount = row.service_price ?? targetTotalForBill;
                      const totalAmount = targetTotalForBill;
                      const amountReceived = totalReceived;
                      const amountPending = Math.max(0, totalAmount - amountReceived);

                      const html = await generatePaymentBillPDF(
                        row.id,
                        user.user_metadata?.full_name || user.email || 'Student',
                        user.email || '',
                        user.user_metadata?.phone || '',
                        row.service_type || 'service',
                        (row.service_type || 'Service').split('_').join(' '),
                        'Study abroad service',
                        serviceAmount,
                        totalAmount,
                        amountReceived,
                        amountPending,
                        row.target_currency || row.service_currency || 'INR'
                      );

                      await downloadContractPDF(html, `Payment-Bill-${row.id}.pdf`);
                    } finally {
                      setDownloadingId(null);
                    }
                  };

                  return (
                    <div
                      key={row.id}
                      className="border rounded-lg p-3 md:p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm capitalize">
                            {(row.service_type || 'Service').split('_').join(' ')}
                          </span>
                          {latest && (
                            <Badge
                              className={statusColor(latest.status)}
                              variant="outline"
                            >
                              {latest.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(row.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {displayCurrency}{' '}
                          {isNaN(targetTotal) ? '-' : targetTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Received: {displayCurrency}{' '}
                          {totalReceived.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pending: {displayCurrency}{' '}
                          {remainingTotal.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2 text-xs text-muted-foreground md:text-right">
                        {latest && (
                          <div>
                            <p>
                              Last update: {latest.currency}{' '}
                              {Number(latest.amount).toLocaleString()} • {latest.status}
                            </p>
                            {latest.paid_at && (
                              <p>Paid on: {new Date(latest.paid_at).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}

                        {canDownloadBill && (
                          <Button
                            size="sm"
                            disabled={downloadingId === row.id}
                            onClick={handleDownloadBill}
                          >
                            {downloadingId === row.id ? 'Preparing bill…' : 'Download bill'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
