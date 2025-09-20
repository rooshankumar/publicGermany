import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="container py-8 pb-20 md:pb-8">
        {/* Main content (full width) */}
        <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Student Reviews</h1>
                <p className="text-muted-foreground mt-2">Read what our students say about their experience</p>
              </div>
              {user && (
                <Button onClick={() => setShowReviewForm(true)} className="md:self-end">
                  <Plus className="mr-2 h-4 w-4" />
                  Write a Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                  <CardDescription>
                    Share your experience to help other students
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

            {/* Two columns: All students' reviews (approved) and My reviews with status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>All Students' Reviews</CardTitle>
                    <CardDescription>Recently approved reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReviewList />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>My Reviews</CardTitle>
                    <CardDescription>Your submitted reviews and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
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

        {/* Mobile sticky action bar */}
        {user && (
          <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-4 py-3 flex items-center justify-center">
              <Button className="w-full" onClick={() => setShowReviewForm(true)}>Write a Review</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
