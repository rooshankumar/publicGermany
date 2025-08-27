import React, { useState } from "react";

const faqs = [
  {
    q: "Is GermanyHelp free to use?",
    a: "Yes! GermanyHelp is free for students. We may add premium features in the future, but core features will remain free."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. Your documents are stored securely and only you can access them. We use industry-standard security practices."
  },
  {
    q: "Does GermanyHelp provide official APS or visa services?",
    a: "No. GermanyHelp is a productivity tool. For official information, always refer to APS and Embassy websites."
  }
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="py-12 bg-background">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border bg-accent/10">
              <button
                className="w-full flex justify-between items-center px-5 py-4 font-semibold text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-panel-${i}`}
              >
                <span>{faq.q}</span>
                <span className={`ml-2 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {openIndex === i && (
                <div
                  id={`faq-panel-${i}`}
                  className="px-5 pb-4 text-muted-foreground text-sm animate-fadeIn"
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
