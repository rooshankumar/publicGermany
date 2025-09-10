import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Review = Database['public']['Tables']['reviews']['Row'] & {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reviews Moderation</h1>
            <p className="text-muted-foreground">Approve, feature, or remove student reviews</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search (name, text, service)" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <Card><CardContent className="p-6">Loading...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-6 text-muted-foreground">No reviews found.</CardContent></Card>
          ) : filtered.map((r) => (
            <Card key={r.id} className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{r.profile?.full_name || 'Anonymous'}</CardTitle>
                  <div className="flex items-center gap-2">
                    {r.is_approved ? (
                      <Badge variant="secondary">Approved</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {r.is_featured ? <Badge>Featured</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">{new Date(r.created_at as any).toLocaleDateString()}</div>
                <div className="text-sm">Rating: {r.rating}</div>
                {r.service_type && (
                  <div className="text-xs">
                    <Badge variant="outline" className="capitalize">{r.service_type}</Badge>
                  </div>
                )}
                <p className="text-sm">"{r.review_text}"</p>
                <div className="flex gap-2 pt-2">
                  {!r.is_approved && (
                    <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => toggleFeatured(r.id, r.is_featured || false)}>
                    {r.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
