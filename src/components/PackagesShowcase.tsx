import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { CheckCircle, Star } from 'lucide-react';
=======
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { SERVICE_PACKAGES, useServicePackages, type ServicePackage } from '@/data/servicePackages';
>>>>>>> eb30697 (ok)
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

<<<<<<< HEAD
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
=======
const PackageCard: React.FC<{ pkg: ServicePackage; onRequest: () => void; compact?: boolean }> = ({
  pkg,
  onRequest,
  compact,
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      className={cn(
        'flex flex-col h-full relative',
        pkg.popular ? 'border-primary border-2 shadow-md' : 'border-border'
      )}
      itemScope
      itemType="https://schema.org/Service"
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground gap-1 shadow">
            <Star className="h-3 w-3 fill-current" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base md:text-lg" itemProp="name">
            {pkg.name}
          </CardTitle>
        </div>
        <div
          className="text-2xl font-bold text-primary"
          itemProp="offers"
          itemScope
          itemType="https://schema.org/Offer"
        >
          <span itemProp="price" content={String(pkg.price)}>{pkg.priceLabel}</span>
          <meta itemProp="priceCurrency" content="INR" />
        </div>
        <CardDescription itemProp="description" className="text-sm leading-relaxed">
          {pkg.shortDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          <span className="font-semibold text-foreground">Payment: </span>
          {pkg.payment}
        </div>

        {(expanded || !compact) && (
          <>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Included:</p>
              <ul className="space-y-1 text-sm">
                {pkg.included.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {pkg.notes && pkg.notes.length > 0 && (
              <div className="text-xs text-muted-foreground border-l-2 border-border pl-2 space-y-1">
                {pkg.notes.map((n, i) => (
                  <p key={i}>{n}</p>
                ))}
              </div>
            )}

            <div className="text-xs">
              <span className="font-semibold text-foreground">Best for: </span>
              <span className="text-muted-foreground">{pkg.bestFor}</span>
            </div>
          </>
        )}

        {compact && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-xs font-medium text-primary hover:underline self-start inline-flex items-center gap-1"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>View details <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}

        <Button onClick={onRequest} className="w-full mt-auto" variant={pkg.popular ? 'default' : 'outline'}>
          Request Package
        </Button>
      </CardContent>
    </Card>
  );
};

const ComparisonTable: React.FC<{ packages: ServicePackage[] }> = ({ packages }) => {
  // Build a union of all included features
  const allFeatures = Array.from(new Set(packages.flatMap((p) => p.included)));
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[180px]">
              Feature
            </th>
            {packages.map((p) => (
              <th key={p.id} className="p-3 text-center font-semibold min-w-[140px]">
                <div className="flex flex-col items-center gap-1">
                  {p.popular && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      Popular
                    </Badge>
                  )}
                  <span>{p.name}</span>
                  <span className="text-primary font-bold">{p.priceLabel}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatures.map(feature => (
            <tr key={feature} className="border-t border-border">
              <td className="p-3 sticky left-0 bg-card z-10 font-medium text-foreground/90">
                {feature}
              </td>
              {packages.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  {p.included.includes(feature) ? (
                    <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-border bg-muted/30">
            <td className="p-3 sticky left-0 bg-muted/30 z-10 font-semibold">Payment</td>
            {packages.map((p) => (
              <td key={p.id} className="p-3 text-xs text-muted-foreground">
                {p.payment}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border">
            <td className="p-3 sticky left-0 bg-card z-10 font-semibold">Best for</td>
            {packages.map((p) => (
              <td key={p.id} className="p-3 text-xs text-muted-foreground">
                {p.bestFor}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
>>>>>>> eb30697 (ok)
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
<<<<<<< HEAD
  const { data: packages = [], isLoading } = useServicePackages();
=======
  const { data: packages = SERVICE_PACKAGES } = useServicePackages();
>>>>>>> eb30697 (ok)

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

<<<<<<< HEAD
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-2xl" />
              ))
            : packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onRequest={() => handleRequest(pkg)} />
              ))}
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              compact={compact}
              onRequest={() => handleRequest(pkg)}
            />
          ))}
>>>>>>> eb30697 (ok)
        </div>

        {showViewAllLink && (
          <div className="mt-5 text-center">
            <Button variant="link" onClick={() => navigate('/services')}>
              View full service catalog →
            </Button>
          </div>
        )}
<<<<<<< HEAD
=======

        {showComparison && (
          <div className="mt-10">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-4">
              Compare Packages
            </h3>
            <ComparisonTable packages={packages} />
          </div>
        )}
>>>>>>> eb30697 (ok)
      </div>
    </section>
  );
};

export default PackagesShowcase;
