import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardList, Target, Plane, FileText, MessagesSquare, Luggage, Menu, X } from 'lucide-react';
import PgLogo, { PgLogoMark } from '@/components/PgLogo';
import { SERVICE_PACKAGES } from '@/data/servicePackages';

// ---------- Header ----------
const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="pg-blur sticky top-0 z-50 border-b border-pg-sep">
      <div className="max-w-[1080px] mx-auto flex items-center justify-between px-6 h-[52px]">
        <Link to="/" className="flex items-center"><PgLogo /></Link>
        <nav className="hidden md:flex gap-7">
          {[
            { href: '#features', label: 'Features' },
            { href: '#stories', label: 'Stories' },
            { href: '#pricing', label: 'Pricing' },
            { href: '#faq', label: 'FAQ' },
          ].map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-pg-label2 hover:text-pg-label transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden sm:inline text-[14px] font-medium text-pg-label2 hover:text-pg-label">Sign in</Link>
          <Link to="/auth" className="pg-btn pg-btn-primary pg-btn-sm">Get started</Link>
          <button
            className="md:hidden p-1.5 -mr-1.5"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-5 h-5 text-pg-label" /> : <Menu className="w-5 h-5 text-pg-label" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-[52px] pg-blur border-b border-pg-sep">
          <div className="flex flex-col gap-3 px-6 py-4">
            {['features', 'stories', 'pricing', 'faq'].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={() => setOpen(false)}
                className="text-[15px] font-medium text-pg-label capitalize"
              >
                {s}
              </a>
            ))}
            <Link to="/services" onClick={() => setOpen(false)} className="text-[15px] font-medium text-pg-label">Services</Link>
            <Link to="/blog" onClick={() => setOpen(false)} className="text-[15px] font-medium text-pg-label">Blog</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="text-[15px] font-medium text-pg-label">Contact</Link>
          </div>
        </div>
      )}
    </header>
  );
};

// ---------- Hero ----------
const Hero: React.FC = () => (
  <section className="px-6 pt-14 pb-10 text-center">
    <div className="max-w-[1080px] mx-auto">
      <h1 className="text-[clamp(32px,6vw,52px)] leading-[1.06] font-bold tracking-[-0.02em] max-w-[680px] mx-auto mb-3.5 text-pg-label">
        Study in Germany,<br />without the guesswork<span className="text-pg-accent">.</span>
      </h1>
      <p className="text-[18px] text-pg-label2 max-w-[480px] mx-auto mb-7">
        One guided path through APS, university applications, and your visa — start to finish.
      </p>
      <div className="flex gap-2.5 justify-center flex-wrap mb-6">
        <Link to="/auth" className="pg-btn pg-btn-primary">Start free</Link>
        <a href="#features" className="pg-btn pg-btn-secondary">See how it works</a>
      </div>
      <div className="flex items-center justify-center gap-4 text-[13px] text-pg-label3 flex-wrap">
        <span><b className="text-pg-label2 font-semibold">10,500+</b> students guided</span>
        <span className="w-[3px] h-[3px] rounded-full bg-pg-label3" />
        <span><b className="text-pg-label2 font-semibold">120+</b> partner universities</span>
        <span className="w-[3px] h-[3px] rounded-full bg-pg-label3" />
        <span><b className="text-pg-label2 font-semibold">6</b> years of experience</span>
      </div>
    </div>
  </section>
);

// ---------- Features ----------
const FEATURES = [
  { icon: ClipboardList, title: 'APS certification', desc: 'Step-by-step help with the document every application needs.' },
  { icon: Target, title: 'University fit', desc: 'A shortlist matched to your grades, budget, and course.' },
  { icon: Plane, title: 'Visa support', desc: 'Full guidance from blocked account to VFS appointment.' },
  { icon: FileText, title: 'Documents', desc: "SOPs, LORs, and CVs reviewed until they're ready." },
  { icon: MessagesSquare, title: '1:1 consultations', desc: "Advisors who've placed students in your exact field." },
  { icon: Luggage, title: 'Pre-departure', desc: 'Housing, insurance, and settling-in support.' },
] as const;

const Features: React.FC = () => (
  <section id="features" className="bg-pg-bg2 py-[52px]">
    <div className="max-w-[1080px] mx-auto px-6">
      <div className="text-center max-w-[520px] mx-auto mb-8">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">What's inside</div>
        <h2 className="text-[clamp(24px,4vw,32px)]">Everything your file needs</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-[14px] p-5 border border-pg-sep/60">
            <Icon className="w-[22px] h-[22px] text-pg-label mb-2.5" strokeWidth={1.8} />
            <h3 className="text-[15.5px] font-semibold mb-1 text-pg-label">{title}</h3>
            <p className="text-[13.5px] leading-[1.4] text-pg-label2">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Testimonials ----------
const TESTIMONIALS = [
  { initial: 'S', name: 'Sanvijeet SR', role: 'Student', quote: 'A dream-come-true journey that felt manageable from day one.', stars: 5 },
  { initial: 'P', name: 'Pragati Jain', role: 'BMW Munich', quote: 'My advisor explained every intricate step until it clicked.', stars: 5 },
  { initial: 'M', name: 'Mimmini V.', role: 'Student', quote: 'Felt like a study partner, patient through every hard question.', stars: 5 },
  { initial: 'S', name: 'Shubham Kumar', role: 'B.Eng, Logistics', quote: 'Shortlisting was tuned to what I actually qualified for.', stars: 5 },
  { initial: 'V', name: 'Vaibhav', role: 'B.Sc, AI', quote: 'A clear shortlist early made resettling far less daunting.', stars: 4 },
];

const Stars: React.FC<{ n: number }> = ({ n }) => (
  <div className="text-pg-gold text-[11px] leading-none">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</div>
);

const Testimonials: React.FC = () => (
  <section id="stories" className="py-[52px]">
    <div className="max-w-[1080px] mx-auto px-6 mb-6">
      <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">Testimonials</div>
      <h2 className="text-[clamp(24px,4vw,32px)]">Students who made it</h2>
    </div>
    <div className="pg-carousel flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-2">
      {TESTIMONIALS.map((t, i) => (
        <div key={i} className="snap-start shrink-0 w-[260px] bg-pg-bg2 rounded-[14px] p-[18px] flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-full bg-pg-label text-white flex items-center justify-center font-semibold text-[13px]">
              {t.initial}
            </div>
            <div>
              <div className="font-semibold text-[13.5px] text-pg-label">{t.name}</div>
              <div className="text-[11.5px] text-pg-label3">{t.role}</div>
            </div>
          </div>
          <Stars n={t.stars} />
          <p className="text-[13px] text-pg-label2 leading-[1.45]">{t.quote}</p>
        </div>
      ))}
    </div>
  </section>
);

// ---------- Process ----------
const STEPS = [
  { n: '01', title: 'Create your profile', desc: 'Academics, budget, target course.' },
  { n: '02', title: 'Get your checklist', desc: 'Shortlisted universities & documents.' },
  { n: '03', title: 'Track progress', desc: 'Every deadline, one dashboard.' },
  { n: '04', title: 'Reach Germany', desc: 'Offer, visa, departure.' },
];

const Process: React.FC = () => (
  <section className="bg-pg-bg2 py-[52px]">
    <div className="max-w-[1080px] mx-auto px-6">
      <div className="text-center max-w-[520px] mx-auto mb-8">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">How it works</div>
        <h2 className="text-[clamp(24px,4vw,32px)]">Four steps, one file</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-pg-label text-white rounded-[14px] p-5">
            <div className="text-[12px] font-bold text-[#9aa4b3] mb-2">{s.n}</div>
            <h4 className="text-white text-[14.5px] font-semibold mb-1">{s.title}</h4>
            <p className="text-[#a9b1bd] text-[12px] leading-[1.4]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Pricing ----------
const Pricing: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6 mb-7">
        <div className="text-center max-w-[520px] mx-auto">
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">Pricing</div>
          <h2 className="text-[clamp(24px,4vw,32px)] mb-2">A package for wherever you're starting</h2>
          <p className="text-[15.5px] text-pg-label2">Transparent, staged pricing — no surprise fees mid-application.</p>
        </div>
      </div>
      <div className="pg-carousel flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto md:overflow-visible snap-x snap-mandatory px-6 pb-2.5 max-w-[1080px] mx-auto">
        {SERVICE_PACKAGES.map((p) => (
          <div
            key={p.id}
            className={`snap-start shrink-0 w-[250px] md:w-auto bg-white rounded-[20px] p-5 flex flex-col relative border ${
              p.popular ? 'border-[1.5px] border-pg-accent shadow-[0_16px_32px_-12px_rgba(0,0,0,0.14)]' : 'border-pg-sep'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-[11px] left-5 bg-pg-accent text-white text-[10.5px] font-bold tracking-wide px-2.5 py-1 rounded-full">
                Most popular
              </span>
            )}
            <div className="text-[15px] font-semibold mb-1 text-pg-label">{p.name}</div>
            <div className="text-[26px] font-bold text-pg-label leading-none mb-0.5">{p.priceLabel}</div>
            <div className="text-[11.5px] text-pg-label3 mb-3.5">{p.payment}</div>
            <ul className="mb-4 space-y-1.5">
              {p.included.slice(0, 3).map((it) => (
                <li key={it} className="flex gap-1.5 text-[12.5px] text-pg-label">
                  <span className="text-pg-green font-bold shrink-0">✓</span>
                  {it}
                </li>
              ))}
              {p.notes?.[0] && (
                <li className="flex gap-1.5 text-[12.5px] italic text-pg-label3">
                  <span className="shrink-0">+</span>
                  {p.notes[0]}
                </li>
              )}
            </ul>
            <button
              onClick={() => navigate(`/services?package=${p.slug}`)}
              className={`pg-btn pg-btn-sm mt-auto w-full ${p.popular ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
            >
              Request
            </button>
          </div>
        ))}
      </div>
      <p className="md:hidden text-center text-[12px] text-pg-label3 mt-1">Swipe for more →</p>
    </section>
  );
};

// ---------- FAQ ----------
const FAQS = [
  { q: 'Do I need an APS certificate to study in Germany?', a: "Most Indian applicants need APS certification before German universities process their application. We'll confirm if it applies to you." },
  { q: 'Which documents do I need for applications?', a: 'Typically transcripts, SOP, LORs, CV, and language certificates. Your checklist lists exactly what your programs ask for.' },
  { q: 'Can I apply to multiple universities at once?', a: 'Yes — most students apply to 7–8 universities to maximise their chances.' },
  { q: 'How much money do I need in my blocked account?', a: "The German government sets an annual minimum, reviewed yearly. We'll confirm the current figure with you." },
  { q: 'How early should I apply for a visa?', a: 'As soon as you have an admission offer — appointment slots can book out weeks in advance.' },
  { q: 'Can I stay in Germany after graduation?', a: "Yes, Germany offers a post-study work visa. We'll walk you through the conditions closer to graduation." },
];

const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-pg-bg2 py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="text-center max-w-[520px] mx-auto mb-8">
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">Questions</div>
          <h2 className="text-[clamp(24px,4vw,32px)]">Frequently asked</h2>
        </div>
        <div className="pg-group max-w-[720px] mx-auto">
          {FAQS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center gap-3.5 px-5 py-4 text-left text-[15px] font-medium text-pg-label"
                aria-expanded={open === i}
              >
                <span>{item.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-pg-label3 transition-transform ${open === i ? 'rotate-90' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-[14px] text-pg-label2 leading-[1.5]">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------- Final CTA ----------
const FinalCTA: React.FC = () => (
  <section className="py-[52px]">
    <div className="max-w-[1080px] mx-auto px-6">
      <div className="bg-pg-label text-white rounded-[20px] px-7 py-11 text-center">
        <h2 className="text-white text-[clamp(22px,3.6vw,30px)] mb-2">Start your Germany file today</h2>
        <p className="text-[#a9b1bd] mb-6 text-[15px]">Free to create. No commitment until you're ready.</p>
        <Link to="/auth" className="pg-btn pg-btn-primary">Get started free</Link>
      </div>
    </div>
  </section>
);

// ---------- Footer ----------
const Footer: React.FC = () => (
  <footer className="py-9 border-t border-pg-sep">
    <div className="max-w-[1080px] mx-auto px-6">
      <div className="flex justify-between items-center flex-wrap gap-3.5">
        <PgLogo />
        <div className="flex gap-5 flex-wrap">
          <Link to="/services" className="text-[13px] text-pg-label2 hover:text-pg-label">Services</Link>
          <a href="#stories" className="text-[13px] text-pg-label2 hover:text-pg-label">Stories</a>
          <Link to="/resources" className="text-[13px] text-pg-label2 hover:text-pg-label">Resources</Link>
          <Link to="/blog" className="text-[13px] text-pg-label2 hover:text-pg-label">Blog</Link>
          <Link to="/contact" className="text-[13px] text-pg-label2 hover:text-pg-label">Contact</Link>
          <Link to="/privacy" className="text-[13px] text-pg-label2 hover:text-pg-label">Privacy</Link>
        </div>
      </div>
      <div className="text-[12.5px] text-pg-label3 mt-4.5">© {new Date().getFullYear()} publicgermany. All rights reserved.</div>
    </div>
  </footer>
);

// ---------- Page ----------
const Index: React.FC = () => {
  useEffect(() => {
    document.title = 'publicgermany — Study in Germany, guided';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'One guided path through APS, university applications, and your German student visa. Trusted by 10,500+ students.');
  }, []);
  return (
    <div className="min-h-screen bg-pg-bg text-pg-label">
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Process />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
