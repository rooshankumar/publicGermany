import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Read what our students say about their experience
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowReviewForm(true)}>
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
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="university">University Applications</TabsTrigger>
            <TabsTrigger value="visa">Visa Assistance</TabsTrigger>
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
    </div>
  );
}
