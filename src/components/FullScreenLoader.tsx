import React from 'react';

/**
 * Branded full-screen loader.
 * Bigger, on-brand: uses the German tricolor (black / red / gold) as
 * three orbiting dots around a soft ring, matching the iOS-style pg design.
 */
const FullScreenLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pg-bg/70 backdrop-blur-sm transition-opacity duration-150">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-24 w-24">
          {/* Outer soft ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-pg-sep" />
          {/* Rotating tricolor arc */}
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-pg-label border-r-pg-accent border-b-pg-gold animate-spin" style={{ animationDuration: '1.1s' }} />
          {/* Center dot mark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-[3px]">
              <span className="block w-[7px] h-[7px] rounded-full bg-pg-label" />
              <span className="block w-[7px] h-[7px] rounded-full bg-pg-accent" />
              <span className="block w-[7px] h-[7px] rounded-full bg-pg-gold" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-semibold text-pg-label tracking-tight">{label}…</div>
          <div className="text-[11px] text-pg-label3 uppercase tracking-[0.15em]">publicgermany</div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
