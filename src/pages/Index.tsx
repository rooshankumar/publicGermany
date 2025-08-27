

import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import LandingHowItWorks from "@/components/LandingHowItWorks";
import LandingFooter from "@/components/LandingFooter";
import LandingFAQ from "@/components/LandingFAQ";
import { useNavigate } from "react-router-dom";
import logo from '@/assets/germany-help-logo.png';
import React from 'react';

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
      return <div className="bg-red-100 text-red-700 p-4">Something went wrong in the Navbar.</div>;
    }
    return this.props.children;
  }
}

function Navbar() {
  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between bg-background/80 border-b sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <img src={logo} alt="GermanyHelp Logo" className="h-8" />
        <span className="font-bold text-lg">GermanyHelp</span>
      </div>
      <div className="flex gap-6 text-sm font-medium">
        <a href="#" className="hover:text-primary">Home</a>
        <a href="#features" className="hover:text-primary">Features</a>
        <a href="#faq" className="hover:text-primary">FAQ</a>
        <a href="#contact" className="hover:text-primary">Contact</a>
        <a href="/auth" className="hover:text-primary">Sign In</a>
      </div>
    </nav>
  );
}

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      <main className="flex-1">
        <LandingHero
          onGetStarted={() => navigate('/auth')}
          onSignIn={() => navigate('/auth')}
        />
        <div id="features">
          <LandingFeatures />
        </div>
        <LandingHowItWorks />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Index;
