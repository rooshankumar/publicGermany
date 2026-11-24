import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back to Home */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective Date: November 2026</p>

        <p className="mb-6">
          Public Germany is the trade name of <strong>ROSHN GLOBAL</strong>, a sole proprietorship registered in Patna, Bihar, India
          (Udyam Registration Number: <strong>UDYAM-BR-26-0260208</strong>). In this notice, “we” means ROSHN GLOBAL. It explains how we
          handle personal information when you use our website and services at
          <a className="text-primary hover:underline ml-1" href="https://publicgermany.vercel.app" target="_blank" rel="noreferrer">https://publicgermany.vercel.app</a>.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Account and study information:</strong> Name, email address, profile and academic details, application and shortlist information, documents you upload, and service requests.
          </li>
          <li>
            <strong>Messages and transactions:</strong> The details you submit through our contact form or send to us, plus payment amount, status, and reference information needed to administer a service. Do not send card details, passwords, or UPI PINs through messages.
          </li>
          <li>
            <strong>Browser storage:</strong> The site uses browser storage for account/session state, theme and interface preferences, and temporary site notices. A functional cookie may remember the navigation panel setting.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>To operate accounts, provide study guidance and requested services, and manage applications, documents, and service requests.</li>
          <li>To respond to questions and send service, account, and deadline-related messages.</li>
          <li>To maintain platform security, troubleshoot issues, and understand site performance.</li>
          <li>To meet legal, accounting, and dispute-resolution obligations.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Service Providers and Sharing</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Supabase:</strong> Receives and stores account, profile, application, service-request, and uploaded-file data to provide sign-in and app features.</li>
          <li><strong>EmailJS:</strong> Processes the name, email address, inquiry type, and message submitted through the contact form so the message and confirmation can be sent. The contact submission is also stored in Supabase.</li>
          <li><strong>Brevo:</strong> Processes recipient email addresses and message content to deliver service and account emails.</li>
          <li><strong>Vercel Analytics:</strong> Receives page-view and performance information to provide website analytics.</li>
          <li><strong>Lovable analytics:</strong> Receives the visitor measurements described below. Lovable collects this data for us. <a className="text-primary hover:underline" href="https://lovable.dev/privacy" target="_blank" rel="noreferrer">Lovable's privacy policy</a> explains how it handles it.</li>
          <li>Some course content may be embedded from YouTube or Google Drive. When you open an embedded video or document, those providers receive information from your browser under their own privacy notices.</li>
          <li>We do not sell personal information. We may share information with service providers needed to operate the site, people helping deliver a service, or authorities when legally required.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Visitor Analytics</h2>
        <p className="mb-6">
          Click tracking is enabled, so clicks on buttons and links are recorded for every visitor. The app does not send custom analytics events. Page visits, referral source, country, browser, operating system, device type, time on page, page speed, and errors are also recorded for every visitor. Lovable analytics uses no cookies, stores nothing on your device, does not keep IP addresses, and does not identify visitors. Detailed data is kept for 90 days and daily summaries for one year. There is no consent banner connected to this analytics. Vercel Analytics separately receives page-view and performance information to provide website analytics.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Your Choices and Requests</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>You may ask us to access, correct, or delete personal information by contacting us. We may need to retain some records where required by law or for legitimate service and accounting purposes.</li>
          <li>You can manage browser storage through your browser settings; blocking essential storage may affect sign-in or site preferences.</li>
          <li>Privacy rules differ by country; please check with someone familiar with the rules where your visitors are located.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Data Security</h2>
        <p className="mb-6">
          We use access controls and security measures intended to protect information. No online service can guarantee absolute security.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">International Data Transfers</h2>
        <p className="mb-6">
          Our service providers may process information in countries other than India. Their own privacy and security terms also apply to the services they provide.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Changes to This Policy</h2>
        <p className="mb-6">
          We may update this policy periodically. Changes will be posted on this page with an updated effective date.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Contact Us</h2>
        <p className="mb-6">
          For privacy questions, contact ROSHN GLOBAL at
          <a className="text-primary hover:underline ml-1" href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a>.
        </p>
      </div>
    </div>
  );
};

export default Privacy;
