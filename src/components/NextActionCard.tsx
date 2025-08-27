import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NextAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionLink: string;
  dueDate?: string;
}

interface NextActionCardProps {
  actions: NextAction[];
}

const NextActionCard = ({ actions }: NextActionCardProps) => {
  if (!actions || actions.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <CardTitle className="text-lg font-semibold text-success">
              Great Progress! 🎉
            </CardTitle>
          </div>
          <CardDescription>
            You're on track with your German study journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Keep up the excellent work! Check back regularly for new tasks and updates.
          </p>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              Review Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const topAction = actions[0];
  const remainingCount = actions.length - 1;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'destructive',
          icon: AlertCircle,
          text: 'Urgent'
        };
      case 'medium':
        return {
          badge: 'default',
          icon: Clock,
          text: 'Important'
        };
      default:
        return {
          badge: 'secondary',
          icon: Clock,
          text: 'When Ready'
        };
    }
  };

  const priorityConfig = getPriorityConfig(topAction.priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20 card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Next Action Required
            </CardTitle>
          </div>
          <Badge variant={priorityConfig.badge as any} className="flex items-center space-x-1">
            <PriorityIcon className="h-3 w-3" />
            <span>{priorityConfig.text}</span>
          </Badge>
        </div>
        <CardDescription>
          Stay on track with your study abroad journey
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Action */}
        <div className="bg-background/60 rounded-lg p-4 border border-border/50">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground">{topAction.title}</h3>
            <Badge variant="outline" className="text-xs">
              {topAction.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {topAction.description}
          </p>
          {topAction.dueDate && (
            <p className="text-xs text-warning flex items-center space-x-1 mb-3">
              <Clock className="h-3 w-3" />
              <span>Due: {topAction.dueDate}</span>
            </p>
          )}
          <Link to={topAction.actionLink}>
            <Button size="sm" className="w-full">
              Take Action
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Additional Actions Summary */}
        {remainingCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              +{remainingCount} more action{remainingCount > 1 ? 's' : ''} pending
            </span>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NextActionCard;