import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generatePaymentBillPDF } from '@/lib/paymentBillEmail';
import { downloadContractPDF, generateContractHTML, generateContractReference } from '@/lib/contractGenerator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContractCard } from '@/components/ContractCard';

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
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      setLoading(true);
      const [
        { data, error },
        { data: contractsData, error: contractsError },
      ] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false }),
        supabase
          .from('contracts' as any)
          .select('*')
          .eq('student_id', user.id)
          .neq('status', 'draft')
          .order('sent_at', { ascending: false }),
      ]);

      if (!error && data) {
        setRows(data as any);
      }
      if (!contractsError && contractsData) {
        setContracts(contractsData as any);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Payments &amp; Contracts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your payments and service contracts.
          </p>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
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

                      const handleDownloadContract = async () => {
                        if (!user) return;
                        try {
                          setDownloadingId(row.id);

                          const studentName = user.user_metadata?.full_name || user.email || 'Student';
                          const studentEmail = user.email || '';
                          const studentPhone = user.user_metadata?.phone || '';
                          const servicePackage = (row.service_type || 'Service').split('_').join(' ');
                          const feeString = targetTotal > 0
                            ? `${displayCurrency} ${targetTotal.toLocaleString()}`
                            : `${displayCurrency} 0`;

                          // Check if a contract already exists for this service & student
                          let contractRef: string;
                          let existingId: string | undefined;
                          try {
                            const { data: existing } = await supabase
                              .from('contracts' as any)
                              .select('id, contract_reference')
                              .eq('student_id', user.id)
                              .eq('service_request_id', row.id)
                              .limit(1)
                              .maybeSingle();

                            if (existing) {
                              existingId = (existing as any).id;
                              contractRef = (existing as any).contract_reference || generateContractReference();
                            } else {
                              contractRef = generateContractReference();
                            }
                          } catch {
                            contractRef = generateContractReference();
                          }

                          const contractHtml = generateContractHTML({
                            studentName,
                            studentEmail,
                            studentPhone,
                            servicePackage,
                            serviceDescription: 'As discussed for your study abroad services',
                            serviceFee: feeString,
                            paymentStructure: 'As agreed between you and publicgermany',
                            contractReference: contractRef,
                          });

                          // Upsert contract row so admin can see it and student can upload signed PDF later
                          try {
                            if (existingId) {
                              await supabase
                                .from('contracts' as any)
                                .update({
                                  student_name: studentName,
                                  student_email: studentEmail,
                                  student_phone: studentPhone || null,
                                  service_package: servicePackage,
                                  service_description: 'As discussed for your study abroad services',
                                  service_fee: feeString,
                                  payment_structure: 'As agreed between you and publicgermany',
                                  contract_html: contractHtml,
                                  status: 'sent',
                                  sent_at: new Date().toISOString(),
                                })
                                .eq('id', existingId);
                            } else {
                              await supabase
                                .from('contracts' as any)
                                .insert({
                                  student_id: user.id,
                                  service_request_id: row.id,
                                  contract_reference: contractRef,
                                  student_name: studentName,
                                  student_email: studentEmail,
                                  student_phone: studentPhone || null,
                                  service_package: servicePackage,
                                  service_description: 'As discussed for your study abroad services',
                                  service_fee: feeString,
                                  payment_structure: 'As agreed between you and publicgermany',
                                  start_date: null,
                                  expected_end_date: null,
                                  contract_html: contractHtml,
                                  status: 'sent',
                                  sent_at: new Date().toISOString(),
                                });
                            }
                          } catch {
                            // If contract save fails, still allow download; admin just won't see it yet
                          }

                          await downloadContractPDF(contractHtml, `Contract-${contractRef}.pdf`);
                        } finally {
                          setDownloadingId(null);
                        }
                      };

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
                            <div className="flex flex-wrap gap-2 mt-1">
                              {canDownloadBill && (
                                <Button
                                  size="sm"
                                  disabled={downloadingId === row.id}
                                  onClick={handleDownloadBill}
                                >
                                  {downloadingId === row.id ? 'Preparing bill…' : 'Download bill'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={downloadingId === row.id}
                                onClick={handleDownloadContract}
                              >
                                {downloadingId === row.id ? 'Preparing contract…' : 'Download contract'}
                              </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              After signing, go to your Dashboard → Your Contracts to upload the signed PDF.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Your Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading contracts…</p>
                ) : contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No contracts yet. Use the Download contract button in the Payments tab to generate one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract: any) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        userId={user?.id}
                        hideMoneyDetails
                        onStatusChange={() => {
                          const refetch = async () => {
                            const { data } = await supabase
                              .from('contracts' as any)
                              .select('*')
                              .eq('student_id', user?.id)
                              .neq('status', 'draft')
                              .order('sent_at', { ascending: false });
                            if (data) setContracts(data as any);
                          };
                          refetch();
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
