import React from 'react';

/** Inline branded loader — same tricolor language as the fullscreen loader, at section scale. */
const InlineLoader: React.FC<{ label?: string; className?: string }> = ({
  label = 'Loading',
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-center py-10 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-pg-sep" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-pg-label border-r-pg-accent border-b-pg-gold animate-spin"
            style={{ animationDuration: '1.1s' }}
          />
        </div>
        <div className="text-xs font-medium text-pg-label2">{label}…</div>
      </div>
    </div>
  );
};

export default InlineLoader;
