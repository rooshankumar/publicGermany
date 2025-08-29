import React from 'react';
import { cn } from '@/lib/utils';
import { AutoSaveStatus } from '@/hooks/useAutoSave';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({ status, lastSaved, className }: AutoSaveIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Save className="w-4 h-4" />;
    }
  };

  const getText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'saving':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'saved':
        return 'text-success bg-success/10 border-success/20';
      case 'error':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300",
      getStatusClass(),
      className
    )}>
      {getIcon()}
      <span>{getText()}</span>
    </div>
  );
}