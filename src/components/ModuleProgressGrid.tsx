import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModuleData {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  status: 'completed' | 'in_progress' | 'pending' | 'needs_attention';
  nextAction?: string;
  link: string;
}

interface ModuleProgressGridProps {
  modules: ModuleData[];
}

const ModuleProgressGrid = ({ modules }: ModuleProgressGridProps) => {
  const getStatusConfig = (status: string, progress: number) => {
    if (progress === 100) {
      return {
        badge: { variant: 'default' as const, className: 'success-indicator' },
        icon: CheckCircle2,
        iconClass: 'text-success',
        text: 'Complete'
      };
    }
    
    switch (status) {
      case 'needs_attention':
        return {
          badge: { variant: 'destructive' as const },
          icon: AlertTriangle,
          iconClass: 'text-destructive',
          text: 'Attention'
        };
      case 'in_progress':
        return {
          badge: { variant: 'default' as const, className: 'bg-warning/10 text-warning border-warning/30' },
          icon: Clock,
          iconClass: 'text-warning',
          text: 'In Progress'
        };
      default:
        return {
          badge: { variant: 'secondary' as const },
          icon: Clock,
          iconClass: 'text-muted-foreground',
          text: 'Pending'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {modules.map((module) => {
        const Icon = module.icon;
        const statusConfig = getStatusConfig(module.status, module.progress);
        const StatusIcon = statusConfig.icon;
        
        return (
          <Link key={module.key} to={module.link}>
            <Card className={cn(
              "h-full transition-all duration-300 cursor-pointer card-hover",
              module.progress === 100 
                ? "bg-gradient-to-br from-success/5 to-success/10 border-success/20" 
                : "hover:shadow-lg hover:border-primary/20"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      module.progress === 100 
                        ? "bg-success/10" 
                        : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        module.progress === 100 
                          ? "text-success" 
                          : "text-primary"
                      )} />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {module.name}
                    </CardTitle>
                  </div>
                  <StatusIcon className={cn("h-4 w-4", statusConfig.iconClass)} />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress 
                    value={module.progress} 
                    className={cn(
                      "h-2 transition-all duration-500",
                      module.progress === 100 && "progress-glow"
                    )}
                  />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {module.completedTasks} / {module.totalTasks} tasks
                    </span>
                    <span className="font-medium text-foreground">
                      {module.progress}%
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={statusConfig.badge.variant}
                    className={statusConfig.badge.className}
                  >
                    {statusConfig.text}
                  </Badge>
                  
                  {module.nextAction && module.progress < 100 && (
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {module.nextAction}
                    </span>
                  )}
                </div>

                {/* Completion indicator for 100% modules */}
                {module.progress === 100 && (
                  <div className="flex items-center space-x-2 text-success text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Module Complete!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default ModuleProgressGrid;