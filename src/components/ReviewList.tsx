import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, StarHalf, StarOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  service_type: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ReviewListProps {
  limit?: number;
  serviceType?: string;
  showTitle?: boolean;
}

export function ReviewList({ limit = 5, serviceType, showTitle = true }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        let query = (supabase as any)
          .from('reviews')
          .select(`id, user_id, rating, review_text, service_type, created_at, profiles ( full_name, avatar_url )`)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (serviceType) {
          query = query.eq('service_type', serviceType);
        }

        if (limit && !showAll) {
          query = query.limit(limit);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setReviews((data || []) as Review[]);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [limit, showAll, serviceType]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
          <StarOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No reviews yet</h3>
        <p className="text-muted-foreground mt-1">
          Be the first to share your experience!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <h2 className="text-2xl font-bold tracking-tight">
          What our {serviceType ? serviceType : ''} students say
        </h2>
      )}
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 flex-wrap">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.profiles?.avatar_url} alt={review.profiles?.full_name} />
                  <AvatarFallback>
                    {review.profiles?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <h4 className="font-medium truncate max-w-[70%] sm:max-w-none">
                      {review.profiles?.full_name || 'Anonymous'}
                    </h4>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 mb-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {review.review_text}
                  </p>
                  {review.service_type && review.service_type !== 'general' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {review.service_type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {limit && reviews.length >= limit && !showAll && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => setShowAll(true)}
            className="text-primary"
          >
            View all reviews
          </Button>
        </div>
      )}
    </div>
  );
}
