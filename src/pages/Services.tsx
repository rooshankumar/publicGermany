import { useState, useEffect, useMemo } from 'react';
import PromoCard from '@/components/PromoCard';
import { usePromoOncePerSession } from '@/hooks/usePromo';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database.types';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IndianRupee, Clock, CheckCircle, XCircle, Star, StarHalf, StarOff, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/lib/sendEmail';
import { useAuth } from '@/hooks/useAuth';

type Review = Database['public']['Tables']['reviews']['Row'] & {
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  }
};

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

// Get all deliverable URLs from the request
const getAllDeliverableUrls = (req: ServiceRequest): string[] => {
  const anyReq = req as any;
  const urls: string[] = [];
  
  // First priority: deliverable_urls array (new system)
  if (anyReq.deliverable_urls && Array.isArray(anyReq.deliverable_urls)) {
    urls.push(...anyReq.deliverable_urls);
  }
  
  // Second priority: single deliverable_url (backward compatibility)
  if (anyReq.deliverable_url && typeof anyReq.deliverable_url === 'string') {
    if (!urls.includes(anyReq.deliverable_url)) {
      urls.push(anyReq.deliverable_url);
    }
  }
  
  // Third priority: URLs in admin response (legacy)
  if (req.admin_response && req.admin_response.includes('http')) {
    const matches = req.admin_response.match(/https?:[^\s)]+/gi) || [];
    matches.forEach(url => {
      if (!urls.includes(url)) {
        urls.push(url);
      }
    });
  }
  
  return urls;
};

const getDeliverableUrl = (req: ServiceRequest) => {
  const urls = getAllDeliverableUrls(req);
  return urls.length > 0 ? urls[0] : null;
};

// Manually discover deliverable for a single request
const discoverDeliverableFor = async (
  req: ServiceRequest,
  setDeliverables: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  toast: (opts: { title: string; description?: string; variant?: any }) => void
) => {
  if (req.status !== 'completed') return;
  try {
    const path = `service_requests/${req.id}`;
    const { data, error } = await supabase.storage.from('documents').list(path, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
    if (!error && data && data.length > 0) {
      const file = data[0];
      const fullPath = `${path}/${file.name}`;
      const { data: pub } = supabase.storage.from('documents').getPublicUrl(fullPath);
      if (pub?.publicUrl) {
        setDeliverables(prev => ({ ...prev, [req.id]: pub.publicUrl }));
        toast({ title: 'Deliverable found', description: 'You can now view or download the file.' });
        return;
      }
    }
    toast({ title: 'No deliverable found', description: 'Please ask the admin to attach the final document.', variant: 'destructive' });
  } catch (e: any) {
    toast({ title: 'Unable to fetch deliverable', description: e?.message || 'Please try again later.', variant: 'destructive' });
  }
};

// Extract a user-friendly filename from a URL
const getFileNameFromUrl = (url: string) => {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const last = pathname.substring(pathname.lastIndexOf('/') + 1);
    return decodeURIComponent(last) || 'download';
  } catch {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'download');
  }
};

// Remove URLs and noisy labels from admin response for cleaner display
const sanitizeAdminResponse = (text: string) => {
  if (!text) return '';
  let t = text;
  // Remove any http/https links
  t = t.replace(/https?:[^\s)]+/gi, ' ');
  // Remove explicit labels like 'Deliverable:'
  t = t.replace(/\bdeliverable:\s*/gi, '');
  // Normalize whitespace
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
};

const Services = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [packageRequestName, setPackageRequestName] = useState<string | null>(null);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewServiceType, setReviewServiceType] = useState('general');
  const [sortKey, setSortKey] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [timeline, setTimeline] = useState<string>('');

  // Map of requestId -> discovered deliverable URL (from storage)
  const [deliverables, setDeliverables] = useState<Record<string, string>>({});
  const [paymentEmail, setPaymentEmail] = useState<string>('publicgermany@outlook.com');

  // Parse stored service_type into clean list of service names (handles package + "Extras:")
  const parseServiceNames = (text: string = ''): string[] => {
    return text
      .split(/\||,/g)
      .map(s => s.replace(/Extras:\s*/i, '').trim())
      .filter(Boolean);
  };

  // Parse a price range string like "20000-25000" into min/max numbers
  const parsePriceRange = (range?: string | null): { min: number; max: number } | null => {
    if (!range) return null;
    const match = (range || '').toString().match(/(\d[\d,]*)\s*-\s*(\d[\d,]*)/);
    if (!match) return null;
    const min = Number(match[1].replace(/,/g, '')) || 0;
    const max = Number(match[2].replace(/,/g, '')) || min;
    return { min, max };
  };


  type CatalogItem = {
    id: string;
    kind: 'package' | 'individual';
    name: string;
    description: string | null;
    price_inr: number | null;
    price_range_inr: string | null;
    is_active: boolean;
  };

  const slugifyName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

  async function fetchCatalog(): Promise<CatalogItem[]> {
    const { data, error } = await (supabase as any)
      .from('services_catalog')
      .select('id, kind, name, description, price_inr, price_range_inr, is_active')
      .eq('is_active', true);
    if (error) throw error;
    return (data || []) as CatalogItem[];
  }

  async function fetchPaymentContact(): Promise<string> {
    const { data, error } = await (supabase as any)
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_contact')
      .single();
    if (error) return 'publicgermany@outlook.com';
    const email = (data?.value?.email || data?.value?.contact || '').toString();
    return email || 'publicgermany@outlook.com';
  }

  // DB-backed services list (individual services only)
  const catalogQuery = useQuery({
    queryKey: ['services_catalog_active'],
    queryFn: fetchCatalog,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  });

  const paymentContactQuery = useQuery({
    queryKey: ['payment_contact'],
    queryFn: fetchPaymentContact,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (paymentContactQuery.data) setPaymentEmail(paymentContactQuery.data);
  }, [paymentContactQuery.data]);

  // Minimal promo popups (once per session)
  const promoExpert = usePromoOncePerSession('expert-help', 6 * 60 * 60 * 1000);
  const promoPackages = usePromoOncePerSession('packages-push', 6 * 60 * 60 * 1000);

  const services = useMemo(() => (
    (catalogQuery.data || [])
      .filter((i) => i.kind === 'individual')
      .map((i) => ({
        id: slugifyName(i.name),
        name: i.name,
        price: i.price_inr === null ? null : Number(i.price_inr) || 0,
        description: i.description || '',
      }))
  ), [catalogQuery.data]);

  // Detailed list of currently selected extras with price (must be after `services` is declared)
  const selectedExtrasDetailed = useMemo(() => {
    return selectedServices
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is { id: string; name: string; price: number | null; description: string } => !!s)
      .map((s) => ({ name: s.name, price: s.price || 0 }));
  }, [selectedServices, services]);

  const packages = useMemo(() => (
    (catalogQuery.data || [])
      .filter((i) => i.kind === 'package')
      .map((i) => ({
        id: slugifyName(i.name),
        name: i.name,
        priceRange: i.price_range_inr || '',
        description: i.description || '',
      }))
  ), [catalogQuery.data]);

  // Sort services by price (low to high) for display consistency
  const sortedServices = useMemo(() => (
    [...services].sort((a, b) => (a.price || 0) - (b.price || 0))
  ), [services]);

  // Compute displayed services based on search + sort controls
  const displayedServices = useMemo(() => (
    [...services]
      .filter(s => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortKey === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortKey === 'price_desc') return (b.price || 0) - (a.price || 0);
        return a.name.localeCompare(b.name);
      })
  ), [services, search, sortKey]);

  // Debounce utility
  const debounce = <F extends (...args: any[]) => void>(fn: F, delay = 300) => {
    let t: any;
    return (...args: Parameters<F>) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  };

  // Fetch current user's payments
  async function fetchUserPayments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [] as any[];
    const { data, error } = await (supabase as any)
      .from('service_payments')
      .select('id, service_id, amount, currency, proof_url, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Map service display name to DB service_id
  const nameToId = (name: string) => slugifyName(name);

  // Get latest payment for a given service_id from user's payments
  const getPaymentFor = (serviceId: string) => {
    const filtered = userPayments.filter((p) => p.service_id === serviceId);
    if (filtered.length === 0) return null;
    return filtered[0];
  };

  // React Query hooks
  const paymentsQuery = useQuery({
    queryKey: ['service_payments', user?.id],
    queryFn: fetchUserPayments,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    enabled: !!user?.id,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['service_requests', user?.id],
    queryFn: fetchServiceRequests,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    enabled: !!user?.id,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews_public_and_me', user?.id],
    queryFn: fetchReviews,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    enabled: !!user?.id,
  });

  // Sync local state from query data
  useEffect(() => {
    if (paymentsQuery.data) setUserPayments(paymentsQuery.data as any[]);
  }, [paymentsQuery.data]);

  // Derive loading state from queries to avoid getting stuck until hard refresh
  useEffect(() => {
    const anyLoading = catalogQuery.isLoading || serviceRequestsQuery.isLoading;
    const allSettled = catalogQuery.isFetched && serviceRequestsQuery.isFetched;
    setLoading(anyLoading ? true : !allSettled ? true : false);
  }, [catalogQuery.isLoading, catalogQuery.isFetched, serviceRequestsQuery.isLoading, serviceRequestsQuery.isFetched]);

  useEffect(() => {
    if ((serviceRequestsQuery.data as any[])) setServiceRequests((serviceRequestsQuery.data as any[]) || []);
  }, [serviceRequestsQuery.data]);

  useEffect(() => {
    const d: any = reviewsQuery.data as any;
    if (d && typeof d === 'object') {
      setReviews(d.publicData || []);
      setMyReviews(d.mineData || []);
    }
  }, [reviewsQuery.data]);

  useEffect(() => {
    // Realtime sync for payments for this user
    const paymentsChannel = supabase
      .channel('service-payments-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, debounce(() => { paymentsQuery.refetch(); }, 400))
      .subscribe();

    const requestsChannel = supabase
      .channel('service-requests-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, debounce(() => {
        // Refresh requests so status & deliverables are up-to-date
        serviceRequestsQuery.refetch();
      }, 400))
      .subscribe();

    // Realtime sync for this user's reviews (keep myReviews up to date)
    let reviewsChannel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      reviewsChannel = supabase
        .channel('reviews-user')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reviews', filter: `user_id=eq.${user.id}` },
          debounce(() => {
            // Refresh both public and my reviews to reflect any change immediately
            reviewsQuery.refetch();
          }, 400)
        )
        .subscribe();
    })();

    return () => { 
      supabase.removeChannel(paymentsChannel); 
      supabase.removeChannel(requestsChannel);
      if (reviewsChannel) supabase.removeChannel(reviewsChannel);
    };
  }, []);

  // When requests load/update, try to discover deliverables in storage for completed ones
  useEffect(() => {
    const discover = async () => {
      const candidates = serviceRequests.filter(r => r.status === 'completed' && !getDeliverableUrl(r) && !deliverables[r.id]);
      if (candidates.length === 0) return;
      const entries: Record<string, string> = {};
      await Promise.all(candidates.map(async (r) => {
        try {
          const path = `service_requests/${r.id}`;
          const { data, error } = await supabase.storage.from('documents').list(path, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
          if (!error && data && data.length > 0) {
            const file = data[0];
            const fullPath = `${path}/${file.name}`;
            const { data: pub } = supabase.storage.from('documents').getPublicUrl(fullPath);
            if (pub?.publicUrl) {
              entries[r.id] = pub.publicUrl;
            }
          }
        } catch (e) {
          // ignore per-item errors
        }
      }));
      if (Object.keys(entries).length > 0) {
        setDeliverables(prev => ({ ...prev, ...entries }));
      }
    };
    discover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequests]);

  // (Removed) QR payment and proof upload flow. Users should email for payments instead.

  async function fetchReviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { publicData: [], mineData: [] } as any;

      // 1) Fetch public approved reviews (with minimal fields + profile join if available)
      const { data: publicData, error: publicErr } = await (supabase as any)
        .from('reviews')
        .select(`
          id, user_id, rating, review_text, service_type, is_approved, is_featured, created_at,
          profiles:profiles!inner(user_id, full_name, avatar_url)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (publicErr) throw publicErr;

      // 2) Fetch this user's reviews (approved or pending) with profile
      const { data: mineData, error: mineErr } = await (supabase as any)
        .from('reviews')
        .select(`
          id, user_id, rating, review_text, service_type, is_approved, is_featured, created_at,
          profiles:profiles!inner(user_id, full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (mineErr) throw mineErr;

      // Normalize profile shape to existing UI expectations
      const mapWithProfile = (arr: any[] = []) => (arr || []).map((r: any) => ({
        ...r,
        profile: r.profiles ? { full_name: r.profiles.full_name, avatar_url: r.profiles.avatar_url } : {},
      }));

      return { publicData: mapWithProfile(publicData), mineData: mapWithProfile(mineData) };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
      return { publicData: [], mineData: [] } as any;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-muted-foreground" />);
      }
    }
    return stars;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .insert({
          user_id: user.id,
          rating,
          review_text: reviewText,
          service_type: reviewServiceType === 'general' ? null : reviewServiceType,
          is_approved: false,
          is_featured: false
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback! Your review is pending approval.",
      });

      setReviewText('');
      setRating(0);
      setReviewServiceType('general');
      setShowReviewDialog(false);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  async function fetchServiceRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as any[];
      
      const { data, error } = await supabase
        .from('service_requests' as any)
        .select(`
          id, user_id, service_type, service_price, service_currency, target_total_amount, target_currency, request_details, preferred_timeline, status, admin_response, created_at,
          service_payments (
            id, amount, currency, status, paid_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
      return [] as any[];
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 && !packageRequestName) {
      toast({ title: "Error", description: "Please select at least one service or a package", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    if (!timeline) {
      toast({ title: "Timeline required", description: "Please choose a preferred timeline before submitting.", variant: "destructive" });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    // Build a human-friendly description including package and optional extras
    const selectedExtras = selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[];
    const serviceNames = packageRequestName
      ? [packageRequestName, ...(selectedExtras.length ? ["Extras: " + selectedExtras.join(', ')] : [])].join(' | ')
      : selectedExtras.join(', ');

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert([{
          user_id: user.id,
          service_type: serviceNames,
          // For package requests, store only the extras total as price (package range is informational)
          service_price: packageRequestName ? calculateTotalPrice() : calculateTotalPrice(),
          service_currency: 'INR',
          request_details: formData.get('details') as string,
          preferred_timeline: formData.get('timeline') as string,
          status: 'new',
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Service request submitted" });
      // Notify admin(s) via email and also send a confirmation to the student
      try {
        const studentName = (profile?.full_name && profile.full_name.trim())
          ? profile.full_name.trim()
          : (user.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : '');
        const studentEmail = user.email || '';
        const profileUrl = `${window.location.origin}/admin/students/${user.id}`;
        const dashboardUrl = `${window.location.origin}/dashboard`;
        const adminEmailPromise = sendEmail(
          'publicgermany@outlook.com',
          'New Service Request',
          `<p>A new service request has been created.</p>
           <p><strong>Student:</strong> ${studentName || '(unknown)'}<br/>
           <strong>Email:</strong> ${studentEmail || '(unknown)'}<br/>
           <strong>Profile:</strong> <a href="${profileUrl}">${profileUrl}</a><br/>
           <strong>Services:</strong> ${serviceNames || '(none)'}<br/>
           <strong>Total:</strong> ₹${calculateTotalPrice().toLocaleString()}<br/>
           <strong>User ID:</strong> ${user.id}</p>`
        );
        const userEmailPromise = studentEmail
          ? sendEmail(
              studentEmail,
              'We received your service request',
              `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1C1C1C;">
                 <p>Hi ${studentName || 'there'},</p>
                 <p>Thanks for submitting your service request. Our team will review it and get back to you shortly.</p>
                 <p><strong>Requested Services:</strong> ${serviceNames || '(none)'}<br/>
                 <strong>Estimated Total:</strong> ₹${calculateTotalPrice().toLocaleString()}</p>
                 <div style="margin-top:12px;">
                   <a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#D00000;color:#ffffff;text-decoration:none;border-radius:6px;">Open My Dashboard</a>
                 </div>
                 <p style="margin-top:12px;color:#666">If you have any questions, reply to this email or contact us at publicgermany@outlook.com.</p>
               </div>`
            )
          : Promise.resolve();
        await Promise.allSettled([adminEmailPromise, userEmailPromise]);
      } catch (_) { /* ignore admin email errors */ }
      setShowRequestDialog(false);
      setSelectedServices([]);
      setPackageRequestName(null);
      fetchServiceRequests();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    }
  };

  // Delete a service request created by the current user
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Delete this service request? This cannot be undone.')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .match({ id: requestId, user_id: user.id });
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Your service request has been deleted.' });
      fetchServiceRequests();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete request', variant: 'destructive' });
    }
  };

  // Delete a review posted by the current user
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error, data: deleted } = await (supabase as any)
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select('id');
      if (error) throw error;
      if (!deleted || deleted.length === 0) {
        // No rows deleted - likely due to RLS or it was already approved/removed
        toast({ title: 'Not deleted', description: 'Unable to delete this review (not found or not permitted).', variant: 'destructive' });
        // Ensure UI is accurate
        fetchReviews();
        return;
      }
      toast({ title: 'Deleted', description: 'Your review has been deleted.' });
      // Remove from UI immediately since DB confirmed deletion
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete review', variant: 'destructive' });
    }
  };

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'payment_pending':
        return <IndianRupee className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'payment_pending': return 'secondary';
      case 'in_review': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading || catalogQuery.isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>

        {/* My Payments (real-time) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Payments</h2>
              <p className="text-muted-foreground">Proofs you submitted and their statuses</p>
            </div>
          </div>
          {userPayments.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">No payments submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userPayments.map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{p.service_id.split('_').join(' ')}</CardTitle>
                      <Badge variant={p.status === 'approved' ? 'secondary' : p.status === 'rejected' ? 'destructive' : 'outline'} className="capitalize">
                        {p.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center gap-4">
                    <div className="text-sm text-muted-foreground">₹{p.amount?.toLocaleString()} • {new Date(p.created_at).toLocaleString()}</div>
                    <a href={p.proof_url} target="_blank" rel="noreferrer" className="underline text-sm">View Proof</a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 space-y-16">
        {/* Catalog load errors */}
        {catalogQuery.isError && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive text-base">Unable to load services</CardTitle>
              <CardDescription>{(catalogQuery.error as any)?.message || 'Please try again shortly.'}</CardDescription>
            </CardHeader>
          </Card>
        )}
        {/* Minimal promo pop cards */}
        {promoExpert.shouldShow && (
          <PromoCard 
            title="Get expert help" 
            description="Start with a quick profile evaluation, only ₹999." 
            onClose={promoExpert.markShown} 
          />
        )}
        {promoPackages.shouldShow && (
          <PromoCard 
            title="Admission + Visa Packages" 
            description="End-to-end guidance. Request a package now." 
            onClose={promoPackages.markShown} 
          />
        )}
        {/* Packages Section */}
        {packages.length > 0 && (
          <div className="space-y-4 md:space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Packages</h2>
              <p className="text-muted-foreground">All-in-one bundles to save time and maximize outcomes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {packages.map((p) => (
                <Card key={p.id} className="border-accent/20 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{p.name}</CardTitle>
                      {p.priceRange ? (
                        <Badge variant="secondary">₹{p.priceRange}</Badge>
                      ) : null}
                    </div>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        className="w-full sm:w-auto"
                        onClick={() => { setSelectedServices([]); setTimeline(''); setPackageRequestName(p.name); setShowRequestDialog(true); }}
                      >
                        Request Package
                      </Button>
                      <Button variant="outline" asChild className="w-full sm:w-auto">
                        <a href={`mailto:${paymentEmail}?subject=${encodeURIComponent('Package enquiry: ' + p.name)}`}>Ask About This</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Services Section */}
        <div className="space-y-6 md:space-y-10">
          <div className="text-center space-y-3">
            <h1 className="hidden md:block text-4xl md:text-5xl font-bold tracking-tight">Our Services</h1>
            <p className="hidden md:block text-muted-foreground text-lg">Professional assistance to help you succeed in your Germany study journey</p>
          </div>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Search services (e.g., SOP, APS, CV)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Sort</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name: A → Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Services grid (with sort & search) */}
          {displayedServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {displayedServices.map((service) => (
                <Card key={service.id} className="border-primary/10 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{service.name}</CardTitle>
                      <Badge variant="secondary">{service.price != null ? `₹${service.price.toLocaleString()}` : '—'}</Badge>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full"
                      onClick={() => { setPackageRequestName(null); setSelectedServices([service.id]); setTimeline(''); setShowRequestDialog(true); }}
                    >
                      Request Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">No services available right now</CardTitle>
                <CardDescription>
                  We’re updating our catalog. Please check back soon or contact us at{' '}
                  <a href={`mailto:${paymentEmail}`} className="underline">{paymentEmail}</a>.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Payments Note */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                For payments, please contact us via email at{' '}
                <a href={`mailto:${paymentEmail}`} className="underline">
                  {paymentEmail}
                </a>.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Reviews section removed from Services; please use /reviews */}
        <div className="">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Personalized Help</DialogTitle>
                <DialogDescription>
                  {packageRequestName ? (
                    <span>You're requesting the <strong>{packageRequestName}</strong> package</span>
                  ) : (
                    <span>Select the services you need and provide details about your requirements</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="space-y-4">
                  {packageRequestName && (
                    <div className="p-4 border rounded-lg space-y-1">
                      <p className="font-medium">Selected package</p>
                      <p className="text-muted-foreground">{packageRequestName}</p>
                    </div>
                  )}

                  <Label className="text-base font-medium">{packageRequestName ? 'Add optional services' : 'Select Services'}</Label>
                  {sortedServices.map((service) => (
                    <div key={service.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceSelection(service.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Label htmlFor={service.id} className="font-medium cursor-pointer">
                              {service.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            ₹{service.price?.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {packageRequestName ? (
                    (() => {
                      const p = packages.find(pk => pk.name === packageRequestName);
                      const range = parsePriceRange(p?.priceRange);
                      const extras = calculateTotalPrice();
                      const combined = range ? { min: range.min + extras, max: range.max + extras } : null;
                      return (
                        <div className="p-4 bg-primary/10 rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Package price</span>
                            <span>{p?.priceRange ? `₹${p.priceRange}` : '—'}</span>
                          </div>
                          {/* Named extras breakdown */}
                          {selectedExtrasDetailed.length > 0 && (
                            <div className="pt-1 space-y-1">
                              {selectedExtrasDetailed.map((ex, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span>{ex.name}</span>
                                  <span>₹{ex.price.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Extras total</span>
                            <span>₹{extras.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Combined total</span>
                            <span>
                              {combined ? `₹${combined.min.toLocaleString()} - ₹${combined.max.toLocaleString()}` : `₹${extras.toLocaleString()}`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Package range + extras shown as combined total.</p>
                        </div>
                      );
                    })()
                  ) : (
                    selectedServices.length > 0 && (
                      <div className="p-4 bg-primary/10 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Total</span>
                          <span>₹{calculateTotalPrice().toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Context & Requirements</Label>
                  <Textarea 
                    id="details" 
                    name="details"
                    placeholder="Please provide details about your requirements, target programs, intake, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Preferred Timeline</Label>
                  {/* Hidden input ensures the selected value is submitted with the form */}
                  <input type="hidden" name="timeline" value={timeline} />
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3 days">1-3 days</SelectItem>
                      <SelectItem value="1 week">1 week</SelectItem>
                      <SelectItem value="2 weeks">2 weeks</SelectItem>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Instructions */}
                <div className="p-4 bg-muted rounded-lg text-sm">
                  For payments, please contact us via email at{' '}
                  <a href={`mailto:${paymentEmail}`} className="underline">{paymentEmail}</a>.
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowRequestDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!packageRequestName && selectedServices.length === 0}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* My Requests */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Service Requests</h2>
              <p className="text-muted-foreground">Track the status of your service requests</p>
            </div>
            <a href="/reviews">
              <Button variant="outline">Write a Review</Button>
            </a>
          </div>
          
          {serviceRequests.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground mb-4">No service requests yet</p>
              <Button onClick={() => { setPackageRequestName(null); setSelectedServices([]); setTimeline(''); setShowRequestDialog(true); }}>
                Request Your First Service
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{request.service_type}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        {request.status !== 'completed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm">
                        <span className="font-medium">
                          {request.service_currency || 'INR'} {request.service_price?.toLocaleString()}
                        </span>
                        {request.preferred_timeline && (
                          <span className="text-muted-foreground ml-2">
                            • Timeline: {request.preferred_timeline}
                          </span>
                        )}
                      </div>
                      {/* Payment Status */}
                      <div className="text-sm mt-1">
                        {(() => {
                          const p = (request as any).service_payments?.[0] as undefined | { status: 'pending'|'received'|'cancelled'; amount: number|null; currency: string|null };
                          const status = p?.status || 'pending';
                          const cls = status === 'received' ? 'bg-success/10 text-success' : status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';
                          const amount = (p?.amount ?? request.service_price) as any;
                          const currency = (p?.currency || request.service_currency || 'INR') as any;
                          return (
                            <Badge className={cls}>
                              Payment: {status}{amount != null ? ` • ${currency} ${amount}` : ''}
                            </Badge>
                          );
                        })()}
                      </div>

                      {/* Totals Breakdown */}
                      {(() => {
                        const paymentsArr = ((request as any).service_payments || []) as Array<{ amount: number|null; status: string|null }>;
                        const receivedSum = paymentsArr
                          .filter((sp) => (sp?.status || '').toLowerCase() === 'received')
                          .reduce((acc, sp) => acc + (Number(sp?.amount) || 0), 0);
                        const totalTarget = Number(((request as any).target_total_amount ?? request.service_price) ?? 0);
                        const curr = (request as any).target_currency || request.service_currency || 'INR';
                        const remaining = Math.max(0, totalTarget - receivedSum);
                        return (
                          <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <span><strong>Total Amount:</strong> {curr} {isNaN(totalTarget) ? '-' : totalTarget.toLocaleString()}</span>
                            <span><strong>Amount Received:</strong> {curr} {receivedSum.toLocaleString()}</span>
                            <span><strong>Amount Remaining:</strong> {curr} {remaining.toLocaleString()}</span>
                          </div>
                        );
                      })()}

                       {/* Show deliverable actions when completed */}
                       {request.status === 'completed' && (
                         <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200">
                           <div className="flex items-center gap-2 text-green-700 mb-2">
                             <CheckCircle className="h-4 w-4" />
                             <span className="text-sm font-medium">Delivered</span>
                           </div>
                           {(() => {
                             // Get all deliverable URLs from the database array
                             const allUrls = getAllDeliverableUrls(request);
                             
                             // Add any discovered URLs from storage
                             if (deliverables[request.id] && !allUrls.includes(deliverables[request.id])) {
                               allUrls.push(deliverables[request.id]);
                             }
                             
                             if (allUrls.length === 0) {
                               return (
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   onClick={() => discoverDeliverableFor(request, setDeliverables, toast)}
                                 >
                                   Check for Files
                                 </Button>
                               );
                             }
                             
                             return (
                               <div className="space-y-2">
                                 {allUrls.map((url, index) => {
                                   const fileName = url.split('/').pop()?.replace(/^\d+-/, '') || `File ${index + 1}`;
                                   return (
                                     <div key={index} className="flex items-center justify-between gap-3 p-2 bg-white rounded border">
                                       <span className="text-xs text-gray-600 truncate flex-1">{fileName}</span>
                                       <div className="flex items-center gap-1">
                                         <a href={url} target="_blank" rel="noreferrer">
                                           <Button size="sm" variant="default" className="text-xs px-2 py-1">View</Button>
                                         </a>
                                         <a href={url} download>
                                           <Button size="sm" variant="outline" className="text-xs px-2 py-1">Download</Button>
                                         </a>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             );
                           })()}
                         </div>
                       )}

                      {/* Fallback: allow user to check storage for deliverable if completed but no link */}
                      {request.status === 'completed' && getAllDeliverableUrls(request).length === 0 && !deliverables[request.id] && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={() => discoverDeliverableFor(request, setDeliverables, toast)}>
                            Check Deliverable
                          </Button>
                        </div>
                      )}

                      {/* Payment badges per-service removed; using unified payment status above */}
                    </div>

                    {(() => { const clean = request.admin_response ? sanitizeAdminResponse(request.admin_response) : ''; return clean; })() && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <strong>Admin Response:</strong> {sanitizeAdminResponse(request.admin_response as string)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Review moved to dedicated page /reviews */}
        {/* Mobile sticky action bar */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3 flex items-center justify-center">
            <Button className="w-full" onClick={() => setShowRequestDialog(true)}>Request Service</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Services;