import React from 'react';

const InlineLoader: React.FC<{ label?: string; className?: string }>
  = ({ label = 'Loading', className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-center py-6 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-muted/40 border-t-primary/80 animate-spin" />
        <span>{label}…</span>
      </div>
    </div>
  );
};

export default InlineLoader;
