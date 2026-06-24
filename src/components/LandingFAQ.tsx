import React, { useState } from "react";

type FAQItem = { q: string; a: React.ReactNode };
type FAQSection = { title: string; items: FAQItem[] };

const sections: FAQSection[] = [
  {
    title: "General Questions About Studying in Germany",
    items: [
      {
        q: "What is publicgermany and how can it assist me?",
        a: (
          <>
            publicgermany is a free platform for Indian students planning to study in Germany. We provide personalized checklists, progress tracking, and guides covering APS certification, university applications, visa processes, and pre-departure support. Optional paid services include one-on-one consultations for APS guidance, university shortlisting, SOP/CV/LOR editing, and visa preparation.
          </>
        )
      },
      {
        q: "Do I really need an APS certificate to study in Germany?",
        a: (
          <>
            Yes — the APS certificate is mandatory for all Indian students applying to German universities and for the German student visa, required since November 2022. APS (Akademische Prüfstelle) verifies your Indian academic documents. Without it, German universities won't process your application and VFS won't accept your visa appointment. <strong>New for 2026:</strong> a minimum of <strong>70% in Class XII</strong> is required to be eligible for the APS certificate. Students below 70% must attend a Studienkolleg (preparatory course) first.
          </>
        )
      },
      {
        q: "What is the current cost for APS certification?",
        a: (
          <>
            The APS certificate fee is <strong>₹18,000</strong> (non-refundable). Processing takes <strong>3–4 weeks</strong> normally and up to <strong>10 weeks</strong> during peak season (March–June, before the July 15 uni-assist deadline). Apply at <em>aps-india.de</em>. Do not spam APS India with status emails — repeated emails can result in your account being blocked.
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
          <>
            Germany has two intakes: <strong>Winter Semester</strong> (October start) and <strong>Summer Semester</strong> (April start). Via uni-assist: Winter deadline is <strong>July 15</strong>, Summer deadline is <strong>January 15</strong>. Direct portal deadlines are earlier — TUM: April 30, KIT: May 31, RWTH Aachen: March 15–May 31 (varies by program). Missing the deadline means waiting another 6 months. No exceptions.
          </>
        )
      },
      {
        q: "Which documents do I need for university applications?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>APS certificate</li>
            <li>Bachelor's degree / transcripts (all semesters)</li>
            <li>Class X and XII marksheets</li>
            <li>IELTS/TOEFL (English-taught) or German certificate B2/C1 (German-taught)</li>
            <li>Statement of Purpose (SOP)</li>
            <li>CV in Europass or clean format</li>
            <li>2 Letters of Recommendation (LORs)</li>
            <li>Valid passport copy</li>
            <li>Program-specific: portfolio, GRE, or work experience proof</li>
          </ul>
        )
      },
      {
        q: "What are the English language requirements for studying in Germany?",
        a: (
          <>
            For English-taught Master's programs: <strong>IELTS Academic 6.0–6.5</strong> (TUM and RWTH Aachen require 6.5 minimum) or <strong>TOEFL iBT 80–95</strong> (TUM requires 95). Some universities waive IELTS if your previous degree was taught in English. For German-taught programs: <strong>TestDaF TDN-4, DSH-2, or Goethe-Zertifikat C1</strong>.
          </>
        )
      },
      {
        q: "Should I apply directly to universities or through uni-assist?",
        a: (
          <>
            Most German public universities use <strong>uni-assist</strong> — 170+ universities including FU Berlin, HU Berlin, Heidelberg, Cologne, Hamburg. Fee: €75 for first application + €15–30 per additional in the same semester. Some have their own portals and do <strong>NOT</strong> use uni-assist: <strong>TUM, KIT, RWTH Aachen, TU Berlin</strong>. Submitting to the wrong portal means your application is not received.
          </>
        )
      },
      {
        q: "Can I apply to multiple German universities simultaneously?",
        a: (
          <>
            Yes — and you should. Apply to <strong>6–10 universities</strong> across three tiers: 2–3 reach schools (TUM, KIT, RWTH), 4–5 match schools, and 2–3 safety schools (Fachhochschulen).
          </>
        )
      },
      {
        q: "How long does the entire process take from APS to university enrollment?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Month 1–2: Research and APS application</li>
            <li>Month 3–4: APS received, university applications submitted</li>
            <li>Month 5–7: Admission decisions received</li>
            <li>Month 7–8: Open blocked account, prepare visa documents</li>
            <li>Month 8–9: Submit visa via CSP + VFS</li>
            <li>Month 9–10: Visa received, accommodation</li>
            <li>Month 10–12: Travel and enrollment</li>
            <li><strong>Total: 9–12 months</strong></li>
          </ul>
        )
      },
      {
        q: "What happens if I miss application deadlines?",
        a: (
          <>
            You must wait for the next intake — 6 months or a full year. Use the time to strengthen your profile: improve GPA, gain work experience, earn certifications, or raise your German language level.
          </>
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
            <strong>€11,904 per year (€992/month)</strong> — updated effective September 2024. Approximately ₹10.7–10.9 lakh. The old €10,332 amount is no longer valid and causes automatic rejection. The money is yours — released monthly after you arrive. Recommended providers: <strong>Fintiba</strong> or <strong>Expatrio</strong> — both open fully online within 1–5 business days.
          </>
        )
      },
      {
        q: "What types of German student visas are available?",
        a: (
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Student Visa (Visum zu Studienzwecken)</strong>: for confirmed admits. Valid 3–6 months; converted to a Residence Permit within 90 days of arrival. Requires €11,904/year proof.</li>
            <li><strong>Student Applicant Visa (Studienbewerbervisa)</strong>: for students still finalizing admission. Requires €1,091/month proof.</li>
          </ol>
        )
      },
      {
        q: "How early should I apply for a German student visa?",
        a: (
          <>
            Apply <strong>3–4 months</strong> before arrival. From <strong>January 2025</strong>, all applications must start online at <em>digital.diplo.de</em> (Consular Services Portal / CSP) before booking a VFS appointment. <strong>From July 1, 2025</strong>, Germany abolished the remonstration procedure — Indian students get <strong>one attempt</strong> at the student visa. Fee: €75 (~₹6,800) + VFS charge ₹1,300–2,500. Processing: 6–25 business days after biometrics.
          </>
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
          <>
            It depends. Bachelor's: mostly German, C1 required (TestDaF TDN-4 or DSH-2). Master's: many are fully English-taught (Engineering, CS, Business). For English-taught programs, German is optional but A1/A2 strongly helps with daily life and jobs. Not required for the visa itself.
          </>
        )
      },
      {
        q: "Can I work while studying in Germany?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>140 full days or 280 half-days</strong> per year (updated from 120/240 in 2024)</li>
            <li>~20 hours/week during lecture periods</li>
            <li>Werkstudent pay: €13–25/hour</li>
            <li>National minimum wage: €12.82/hour (2025)</li>
            <li>18-month Job Seeker Visa after graduation</li>
          </ul>
        )
      }
    ]
  },
  {
    title: "Application Process and Support",
    items: [
      {
        q: "What happens if I get rejected by German universities?",
        a: (
          <ol className="list-decimal pl-5 space-y-1">
            <li>Apply for the next semester — two intakes yearly.</li>
            <li>Apply to <strong>Fachhochschulen</strong> (universities of applied sciences) — lower competition, industry-practical.</li>
            <li>Consider a Studienkolleg if Class XII is below 70%.</li>
            <li>Strengthen profile: certifications, work experience, language improvements.</li>
          </ol>
        )
      },
      {
        q: "How much does it cost to study at a German public university?",
        a: (
          <>
            Most public universities charge <strong>zero tuition</strong> — only a semester contribution of <strong>€70–€380</strong> (often includes a public transport pass). Exception: <strong>Baden-Württemberg</strong> universities (Heidelberg, Stuttgart, Freiburg, Tübingen) charge non-EU students <strong>€1,500/semester</strong>. Living costs: €800–€1,200/month depending on city.
          </>
        )
      },
      {
        q: "Can I stay in Germany after graduation?",
        a: (
          <>
            Yes — an <strong>18-month Job Seeker Visa</strong>. After 2–3 years of skilled work you can apply for permanent residence. After 5 years you may be eligible for German citizenship.
          </>
        )
      }
    ]
  }
];

export default function LandingFAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);

  return (
    <section id="faq" className="py-16 bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">FAQ</h2>
          <p className="text-muted-foreground mt-2">Answers to common questions about studying in Germany</p>
        </div>

        <div className="space-y-10">
          {sections.map((section, si) => (
            <div key={si}>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm">
                      <button
                        className="w-full flex justify-between items-center px-5 py-4 text-left font-medium text-foreground hover:bg-accent/30 transition"
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${key}`}
                      >
                        <span className="pr-3">{item.q}</span>
                        <span className={`ml-auto text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
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
