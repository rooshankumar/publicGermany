import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { SERVICE_PACKAGES, type ServicePackage } from '@/data/servicePackages';
import { cn } from '@/lib/utils';

interface PackagesShowcaseProps {
  /** Where to navigate / behavior when user clicks "Request Package". */
  onRequest?: (pkg: ServicePackage) => void;
  /** Show the comparison table below cards. */
  showComparison?: boolean;
  /** Section heading text. */
  heading?: string;
  /** Section subtitle. */
  subtitle?: string;
  /** Compact mode for embedding on homepage. */
  compact?: boolean;
  /** Show a "View all packages" link to /services. */
  showViewAllLink?: boolean;
}

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

const ComparisonTable: React.FC = () => {
  // Build a union of all included features
  const allFeatures = Array.from(
    new Set(SERVICE_PACKAGES.flatMap(p => p.included))
  );
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[180px]">
              Feature
            </th>
            {SERVICE_PACKAGES.map(p => (
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
              {SERVICE_PACKAGES.map(p => (
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
            {SERVICE_PACKAGES.map(p => (
              <td key={p.id} className="p-3 text-xs text-muted-foreground">
                {p.payment}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border">
            <td className="p-3 sticky left-0 bg-card z-10 font-semibold">Best for</td>
            {SERVICE_PACKAGES.map(p => (
              <td key={p.id} className="p-3 text-xs text-muted-foreground">
                {p.bestFor}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const PackagesShowcase: React.FC<PackagesShowcaseProps> = ({
  onRequest,
  showComparison = false,
  heading = 'Service Packages',
  subtitle = 'Complete, transparent packages for your Germany study journey.',
  compact = false,
  showViewAllLink = false,
}) => {
  const navigate = useNavigate();

  const handleRequest = (pkg: ServicePackage) => {
    if (onRequest) {
      onRequest(pkg);
    } else {
      // Default: send user to /services with the package preselected via query param
      navigate(`/services?package=${pkg.slug}`);
    }
  };

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'publicgermany Service Packages',
    itemListElement: SERVICE_PACKAGES.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Service',
        name: p.name,
        description: `${p.shortDescription} Included: ${p.included.join('; ')}. Payment: ${p.payment} Best for: ${p.bestFor}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={cn(compact ? 'max-w-6xl mx-auto px-4 sm:px-6' : '')}>
        <header className="text-center mb-8">
          <h2
            id="service-packages-heading"
            className={cn(
              'font-bold tracking-tight text-foreground mb-2',
              compact ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
            )}
          >
            {heading}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-3">
          {SERVICE_PACKAGES.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              compact={compact}
              onRequest={() => handleRequest(pkg)}
            />
          ))}
        </div>

        {showViewAllLink && (
          <div className="text-center mt-6">
            <Button variant="link" onClick={() => navigate('/services')}>
              View full service catalog →
            </Button>
          </div>
        )}

        {showComparison && (
          <div className="mt-10">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-4">
              Compare Packages
            </h3>
            <ComparisonTable />
          </div>
        )}
      </div>
    </section>
  );
};

export default PackagesShowcase;
