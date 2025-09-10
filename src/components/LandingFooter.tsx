import React from "react";

export default function LandingFooter() {
  return (
    <footer className="py-8 bg-background border-t mt-12">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4 mb-2 md:mb-0">
          <a href="#about" className="hover:underline">About</a>
          <a href="#contact" className="hover:underline">Contact</a>
          <a href="#faq" className="hover:underline">FAQ</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
        <div className="text-xs text-center md:text-right">
          publicgermany is an educational productivity tool. We do not provide legal immigration services. For official information, visit APS and Embassy websites.
        </div>
      </div>
    </footer>
  );
}
