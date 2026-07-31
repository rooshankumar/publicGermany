import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import {
  Search,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Eye,
  Trash2,
  X,  AlertCircle, Sparkles, ShieldCheck, ChevronRight, CircleAlert,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/lib/sendEmail';
import { useAuth } from '@/hooks/useAuth';
import { useServicePackages, useServicesCatalog, type ServicePackageRow, type CatalogService } from '@/hooks/useServiceData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceRequest {
  id: string;
  service_type: string;
  service_price: number;
  service_currency: string;
  request_details: string | null;
  preferred_timeline: string | null;
  status: 'new' | 'in_review' | 'payment_pending' | 'in_progress' | 'completed';
  admin_response?: string | null;
  deliverable_urls?: string[] | null;
  created_at: string;
}

type Tab = 'browse' | 'faq' | 'requests' | 'delivered';

const ServicesNew: React.FC = () => {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [packageRequestName, setPackageRequestName] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string>('');
  const [requestDetails, setRequestDetails] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState<ServicePackageRow | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);

  const { data: packages = [] } = useServicePackages();
  const { data: services = [] } = useServicesCatalog();

  const requestsQuery = useQuery({
    queryKey: ['my-service-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select(`*, service_payments (id, amount, currency, status, paid_at)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('service-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `user_id=eq.${user.id}` },
        () => requestsQuery.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const requests = requestsQuery.data || [];
  const completedRequests = requests.filter((r) => r.status === 'completed');
  const totalDeliveredFiles = completedRequests.reduce(
    (sum, r) => sum + (r.deliverable_urls?.length || 0),
    0,
  );

  // Preselect a package via ?package=<slug>
  useEffect(() => {
    const slug = searchParams.get('package');
    if (!slug || packages.length === 0) return;
    const pkg = packages.find((p) => p.slug === slug);
    if (pkg) {
      setPackageRequestName(pkg.title);
      setShowRequestDialog(true);
      searchParams.delete('package');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, packages]);

  const individualServices = useMemo(
    () => services.filter((s) => s.kind === 'individual'),
    [services],
  );

  const filteredServices = useMemo(
    () =>
      individualServices.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [individualServices, searchTerm],
  );

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const extrasTotal = selectedServices.reduce((total, id) => {
    const service = individualServices.find((s) => s.id === id);
    return total + (service?.price_inr || 0);
  }, 0);

  const getPackagePrice = () => {
    if (!packageRequestName) return 0;
    return packages.find((p) => p.title === packageRequestName)?.price || 0;
  };

  const totalAmount = extrasTotal + getPackagePrice();

  // ------- Actions -------
  const handleRequestSubmit = async () => {
    if (selectedServices.length === 0 && !packageRequestName) {
      toast({ title: 'Please select a package or one service', variant: 'destructive' });
      return;
    }
    if (!timeline) {
      toast({ title: 'Timeline required', description: 'Please choose a preferred timeline', variant: 'destructive' });
      return;
    }
    if (!user) return;

    const extras = selectedServices
      .map((id) => individualServices.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];
    const serviceNames = packageRequestName
      ? [packageRequestName, ...(extras.length ? [`Extras: ${extras.join(', ')}`] : [])].join(' | ')
      : extras.join(', ');

    try {
      const { error } = await supabase.from('service_requests').insert([
        {
          user_id: user.id,
          service_type: serviceNames,
          service_price: totalAmount,
          service_currency: 'INR',
          request_details: requestDetails,
          preferred_timeline: timeline,
          status: 'new',
        },
      ]);
      if (error) throw error;

      toast({ title: 'Request submitted', description: 'Our team will contact you shortly.' });

      try {
        const studentName = profile?.full_name || user.email?.split('@')[0] || 'Student';
        const studentEmail = user.email || '';
        await Promise.allSettled([
          sendEmail(
            'publicgermany@outlook.com',
            'New Service Request',
            `<p>New service request from ${studentName}</p>
             <p><strong>Email:</strong> ${studentEmail}<br/>
             <strong>Services:</strong> ${serviceNames}<br/>
             <strong>Total:</strong> ₹${totalAmount.toLocaleString()}<br/>
             <strong>Timeline:</strong> ${timeline}</p>`,
          ),
          studentEmail
            ? sendEmail(
                studentEmail,
                'Service Request Received',
                `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1D1D1F;">
                   <p>Hi ${studentName},</p>
                   <p>We've received your service request. Our team will reach out shortly.</p>
                   <p><strong>Services:</strong> ${serviceNames}<br/>
                   <strong>Total:</strong> ₹${totalAmount.toLocaleString()}<br/>
                   <strong>Timeline:</strong> ${timeline}</p>
                   <p>\u2014 publicgermany</p>
                 </div>`,
              )
            : Promise.resolve(),
        ]);
      } catch {}

      setSelectedServices([]);
      setPackageRequestName(null);
      setTimeline('');
      setRequestDetails('');
      setShowRequestDialog(false);
      requestsQuery.refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Delete this request? This cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast({ title: 'Request deleted' });
      requestsQuery.refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      const last = pathname.substring(pathname.lastIndexOf('/') + 1);
      return decodeURIComponent(last).replace(/^\d+-/, '') || 'download';
    } catch {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1] || 'download').replace(/^\d+-/, '');
    }
  };

  const openFile = async (url: string, download = false) => {
    try {
      const filePath = url.includes('/documents/') ? url.split('/documents/')[1] : url;
      const fileName = getFileNameFromUrl(url);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600, download ? { download: fileName } : undefined);
      const finalUrl = error || !data?.signedUrl ? url : data.signedUrl;
      if (download) {
        const a = document.createElement('a');
        a.href = finalUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(finalUrl, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { icon: any; label: string; className: string }> = {
      new: { icon: Clock, label: 'New', className: 'bg-pg-bg3 text-pg-label2' },
      in_review: { icon: AlertCircle, label: 'In review', className: 'bg-pg-gold/15 text-pg-gold' },
      payment_pending: { icon: Clock, label: 'Payment pending', className: 'bg-pg-gold/15 text-pg-gold' },
      in_progress: { icon: Clock, label: 'In progress', className: 'bg-pg-accent/10 text-pg-accent' },
      completed: { icon: CheckCircle, label: 'Completed', className: 'bg-pg-green/15 text-pg-green' },
    };
    const c = map[status] || map.new;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${c.className}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  // ----------------- UI -----------------
  return (
    <Layout>
      <div className="max-w-[1080px] mx-auto px-3 sm:px-4 pb-24">
        <div className="pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4">
            <div>
              <h1 className="text-[24px] sm:text-[26px] font-bold text-pg-label tracking-tight">Services</h1>
              <p className="text-[13px] text-pg-label3 mt-1">Choose a package or request a focused service.</p>
            </div>
            <div className="text-[12.5px] text-pg-label3">
              {requests.length} requests &middot; {totalDeliveredFiles} files
            </div>
          </div>

          <div className="flex bg-pg-bg2 rounded-[10px] p-[3px] mb-6 max-w-[420px]">
            {(['browse', 'faq', 'requests', 'delivered'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-center py-2 px-2.5 text-[13.5px] font-semibold rounded-[8px] transition-colors ${
                  tab === t ? 'bg-pg-bg text-pg-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-pg-label2'
                }`}
              >
                {t === 'browse'
                  ? 'Browse'
                  : t === 'faq'
                  ? 'FAQs'
                  : t === 'requests'
                  ? `Requests${requests.length ? ` (${requests.length})` : ''}`
                  : `Delivered${completedRequests.length ? ` (${completedRequests.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'browse' && (
          <>
            {/* ===== SECTION: Our Core Packages ===== */}
            <section className="mb-6">
              <div className="mb-4">
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1">Our Core Packages</div>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-pg-label mb-1">Choose the package that best matches your study abroad journey.</h2>
                <p className="text-[13.5px] sm:text-[14px] text-pg-label2">Every package includes personalized guidance from our team.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {packages.map((pkg) => {
                  const selected = packageRequestName === pkg.title;
                  return (
                    <div
                      key={pkg.id}
                      className={`rounded-[18px] border p-3.5 sm:p-4 flex flex-col gap-3 ${
                        pkg.highlighted
                          ? 'border-pg-accent/50 bg-gradient-to-br from-pg-accent/[0.06] to-pg-bg shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)]'
                          : 'border-pg-sep bg-pg-bg'
                      }`}
                    >
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                        {pkg.popular && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-pg-accent">
                            <Sparkles className="h-3 w-3" /> Popular
                          </span>
                        )}
                        {pkg.riskFree && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pg-green/10 px-2.5 py-0.5 text-[10px] font-semibold text-pg-green">
                            <ShieldCheck className="h-3 w-3" /> Risk-Free
                          </span>
                        )}
                      </div>

                      {/* Name & Price */}
                      <div>
                        <h3 className="text-[15px] font-semibold text-pg-label leading-tight">{pkg.title}</h3>
                        <div className="mt-1.5 text-[22px] font-bold text-pg-label">{pkg.priceLabel}</div>
                        <p className="mt-0.5 text-[12px] text-pg-label2">{pkg.paymentSummary}</p>
                      </div>

                      {/* Highlights */}
                      <ul className="space-y-1 text-[12px] text-pg-label2">
                        {pkg.includedFeatures.slice(0, 3).map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pg-green" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Actions */}
                      <div className="mt-auto flex flex-col gap-1.5">
                        <button
                          onClick={() => setSelectedPackage(pkg)}
                          className="flex items-center justify-center gap-1 text-[12.5px] font-semibold text-pg-accent hover:underline py-1"
                        >
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPackageRequestName(pkg.title);
                            setShowRequestDialog(true);
                          }}
                          className={`pg-btn text-[12.5px] ${pkg.highlighted ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ===== SECTION: Individual Services ===== */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1">Individual Services</div>
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-pg-label">Focused support for specific needs</h2>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-pg-label3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services…"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-pg-bg2 rounded-[10px] text-[14px] text-pg-label placeholder:text-pg-label3 border-0 outline-none focus:ring-2 focus:ring-pg-accent"
                />
              </div>

              {filteredServices.length === 0 ? (
                <div className="py-10 text-center text-pg-label3 text-[14px]">No services found</div>
              ) : (
                <div className="space-y-1.5">
                  {filteredServices.map((service) => {
                    const selected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-pg-sep bg-pg-bg px-3.5 py-2.5 min-h-[64px]"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedService(service)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-[13.5px] font-semibold text-pg-label">{service.name}</div>
                            {service.category && (
                              <span className="rounded-full bg-pg-bg2 px-2 py-0.5 text-[9.5px] uppercase tracking-wide text-pg-label3">
                                {service.category}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[12px] text-pg-label2 line-clamp-1">{service.shortDescription}</div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="text-[12.5px] font-semibold text-pg-label whitespace-nowrap">{service.priceLabel}</div>
                          <button
                            onClick={() => setSelectedService(service)}
                            className="rounded-full bg-pg-bg2 px-2.5 py-1 text-[11.5px] font-semibold text-pg-label"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selected) toggleService(service.id);
                              setShowRequestDialog(true);
                            }}
                            className="rounded-full bg-pg-accent px-2.5 py-1 text-[11.5px] font-semibold text-white"
                          >
                            Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sticky Bottom Bar */}
            {selectedServices.length > 0 && (
              <div className="sticky bottom-4 mt-5 bg-pg-label text-pg-bg rounded-[14px] px-4 py-3 flex items-center justify-between gap-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]">
                <div>
                  <div className="text-[11px] text-pg-label3">{selectedServices.length} selected</div>
                  <div className="text-[17px] font-bold">₹{extrasTotal.toLocaleString('en-IN')}</div>
                </div>
                <button
                  onClick={() => setShowRequestDialog(true)}
                  className="pg-btn text-[12.5px]"
                  style={{ background: 'var(--pg-gold)', color: '#fff' }}
                >
                  Request selected
                </button>
              </div>
            )}
          </>
        )}

        {/* ========= TAB: REQUESTS ========= */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Clock className="w-8 h-8 text-pg-label3 mx-auto mb-3" />
                <p className="text-[14px] text-pg-label2 mb-4">No requests yet</p>
                <button onClick={() => setTab('browse')} className="pg-btn pg-btn-secondary pg-btn-sm">
                  Browse services
                </button>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-pg-bg border border-pg-sep rounded-[16px] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-pg-label text-[14px] sm:text-[15px] truncate">{r.service_type}</div>
                      <div className="text-[11.5px] text-pg-label3 mt-0.5">
                        Requested {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      {r.status !== 'completed' && (
                        <button
                          onClick={() => handleDeleteRequest(r.id)}
                          className="p-1.5 rounded-full text-pg-label3 hover:text-pg-accent hover:bg-pg-bg2"
                          aria-label="Delete request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {r.request_details && (
                    <p className="text-[12.5px] text-pg-label2 mt-2">{r.request_details}</p>
                  )}
                  {r.preferred_timeline && (
                    <p className="text-[12px] text-pg-label3 mt-1">Timeline: {r.preferred_timeline}</p>
                  )}
                  {r.admin_response && (
                    <div className="mt-3 bg-pg-bg2 rounded-[10px] px-3.5 py-2.5 text-[12.5px] text-pg-label">
                      <div className="text-[10.5px] font-medium text-pg-label3 mb-1">Admin response</div>
                      {r.admin_response}
                    </div>
                  )}
                  {(() => {
                    const payments = ((r as any).service_payments || []) as Array<{ amount: number | null; status: string | null }>;
                    const received = payments
                      .filter((p) => (p?.status || '').toLowerCase() === 'received')
                      .reduce((a, p) => a + (Number(p?.amount) || 0), 0);
                    const target = Number(((r as any).target_total_amount ?? r.service_price) ?? 0);
                    const curr = (r as any).target_currency || r.service_currency || 'INR';
                    const remaining = Math.max(0, target - received);
                    return (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px] bg-pg-bg2 rounded-[10px] p-3">
                        <div>
                          <div className="text-pg-label3 mb-0.5">Total</div>
                          <div className="font-semibold text-pg-label">{curr} {target.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-pg-label3 mb-0.5">Paid</div>
                          <div className="font-semibold text-pg-green">{curr} {received.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-pg-label3 mb-0.5">Remaining</div>
                          <div className="font-semibold text-pg-gold">{curr} {remaining.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })()}
                  {r.status === 'completed' && r.deliverable_urls?.length ? (
                    <div className="mt-3 pt-3 border-t border-pg-sep">
                      <div className="text-[11.5px] font-medium text-pg-green mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {r.deliverable_urls.length} file{r.deliverable_urls.length > 1 ? 's' : ''} delivered
                      </div>
                      <div className="space-y-1.5">
                        {r.deliverable_urls.map((url, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <FileText className="w-3.5 h-3.5 text-pg-label3 shrink-0" />
                              <span className="truncate text-pg-label">{getFileNameFromUrl(url)}</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => openFile(url, false)}
                                className="p-1.5 rounded-full hover:bg-pg-bg2 text-pg-label2"
                                aria-label="View"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openFile(url, true)}
                                className="p-1.5 rounded-full hover:bg-pg-bg2 text-pg-label2"
                                aria-label="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}

        {/* ========= TAB: FAQS ========= */}
        {tab === 'faq' && (
          <div className="space-y-3">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-pg-label mb-1">Frequently Asked Questions</h2>
            <p className="text-[13.5px] text-pg-label2 mb-4">Common questions about our services and process.</p>
            <div className="space-y-2">
              {[
                {
                  q: 'What does my service fee cover and what costs are not included?',
                  a: 'Our service fee covers consultation, documentation, applications, and process support. Costs you pay directly include: university application fees (to each university), APS certificate fee, TestAS exam fee, IELTS/PTE exam fee, visa application and VFS service fee, blocked account setup, health insurance, and courier charges.',
                },
                {
                  q: 'When do I pay the remaining amount?',
                  a: 'Payment milestones are clearly outlined in your contract. For our Pay After packages, you pay a small advance to begin and the balance is due only after you receive an admission offer (Pay After Admission) or after your visa is approved (Pay After Visa).',
                },
                {
                  q: 'Are university application fees included in your packages?',
                  a: 'No, university application fees are paid directly by you to each university. Our service fee covers consultation, documentation, application support, and process guidance only.',
                },
                {
                  q: 'What do I get with a service package?',
                  a: 'Every package includes personalized guidance from our team. This covers profile evaluation, document preparation (SOP, LOR, CV), university shortlisting and applications, admission support, and visa process guidance where applicable.',
                },
                {
                  q: 'How many universities will you apply to?',
                  a: 'We typically apply to 7-8 universities per student, selected based on your profile, preferences, and chances of admission.',
                },
                {
                  q: 'Can I change my university preferences after submitting?',
                  a: 'Yes, you can update your preferences during the shortlisting phase. Changes after applications have been submitted may incur additional university application fees.',
                },
                {
                  q: 'How long does the whole process take?',
                  a: 'The timeline depends on your profile and the package you choose. Our team provides a personalized timeline after the initial profile evaluation. Generally, the full process from evaluation to visa can take 4-8 months.',
                },
                {
                  q: 'Is the advance amount refundable?',
                  a: 'No, the advance amount is not refundable. It covers the initial work we do for you, including profile evaluation and document preparation.',
                },
                {
                  q: 'Do you help with blocked account and health insurance?',
                  a: 'We provide guidance on how to set up your blocked account and choose health insurance, but the actual costs and arrangements are handled by you directly.',
                },
              ].map((faq) => (
                <details key={faq.q} className="rounded-[12px] border border-pg-sep bg-pg-bg overflow-hidden group">
                  <summary className="px-4 py-3.5 text-[13.5px] font-semibold text-pg-label cursor-pointer hover:bg-pg-bg2 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 text-pg-label3 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-[13px] text-pg-label2 leading-[1.6]">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ========= TAB: DELIVERED ========= */}
        {tab === 'delivered' && (
          <div className="space-y-3">
            {completedRequests.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <FileText className="w-8 h-8 text-pg-label3 mx-auto mb-3" />
                <p className="text-[14px] text-pg-label2">No delivered files yet</p>
              </div>
            ) : (
              completedRequests.map((r) => (
                <div key={r.id} className="bg-pg-bg border border-pg-sep rounded-[16px] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-pg-green" />
                    <div className="font-semibold text-pg-label text-[14px] sm:text-[15px] truncate">{r.service_type}</div>
                  </div>
                  {r.deliverable_urls?.length ? (
                    <div>
                      {r.deliverable_urls.map((url, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-1 py-2.5 border-t border-pg-sep/50 first:border-t-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-pg-label3 shrink-0" />
                            <span className="text-[13px] text-pg-label truncate">{getFileNameFromUrl(url)}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openFile(url, false)}
                              className="pg-btn pg-btn-sm pg-btn-secondary text-[11px]"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => openFile(url, true)}
                              className="pg-btn pg-btn-sm pg-btn-secondary text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-pg-label3">No files attached</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ===== PACKAGE DETAIL DIALOG ===== */}
      <Dialog open={Boolean(selectedPackage)} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90dvh] overflow-y-auto rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-pg-label">{selectedPackage?.title}</DialogTitle>
            <p className="text-[13px] text-pg-label2 mt-1">{selectedPackage?.fullDescription}</p>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              {/* What's Included */}
              <div className="rounded-[12px] bg-pg-bg2 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-2">Includes</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPackage.includedFeatures.map((feature) => (
                    <span key={feature} className="inline-flex items-center gap-1 rounded-full bg-pg-green/10 px-2.5 py-1 text-[11.5px] font-medium text-pg-green">
                      <CheckCircle className="w-3 h-3" /> {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Payment & Process */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] bg-pg-bg2 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-pg-label3 mb-1.5">Payment</div>
                  <p className="text-[12.5px] text-pg-label2 leading-[1.5]">
                    {selectedPackage.paymentTerms.split('\n').map((line, i) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </p>
                </div>
                <div className="rounded-[12px] bg-pg-bg2 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-pg-label3 mb-1.5">Process</div>
                  <div className="flex flex-wrap items-center gap-1 text-[12px] text-pg-label2">
                    {selectedPackage.processSteps.map((step, i) => (
                      <span key={step} className="inline-flex items-center gap-1">
                        {i > 0 && <span className="text-pg-accent mx-0.5">&rarr;</span>}
                        <span>{step}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Not Included */}
              <div className="rounded-[12px] border border-pg-gold/20 bg-pg-gold/[0.04] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-pg-gold mb-1.5">Not Included (paid by you)</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPackage.exclusions.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full bg-pg-gold/10 px-2 py-0.5 text-[11px] font-medium text-pg-gold">
                      <CircleAlert className="w-3 h-3" /> {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setPackageRequestName(selectedPackage.title);
                    setSelectedPackage(null);
                    setShowRequestDialog(true);
                  }}
                  className="pg-btn pg-btn-primary flex-1"
                >
                  Request This Package
                </button>
                <button onClick={() => setSelectedPackage(null)} className="pg-btn pg-btn-secondary">
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== SERVICE DETAIL DIALOG ===== */}
      <Dialog open={Boolean(selectedService)} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90dvh] overflow-y-auto rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-pg-label">{selectedService?.name}</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <p className="text-[14px] text-pg-label2 leading-[1.6]">{selectedService.fullDescription}</p>
              <div className="rounded-[14px] bg-pg-bg2 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.06em] text-pg-label3">Price</div>
                  <div className="text-[18px] font-bold text-pg-label">{selectedService.priceLabel}</div>
                </div>
                <button
                  onClick={() => {
                    if (!selectedServices.includes(selectedService.id)) toggleService(selectedService.id);
                    setSelectedService(null);
                    setShowRequestDialog(true);
                  }}
                  className="pg-btn pg-btn-primary"
                >
                  Request Service
                </button>
              </div>
              <button onClick={() => setSelectedService(null)} className="pg-btn pg-btn-secondary w-full">
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== REQUEST DIALOG ===== */}
      <Dialog
        open={showRequestDialog}
        onOpenChange={(open) => {
          setShowRequestDialog(open);
          if (!open) setPackageRequestName(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px] rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-pg-label">Request services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-pg-bg2 rounded-[14px] p-4">
              {packageRequestName && (
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-pg-label3">Package</div>
                    <div className="font-semibold text-pg-label">{packageRequestName}</div>
                  </div>
                  <button
                    onClick={() => setPackageRequestName(null)}
                    className="text-pg-label3 hover:text-pg-label"
                    aria-label="Remove package"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="text-[12px] text-pg-label2 mb-2">
                  + {selectedServices.length} individual service{selectedServices.length > 1 ? 's' : ''}
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-pg-sep">
                <div className="text-[12.5px] text-pg-label2">Estimated total</div>
                <div className="text-[18px] font-bold text-pg-label">₹{totalAmount.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <Label className="text-[13px] font-medium text-pg-label mb-1.5 block">Preferred timeline</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger className="rounded-[10px] border-pg-sep">
                  <SelectValue placeholder="Choose a timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As soon as possible</SelectItem>
                  <SelectItem value="1-week">Within 1 week</SelectItem>
                  <SelectItem value="2-weeks">Within 2 weeks</SelectItem>
                  <SelectItem value="1-month">Within 1 month</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[13px] font-medium text-pg-label mb-1.5 block">Anything else? (optional)</Label>
              <Textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Any details you'd like us to know…"
                className="rounded-[10px] border-pg-sep min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowRequestDialog(false)} className="pg-btn pg-btn-secondary">
                Cancel
              </button>
              <button onClick={handleRequestSubmit} className="pg-btn pg-btn-primary">
                Submit request
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ServicesNew;
