import React from "react";
import { Button } from "@/components/ui/button";
import logos from "@/assets/logos.png";

export default function LandingHero({ onGetStarted, onSignIn }: { onGetStarted?: () => void; onSignIn?: () => void }) {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Hero Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-success"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-white/5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Floating gradient orbs for depth */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Content */}
      <div className="relative container mx-auto px-6 text-center">
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="glass-card p-4 border-white/20 shadow-glass-dark">
            <img src={logos} alt="publicgermany Logo" className="h-16 w-auto" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
          Your Trusted Path to
          <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
            Study in Germany 🇩🇪
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Navigate your journey from APS documents to university admission with expert guidance, personalized checklists, and trusted resources.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-glass-dark hover:scale-105 transition-all duration-300 font-bold" 
            onClick={onGetStarted}
          >
            Start Your Journey →
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 glass-subtle border-white/30 text-white hover:bg-white/20 backdrop-blur-md hover:scale-105 transition-all duration-300 font-semibold" 
            onClick={onSignIn}
          >
            Sign In
          </Button>
        </div>
        
        {/* Grade Converter Link */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <a href="/converter" className="inline-flex items-center gap-2 glass-subtle px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/20 backdrop-blur-md hover:scale-105 transition-all duration-300 font-semibold">
            🧮 German Grade Converter
          </a>
        </div>
        
        {/* Trust Indicators with glass effect */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {[
            { icon: '🏛️', text: 'Official APS Partner' },
            { icon: '📄', text: 'DAAD Recognized' },
            { icon: '🔒', text: 'Secure & Trusted' }
          ].map((item, idx) => (
            <div key={idx} className="glass-subtle px-4 py-3 rounded-full border border-white/20 flex items-center gap-2 hover:scale-105 transition-transform duration-300">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-semibold text-white">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
