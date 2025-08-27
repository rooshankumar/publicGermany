import React from "react";

const steps = [
  {
    icon: "1️⃣",
    title: "Sign up & create your profile."
  },
  {
    icon: "2️⃣",
    title: "Upload documents securely."
  },
  {
    icon: "3️⃣",
    title: "Get your checklist & track deadlines."
  }
];

export default function LandingHowItWorks() {
  return (
    <section className="py-12 bg-accent/10">
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center max-w-xs">
              <div className="text-4xl mb-2">{step.icon}</div>
              <div className="font-semibold text-lg mb-1">{step.title}</div>
              {i < steps.length - 1 && <div className="h-8 w-1 bg-muted-foreground/20 my-2 md:hidden" />} {/* mobile stepper */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
