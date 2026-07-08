import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
type Review = {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  service_type: string | null;
  is_approved: boolean;
  is_featured: boolean | null;
  created_at: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'featured'>('pending');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // fetch profiles for names
      const userIds = Array.from(new Set((data || []).map((r: any) => r.user_id))); 
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: p } = await (supabase as any)
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
        profiles = p || [];
      }

      const withProfile: Review[] = (data || []).map((r: any) => ({
        ...r,
        profile: profiles.find((p) => p.user_id === r.user_id) || {},
      }));
      setReviews(withProfile);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchReviews())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return (reviews || []).filter((r) => {
      if (status === 'pending' && r.is_approved) return false;
      if (status === 'approved' && !r.is_approved) return false;
      if (status === 'featured' && !r.is_featured) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(
          (r.profile?.full_name || '').toLowerCase().includes(q) ||
          (r.review_text || '').toLowerCase().includes(q) ||
          (r.service_type || '').toLowerCase().includes(q)
        )) return false;
      }
      return true;
    });
  }, [reviews, status, search]);

  const approve = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Approved', description: 'Review has been approved.' });
      fetchReviews();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to approve', variant: 'destructive' });
    }
  };

  const hide = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .update({ is_approved: false, is_featured: false })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Hidden', description: 'Review is now hidden from public pages.' });
      fetchReviews();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to hide review', variant: 'destructive' });
    }
  };

  const toggleFeatured = async (id: string, is_featured: boolean | null) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .update({ is_featured: !is_featured })
        .eq('id', id);
      if (error) throw error;
      toast({ title: !is_featured ? 'Featured' : 'Unfeatured', description: 'Review feature status updated.' });
      fetchReviews();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to update feature', variant: 'destructive' });
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject review? This will delete it permanently.')) return;
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Rejected', description: 'Review has been removed.' });
      fetchReviews();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to reject', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold">Reviews Moderation</h1>
            <p className="text-[10px] text-muted-foreground">Approve, feature, or remove student reviews</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Input className="h-7 text-xs flex-1" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="featured" className="text-xs">Featured</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {loading ? (
            <Card><CardContent className="p-4"><InlineLoader label="Loading reviews" /></CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-4 text-xs text-muted-foreground">No reviews found.</CardContent></Card>
          ) : filtered.map((r) => (
            <Card key={r.id} className="border-border/60 shadow-none">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold truncate">{r.profile?.full_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-1">
                    {r.is_approved ? <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">Approved</Badge> : <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Pending</Badge>}
                    {r.is_featured ? <Badge className="text-[8px] px-1 py-0 h-4">Featured</Badge> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{new Date(r.created_at as any).toLocaleDateString()}</span>
                  <span>· Rating: {r.rating}</span>
                  {r.service_type && <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">{r.service_type}</Badge>}
                </div>
                <div className={cn('text-[11px] break-words whitespace-pre-wrap', expanded[r.id] ? '' : 'max-h-16 overflow-hidden')}>
                  {r.review_text}
                </div>
                {(r.review_text?.length ?? 0) > 120 && (
                  <Button variant="link" size="sm" className="px-0 h-5 text-[10px]" onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}>
                    {expanded[r.id] ? 'Show less' : 'Read more'}
                  </Button>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {!r.is_approved && <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => approve(r.id)}>Approve</Button>}
                  {r.is_approved && <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2" onClick={() => hide(r.id)}>Hide</Button>}
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => toggleFeatured(r.id, r.is_featured || false)}>{r.is_featured ? 'Unfeature' : 'Feature'}</Button>
                  <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => reject(r.id)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
