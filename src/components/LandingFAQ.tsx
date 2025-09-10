import React, { useState } from "react";

type FAQItem = { q: string; a: React.ReactNode };
type FAQSection = { title: string; items: FAQItem[] };

const sections: FAQSection[] = [
  {
    title: "General Questions About Studying in Germany",
    items: [
      {
        q: "What is GermanyHelp and how can it assist me?",
        a: (
          <>
            GermanyHelp is a comprehensive platform that provides guidance for international students planning to study in Germany. We offer free resources including personalized checklists, progress tracking, and access to guides covering APS certification, university applications, visa processes, and pre-departure support. Optional paid services include one-on-one consultations for APS guidance, university shortlisting, document review, and visa preparation.
          </>
        )
      },
      {
        q: "Do I really need APS certification to study in Germany?",
        a: (
          <>
            Yes, APS certification is mandatory for Indian students applying to German universities for degree programs lasting more than 90 days (Studienkolleg, bachelor's, master's). The APS certificate verifies the authenticity of your Indian academic documents and ensures they meet German university admission standards. Without APS certification, you cannot obtain a German student visa.
          </>
        )
      },
      {
        q: "What is the current cost for APS certification?",
        a: (
          <>
            The APS certification fee for Indian students is <strong>₹18,000</strong> (approximately €225). The fee is non-refundable. Processing typically takes <strong>4–6 weeks</strong>, and most applications no longer require an interview.
          </>
        )
      }
    ]
  },
  {
    title: "University Applications and Deadlines",
    items: [
      {
        q: "What are the application deadlines for German universities?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Winter Semester</strong> (Sep/Oct start): usually by <strong>July 15</strong></li>
            <li><strong>Summer Semester</strong> (Mar/Apr start): usually by <strong>January 15</strong></li>
            <li>Some universities/programs have earlier deadlines (e.g., certain TUM programs by <strong>May 31</strong>).</li>
          </ul>
        )
      },
      {
        q: "Which documents do I need for university applications?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Completed application form</li>
            <li>Academic transcripts and certificates (from Class 10 onwards)</li>
            <li>Degree certificates or provisional certificates</li>
            <li>Valid passport copy</li>
            <li>Language proficiency certificates (German or English)</li>
            <li>Statement of Purpose (SOP)</li>
            <li>Curriculum Vitae (CV)</li>
            <li>Letters of Recommendation (LOR)</li>
            <li>Passport-sized photographs</li>
            <li>Official translations for any non-English/German documents</li>
          </ul>
        )
      },
      {
        q: "What are the English language requirements for studying in Germany?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>TOEFL iBT</strong>: 80–100 (varies)</li>
            <li><strong>IELTS</strong>: 6.5–7.5</li>
            <li><strong>Cambridge English</strong>: 180+ (C1 Advanced/C2 Proficiency)</li>
            <li><strong>PTE Academic</strong>: 58–70</li>
            <li>Example: TUM often requires TOEFL iBT 88; some programs accept 80.</li>
          </ul>
        )
      }
    ]
  },
  {
    title: "Visa and Financial Requirements",
    items: [
      {
        q: "How much money do I need in my blocked account for a German student visa?",
        a: (
          <>
            For <strong>2025</strong>, you must deposit <strong>€11,904</strong> (about ₹10,63,872) in your blocked account, with a monthly withdrawal limit of €992. Some visa types (language courses, apprenticeships) may require ~10% more (≈ €13,094.40).
          </>
        )
      },
      {
        q: "What types of German student visas are available?",
        a: (
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Student Visa (Visum zu Studienzwecken)</strong>: for admitted students, valid for one year.</li>
            <li><strong>Prospective Student Visa (Visum zur Studienbewerbung)</strong>: for applicants still applying; valid 3–9 months and extendable.</li>
          </ol>
        )
      },
      {
        q: "How early should I apply for a German student visa?",
        a: (
          <>Apply at least <strong>3 months</strong> before travel. Processing often takes several months; it’s best to have your APS certificate and admission letter ready first.</>
        )
      }
    ]
  },
  {
    title: "Language Requirements and Preparation",
    items: [
      {
        q: "Do I need to learn German to study in Germany?",
        a: (
          <>Not strictly. Many programs are in English, especially at the master’s level. However, basic German helps daily life, internships, and jobs. For German‑taught programs, prove proficiency via TestDaF, DSH, or Goethe certificates.</>
        )
      },
      {
        q: "Can I work while studying in Germany?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>120 full days</strong> OR <strong>240 half days</strong> per year.</li>
            <li>Unlimited hours for university assistant (HiWi) jobs.</li>
            <li>EU students have unrestricted work rights.</li>
          </ul>
        )
      }
    ]
  },
  {
    title: "Application Process and Support",
    items: [
      {
        q: "Should I apply directly to universities or through uni-assist?",
        a: (
          <>Depends on the university. Some use <strong>uni‑assist</strong>; others have their own portals. Check each university’s site. Uni‑assist charges fees but simplifies multiple applications.</>
        )
      },
      {
        q: "What happens if I miss application deadlines?",
        a: (
          <>You may need to wait a semester. A few programs have later deadlines, but options become limited. Apply at least <strong>8 weeks</strong> early to buffer for document processing.</>
        )
      },
      {
        q: "Can I apply to multiple German universities simultaneously?",
        a: (
          <>Yes. You can apply to multiple universities (fees may apply for each, especially via uni‑assist). Focus on programs that fit your profile for best results.</>
        )
      },
      {
        q: "How long does the entire process take from APS to university enrollment?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>APS processing: <strong>6–8 weeks</strong></li>
            <li>University decisions: <strong>2–4 weeks</strong> after deadlines</li>
            <li>Visa processing: <strong>8–12 weeks</strong></li>
            <li>Pre‑departure prep: <strong>4–6 weeks</strong></li>
            <li><strong>Total:</strong> typically <strong>8–12 months</strong>; starting one year in advance is ideal.</li>
          </ul>
        )
      }
    ]
  }
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);

  return (
    <section id="faq" className="py-16 bg-background">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">FAQ</h2>
          <p className="text-muted-foreground mt-2">Answers to common questions about studying in Germany</p>
        </div>

        <div className="space-y-10">
          {sections.map((section, si) => (
            <div key={si}>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="rounded-lg border bg-card/50 backdrop-blur-sm">
                      <button
                        className="w-full flex justify-between items-center px-5 py-4 text-left font-medium hover:bg-accent/30 transition"
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${key}`}
                      >
                        <span>{item.q}</span>
                        <span className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {isOpen && (
                        <div id={`faq-panel-${key}`} className="px-5 pb-5 text-muted-foreground text-sm animate-fade-in">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
