import React from 'react';

/** Tri-color dot logo mark used across the iOS-style redesign. */
export const PgLogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`inline-flex items-center gap-[2px] ${className || ''}`} aria-hidden="true">
    <span className="block w-[5px] h-[5px] rounded-full bg-pg-label" />
    <span className="block w-[5px] h-[5px] rounded-full bg-pg-accent" />
    <span className="block w-[5px] h-[5px] rounded-full bg-pg-gold" />
  </span>
);

/** Full logo (mark + wordmark) for headers and footers. */
const PgLogo: React.FC<{ label?: string; className?: string }> = ({
  label = 'publicgermany',
  className,
}) => (
  <span className={`inline-flex items-center gap-2 font-bold text-[16px] text-pg-label ${className || ''}`}>
    <PgLogoMark />
    {label}
  </span>
);

export default PgLogo;
