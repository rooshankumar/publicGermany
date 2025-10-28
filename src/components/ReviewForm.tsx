import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ReviewFormProps {
  onSubmitSuccess?: () => void;
  initialRating?: number;
  initialReview?: string;
  serviceType?: string;
}

export function ReviewForm({ 
  onSubmitSuccess, 
  initialRating = 0,
  initialReview = '',
  serviceType = 'general'
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit a review.',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase.from('reviews').insert([
        {
          user_id: user.id,
          rating,
          review_text: review,
          service_type: serviceType,
          is_approved: false, // Needs admin approval
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback. Your review is pending approval.',
      });

      setRating(0);
      setReview('');
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'There was an error submitting your review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="rating">Your Rating</Label>
        <div className="flex items-center mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`p-1 focus:outline-none ${
                star <= rating ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
              onClick={() => handleRatingClick(star)}
              disabled={isSubmitting}
            >
              <Star 
                className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} 
              />
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="review">Your Review</Label>
        <Textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          className="mt-1 min-h-[100px]"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || rating === 0}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </div>
    </form>
  );
}
