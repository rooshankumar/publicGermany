import React from "react";

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective Date: September 2025</p>

        <p className="mb-6">
          At <strong>publicgermany</strong> ("we", "our", "us"), your privacy is a priority. This Privacy Policy explains how we
          collect, use, protect, and disclose your personal information when you use our website and app available at
          <a className="text-primary hover:underline ml-1" href="https://publicgermany.vercel.app" target="_blank" rel="noreferrer">https://publicgermany.vercel.app</a>.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Personal Information:</strong> When you create a profile, use our services, or communicate with us, we collect
            details such as your name, email, academic background, documents you upload (SOP, CV, LOR), and payment information if you
            purchase personalized help.
          </li>
          <li>
            <strong>Usage Data:</strong> We collect data on how you use our platform, including pages visited, session times, IP address,
            and device info through cookies and analytics to improve your experience.
          </li>
          <li>
            <strong>Communications:</strong> Emails, messages, or support requests you send us are stored for service improvement and support.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>To provide and personalize our services, including APS certification guidance, university recommendations, and visa support.</li>
          <li>To communicate with you, including sending important updates, service-related communications, and marketing newsletters if you opt-in.</li>
          <li>To improve and optimize our platform functionality and security.</li>
          <li>To comply with legal requirements and protect rights.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Data Sharing and Disclosure</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>Your data is shared only with trusted partners involved in delivering services (e.g., education consultants) under strict confidentiality.</li>
          <li>We do not sell or rent your personal data to third parties.</li>
          <li>We may disclose data to comply with laws or protect rights if legally required.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Your Rights and Choices</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>You may access, correct, or delete your personal data by contacting us.</li>
          <li>You can opt-out of marketing communications anytime.</li>
          <li>Cookie preferences can be managed via your browser or our platform settings.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Data Security</h2>
        <p className="mb-6">
          We implement industry-standard security measures including encryption, secure servers, and restricted data access to protect your information.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">International Data Transfers</h2>
        <p className="mb-6">
          Your data may be processed and stored in servers located in Germany or other countries with adequate data protection laws.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Changes to This Policy</h2>
        <p className="mb-6">
          We may update this policy periodically. Changes will be posted on this page with an updated effective date.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Contact Us</h2>
        <p className="mb-6">
          For privacy questions, contact us at
          <a className="text-primary hover:underline ml-1" href="mailto:roshlingua@gmail.com">roshlingua@gmail.com</a>.
        </p>
      </div>
    </div>
  );
};

export default Privacy;
