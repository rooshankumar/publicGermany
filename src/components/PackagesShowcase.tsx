import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServicePackages, type ServicePackageRow } from '@/hooks/useServiceData';
import { Skeleton } from '@/components/ui/skeleton';

interface PackagesShowcaseProps {
  onRequest?: (pkg: ServicePackageRow) => void;
  heading?: string;
  subtitle?: string;
  compact?: boolean;
  showViewAllLink?: boolean;
}

const PackageCard: React.FC<{ pkg: ServicePackageRow; onRequest: () => void }> = ({ pkg, onRequest }) => (
  <div
    className={cn(
      'flex flex-col h-full relative rounded-2xl border bg-pg-bg p-4 md:p-5 transition-shadow',
      pkg.highlighted
        ? 'border-pg-accent border-[1.5px] shadow-[0_16px_32px_-14px_rgba(0,0,0,0.16)]'
        : 'border-pg-sep',
    )}
    itemScope
    itemType="https://schema.org/Service"
  >
    {pkg.badge && (
      <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-pg-accent px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
        <Star className="h-2.5 w-2.5 fill-current" /> {pkg.badge}
      </span>
    )}
    <div className="text-[14px] font-semibold text-pg-label" itemProp="name">
      {pkg.title}
    </div>
    <div className="mt-1 text-[24px] font-bold leading-none text-pg-label">{pkg.priceLabel}</div>
    <div className="mt-1 text-[11.5px] text-pg-label3">{pkg.paymentLabel}</div>
    {pkg.description && (
      <p className="mt-2.5 text-[12.5px] leading-snug text-pg-label2 line-clamp-3" itemProp="description">
        {pkg.description}
      </p>
    )}
    <ul className="mt-3 mb-4 space-y-1.5">
      {pkg.features.slice(0, 5).map((f) => (
        <li key={f.id} className="flex items-start gap-1.5 text-[12.5px] text-pg-label">
          <CheckCircle className="mt-[2px] h-3 w-3 shrink-0 text-pg-green" />
          <span>{f.feature}</span>
        </li>
      ))}
    </ul>
    <Button
      size="sm"
      onClick={onRequest}
      className={cn('mt-auto w-full', !pkg.highlighted && 'bg-pg-label text-white hover:bg-pg-label/90')}
    >
      Request package
    </Button>
  </div>
);

const PackagesShowcase: React.FC<PackagesShowcaseProps> = ({
  onRequest,
  heading = 'Service Packages',
  subtitle = 'Complete, transparent packages for your Germany journey.',
  compact = false,
  showViewAllLink = false,
}) => {
  const navigate = useNavigate();
  const { data: packages = [], isLoading } = useServicePackages();

  const handleRequest = (pkg: ServicePackageRow) => {
    if (onRequest) onRequest(pkg);
    else navigate(`/services?package=${pkg.slug}`);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'publicgermany Service Packages',
    itemListElement: packages.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Service',
        name: p.title,
        description: `${p.description || ''} Includes: ${p.features.map((f) => f.feature).join('; ')}.`,
        provider: { '@type': 'Organization', name: 'publicgermany' },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <section
      id="service-packages"
      className={cn('w-full', compact ? 'py-10 md:py-14' : 'py-6')}
      aria-labelledby="service-packages-heading"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={cn(compact ? 'mx-auto max-w-6xl px-4 sm:px-6' : '')}>
        <header className="mb-6 text-center">
          <h2
            id="service-packages-heading"
            className={cn(
              'mb-1.5 font-bold tracking-tight text-pg-label',
              compact ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl',
            )}
          >
            {heading}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-pg-label2 md:text-base">{subtitle}</p>
        </header>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-2xl" />
              ))
            : packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onRequest={() => handleRequest(pkg)} />
              ))}
        </div>

        {showViewAllLink && (
          <div className="mt-5 text-center">
            <Button variant="link" onClick={() => navigate('/services')}>
              View full service catalog →
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PackagesShowcase;
