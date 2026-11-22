import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Instagram, Mail, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/ContactForm';

const Contact: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/"><ArrowLeft className="h-4 w-4" />Back to home</Link>
        </Button>
      </div>
      <div className="german-stripe w-full" />
    </header>

    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Public Germany</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            Questions about admissions, student visa documentation, or our services? Write to us or use the contact form.
          </p>

          <div className="mt-8 border-t border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted-foreground">Legal business name</span><strong>ROSHN GLOBAL</strong>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted-foreground">Trade name</span><strong>Public Germany</strong>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted-foreground">Business type</span><strong>Sole proprietorship</strong>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted-foreground">Udyam registration</span><strong>UDYAM-BR-26-0260208</strong>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 border-b border-border py-3 text-sm">
              <span className="text-muted-foreground">Registered location</span><strong className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />Patna, Bihar, India</strong>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 text-sm">
            <a href="mailto:publicgermany@outlook.com" className="inline-flex items-center gap-2 text-primary hover:underline">
              <Mail className="h-4 w-4" />publicgermany@outlook.com
            </a>
            <a href="https://www.instagram.com/publicgermany/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
              <Instagram className="h-4 w-4" />Instagram
            </a>
            <a href="https://t.me/publicgermany" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
              <Send className="h-4 w-4" />Telegram
            </a>
          </div>
        </section>

        <section aria-label="Send a message">
          <ContactForm />
        </section>
      </div>

      <footer className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/refund-policy" className="hover:underline">Refund &amp; Cancellation</Link>
        </div>
      </footer>
    </main>
  </div>
);

export default Contact;