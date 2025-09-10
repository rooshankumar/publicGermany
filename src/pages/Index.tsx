import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from '@/assets/germany-help-logo.png';
import { 
  GraduationCap, 
  Shield, 
  Users, 
  CheckCircle, 
  Star,
  BookOpen,
  Globe,
  Award,
  ArrowRight,
  Menu,
  X,
  FileCheck,
  Building,
  MapPin,
  Calendar,
  StarHalf,
  StarOff
} from 'lucide-react';
import LandingFAQ from '@/components/LandingFAQ';

// Simple error boundary for Navbar
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // You can log error here
  }
  render() {
    if (this.state.hasError) {
      return <div className="bg-destructive/10 text-destructive p-4 rounded-lg">Something went wrong in the Navbar.</div>;
    }
    return this.props.children;
  }
}

function FreeVsPaidSection() {
  return (
    <section id="free-vs-paid" className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">What’s Free vs Paid</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">GermanyHelp is free to use. You only pay if you request personalized, one‑on‑one help.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-success/30 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success text-xl">
                <Shield className="w-5 h-5" /> Free (Forever)
              </CardTitle>
              <CardDescription>Everything you need to get started and stay on track.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="list-disc pl-5 space-y-2">
                <li>Create profile and get personalized checklist</li>
                <li>Track progress across APS, documents, and applications</li>
                <li>Access resources, FAQs, and guides</li>
                <li>Upload/manage documents</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/30 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary text-xl">
                <Users className="w-5 h-5" /> Personalized Help (Paid)
              </CardTitle>
              <CardDescription>Optional one‑on‑one services to maximize results.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="list-disc pl-5 space-y-2">
                <li>APS guidance and review</li>
                <li>University shortlisting tailored to your profile</li>
                <li>SOP/CV/LOR editing and feedback</li>
                <li>Visa file review and interview prep</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="w-full py-3 px-4 md:px-6 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="GermanyHelp Logo" className="h-10 w-10" />
          <span className="font-bold text-xl text-foreground tracking-tight">GermanyHelp</span>
          <Badge className="trust-badge hidden sm:inline-flex">
            <Shield className="w-3 h-3" />
            Trusted
          </Badge>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
          <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Success Stories</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          <Button variant="outline" asChild>
            <a href="/auth">Sign In</a>
          </Button>
          <Button asChild className="btn-cta">
            <a href="/auth">Get Started Free</a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-primary"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-medium">
          <div className="px-4 py-3 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-primary">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground hover:text-primary">How It Works</a>
            <a href="#testimonials" className="block text-sm font-medium text-muted-foreground hover:text-primary">Success Stories</a>
            <a href="#faq" className="block text-sm font-medium text-muted-foreground hover:text-primary">FAQ</a>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" asChild className="w-full">
                <a href="/auth">Sign In</a>
              </Button>
              <Button asChild className="w-full btn-cta">
                <a href="/auth">Get Started Free</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-success/5"></div>
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-6 md:mb-8">
            <Badge className="trust-badge animate-fade-in">
              <Award className="w-3 h-3" />
              50+ Students Guided
            </Badge>
            <Badge className="trust-badge animate-fade-in">
              <Star className="w-3 h-3" />
              Trusted Support
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 md:mb-6 animate-fade-in-up">
            Your Complete Guide to 
            <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent"> Study in Germany</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-5 md:mb-8 animate-fade-in">
            Navigate APS certification, university applications, and visa processes with our comprehensive 
            checklist and expert guidance. Start your German education journey today.
          </p>

          {/* Simple illustrative SVG */}
          <div className="max-w-md mx-auto mb-8 animate-fade-in hidden sm:block">
            <svg viewBox="0 0 300 120" className="w-full h-auto">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(210 29% 24%)" />
                  <stop offset="100%" stopColor="hsl(24 100% 50%)" />
                </linearGradient>
              </defs>
              <rect x="10" y="20" rx="12" ry="12" width="280" height="80" fill="url(#grad)" opacity="0.12" />
              <g fill="none" stroke="hsl(210 29% 24% / 0.4)" strokeWidth="2">
                <rect x="40" y="40" width="60" height="40" rx="6" />
                <rect x="120" y="40" width="140" height="20" rx="6" />
                <rect x="120" y="66" width="100" height="10" rx="5" />
              </g>
            </svg>
          </div>

          <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12 animate-scale-in">
            <Button size="lg" onClick={onGetStarted} className="btn-cta w-full sm:w-auto text-base md:text-lg px-5 py-3 md:px-8 md:py-4">
              <GraduationCap className="mr-2 w-5 h-5" />
              Start Your Journey Free
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-5 py-3 md:px-8 md:py-4" asChild>
              <a href="#how-it-works">
                See How It Works
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>
          <div className="w-full text-center">
              <p className="mt-2 text-sm text-muted-foreground">Free app. Pay only if you need personalized help.</p>
            </div>

          {/* Social proof */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto place-items-center text-center animate-fade-in">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Students Guided Successfully</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">1.5+</div>
              <div className="text-sm text-muted-foreground">Years of Experience</div>
            </div>
            {/* Removed Partner Universities until verified */}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: FileCheck,
      title: "APS Certification Guidance",
      description: "Step-by-step assistance with APS document preparation and submission process."
    },
    {
      icon: Building,
      title: "University Selection",
      description: "Personalized university recommendations based on your profile and preferences."
    },
    {
      icon: Globe,
      title: "Visa Application Support",
      description: "Complete guidance through the German student visa application process."
    },
    {
      icon: BookOpen,
      title: "Document Preparation",
      description: "Help with SOP, CV, LOR, and all required documents for applications."
    },
    {
      icon: Users,
      title: "Expert Consultations",
      description: "One-on-one sessions with experienced education consultants."
    },
    {
      icon: MapPin,
      title: "Pre-departure Support",
      description: "Guidance on accommodation, insurance, and settling in Germany."
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for German Education
          </h2>
          <div className="w-16 h-1 bg-warning mx-auto rounded-full mb-4"></div>
          <p className="text-lead max-w-2xl mx-auto">
            From APS certification to university admission, we provide comprehensive support 
            for your entire study abroad journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow transition-transform hover:-translate-y-0.5 animate-fade-in">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Create Your Profile",
      description: "Tell us about your academic background and goals",
      icon: Users
    },
    {
      step: "2", 
      title: "Get Personalized Checklist",
      description: "Receive a customized roadmap for your APS and university applications",
      icon: CheckCircle
    },
    {
      step: "3",
      title: "Track Your Progress",
      description: "Follow your progress and get expert guidance at every step",
      icon: Calendar
    },
    {
      step: "4",
      title: "Achieve Your Goal",
      description: "Successfully get admitted to your dream German university",
      icon: GraduationCap
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-accent/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How GermanyHelp Works
          </h2>
          <div className="w-16 h-1 bg-warning mx-auto rounded-full mb-4"></div>
          <p className="text-lead max-w-2xl mx-auto">
            Our proven 4-step process has helped thousands of students achieve their German education dreams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center animate-fade-in">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center text-success-foreground font-bold text-sm">
                  {step.step}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  service_type: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

function TestimonialsSection() {
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ['approved-reviews-home'],
    queryFn: async () => {
      // 1) Fetch approved reviews
      const { data: base, error: baseErr } = await (supabase as any)
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(6);
      if (baseErr) throw baseErr;

      const arr = (base || []) as any[];
      if (arr.length === 0) return [] as Review[];

      // 2) Fetch profiles for display names
      const userIds = Array.from(new Set(arr.map(r => r.user_id)));
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: p } = await (supabase as any)
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
        profiles = p || [];
      }

      // 3) Attach profiles
      const withProfiles: Review[] = arr.map(r => ({
        ...r,
        profiles: profiles.find(pr => pr.user_id === r.user_id) || null,
      }));
      return withProfiles;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
      }
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (error) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-destructive">Failed to load testimonials. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-6 w-24 mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <Skeleton className="h-5 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6 flex-grow" />
                  <div>
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <StarOff className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Reviews Yet</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">Check back later to see what our students are saying about their experience.</p>
          <Button variant="outline">
            Share Your Experience
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-16 bg-muted/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold tracking-tight mb-4">What Our Students Say</h2>
          <div className="w-16 h-1 bg-warning mx-auto rounded-full mb-4"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from students who have successfully navigated their journey to studying in Germany with our help.
          </p>
        </div>
        
        {/* Mobile slider */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory space-x-4 flex">
          {reviews.map((review) => (
            <Card key={review.id} className="min-w-[85%] snap-center hover:shadow-md transition-shadow transition-transform hover:-translate-y-0.5 animate-fade-in">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">{renderStars(review.rating)}</div>
                  {review.service_type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{review.service_type}</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-6 flex-grow">"{review.review_text}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                    {review.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <Card key={review.id} className="h-full hover:shadow-md transition-shadow transition-transform hover:-translate-y-0.5 animate-fade-in">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">{renderStars(review.rating)}</div>
                  {review.service_type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{review.service_type}</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-6 flex-grow">"{review.review_text}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                    {review.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" className="mx-auto">
            Read All Reviews
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-r from-primary to-success relative overflow-hidden animate-fade-in-up">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>
      
      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Start Your German Education Journey?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of successful students who have achieved their dreams with GermanyHelp.
        </p>
        <Button 
          size="lg" 
          onClick={onGetStarted}
          className="btn-cta text-lg px-8 py-4"
        >
          <GraduationCap className="mr-2 w-5 h-5" />
          Get Started Free Today
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-card border-t py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="GermanyHelp Logo" className="h-10 w-10" />
              <span className="font-bold text-xl text-foreground">GermanyHelp</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Your trusted partner for studying in Germany. We provide comprehensive guidance 
              from APS certification to university admission.
            </p>
            <div className="flex items-center gap-2">
              <Badge className="trust-badge">
                <Shield className="w-3 h-3" />
                Trusted by 50+ Students
              </Badge>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">APS Guidance</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">University Selection</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Document Preparation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Visa Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 GermanyHelp. All rights reserved. Made with ❤️ for aspiring German students.</p>
        </div>
      </div>
    </footer>
  );
}

function GermanyFlagBar() {
  return (
    <div className="w-full h-1">
      <div className="max-w-6xl mx-auto flex h-full">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-yellow-400" />
      </div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      <GermanyFlagBar />
      <main className="flex-1">
        <HeroSection onGetStarted={handleGetStarted} />
        <FeaturesSection />
        <div className="border-t border-border" />
        <HowItWorksSection />
        <div className="border-t border-border" />
        <FreeVsPaidSection />
        <div className="border-t border-border" />
        <TestimonialsSection />
        <div className="border-t border-border" />
        <LandingFAQ />
        <CTASection onGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;