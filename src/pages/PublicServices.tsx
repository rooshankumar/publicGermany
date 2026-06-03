import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PackagesShowcase from '@/components/PackagesShowcase';
import LandingFAQ from '@/components/LandingFAQ';
import logos from '@/assets/logos.png';
import type { ServicePackage } from '@/data/servicePackages';

const PublicServices: React.FC = () => {
  const navigate = useNavigate();

  // Set SEO meta tags
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Service Packages & Pricing — publicgermany | Germany Study Abroad';

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc =
      'Transparent admission & visa packages for studying in Germany. Visa Application Only ₹20,000, Admission Package ₹30,000, Admission + Visa ₹50,000, Pay After Admission ₹60,000.';
    setMeta('description', desc);
    setMeta('og:title', 'Service Packages — publicgermany', 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'website', 'property');

    // canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/services`);

    return () => {
      document.title = prevTitle;
    };
  }, []);

  const handleRequest = (pkg: ServicePackage) => {
    // Send guests to auth, then back to services with the package preselected.
    const next = encodeURIComponent(`/services?package=${pkg.slug}`);
    navigate(`/auth?next=${next}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Public header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logos} alt="publicgermany logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-base">publicgermany</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
        <div className="german-stripe w-full" />
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Button asChild variant="ghost" size="sm" className="gap-2 mb-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </Button>
          <div className="text-center max-w-3xl mx-auto pt-2">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Study in Germany — Service Packages
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Transparent pricing. End-to-end admission and visa support. Pick the package that fits your stage.
            </p>
          </div>

          <PackagesShowcase
            onRequest={handleRequest}
            showComparison
            heading="Choose your package"
            subtitle="All packages include personalized guidance from our team."
          />

          <section
            id="individual-services-info"
            className="mt-12 rounded-lg border border-border bg-card p-6 text-center"
          >
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Need only one service?
            </h2>
            <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
              We also offer individual à-la-carte services like SOP review, university shortlisting,
              APS support, document review and more. Sign in to browse the full catalog.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in to see all services</Link>
            </Button>
          </section>
        </div>

        <div className="border-t border-border" />
        <LandingFAQ />
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} publicgermany · <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/terms" className="hover:underline">Terms</Link> · <Link to="/contact" className="hover:underline">Contact</Link>
      </footer>
    </div>
  );
};

export default PublicServices;
