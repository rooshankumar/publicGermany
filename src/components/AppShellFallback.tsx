import React from 'react';

const AppShellFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar skeleton (mobile) */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Desktop layout skeleton */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded bg-muted animate-pulse" />
            ))}
          </div>
          <div className="mt-auto p-4 border-t border-border">
            <div className="h-10 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="space-y-3">
            <div className="h-7 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile content skeleton */}
      <div className="md:hidden p-4">
        <div className="space-y-3">
          <div className="h-7 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppShellFallback;
