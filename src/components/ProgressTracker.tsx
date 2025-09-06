import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  deadline?: string;
  category: string;
  weight: number; // For weighted progress calculation
}

interface ProgressTrackerProps {
  showDetailed?: boolean;
  className?: string;
}

export const ProgressTracker = ({ showDetailed = false, className = '' }: ProgressTrackerProps) => {
  const { profile } = useAuth();
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'documents', name: 'Documents', color: 'bg-blue-100 text-blue-800' },
    { key: 'university', name: 'University Applications', color: 'bg-green-100 text-green-800' },
    { key: 'visa', name: 'Visa Process', color: 'bg-purple-100 text-purple-800' },
    { key: 'preparation', name: 'Preparation', color: 'bg-orange-100 text-orange-800' },
  ];

  useEffect(() => {
    fetchProgressData();
  }, [profile]);

  const fetchProgressData = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at');

      if (error) throw error;

      // Transform checklist items to progress steps
      const progressSteps: ProgressStep[] = (data || []).map(item => ({
        id: item.id,
        title: item.item_name,
        description: item.notes || `Complete ${item.item_name.toLowerCase()}`,
        status: item.status as any,
        category: item.module,
        weight: 1, // Equal weight for now
        deadline: undefined // Remove this line since checklist_items doesn't have deadline
      }));

      setSteps(progressSteps);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallProgress = () => {
    if (steps.length === 0) return 0;
    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    const completedWeight = steps
      .filter(step => step.status === 'completed')
      .reduce((sum, step) => sum + step.weight, 0);
    return Math.round((completedWeight / totalWeight) * 100);
  };

  const getCategoryProgress = (categoryKey: string) => {
    const categorySteps = steps.filter(step => step.category === categoryKey);
    if (categorySteps.length === 0) return 0;
    const completed = categorySteps.filter(step => step.status === 'completed').length;
    return Math.round((completed / categorySteps.length) * 100);
  };

  const getStatusCounts = () => {
    return {
      completed: steps.filter(s => s.status === 'completed').length,
      inProgress: steps.filter(s => s.status === 'in_progress').length,
      pending: steps.filter(s => s.status === 'pending').length,
      overdue: steps.filter(s => s.status === 'overdue').length,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusCounts = getStatusCounts();
  const overallProgress = getOverallProgress();

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Journey Progress</span>
              </CardTitle>
              <CardDescription>
                {statusCounts.completed} of {steps.length} steps completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={overallProgress} className="progress-glow h-3" />
            
            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success">{statusCounts.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-warning">{statusCounts.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-muted-foreground">{statusCounts.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive">{statusCounts.overdue}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      {showDetailed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const progress = getCategoryProgress(category.key);
            const categorySteps = steps.filter(step => step.category === category.key);
            
            return (
              <Card key={category.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge className={category.color}>{progress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    
                    {/* Recent Steps */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {categorySteps.slice(0, 3).map((step) => (
                        <div key={step.id} className="flex items-center space-x-2 text-sm">
                          {getStatusIcon(step.status)}
                          <span className="flex-1 truncate">{step.title}</span>
                        </div>
                      ))}
                      {categorySteps.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{categorySteps.length - 3} more steps
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
    </div>
  );
};