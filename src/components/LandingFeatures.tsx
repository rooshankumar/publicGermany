import React from "react";

const features = [
  {
    icon: "📑",
    title: "Document Uploads",
    desc: "Upload & manage APS, passport, CV, LOM."
  },
  {
    icon: "✅",
    title: "Personalized Checklist",
    desc: "Track tasks step by step."
  },
  {
    icon: "🎯",
    title: "Deadline Reminders",
    desc: "Never miss an enrollment date."
  },
  {
    icon: "🤝",
    title: "Guidance & Resources",
    desc: "Links to APS, embassy, universities."
  }
];

export default function LandingFeatures() {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-accent/30 rounded-lg p-6 flex flex-col items-center text-center shadow-sm">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
