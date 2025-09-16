import { useState, useEffect } from 'react';
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
  created_at: string;
}

const getDeliverableUrl = (req: ServiceRequest) => {
  const anyReq = req as any;
  if (anyReq.deliverable_url && typeof anyReq.deliverable_url === 'string') {
    return anyReq.deliverable_url as string;
  }
  if (req.admin_response && req.admin_response.includes('http')) {
    const match = req.admin_response.match(/https?:[^\s)]+/i);
    if (match) return match[0];
  }
  return null;
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
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewServiceType, setReviewServiceType] = useState('general');
  const [sortKey, setSortKey] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_asc');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Map of requestId -> discovered deliverable URL (from storage)
  const [deliverables, setDeliverables] = useState<Record<string, string>>({});

  const services = [
    { id: 'university_shortlisting', name: 'University Shortlisting', price: 5000, description: 'Get personalized university recommendations based on your profile' },
    { id: 'cv_preparation', name: 'CV Preparation', price: 3000, description: 'Professional CV tailored for German university applications' },
    { id: 'sop_first_draft', name: 'SOP (1st draft)', price: 2500, description: 'Statement of Purpose - first draft with revisions' },
    { id: 'sop_additional', name: 'SOP (additional)', price: 2000, description: 'Additional SOP for different programs' },
    { id: 'lor_samples', name: 'LOR Samples', price: 3000, description: 'Letter of Recommendation templates and samples' },
    { id: 'visa_sop', name: 'Visa SOP', price: 5000, description: 'Statement of Purpose specifically for visa applications' },
    { id: 'aps_help', name: 'APS Help', price: 2000, description: 'Guidance and assistance with APS certificate application' },
    { id: 'general_profile_evaluation', name: 'General Profile Evaluation', price: 999, description: 'Quick profile evaluation with actionable next steps' },
  ];

  // Sort services by price (low to high) for display consistency
  const sortedServices = [...services].sort((a, b) => a.price - b.price);

  // Compute displayed services based on search + sort controls
  const displayedServices = [...services]
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortKey === 'price_asc') return a.price - b.price;
      if (sortKey === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

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
  const nameToId = (name: string) => {
    const map: Record<string, string> = {
      'General Profile Evaluation': 'general_profile_evaluation',
      'APS Help': 'aps_help',
      'University Shortlisting': 'university_shortlisting',
      'CV Preparation': 'cv_preparation',
      'SOP (1st draft)': 'sop_first_draft',
      'SOP (additional)': 'sop_additional',
      'LOR Samples': 'lor_samples',
      'Visa SOP': 'visa_sop',
    };
    return map[name] || name.toLowerCase().split(' ').join('_');
  };

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
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['service_requests', user?.id],
    queryFn: fetchServiceRequests,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews_public_and_me', user?.id],
    queryFn: fetchReviews,
  });

  // Sync local state from query data
  useEffect(() => {
    if (paymentsQuery.data) setUserPayments(paymentsQuery.data as any[]);
  }, [paymentsQuery.data]);

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
        .from('service_requests')
        .select('id, user_id, service_type, service_price, service_currency, request_details, preferred_timeline, status, admin_response, created_at')
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
    if (selectedServices.length === 0) {
      toast({ title: "Error", description: "Please select at least one service", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const serviceNames = selectedServices.map(id => services.find(s => s.id === id)?.name).join(', ');

    try {
      const { error } = await supabase
        .from('service_requests')
        .insert([{
          user_id: user.id,
          service_type: serviceNames,
          service_price: calculateTotalPrice(),
          service_currency: 'INR',
          request_details: formData.get('details') as string,
          preferred_timeline: formData.get('timeline') as string,
          status: 'new',
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Service request submitted" });
      // Notify admin(s) via email (bell notifications handled by DB trigger)
      try {
        await sendEmail(
          'roshlingua@gmail.com',
          'New Service Request',
          `<p>A new service request has been created.</p>
           <p><strong>Services:</strong> ${serviceNames || '(none)'}<br/>
           <strong>Total:</strong> ₹${calculateTotalPrice().toLocaleString()}<br/>
           <strong>User ID:</strong> ${user.id}</p>`
        );
      } catch (_) { /* ignore admin email errors */ }
      setShowRequestDialog(false);
      setSelectedServices([]);
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

  if (loading) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayedServices.map((service) => (
              <Card key={service.id} className="border-primary/10 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{service.name}</CardTitle>
                    <Badge variant="secondary">₹{service.price.toLocaleString()}</Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => { setSelectedServices([service.id]); setShowRequestDialog(true); }}
                  >
                    Request Service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payments Note */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                For payments, please contact us via email at{' '}
                <a href="mailto:roshlingua@gmail.com" className="underline">
                  roshlingua@gmail.com
                </a>.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Reviews Section removed on Services page: Only show the user's own reviews below */}

        {/* Your Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Your Reviews</h3>
              <p className="text-muted-foreground">See what you've shared. Pending reviews will be shown here until approved.</p>
            </div>
            <Button variant="outline" onClick={() => setShowReviewDialog(true)}>Write a Review</Button>
          </div>

          {myReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myReviews.map((review) => (
                <Card key={review.id} className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {review.profile?.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {review.profile?.full_name || 'You'}
                          </CardTitle>
                          <CardDescription>
                            {new Date(review.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!review.is_approved ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Pending Approval</Badge>
                        ) : review.is_featured ? (
                          <Badge variant="secondary">Featured</Badge>
                        ) : (
                          <Badge variant="secondary">Approved</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-3">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-muted-foreground">"{review.review_text}"</p>
                    {review.service_type && (
                      <Badge variant="outline" className="mt-3">
                        {review.service_type}
                      </Badge>
                    )}
                    {!review.is_approved && (
                      <div className="mt-3">
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>
                          <Trash className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">You haven't submitted any reviews yet.</p>
              <Button className="mt-3" onClick={() => setShowReviewDialog(true)}>Write your first review</Button>
            </div>
          )}
        </div>
        <div className="">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Personalized Help</DialogTitle>
                <DialogDescription>
                  Select the services you need and provide details about your requirements
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Select Services</Label>
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
                            ₹{service.price.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedServices.length > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-bold">
                          ₹{calculateTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
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
                  <Select name="timeline" required>
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
                  For payments, please contact us via email at
                  {' '}
                  <a href="mailto:roshlingua@gmail.com" className="underline">roshlingua@gmail.com</a>.
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowRequestDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedServices.length === 0}>
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
          </div>
          
          {serviceRequests.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground mb-4">No service requests yet</p>
              <Button onClick={() => setShowRequestDialog(true)}>
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

                      {/* Show deliverable actions when completed */}
                      {(() => { const url = request.status === 'completed' ? (getDeliverableUrl(request) || deliverables[request.id]) : null; return url; })() && (
                        <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Delivered</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={(getDeliverableUrl(request) || deliverables[request.id]) as string}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button size="sm" variant="default">View</Button>
                              </a>
                              <a
                                href={(getDeliverableUrl(request) || deliverables[request.id]) as string}
                                download
                              >
                                <Button size="sm" variant="outline">Download</Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fallback: allow user to check storage for deliverable if completed but no link */}
                      {request.status === 'completed' && !(getDeliverableUrl(request) || deliverables[request.id]) && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={() => discoverDeliverableFor(request, setDeliverables, toast)}>
                            Check Deliverable
                          </Button>
                        </div>
                      )}

                      {/* Reflect pending payments for included services */}
                      <div className="flex flex-wrap gap-2">
                        {request.service_type.split(',').map(n => n.trim()).filter(Boolean).map((name) => {
                          const sid = nameToId(name);
                          const pay = getPaymentFor(sid);
                          if (!pay) return null;
                          const variant = pay.status === 'approved' ? 'secondary' : pay.status === 'rejected' ? 'destructive' : 'outline';
                          return (
                            <Badge key={`${request.id}-${sid}`} variant={variant as any} className="capitalize">
                              {name}: {pay.status} • ₹{(pay.amount || 0).toLocaleString()}
                            </Badge>
                          );
                        })}
                      </div>
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

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>Share your experience with our services</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex space-x-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Service Type</Label>
                <Select
                  value={reviewServiceType}
                  onValueChange={setReviewServiceType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Experience</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Submit Review
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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