import React from "react";
import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="py-8 bg-background border-t mt-12">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4 mb-2 md:mb-0">
          <a href="#about" className="hover:underline">About</a>
          <Link to="/contact" className="hover:underline">Contact</Link>
          <a href="#faq" className="hover:underline">FAQ</a>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/refund-policy" className="hover:underline">Refund &amp; Cancellation</Link>
          <a href="https://www.instagram.com/publicgermany/" target="_blank" rel="noreferrer" className="hover:underline">Instagram</a>
          <a href="https://t.me/publicgermany" target="_blank" rel="noreferrer" className="hover:underline">Telegram</a>
        </div>
        <div className="text-xs text-center md:text-right">
          <p>Public Germany is operated by ROSHN GLOBAL, a sole proprietorship registered in Patna, Bihar, India.</p>
          <p>Udyam Registration: UDYAM-BR-26-0260208 · <a href="mailto:publicgermany@outlook.com" className="hover:underline">publicgermany@outlook.com</a></p>
        </div>
      </div>
    </footer>
  );
}
