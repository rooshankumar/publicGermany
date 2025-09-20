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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Browse Reviews</CardTitle>
                <CardDescription>Select a category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant={activeTab === 'all' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('all')}>All Reviews</Button>
                <Button variant={activeTab === 'university' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('university')}>University Applications</Button>
                <Button variant={activeTab === 'visa' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('visa')}>Visa Assistance</Button>
                <Button variant={activeTab === 'counseling' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setActiveTab('counseling')}>Counseling</Button>
                {user && (
                  <Button onClick={() => setShowReviewForm(true)} className="w-full justify-start mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <section className="md:col-span-3">
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

            <Tabs 
              defaultValue="all" 
              value={activeTab}
              className="w-full"
              onValueChange={(value) => setActiveTab(value)}
            >
              <div className="flex items-center justify-between mb-6 md:hidden">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="university">University</TabsTrigger>
                  <TabsTrigger value="visa">Visa</TabsTrigger>
                  <TabsTrigger value="counseling">Counseling</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                <ReviewList />
              </TabsContent>
              <TabsContent value="university">
                <ReviewList serviceType="university" />
              </TabsContent>
              <TabsContent value="visa">
                <ReviewList serviceType="visa" />
              </TabsContent>
              <TabsContent value="counseling">
                <ReviewList serviceType="counseling" />
              </TabsContent>
            </Tabs>
          </section>
        </div>

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
