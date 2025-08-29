import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar
} from 'lucide-react';

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

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="w-full py-4 px-6 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="GermanyHelp Logo" className="h-10 w-10" />
          <span className="font-bold text-xl text-foreground">GermanyHelp</span>
          <Badge className="trust-badge">
            <Shield className="w-3 h-3" />
            Trusted
          </Badge>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
          <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Success Stories</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          <Button variant="outline" asChild>
            <a href="/auth">Sign In</a>
          </Button>
          <Button asChild className="btn-primary">
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
          <div className="px-6 py-4 space-y-4">
            <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-primary">Features</a>
            <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground hover:text-primary">How It Works</a>
            <a href="#testimonials" className="block text-sm font-medium text-muted-foreground hover:text-primary">Success Stories</a>
            <a href="#faq" className="block text-sm font-medium text-muted-foreground hover:text-primary">FAQ</a>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" asChild className="w-full">
                <a href="/auth">Sign In</a>
              </Button>
              <Button asChild className="w-full btn-primary">
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
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-success/5"></div>
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center">
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge className="trust-badge">
              <Award className="w-3 h-3" />
              1000+ Students Guided
            </Badge>
            <Badge className="trust-badge">
              <Star className="w-3 h-3" />
              98% Success Rate
            </Badge>
          </div>

          <h1 className="text-hero mb-6 animate-fade-in">
            Your Complete Guide to 
            <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent"> Study in Germany</span>
          </h1>
          
          <p className="text-lead max-w-3xl mx-auto mb-8 animate-slide-up">
            Navigate APS certification, university applications, and visa processes with our comprehensive 
            checklist and expert guidance. Start your German education journey today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-scale-in">
            <Button size="lg" onClick={onGetStarted} className="btn-primary text-lg px-8 py-4">
              <GraduationCap className="mr-2 w-5 h-5" />
              Start Your Journey Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <a href="#how-it-works">
                See How It Works
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>

          {/* Social proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Students Guided Successfully</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Years of Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Partner Universities</div>
            </div>
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
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for German Education
          </h2>
          <p className="text-lead max-w-2xl mx-auto">
            From APS certification to university admission, we provide comprehensive support 
            for your entire study abroad journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
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
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How GermanyHelp Works
          </h2>
          <p className="text-lead max-w-2xl mx-auto">
            Our proven 4-step process has helped thousands of students achieve their German education dreams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
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

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Priya Sharma",
      university: "TU Munich",
      text: "GermanyHelp made my APS process so much easier. The step-by-step guidance was invaluable!",
      rating: 5
    },
    {
      name: "Rahul Patel", 
      university: "RWTH Aachen",
      text: "I got into my dream university thanks to their expert guidance on documents and applications.",
      rating: 5
    },
    {
      name: "Anita Gupta",
      university: "University of Stuttgart", 
      text: "The personalized checklist kept me organized throughout the entire application process.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Success Stories from Our Students
          </h2>
          <p className="text-lead max-w-2xl mx-auto">
            Join thousands of students who have successfully started their German education journey with our help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.university}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-success relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Start Your German Education Journey?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of successful students who have achieved their dreams with GermanyHelp.
        </p>
        <Button 
          size="lg" 
          onClick={onGetStarted}
          className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4"
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
      <div className="max-w-7xl mx-auto px-6">
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
                Trusted by 1000+ Students
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
          <p>&copy; 2024 GermanyHelp. All rights reserved. Made with ❤️ for aspiring German students.</p>
        </div>
      </div>
    </footer>
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
      <main className="flex-1">
        <HeroSection onGetStarted={handleGetStarted} />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection onGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;