import React from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/germany-help-logo.png";

export default function LandingHero({ onGetStarted, onSignIn }: { onGetStarted?: () => void; onSignIn?: () => void }) {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-background to-accent/10">
      <div className="container mx-auto flex flex-col items-center text-center gap-6">
        <img src={logo} alt="GermanyHelp Logo" className="h-16 mb-4" />
        <h1 className="text-3xl md:text-5xl font-bold mb-2">GermanyHelp – Your trusted companion for studying in Germany.</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Button size="lg" className="text-lg px-8" onClick={onGetStarted}>Get Started</Button>
          <Button size="lg" variant="outline" className="text-lg px-8" onClick={onSignIn}>Sign In</Button>
        </div>
        <div className="mt-8">
          <img src="/placeholder.svg" alt="Student with suitcase and checklist" className="mx-auto max-h-64" />
        </div>
      </div>
    </section>
  );
}
