import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, StarHalf } from 'lucide-react';

export interface TestimonialReview {
  id: string;
  rating: number;
  review_text: string;
  service_type?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
  course_name?: string;
  university_name?: string;
  approval_status?: string;
}

function renderStars(rating: number) {
  const stars = [] as React.ReactNode[];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
    else if (i === fullStars + 1 && hasHalf) stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
    else stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
  }
  return stars;
}

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export type TestimonialCardProps = {
  review: TestimonialReview;
  isOpen: boolean;
  onToggle: (id: string) => void;
  truncateAt?: number;
  className?: string; // allows min-width or snap classes for mobile
  showNameBelowCard?: boolean; // deprecated: name is now shown in header
};

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  review,
  isOpen,
  onToggle,
  truncateAt = 200,
  className = '',
  showNameBelowCard = false,
}) => {
  const text = review.review_text || '';
  const isTruncated = text.length > truncateAt && !isOpen;
  const displayText = isTruncated ? text.slice(0, truncateAt) + '…' : text;

  const card = (
    <Card className={[
      'rounded-xl bg-card/95 border border-border/60 shadow-sm hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5',
      className,
    ].join(' ')}>
      <CardContent className="px-6 py-6 h-full flex flex-col relative overflow-hidden">
        {/* Header: Avatar + Name + Meta */}
        <div className="flex items-center gap-3 mb-3">
          {review.profiles?.avatar_url ? (
            <img
              src={review.profiles.avatar_url}
              alt={review.profiles.full_name || 'User'}
              className="h-10 w-10 rounded-full object-cover border border-border/60"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
              {(review.profiles?.full_name || 'U').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[220px]">
              {review.profiles?.full_name || 'Anonymous'}
            </p>
            <p className="text-[12px] text-muted-foreground truncate max-w-[260px]">
              {review.course_name ? `Course: ${review.course_name}` : 'Student'}
              {review.university_name ? ` • ${review.university_name}` : ''}
            </p>
            {review.approval_status && (
              <span className="mt-1 inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                {review.approval_status}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex">{renderStars(review.rating)}</div>
        </div>

        {/* Testimonial Text with overlay */}
        <div className="relative mb-3">
          <div className="absolute left-0 top-0 text-foreground/30 text-xl select-none">“</div>
          <p className="pl-4 text-sm leading-relaxed text-foreground/90">{displayText}</p>
          {isTruncated && (
            <div className="mt-2">
              <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-6 bg-gradient-to-t from-background/90 to-transparent" />
              <button onClick={() => onToggle(review.id)} className="relative z-[1] text-xs text-primary hover:underline">
                Show more
              </button>
            </div>
          )}
          {!isTruncated && text.length > truncateAt && (
            <button onClick={() => onToggle(review.id)} className="mt-2 text-xs text-primary hover:underline">
              Show less
            </button>
          )}
        </div>

        {/* Footer: service tag and date */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between">
          {review.service_type ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-foreground/80 whitespace-nowrap border border-border/50">
              {review.service_type}
            </span>
          ) : (
            <span />
          )}
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground leading-tight">{formatDate(review.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!showNameBelowCard) return card;

  return (
    <div className="flex flex-col">
      {card}
      <div className="px-1 pt-2 text-left">
        <p className="text-[11px] text-muted-foreground leading-tight">{formatDate(review.created_at)}</p>
      </div>
    </div>
  );
};

export default TestimonialCard;
