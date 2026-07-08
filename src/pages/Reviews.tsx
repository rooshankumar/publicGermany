import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadMine = async () => {
      if (!user?.id) { setMyReviews([]); return; }
      try {
        setMyLoading(true);
        const { data, error } = await (supabase as any)
          .from('reviews')
          .select(`id, user_id, rating, review_text, service_type, created_at, is_approved`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        setMyReviews(data || []);
      } catch (_) {
        setMyReviews([]);
      } finally {
        setMyLoading(false);
      }
    };
    loadMine();
  }, [user?.id, refreshKey]);

  return (
    <Layout>
      <div className="w-full md:container mx-auto px-2 sm:px-4 py-4 md:py-8">
        {/* Main content (full width) */}
        <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h1 className="text-base font-bold">Reviews</h1>
                <p className="text-[10px] text-muted-foreground">Read what our students say</p>
              </div>
              {user && (
                <Button size="sm" className="h-7 text-[10px]" onClick={() => setShowReviewForm(true)}>
                  <Plus className="mr-1 h-3 w-3" />Write
                </Button>
              )}
            </div>

            {showReviewForm && (
              <Card className="mb-3"><CardContent className="pt-3">
                  <ReviewForm 
                    onSubmitSuccess={() => {
                      setShowReviewForm(false);
                      setActiveTab('all');
                      setRefreshKey((k) => k + 1);
                    }} 
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="shadow-none"><CardContent className="p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">All Reviews</p>
                <ReviewList />
              </CardContent></Card>
              <Card className="shadow-none"><CardContent className="p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">My Reviews</p>
                    {myLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : myReviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">You haven't submitted any reviews yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {myReviews.map((r) => {
                          const status: 'approved' | 'pending' | 'rejected' = ((): any => {
                            // If your schema has a status column, replace this derivation.
                            return r.is_approved ? 'approved' : 'pending';
                          })();
                          const badgeClass = status === 'approved' ? 'bg-success/10 text-success' : status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';
                          return (
                            <Card key={r.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${badgeClass} capitalize`}>{status}</Badge>
                                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-foreground break-words">{r.review_text}</p>
                                    {r.service_type && (
                                      <div className="mt-2">
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                          {r.service_type}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
        </section>
        
      </div>
    </Layout>
  );
}
