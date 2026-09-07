import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Target, Plane, FileText, MessagesSquare, Luggage, Menu, X, X as XIcon } from 'lucide-react';
import { PWAInstallButton, PWAInstallPopup } from '@/components/PWAInstallPrompt';
import PgLogo, { PgLogoMark } from '@/components/PgLogo';
import { useServicePackages } from '@/hooks/useServiceData';
import { supabase } from '@/integrations/supabase/client';

// April 2024 → now
const START_DATE = new Date('2024-04-01T00:00:00Z');
const useYearsOfExperience = () => {
  return useMemo(() => {
    const now = new Date();
    const years = (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 1) {
      const months = Math.max(1, Math.round(years * 12));
      return `${months} month${months === 1 ? '' : 's'}`;
    }
    return `${Math.floor(years)}+ years`;
  }, []);
};

const useLiveStats = () => {
  const [students, setStudents] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });
      if (typeof count === 'number') setStudents(count);
    })();
  }, []);
  return { students };
};

type LiveReview = {
  id: string;
  rating: number;
  review_text: string;
  service_type: string | null;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

const useLiveReviews = (limit = 8) => {
  const [reviews, setReviews] = useState<LiveReview[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('reviews')
        .select('id, rating, review_text, service_type, created_at, profiles ( full_name, avatar_url )')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      setReviews((data || []) as LiveReview[]);
    })();
  }, [limit]);
  return reviews;
};

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
          <PWAInstallButton className="h-8 w-8 p-0 inline-flex" />
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
const Hero: React.FC = () => {
  const { students } = useLiveStats();
  const years = useYearsOfExperience();
  const studentsLabel = students === null ? '…' : `${students}+`;
  return (
    <section className="px-6 pt-14 pb-10 text-center">
      <div className="max-w-[1080px] mx-auto">
        <div className="flex justify-center mb-5">
          <PgLogo />
        </div>
        <h1 className="text-[clamp(32px,6vw,52px)] leading-[1.06] font-bold tracking-[-0.02em] max-w-[680px] mx-auto mb-3.5 text-pg-label">
          Study in Germany,<br />without the guesswork<span className="text-pg-accent">.</span>
        </h1>
        <p className="text-[18px] text-pg-label2 max-w-[480px] mx-auto mb-7">
          One guided path through APS, university applications, and your visa — start to finish.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap mb-6">
          <Link to="/auth" className="pg-btn pg-btn-primary">Start free</Link>
          <a href="#features" className="pg-btn pg-btn-secondary">See how it works</a>
          <PWAInstallButton label="📱 Install App" className="text-[15px] font-medium" />
        </div>
        <div className="flex items-center justify-center gap-4 text-[13px] text-pg-label3 flex-wrap">
          <span><b className="text-pg-label2 font-semibold">{studentsLabel}</b> students guided</span>
          <span className="w-[3px] h-[3px] rounded-full bg-pg-label3" />
          <span><b className="text-pg-label2 font-semibold">{years}</b> of experience</span>
          <span className="w-[3px] h-[3px] rounded-full bg-pg-label3" />
          <span>Since <b className="text-pg-label2 font-semibold">April 2024</b></span>
        </div>
      </div>
    </section>
  );
};

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
          <div key={title} className="bg-pg-bg rounded-[14px] p-5 border border-pg-sep/60">
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
const Stars: React.FC<{ n: number }> = ({ n }) => (
  <div className="text-pg-gold text-[11px] leading-none">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</div>
);

const initialOf = (name?: string | null) => (name?.trim()?.[0] || 'S').toUpperCase();

const ReviewCard: React.FC<{ r: LiveReview }> = ({ r }) => {
  const [expanded, setExpanded] = useState(false);
  const name = r.profiles?.full_name || 'Student';
  const text = r.review_text || '';
  const isLong = text.length > 180;
  return (
    <div className={`snap-start shrink-0 w-[260px] bg-pg-bg2 rounded-[14px] p-[18px] flex flex-col gap-2 ${expanded ? 'self-start' : ''}`}>
      <div className="flex items-center gap-2.5">
        {r.profiles?.avatar_url ? (
          <img src={r.profiles.avatar_url} alt={name} className="w-[34px] h-[34px] rounded-full object-cover" />
        ) : (
          <div className="w-[34px] h-[34px] rounded-full bg-pg-label text-pg-bg flex items-center justify-center font-semibold text-[13px]">
            {initialOf(name)}
          </div>
        )}
        <div>
          <div className="font-semibold text-[13.5px] text-pg-label">{name}</div>
          <div className="text-[11.5px] text-pg-label3">
            {r.service_type && r.service_type !== 'general' ? r.service_type : 'Student'}
          </div>
        </div>
      </div>
      <Stars n={Math.max(1, Math.min(5, Math.round(r.rating)))} />
      <p className={`text-[13px] text-pg-label2 leading-[1.45] whitespace-pre-line ${expanded ? '' : 'line-clamp-5'}`}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-[12px] font-semibold text-pg-accent hover:underline"
        >
          {expanded ? 'Show less' : 'Read full review'}
        </button>
      )}
    </div>
  );
};

const Testimonials: React.FC = () => {
  const reviews = useLiveReviews(8);
  if (reviews.length === 0) return null;
  return (
    <section id="stories" className="py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6 mb-6">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">Testimonials</div>
        <h2 className="text-[clamp(24px,4vw,32px)]">Students who made it</h2>
      </div>
      <div className="pg-carousel flex items-start gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-2">
        {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
      </div>
    </section>

  );
};

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
          <div key={s.n} className="bg-pg-label text-pg-bg dark:bg-pg-bg3 dark:text-pg-label rounded-[14px] p-5">
            <div className="text-[12px] font-bold text-pg-label3 dark:text-pg-label2 mb-2">{s.n}</div>
            <h4 className="text-pg-bg dark:text-pg-label text-[14.5px] font-semibold mb-1">{s.title}</h4>
            <p className="text-pg-label3 text-[12px] leading-[1.4]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Partner Services (IELTS, Loan, German) ----------
type ModalType = 'ielts' | 'loan' | 'german' | null;

const PartnerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, wide, children }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 z-[999] flex items-center justify-center p-6 transition-opacity duration-250 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-pg-bg border border-pg-sep rounded-[18px] w-full max-h-[86vh] overflow-y-auto p-9 transition-all duration-400 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97] translate-y-2'
        } ${wide ? 'max-w-[780px]' : 'max-w-[620px]'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[24px] font-extrabold tracking-[-0.01em] text-pg-label">{title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 w-[34px] h-[34px] rounded-full bg-pg-bg2 border border-pg-sep flex items-center justify-center text-pg-label3 hover:text-pg-label transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ModalSubtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[14px] font-semibold text-pg-accent mb-3.5">{children}</div>
);

const ModalLead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[14px] text-pg-label2 leading-[1.7] mb-[18px]">{children}</p>
);

const PriceTag: React.FC<{ amount: string; label: string; free?: boolean }> = ({ amount, label, free }) => (
  <div className="inline-flex items-baseline gap-1.5 bg-pg-bg2 border border-pg-sep px-4 py-2.5 rounded-[10px] mb-5">
    <span className={`text-[21px] font-extrabold ${free ? 'text-pg-green' : 'text-pg-label'}`}>{amount}</span>
    <span className="text-[12px] text-pg-label3">{label}</span>
  </div>
);

const FeatureList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-0 mb-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5 py-2.5 border-b border-pg-sep text-[13px] text-pg-label2 leading-[1.6]">
        <span className="text-pg-accent font-extrabold shrink-0 mt-0.5">✓</span>
        <span dangerouslySetInnerHTML={{ __html: item }} />
      </li>
    ))}
  </ul>
);

const NoteBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-[18px] bg-pg-accent/5 border border-pg-accent/15 rounded-[10px] px-4 py-3.5 text-[12.5px] text-pg-label2 leading-[1.6]">
    {children}
  </div>
);

const TrainerMini: React.FC<{ name: string; cred: string }> = ({ name, cred }) => (
  <div className="bg-pg-bg2 border border-pg-sep rounded-[10px] p-[14px]">
    <div className="font-bold text-[13px] text-pg-label mb-1">{name}</div>
    <div className="text-[11.5px] text-pg-label3 leading-[1.5]">{cred}</div>
  </div>
);

const CourseTable: React.FC<{ label: string; headers: string[]; rows: string[][] }> = ({ label, headers, rows }) => (
  <div className="mt-5 first:mt-0">
    <div className="text-[10.5px] font-bold tracking-[0.05em] uppercase text-pg-accent mb-2">{label}</div>
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left text-pg-label3 font-semibold uppercase text-[10px] tracking-[0.04em] px-2.5 py-2 border-b border-pg-sep">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-2.5 py-2 border-b border-pg-sep ${j === 0 ? 'text-pg-label font-semibold' : j === row.length - 1 ? 'text-pg-accent font-bold text-right' : 'text-pg-label2'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PartnerServices: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [mounted, setMounted] = useState<ModalType>(null);

  const openModal = useCallback((id: ModalType) => {
    setMounted(id);
    requestAnimationFrame(() => setActiveModal(id));
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    document.body.style.overflow = '';
    setTimeout(() => setMounted(null), 400);
  }, []);

  // Restore body scroll on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeModal]);

  type CardItem = { id: 'ielts' | 'loan' | 'german'; tag: string; title: string; who: string; price: string; free: boolean };
  const CARDS: CardItem[] = [
    {
      id: 'ielts',
      tag: 'IELTS',
      title: 'IELTS Academic',
      who: 'Ruchi Gulatee Puri · 17+ years experience',
      price: '₹5,999',
      free: false,
    },
    {
      id: 'loan',
      tag: 'Finance',
      title: 'Blocked Account & Education Loan',
      who: 'Vijay',
      price: '',
      free: true,
    },
    {
      id: 'german',
      tag: 'Language',
      title: 'German Language Courses',
      who: 'Shalini Chauhan & Esha Chowdhury',
      price: '₹6,000',
      free: false,
    },
  ];

  return (
    <section className="bg-pg-bg2 py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="flex justify-between items-start gap-6 mb-9">
          <div>
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-2.5">
              Beyond the application
            </div>
            <h2 className="text-[clamp(24px,4vw,32px)] max-w-[440px]">
              Everything else your Germany file needs
            </h2>
            <p className="text-[14.5px] text-pg-label2 mt-2 max-w-[480px] leading-[1.6]">
              IELTS, financing, and German language — vetted specialists, one tap away from the full picture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => openModal(card.id)}
              className="bg-pg-bg border border-pg-sep/60 rounded-[14px] p-5 sm:p-6 text-left w-full cursor-pointer transition-all duration-200 hover:border-pg-accent hover:-translate-y-[3px] hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.35)] group"
            >
              <span className="inline-block text-[10.5px] font-bold tracking-[0.06em] uppercase text-pg-accent bg-pg-accent/10 border border-pg-accent/20 px-2.5 py-1 rounded-full mb-3.5">
                {card.tag}
              </span>
              <h3 className="text-[17px] font-bold mb-1 text-pg-label">{card.title}</h3>
              <div className="text-[12px] text-pg-label3 mb-3.5">{card.who}</div>
              <div className={`text-[15px] font-extrabold mb-3 ${card.free ? 'text-pg-green' : 'text-pg-label'}`}>
                {card.free ? 'Free' : <><span className="text-[11px] font-semibold text-pg-label3 uppercase tracking-[0.04em]">From </span>{card.price}</>}
              </div>
              <div className="text-[13px] font-bold text-pg-accent flex items-center gap-1.5">
                View full details
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-[3px]">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* IELTS Modal */}
      {mounted === 'ielts' && (
        <PartnerModal isOpen={activeModal === 'ielts'} onClose={closeModal} title="IELTS Academic">
          <ModalSubtitle>Expert-led by Ruchi Gulatee Puri — 17+ years of experience</ModalSubtitle>
          <ModalLead>
            This is an IELTS preparation course, not a general English language course. The focus stays on exam strategy and scoring technique — exactly what moves your band score.
          </ModalLead>
          <PriceTag amount="₹5,999" label="full course" />
          <FeatureList items={[
            '<strong>Live classes</strong> — not pre-recorded, real-time instruction',
            '<strong>Mock tests</strong> to track your progress toward your target band',
            '<strong>Study materials</strong> included',
            '<strong>Personalized guidance</strong> throughout',
            'Classes on alternate days, <strong>3–4 sessions/week</strong>',
            'Each class is <strong>1.5 hours</strong> — 20 classes = 30 regular 1-hour sessions',
          ]} />
          <NoteBox><strong>Note:</strong> exam-strategy focused. If you need to build English fluency from the ground up, talk to us about language options first.</NoteBox>
        </PartnerModal>
      )}

      {/* Loan Modal */}
      {mounted === 'loan' && (
        <PartnerModal isOpen={activeModal === 'loan'} onClose={closeModal} title="Blocked Account & Education Loan">
          <ModalSubtitle>Vijay</ModalSubtitle>
          <ModalLead>
            Financing built around what a Germany application actually needs — your blocked account and an education loan sized and priced for a German university budget, not a generic study-abroad product.
          </ModalLead>
          <PriceTag amount="Free" label="guidance & coordination" free />
          <FeatureList items={[
            '<strong>Low rate of interest</strong>, specifically for Germany-bound students',
            '<strong>Minimal insurance requirements</strong> compared to standard study loans',
            'Guidance on <strong>blocked account</strong> setup and funding',
            'Support sized to your course, city, and university',
          ]} />
        </PartnerModal>
      )}

      {/* German Modal */}
      {mounted === 'german' && (
        <PartnerModal isOpen={activeModal === 'german'} onClose={closeModal} title="German Language Courses" wide>
          <ModalSubtitle>Shalini Chauhan & Esha Chowdhury</ModalSubtitle>
          <ModalLead>
            C1-certified, industry-experienced educators. Goethe, TELC & ÖSD-aligned exam prep, conversation-focused practice, and an internal exam after every level.
          </ModalLead>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-[18px]">
            <TrainerMini
              name="Shalini Chauhan"
              cred="Master's in German Studies · C1 (Goethe-Institut) · 8+ years teaching across freelance, institute & corporate settings"
            />
            <TrainerMini
              name="Esha Chowdhury"
              cred="M.Tech Software Engineering · C1 German (Goethe-Institut) · DELF A1 French · 8 yrs language teaching, 14 yrs overall"
            />
          </div>

          <CourseTable
            label="Lateral Courses"
            headers={['Batch','Duration','Session','Fee']}
            rows={[
              ['Lateral A1','60 hrs (2 mo)','1.5 hrs','₹15,000'],
              ['Lateral A2','80 hrs (2.5 mo)','1.5 hrs','₹15,000'],
              ['Lateral B1','120 hrs (4 mo)','1.5 hrs','₹16,000'],
              ['Lateral B2.1','100 hrs (3 mo)','1.5 hrs','₹16,000'],
              ['Lateral B2.2','120 hrs (4 mo)','1.5 hrs','₹16,000'],
              ['Lateral C1.1','120 hrs (4 mo)','1.5 hrs','₹17,000'],
              ['Lateral C1.2','120 hrs (4 mo)','1.5 hrs','₹17,000'],
            ]}
          />

          <CourseTable
            label="Exam Prep Courses"
            headers={['Batch','Duration','Session','Fee']}
            rows={[
              ['Exam Prep A1','20 hrs (14 days)','1.5 hrs','₹6,000'],
              ['Exam Prep A2','20 hrs (14 days)','1.5 hrs','₹6,000'],
              ['Exam Prep B1','40 hrs (26 days)','1.5 hrs','₹8,000'],
              ['Exam Prep B2','40 hrs (26 days)','1.5 hrs','₹9,000'],
            ]}
          />

          <CourseTable
            label="Fast Track (Exam Prep included)"
            headers={['Batch','Duration','Session','Fee']}
            rows={[
              ['A1+A2 Fast Track','120 hrs (2.5 mo)','2.5 hrs','₹24,000'],
              ['B1 Fast Track','150 hrs (3 mo)','2.5 hrs','₹21,000'],
              ['B2 Fast Track','220 hrs (4.5 mo)','2.5 hrs','₹25,000'],
            ]}
          />

          <CourseTable
            label="Super Fast Track (Exam Prep included)"
            headers={['Batch','Duration','Session','Fee']}
            rows={[
              ['A1+A2 Super Fast Track','120 hrs (1.5 mo)','4.5 hrs','₹24,000'],
              ['B1 Super Fast Track','150 hrs (2 mo)','4.5 hrs','₹21,000'],
              ['B2 Super Fast Track','220 hrs (2.5 mo)','4.5 hrs','₹25,000'],
            ]}
          />

          <NoteBox>Also included: additional study materials, free access to all session recordings, and complimentary culture-sensitization training.</NoteBox>
        </PartnerModal>
      )}
    </section>
  );
};

// ---------- Pricing ----------
const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { data: packages = [] } = useServicePackages();
  return (
    <section id="pricing" className="py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6 mb-7">
        <div className="text-center max-w-[520px] mx-auto">
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-1.5">Pricing</div>
          <h2 className="text-[clamp(24px,4vw,32px)] mb-2">A package for wherever you're starting</h2>
          <p className="text-[15.5px] text-pg-label2">Transparent, staged pricing — no surprise fees mid-application.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 px-6 max-w-[1080px] mx-auto">
        {packages.map((p) => (
          <div
            key={p.id}
            className={`bg-pg-bg rounded-[20px] p-4 sm:p-5 flex flex-col relative border ${
              p.highlighted ? 'border-[1.5px] border-pg-accent shadow-[0_16px_32px_-12px_rgba(0,0,0,0.14)]' : 'border-pg-sep'
            }`}
          >
            {p.badge && (
              <span className="absolute -top-[11px] left-4 sm:left-5 bg-pg-accent text-white text-[10.5px] font-bold tracking-wide px-2.5 py-1 rounded-full">
                {p.badge}
              </span>
            )}
            <div className="text-[14px] sm:text-[15px] font-semibold mb-1 text-pg-label">{p.title}</div>
            <div className="text-[22px] sm:text-[26px] font-bold text-pg-label leading-none mb-0.5">{p.priceLabel}</div>
            <div className="text-[11px] sm:text-[11.5px] text-pg-label3 mb-3.5">{p.paymentLabel}</div>
            <ul className="mb-4 space-y-1.5">
              {p.features.slice(0, 4).map((f) => (
                <li key={f.id} className="flex gap-1.5 text-[12px] sm:text-[12.5px] text-pg-label">
                  <span className="text-pg-green font-bold shrink-0">✓</span>
                  {f.feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(`/services?package=${p.slug}`)}
              className={`pg-btn pg-btn-sm mt-auto w-full ${p.highlighted ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
            >
              Request
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};


// ---------- FAQ ----------
type FaqItem = { tag: 'What' | 'When' | 'How'; q: string; a: string };
type FaqStage = 'start' | 'apply' | 'money' | 'after';
type FaqGroup = { stage: FaqStage; label: string; items: FaqItem[] };

const STAGE_TABS: { id: FaqStage | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'start', label: 'Getting Started' },
  { id: 'apply', label: 'Applications & APS' },
  { id: 'money', label: 'Money & Visa' },
  { id: 'after', label: 'Life in Germany' },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    stage: 'start',
    label: 'Getting Started',
    items: [
      { tag: 'What', q: "What's the first step to studying in Germany?", a: "Build your profile with us — academics, budget, and target course. We'll tell you within days whether Germany's a good fit and what your realistic university shortlist looks like." },
      { tag: 'When', q: 'When should I start the process?', a: 'Ideally 8–12 months before your intake. APS, applications, and visa processing all take time — starting early gives you room for delays without missing intake deadlines.' },
      { tag: 'How', q: 'Do I need to know German to apply?', a: 'Not for English-taught programs. But even A1–A2 German helps with daily life, part-time jobs, and visa interviews — we offer courses from A1 through C1.' },
    ],
  },
  {
    stage: 'apply',
    label: 'Applications & APS',
    items: [
      { tag: 'What', q: 'Do I need an APS certificate?', a: "Most Indian applicants need APS certification before German universities process their application. We'll confirm if it applies to your specific course and university." },
      { tag: 'What', q: 'Which documents do I need for applications?', a: 'Academic transcripts, degree certificates, SOP, LORs, CV, language proof (IELTS/German), and APS certificate — the exact list depends on your university and course.' },
      { tag: 'How', q: 'Can I apply to multiple universities at once?', a: 'Yes — most students apply to 6–10 universities to balance ambition with safety options. We help shortlist based on your grades, budget, and course fit.' },
      { tag: 'When', q: 'How long does APS take?', a: 'Typically 4–8 weeks from document submission to certificate, depending on your certificate type and current processing volumes.' },
    ],
  },
  {
    stage: 'money',
    label: 'Money & Visa',
    items: [
      { tag: 'How', q: 'How much money do I need in my blocked account?', a: "The government sets an annual minimum that's revised periodically — we confirm the current exact figure with you when you start your blocked account." },
      { tag: 'How', q: 'Do I need an education loan, or can I self-fund?', a: 'Either works. If you need a loan, we connect you with financing built specifically for Germany-bound students — low interest and minimal insurance requirements.' },
      { tag: 'When', q: 'How early should I apply for a visa?', a: 'As soon as you have your admission offer — ideally 3 months before your intended travel date, since VFS appointment slots fill up fast in peak season.' },
      { tag: 'What', q: "What does the visa application need beyond my admission letter?", a: 'Blocked account confirmation, health insurance, accommodation proof, and a visa-specific SOP — we review each document before you submit.' },
    ],
  },
  {
    stage: 'after',
    label: 'Life in Germany',
    items: [
      { tag: 'How', q: 'Can I work part-time as a student?', a: 'Yes — international students can work up to 140 full or 280 half days per year, which comfortably covers living expenses alongside your studies.' },
      { tag: 'What', q: 'Can I stay in Germany after graduation?', a: 'Yes — graduates get an 18-month post-study work visa to find a job related to their degree, which can then convert to a work or EU Blue Card visa.' },
    ],
  },
];

const TagBadge: React.FC<{ tag: 'What' | 'When' | 'How' }> = ({ tag }) => (
  <span className="text-[9.5px] font-bold uppercase tracking-[0.04em] text-pg-accent bg-pg-accent/10 border border-pg-accent/20 px-[7px] py-[2px] rounded-full shrink-0 mr-2">
    {tag}
  </span>
);

const FAQ: React.FC = () => {
  const [activeStage, setActiveStage] = useState<FaqStage | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback((key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const visibleGroups = activeStage === 'all'
    ? FAQ_GROUPS
    : FAQ_GROUPS.filter((g) => g.stage === activeStage);

  return (
    <section id="faq" className="bg-pg-bg2 py-[52px]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="max-w-[720px] mx-auto">
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-pg-accent mb-2.5">Questions</div>
          <h2 className="text-[clamp(24px,4vw,32px)] mb-1.5">Frequently asked</h2>
          <p className="text-[14px] sm:text-[15px] text-pg-label2 leading-[1.6] mb-8 max-w-[520px]">
            The what, when, and how of studying in Germany — organized by stage, so you only read what you need right now.
          </p>
        </div>

        {/* Stage tabs */}
        <div className="max-w-[720px] mx-auto flex gap-2 flex-wrap border-b border-pg-sep pb-4 sm:pb-5 mb-8">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStage(tab.id)}
              className={`text-[12.5px] font-semibold px-3.5 py-2 rounded-full border transition-all duration-200 ${
                activeStage === tab.id
                  ? 'bg-pg-accent border-pg-accent text-white'
                  : 'bg-pg-bg border-pg-sep text-pg-label2 hover:border-pg-accent hover:text-pg-label'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ groups */}
        {visibleGroups.map((group) => (
          <div key={group.stage} className="max-w-[720px] mx-auto mb-8 last:mb-0">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-pg-label3 mb-3">
              {group.label}
            </div>
            {group.items.map((item, i) => {
              const key = `${group.stage}-${i}`;
              const isOpen = openItems.has(key);
              return (
                <div
                  key={key}
                  className="bg-pg-bg border border-pg-sep rounded-[12px] mb-2.5 overflow-hidden transition-shadow duration-200 hover:border-pg-accent/40"
                >
                  <button
                    onClick={() => toggleItem(key)}
                    className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <TagBadge tag={item.tag} />
                    <span className="flex-1 text-[13.5px] sm:text-[14.5px] font-semibold text-pg-label leading-snug">
                      {item.q}
                    </span>
                    <span
                      className={`shrink-0 w-[22px] h-[22px] flex items-center justify-center text-pg-label3 text-[17px] font-light transition-transform duration-250 ${
                        isOpen ? 'rotate-45 text-pg-accent' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease overflow-hidden ${
                      isOpen ? 'max-h-[260px]' : 'max-h-0'
                    }`}
                  >
                    <div className="px-4 sm:px-5 pb-4 sm:pb-[18px] text-[13px] sm:text-[13.5px] text-pg-label2 leading-[1.65]">
                      {item.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};

// ---------- Final CTA ----------
const FinalCTA: React.FC = () => (
  <section className="py-[52px]">
    <div className="max-w-[1080px] mx-auto px-6">
      <div className="bg-pg-label text-pg-bg dark:bg-pg-bg3 dark:text-pg-label rounded-[20px] px-5 sm:px-8 py-10 sm:py-11 text-center">
        <h2 className="text-pg-bg dark:text-pg-label text-[clamp(22px,3.6vw,30px)] mb-2">Start your Germany file today</h2>
        <p className="text-pg-label3 dark:text-pg-label2 mb-6 text-[15px]">Free to create. No commitment until you're ready.</p>
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
    if (meta) meta.setAttribute('content', 'One guided path through APS, university applications, and your German student visa. Trusted by real students since April 2024.');
  }, []);
  return (
    <div className="min-h-screen bg-pg-bg text-pg-label">
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Process />
        <PartnerServices />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <PWAInstallPopup />
    </div>
  );
};

export default Index;
