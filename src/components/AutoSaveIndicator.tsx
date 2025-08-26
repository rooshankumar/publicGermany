import { Check, Save, AlertCircle, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export const AutoSaveIndicator = ({ status, className = '' }: AutoSaveIndicatorProps) => {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'auto-save-indicator saving'
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Saved',
          className: 'auto-save-indicator saved'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'auto-save-indicator error'
        };
      default:
        return {
          icon: Save,
          text: 'Saving...',
          className: 'auto-save-indicator'
        };
    }
  };

  const { icon: Icon, text, className: statusClassName } = getStatusConfig();

  return (
    <div className={`${statusClassName} ${className}`}>
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${status === 'saving' ? 'animate-spin' : ''}`} />
        <span>{text}</span>
      </div>
    </div>
  );
};