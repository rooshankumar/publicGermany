import React from 'react';
import logos from '@/assets/logos.png';

const FullScreenLoader: React.FC<{ label?: string }>
  = ({ label = 'Loading' }) => {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Logo mark */}
          <div className="h-12 w-12 rounded-xl overflow-hidden ring-1 ring-border bg-card shadow-soft flex items-center justify-center">
            <img src={logos} alt="publicgermany" className="h-full w-full object-contain p-1.5" />
          </div>
          {/* Spinner ring */}
          <div className="absolute inset-0 -m-2 animate-spin">
            <div className="h-full w-full rounded-2xl border-2 border-muted/40 border-t-primary/70" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>{label}…</span>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
