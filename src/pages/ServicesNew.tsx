import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import {
  Search,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Eye,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/lib/sendEmail';
import { useAuth } from '@/hooks/useAuth';
import { useServicePackages, useServicesCatalog, type ServicePackageRow } from '@/hooks/useServiceData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_inr: number | null;
  price_range_inr: string | null;
  is_active: boolean;
  kind: string;
  created_at: string;
  updated_at: string;
}

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

type Tab = 'browse' | 'requests' | 'delivered';

const ServicesNew: React.FC = () => {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [packageRequestName, setPackageRequestName] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string>('');
  const [requestDetails, setRequestDetails] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ------- Data -------
  const catalogQuery = useServicesCatalog();
  const packagesQuery = useServicePackages();

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

  const services = catalogQuery.data || [];
  const packages = packagesQuery.data || [];
  const individualServices = services;
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

  const filteredServices = useMemo(
    () =>
      individualServices.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [individualServices, searchTerm],
  );

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const extrasTotal = selectedServices.reduce((total, id) => {
    const s = services.find((x) => x.id === id);
    return total + (s?.price_inr || 0);
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
      .map((id) => services.find((s) => s.id === id)?.name)
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

      toast({ title: 'Request submitted', description: "Our team will contact you shortly." });

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
                   <p>— publicgermany</p>
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
      <div className="max-w-[1080px] mx-auto px-1 sm:px-2 pb-24">
        {/* Page head */}
        <div className="pt-2">
          <div className="flex justify-between items-center flex-wrap gap-2.5 mb-4">
            <h1 className="text-[26px] font-bold text-pg-label tracking-tight">Services</h1>
            <div className="text-[12.5px] text-pg-label3">
              {requests.length} requests · {totalDeliveredFiles} files
            </div>
          </div>

          {/* Segmented control */}
          <div className="flex bg-pg-bg2 rounded-[10px] p-[3px] mb-8 max-w-[340px]">
            {(['browse', 'requests', 'delivered'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-center py-2 px-2.5 text-[13.5px] font-semibold rounded-[8px] transition-colors ${
                  tab === t ? 'bg-pg-bg text-pg-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-pg-label2'
                }`}
              >
                {t === 'browse'
                  ? 'Browse'
                  : t === 'requests'
                  ? `Requests${requests.length ? ` (${requests.length})` : ''}`
                  : `Delivered${completedRequests.length ? ` (${completedRequests.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* ========= BROWSE ========= */}
        {tab === 'browse' && (
          <>
            <div className="mb-5">
              <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1">Packages</div>
              <h2 className="text-[22px] font-bold text-pg-label mb-1">Pick a package</h2>
              <p className="text-pg-label2 text-[14.5px]">Fixed pricing, staged payment, no surprises.</p>
            </div>

            <div className="pg-carousel flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2.5 mb-6">
              {SERVICE_PACKAGES.map((p) => (
                <div
                  key={p.id}
                  className={`snap-start shrink-0 w-[240px] md:w-auto bg-pg-bg rounded-[20px] p-[18px] flex flex-col relative border ${
                    p.popular ? 'border-[1.5px] border-pg-accent shadow-[0_16px_32px_-12px_rgba(0,0,0,0.14)]' : 'border-pg-sep'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-[11px] left-[18px] bg-pg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Most popular
                    </span>
                  )}
                  <div className="text-[14.5px] font-semibold text-pg-label mb-0.5">{p.name}</div>
                  <div className="text-[24px] font-bold text-pg-label leading-none mb-0.5">{p.priceLabel}</div>
                  <div className="text-[11px] text-pg-label3 mb-3">{p.payment}</div>
                  <ul className="mb-3.5 space-y-1.5">
                    {p.included.map((it) => (
                      <li key={it} className="flex gap-1.5 text-[12px] text-pg-label">
                        <span className="text-pg-green font-bold shrink-0">✓</span>
                        {it}
                      </li>
                    ))}
                    {p.notes?.[0] && (
                      <li className="flex gap-1.5 text-[12px] italic text-pg-label3">
                        <span className="shrink-0">+</span>
                        {p.notes[0]}
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => {
                      setPackageRequestName(p.name);
                      setShowRequestDialog(true);
                    }}
                    className={`pg-btn w-full mt-auto ${p.popular ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
                  >
                    Request
                  </button>
                </div>
              ))}
            </div>

            {/* Individual services */}
            <div className="flex items-center gap-2.5 mt-11 mb-1">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-pg-bg2 flex items-center justify-center">
                <Plus className="w-4 h-4 text-pg-label" strokeWidth={2.2} />
              </div>
              <h2 className="text-[22px] font-bold text-pg-label">Individual services</h2>
            </div>
            <p className="text-pg-label2 text-[14px] mb-4.5">Swipe through, tap a card to preview and add.</p>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-pg-label3 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services…"
                className="w-full pl-10 pr-3.5 py-3 bg-pg-bg2 rounded-[12px] text-[15px] text-pg-label placeholder:text-pg-label3 border-0 outline-none focus:ring-2 focus:ring-pg-accent focus:ring-offset-1"
              />
            </div>

            {filteredServices.length === 0 ? (
              <div className="pg-group px-5 py-10 text-center text-pg-label3 text-[14px]">No services found</div>
            ) : (
              <>
                {/* Horizontal snap carousel of service tiles */}
                <div className="pg-carousel flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1">
                  {filteredServices.map((s) => {
                    const selected = selectedServices.includes(s.id);
                    const expanded = expandedServiceId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setExpandedServiceId(expanded ? null : s.id)}
                        className={`snap-start shrink-0 w-[220px] text-left bg-pg-bg rounded-[16px] p-4 border transition-all ${
                          expanded
                            ? 'border-pg-accent shadow-[0_12px_28px_-14px_rgba(0,0,0,0.25)]'
                            : selected
                            ? 'border-pg-accent/60'
                            : 'border-pg-sep'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-[14px] font-semibold text-pg-label leading-tight line-clamp-2">
                            {s.name}
                          </div>
                          {selected && (
                            <span className="w-[18px] h-[18px] rounded-full bg-pg-accent text-white flex items-center justify-center shrink-0">
                              <CheckCircle className="w-2.5 h-2.5" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <div className="text-[12px] text-pg-label3 line-clamp-3 mb-3 min-h-[48px]">
                            {s.description}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] font-bold text-pg-label">
                            ₹{s.price_inr?.toLocaleString() || '—'}
                          </div>
                          <div className="text-[11px] font-medium text-pg-accent">
                            {expanded ? 'Hide' : 'Preview'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Inline expanded detail — like the testimonials expanded card */}
                {expandedServiceId && (() => {
                  const s = filteredServices.find((x) => x.id === expandedServiceId);
                  if (!s) return null;
                  const selected = selectedServices.includes(s.id);
                  return (
                    <div className="mb-6 bg-pg-bg rounded-[20px] border border-pg-sep p-5 md:p-6 animate-fade-in-up">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-[11.5px] uppercase tracking-[0.06em] text-pg-accent font-semibold mb-1">
                            Service preview
                          </div>
                          <h3 className="text-[19px] font-bold text-pg-label leading-tight">{s.name}</h3>
                        </div>
                        <button
                          onClick={() => setExpandedServiceId(null)}
                          className="p-1.5 rounded-full text-pg-label3 hover:text-pg-label hover:bg-pg-bg2"
                          aria-label="Close preview"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {s.description && (
                        <p className="text-[14px] text-pg-label2 leading-[1.55] mb-4 whitespace-pre-line">
                          {s.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between bg-pg-bg2 rounded-[12px] px-4 py-3 mb-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-pg-label3">Price</div>
                          <div className="text-[20px] font-bold text-pg-label">
                            ₹{s.price_inr?.toLocaleString() || '—'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wide text-pg-label3">Delivery</div>
                          <div className="text-[13px] font-medium text-pg-label">Discussed on request</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleService(s.id)}
                          className={`pg-btn ${selected ? 'pg-btn-secondary' : 'pg-btn-secondary'}`}
                        >
                          {selected ? 'Remove from bundle' : 'Add to bundle'}
                        </button>
                        <button
                          onClick={() => {
                            if (!selected) toggleService(s.id);
                            setShowRequestDialog(true);
                          }}
                          className="pg-btn pg-btn-primary"
                        >
                          Request now
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Full grouped list for quick multi-select */}
                <div className="pg-group">
                  {filteredServices.map((s) => {
                    const selected = selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className="w-full flex items-center gap-3.5 px-[18px] py-3.5 text-left active:bg-pg-bg3 transition-colors"
                      >
                        <span
                          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-[1.5px] shrink-0 ${
                            selected ? 'bg-pg-accent border-pg-accent text-white' : 'border-pg-label3/50 bg-pg-bg'
                          }`}
                        >
                          {selected && <CheckCircle className="w-3 h-3" strokeWidth={3} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14.5px] font-medium text-pg-label truncate">{s.name}</div>
                          {s.description && (
                            <div className="text-[12.5px] text-pg-label3 line-clamp-1">{s.description}</div>
                          )}
                        </div>
                        <div className="text-[14px] font-semibold text-pg-label whitespace-nowrap">
                          ₹{s.price_inr?.toLocaleString() || '—'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sticky selection bar */}
            {selectedServices.length > 0 && (
              <div className="sticky bottom-4 mt-5 bg-pg-label text-pg-bg rounded-[16px] px-5 py-3.5 flex items-center justify-between gap-3.5 flex-wrap shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]">
                <div>
                  <div className="text-[12px] text-pg-label3">{selectedServices.length} selected</div>
                  <div className="text-[18px] font-bold">₹{extrasTotal.toLocaleString('en-IN')}</div>
                </div>
                <button
                  onClick={() => setShowRequestDialog(true)}
                  className="pg-btn"
                  style={{ background: 'var(--pg-gold)', color: '#fff' }}
                >
                  Request selected
                </button>
              </div>
            )}
          </>
        )}

        {/* ========= REQUESTS ========= */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="pg-group px-6 py-14 text-center">
                <Clock className="w-8 h-8 text-pg-label3 mx-auto mb-3" />
                <p className="text-[14px] text-pg-label2 mb-4">No requests yet</p>
                <button onClick={() => setTab('browse')} className="pg-btn pg-btn-secondary pg-btn-sm">
                  Browse services
                </button>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-pg-bg border border-pg-sep rounded-[16px] p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-pg-label text-[15px] truncate">{r.service_type}</div>
                      <div className="text-[12px] text-pg-label3 mt-0.5">
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
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {r.request_details && (
                    <p className="text-[13px] text-pg-label2 mt-2">{r.request_details}</p>
                  )}
                  {r.preferred_timeline && (
                    <p className="text-[12.5px] text-pg-label3 mt-1">Timeline: {r.preferred_timeline}</p>
                  )}
                  {r.admin_response && (
                    <div className="mt-3 bg-pg-bg2 rounded-[10px] px-3.5 py-2.5 text-[13px] text-pg-label">
                      <div className="text-[11px] font-medium text-pg-label3 mb-1">Admin response</div>
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
                      <div className="mt-3 grid grid-cols-3 gap-2.5 text-[12px] bg-pg-bg2 rounded-[10px] p-3">
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
                      <div className="text-[12px] font-medium text-pg-green mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {r.deliverable_urls.length} file{r.deliverable_urls.length > 1 ? 's' : ''} delivered
                      </div>
                      <div className="space-y-1.5">
                        {r.deliverable_urls.map((url, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
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

        {/* ========= DELIVERED ========= */}
        {tab === 'delivered' && (
          <div className="space-y-3">
            {completedRequests.length === 0 ? (
              <div className="pg-group px-6 py-14 text-center">
                <FileText className="w-8 h-8 text-pg-label3 mx-auto mb-3" />
                <p className="text-[14px] text-pg-label2">No delivered files yet</p>
              </div>
            ) : (
              completedRequests.map((r) => (
                <div key={r.id} className="bg-pg-bg border border-pg-sep rounded-[16px] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-pg-green" />
                    <div className="font-semibold text-pg-label text-[15px] truncate">{r.service_type}</div>
                  </div>
                  {r.deliverable_urls?.length ? (
                    <div className="pg-group">
                      {r.deliverable_urls.map((url, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-pg-label3 shrink-0" />
                            <span className="text-[13.5px] text-pg-label truncate">{getFileNameFromUrl(url)}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openFile(url, false)}
                              className="pg-btn pg-btn-sm pg-btn-secondary"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              onClick={() => openFile(url, true)}
                              className="pg-btn pg-btn-sm pg-btn-secondary"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-pg-label3">No files attached</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Request Dialog */}
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
                <div className="text-[12.5px] text-pg-label2 mb-2">
                  + {selectedServices.length} individual service{selectedServices.length > 1 ? 's' : ''}
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-pg-sep">
                <div className="text-[13px] text-pg-label2">Estimated total</div>
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
              <button
                onClick={() => setShowRequestDialog(false)}
                className="pg-btn pg-btn-secondary"
              >
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
