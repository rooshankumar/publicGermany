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

  const handleUploadSignedForContract = async (contract: any, file: File) => {
    if (!user?.id) return;

    const userId = user.id;

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const path = `signed-contracts/${userId}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: false });

    if (uploadErr) {
      console.error('Storage upload error (contracts tab):', uploadErr);
      return;
    }

    const { data: publicData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    const publicUrl = publicData?.publicUrl;

    const { error: updateErr } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_document_url: publicUrl,
        signed_at: new Date().toISOString(),
      })
      .eq('id', contract.id);

    if (updateErr) {
      console.error('Contract update error (contracts tab):', updateErr);
      return;
    }

    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          title: 'Student Uploaded Signed Contract',
        }));
        const { error: notifErr } = await supabase.from('notifications').insert(notifications as any);
        if (notifErr) {
          console.warn('Basic notification insert failed (contracts tab), trying extended:', notifErr);
          try {
            const extendedNotifications = admins.map((admin) => ({
              user_id: admin.user_id,
              title: 'Student Uploaded Signed Contract',
              type: 'contract_signed',
              ref_id: contract.id,
              meta: {
                contract_reference: contract.contract_reference,
                student_name: contract.service_package,
              },
            }));
            await supabase.from('notifications').insert(extendedNotifications as any);
          } catch (extErr) {
            console.warn('Extended notification insert also failed (contracts tab):', extErr);
          }
        }
      }

      try {
        const { sendEmail } = await import('@/lib/sendEmail');
        await sendEmail(
          'publicgermany@outlook.com',
          `Signed Contract Uploaded: ${contract.contract_reference}`,
          `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1C1C1C;">
            <h2>A student has uploaded a signed contract</h2>
            <p><strong>Contract Reference:</strong> ${contract.contract_reference}</p>
            <p><strong>Service:</strong> ${contract.service_package}</p>
            <p><strong>Fee:</strong> ${contract.service_fee}</p>
            <p>Please review the signed contract in the admin dashboard.</p>
            <a href="https://publicgermany.vercel.app/admin/contracts" 
               style="display:inline-block;padding:10px 20px;background:#1e3a8a;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px;">
              View in Dashboard
            </a>
          </div>`
        );
      } catch (notifyErr) {
        console.warn('Admin email notification failed (contracts tab):', notifyErr);
      }

      try {
        const { data } = await supabase
          .from('contracts' as any)
          .select('*')
          .eq('student_id', userId)
          .neq('status', 'draft')
          .order('sent_at', { ascending: false });
        if (data) setContracts(data as any);
      } catch (refetchErr) {
        console.warn('Refetch contracts failed after upload (contracts tab):', refetchErr);
      }
    } catch (err) {
      console.warn('Admin notification setup failed (contracts tab):', err);
    }
  };

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

          {/* PAYMENTS TAB: payment history + Download bill only */}
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
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTRACTS TAB: per-service rows, contract generation + upload signed */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading contracts…</p>
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No services yet. Once you have service requests, you can generate contracts here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rows.map((row) => {
                      const payments = row.service_payments || [];
                      const totalReceived = payments
                        .filter((p) => (p.status || '').toLowerCase() === 'received')
                        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

                      const targetTotal = Number(row.target_total_amount ?? row.service_price ?? 0) || 0;
                      const displayCurrency = row.target_currency || row.service_currency || 'INR';
                      const remainingTotal = Math.max(0, targetTotal - totalReceived);

                      const existingContract = contracts.find(
                        (c: any) => c.service_request_id === row.id
                      );

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

                          try {
                            const { data } = await supabase
                              .from('contracts' as any)
                              .select('*')
                              .eq('student_id', user.id)
                              .neq('status', 'draft')
                              .order('sent_at', { ascending: false });
                            if (data) setContracts(data as any);
                          } catch (refetchErr) {
                            console.warn('Refetch contracts failed after download (contracts tab):', refetchErr);
                          }
                        } finally {
                          setDownloadingId(null);
                        }
                      };

                      const uploadInputId = `upload-signed-${row.id}`;

                      return (
                        <div
                          key={row.id}
                          className="border rounded-lg p-3 md:p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <span className="font-medium text-sm capitalize">
                              {(row.service_type || 'Service').split('_').join(' ')}
                            </span>
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
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={downloadingId === row.id}
                                onClick={handleDownloadContract}
                              >
                                {downloadingId === row.id ? 'Preparing contract…' : 'Download contract'}
                              </Button>

                              {existingContract && (
                                <>
                                  <input
                                    id={uploadInputId}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const target = e.target as HTMLInputElement;
                                      const file = target.files?.[0];
                                      if (!file) return;
                                      await handleUploadSignedForContract(existingContract, file);
                                      target.value = '';
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.getElementById(uploadInputId) as HTMLInputElement | null;
                                      input?.click();
                                    }}
                                  >
                                    Upload Signed
                                  </Button>
                                </>
                              )}
                            </div>
                            {!existingContract && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                First download the contract. After generating it, you can upload the signed PDF here.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
