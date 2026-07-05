import React, { useState } from "react";

type FAQItem = { q: string; a: React.ReactNode };
type FAQTab = { key: string; label: string; groups: { title?: string; items: FAQItem[] }[] };

const tabs: FAQTab[] = [
  {
    key: "core",
    label: "Core",
    groups: [
      {
        title: "General",
        items: [
          { q: "Why should I study in Germany?", a: <>Germany offers internationally recognized degrees, affordable education, strong research opportunities, and excellent career prospects.</> },
          { q: "Is studying in Germany free?", a: <>Most public universities charge no tuition fees, but students must pay a semester contribution and cover living expenses.</> },
          { q: "Can I study in English?", a: <>Yes. Many Bachelor's and especially Master's programs are taught entirely in English.</> },
          { q: "Do I need German?", a: <>Not for English-taught programs, but basic German helps with daily life, internships, and part-time jobs.</> },
          { q: "Do I need an APS Certificate?", a: <>Indian applicants generally require an APS Certificate before applying for a student visa and for many university applications.</> },
          { q: "Can I work while studying?", a: <>Yes. International students may work according to current German immigration regulations.</> },
          { q: "How long does the complete process take?", a: <>Typically <strong>8–12 months</strong> from preparation to departure.</> },
          { q: "Can I stay in Germany after graduation?", a: <>Yes. Graduates can apply for a post-study residence permit to look for qualified employment.</> },
        ],
      },
      {
        title: "Intake & Academic Calendar",
        items: [
          {
            q: "Which intakes are available?",
            a: (
              <div className="space-y-3">
                <p>Germany mainly has <strong>two intakes</strong>:</p>
                <div>
                  <p className="font-semibold text-foreground">Winter Intake (Main Intake)</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Applications usually open: <strong>April–May</strong></li>
                    <li>Deadlines: <strong>15 July</strong> (many public universities)</li>
                    <li>Private universities may accept applications until <strong>August or September</strong></li>
                    <li>Classes usually begin: <strong>September or October</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Summer Intake</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Applications usually open: <strong>October–November</strong></li>
                    <li>Deadlines: <strong>15 January</strong> (many public universities)</li>
                    <li>Private universities may accept applications until <strong>February</strong></li>
                    <li>Classes usually begin: <strong>March or April</strong></li>
                  </ul>
                </div>
                <p className="text-xs italic">Exact dates vary by university — always check the official website.</p>
              </div>
            ),
          },
          {
            q: "Which intake is better?",
            a: (
              <div className="space-y-2">
                <p>Winter Intake offers more courses, more universities, more scholarships, and better accommodation options.</p>
                <p>Summer Intake is suitable if you miss Winter deadlines or your preferred course is available then.</p>
              </div>
            ),
          },
          {
            q: "When should I start preparing?",
            a: (
              <div className="space-y-2">
                <p>Start <strong>8–12 months</strong> before your intended intake.</p>
                <p className="text-sm">Example for Winter:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>August–December: Research & profile evaluation</li>
                  <li>January–March: Language tests & APS</li>
                  <li>March–June: Applications</li>
                  <li>June–September: Admission, visa & accommodation</li>
                  <li>September/October: Fly to Germany</li>
                </ul>
              </div>
            ),
          },
        ],
      },
    ],
  },
  {
    key: "bachelors",
    label: "Bachelor's",
    groups: [
      {
        items: [
          { q: "Can I study after Class 12?", a: <>Yes. Depending on your qualifications, you may be eligible for direct admission or need Studienkolleg.</> },
          { q: "What is Studienkolleg?", a: <>A preparatory course for students whose school education does not directly qualify them for German universities.</> },
          { q: "Is IELTS mandatory?", a: <>Not always. Requirements vary by university.</> },
          { q: "Which documents are required?", a: <>Academic records, passport, CV, language certificate, APS (for Indian applicants), and any program-specific documents.</> },
          { q: "Can I apply with pending results?", a: <>Many universities accept provisional applications.</> },
          { q: "How many universities should I apply to?", a: <>Around <strong>5–10 applications</strong> is common.</> },
          { q: "Can I work during my Bachelor's?", a: <>Yes, subject to immigration regulations.</> },
          { q: "What can I do after graduation?", a: <>Continue with a Master's, start working, or apply for a post-study residence permit if eligible.</> },
        ],
      },
    ],
  },
  {
    key: "masters",
    label: "Master's",
    groups: [
      {
        items: [
          { q: "Can I apply with any Bachelor's degree?", a: <>Usually your Bachelor's should be closely related to the Master's program.</> },
          { q: "Is work experience required?", a: <>Usually no, except for some specialized programs such as certain MBAs.</> },
          { q: "Is IELTS mandatory?", a: <>It depends on the university.</> },
          { q: "What is an SOP?", a: <>A Statement of Purpose explaining your background, goals, and motivation.</> },
          { q: "Can I apply during my final semester?", a: <>Yes. Many universities accept provisional transcripts.</> },
          { q: "Which documents are required?", a: <>Transcripts, degree/provisional certificate, CV, SOP, language certificate, APS (for Indian applicants), and any required recommendation letters.</> },
          { q: "Can I work while studying?", a: <>Yes, subject to immigration regulations.</> },
          { q: "Can I stay and work after graduation?", a: <>Yes. Germany offers a post-study residence permit for eligible graduates.</> },
        ],
      },
    ],
  },
];

export default function LandingFAQ() {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);
  const current = tabs.find((t) => t.key === activeTab)!;

  return (
    <section id="faq" className="py-16 bg-pg-bg2 text-pg-label">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-pg-label">Germany Study FAQ</h2>
          <p className="text-pg-label2 mt-2">Everything you need to know — grouped by what you're applying for.</p>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-6 inline-flex w-full sm:w-auto justify-center rounded-full border border-pg-sep bg-pg-bg p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setOpen(null); }}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-full transition ${
                activeTab === t.key
                  ? 'bg-pg-label text-pg-bg shadow-sm'
                  : 'text-pg-label2 hover:text-pg-label'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {current.groups.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <h3 className="text-lg font-semibold mb-3 text-pg-label">{group.title}</h3>
              )}
              <div className="space-y-2">
                {group.items.map((item, ii) => {
                  const key = `${current.key}-${gi}-${ii}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="rounded-[14px] border border-pg-sep bg-pg-bg overflow-hidden">
                      <button
                        className="w-full flex justify-between items-center px-4 py-3 text-left font-medium text-pg-label hover:bg-pg-bg2 transition"
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                      >
                        <span className="pr-3 text-sm">{item.q}</span>
                        <span className={`ml-auto text-pg-label3 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-pg-label2 text-sm leading-relaxed border-t border-pg-sep pt-3">
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
