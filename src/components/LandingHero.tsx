import React from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/germany-help-logo.png";

export default function LandingHero({ onGetStarted, onSignIn }: { onGetStarted?: () => void; onSignIn?: () => void }) {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-success"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-white/5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-6 text-center">
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <img src={logo} alt="publicgermany Logo" className="h-16 w-auto" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Your Trusted Path to
          <span className="block bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
            Study in Germany 🇩🇪
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
          Navigate your journey from APS documents to university admission with expert guidance, personalized checklists, and trusted resources.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90 shadow-strong" 
            onClick={onGetStarted}
          >
            Start Your Journey
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm" 
            onClick={onSignIn}
          >
            Sign In
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-white/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <span className="text-sm font-medium">Official APS Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium">DAAD Recognized</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="text-sm font-medium">Secure & Trusted</span>
          </div>
        </div>
      </div>
    </section>
  );
}
