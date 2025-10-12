import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SkeletonCard = () => (
  <Card className="glass-card border-border/30">
    <CardHeader className="animate-pulse">
      <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 mb-3 shimmer"></div>
      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-1/2 shimmer"></div>
    </CardHeader>
    <CardContent className="animate-pulse space-y-3">
      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded shimmer"></div>
      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-5/6 shimmer"></div>
      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-4/6 shimmer"></div>
    </CardContent>
  </Card>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// Shimmer animation CSS - add to index.css
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .shimmer {
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
`;
