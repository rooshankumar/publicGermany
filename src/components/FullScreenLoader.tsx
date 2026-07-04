import React from 'react';
import logos from '@/assets/logos.png';

const FullScreenLoader: React.FC<{ label?: string }>
  = ({ label = 'Loading' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent transition-opacity duration-150">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-muted/30" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <div className="text-xs font-medium text-foreground/80">{label}…</div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
