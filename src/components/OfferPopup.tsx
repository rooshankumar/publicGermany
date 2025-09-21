import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OfferPopupProps {
  open: boolean;
  onClose: () => void;
}

export default function OfferPopup({ open, onClose }: OfferPopupProps) {
  if (!open) return null;

  const [showTerms, setShowTerms] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative mx-4 w-full max-w-lg">
        <Card className="overflow-hidden shadow-2xl border-border/60 bg-card/95">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-warning/10 to-accent/10" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <CardTitle className="text-2xl">Limited‑Time Admission & Visa Offers</CardTitle>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">Save up to ₹10,000</Badge>
            </div>
            <CardDescription className="relative text-base mt-1">
              Exclusive pricing on our most popular end‑to‑end packages. Sign in to claim and get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="rounded-lg border border-border/60 p-4 bg-background/80">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">Admission Package</div>
                  <Badge variant="secondary" className="uppercase">Now</Badge>
                </div>
                <div className="text-xs text-muted-foreground line-through">Was ₹30,000</div>
                <div className="text-lg font-bold text-foreground">₹20,000 – ₹25,000</div>
                <div className="text-xs text-muted-foreground mt-1">Profile eval, SOP/LOR, shortlisting & more</div>
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-background/80">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">Visa Package</div>
                  <Badge variant="secondary" className="uppercase">Now</Badge>
                </div>
                <div className="text-xs text-muted-foreground line-through">Was ₹40,000</div>
                <div className="text-lg font-bold text-foreground">₹30,000 – ₹35,000</div>
                <div className="text-xs text-muted-foreground mt-1">Admission + visa file, checks & guidance</div>
              </div>
            </div>

            {/* Terms toggle */}
            <div className="text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowTerms((v) => !v)}
                className="underline hover:text-foreground transition-colors"
              >
                {showTerms ? 'Hide' : 'View'} terms
              </button>
              {showTerms && (
                <div className="mt-2 space-y-1">
                  <div>• Transparent applications — you get full visibility throughout.</div>
                  <div>• Personal login — track your progress with your own credentials.</div>
                  <div>• University shortlisting tailored to your profile, with a focus on public universities.</div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/auth" onClick={onClose}>
                  Claim Offer & Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" onClick={onClose}>Not now</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
