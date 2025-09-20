import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);

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
                    }} 
                  />
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="all" className="w-full">
              <TabsContent value="all">
                <ReviewList />
              </TabsContent>
            </Tabs>
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
