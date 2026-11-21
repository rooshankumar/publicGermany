import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms: React.FC = () => {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Updated: November 2026</p>

        <p className="mb-6">
          Public Germany is the trade name of <strong>ROSHN GLOBAL</strong>, a sole proprietorship registered in Patna, Bihar, India
          (Udyam Registration Number: <strong>UDYAM-BR-26-0260208</strong>). By accessing or using
          <a className="text-primary hover:underline ml-1" href="https://publicgermany.vercel.app" target="_blank" rel="noreferrer">https://publicgermany.vercel.app</a>
          {" "}("Service"), you agree to these Terms of Service ("Terms").
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Use of Service</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>You must be at least 18 years old to use the Service or have consent from a guardian.</li>
          <li>Use the platform lawfully and do not abuse or disrupt services.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Services Provided</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>publicgermany offers free access to checklists, guidance resources, document management, and progress tracking.</li>
          <li>Paid educational support may include university admission guidance, application assistance, student visa documentation support, Statement of Purpose preparation, and related services for higher education in Germany.</li>
          <li>Personalized counseling and document review services are available for a fee.</li>
          <li>We reserve the right to modify or discontinue parts of the service at any time.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Digital Service Delivery</h2>
        <p className="mb-6">
          Services are delivered digitally through access to the website portal, email, and/or scheduled video sessions, depending on the service purchased. Any service-specific scope and timing will be shared during the request or purchase process.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Payment and Refunds</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>Fees for personalized services are clearly stated. Payments are processed securely.</li>
          <li>Cancellation and refund terms are described in our <Link to="/refund-policy" className="text-primary hover:underline">Refund and Cancellation Policy</Link>. Fees are generally non-refundable after personalized consultation or customized work has begun, subject to that policy and applicable law.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>All content, logos, and software on publicgermany are proprietary and protected.</li>
          <li>You may not copy, reproduce, or distribute our materials without our permission.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Disclaimer and Limitation of Liability</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>publicgermany provides guidance but does not guarantee university admissions or visa approvals.</li>
          <li>Use the information at your own risk. We are not liable for indirect damages or losses arising from service use.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Termination</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>We may suspend or terminate accounts that violate terms or misuse the Service. Users may also terminate their accounts at any time.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Governing Law</h2>
        <p className="mb-6">These Terms are governed by the laws of India. Subject to applicable law, courts located in Patna, Bihar, India shall have jurisdiction over disputes arising from these Terms or the Service.</p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Changes to Terms</h2>
        <p className="mb-6">We reserve the right to update these Terms. Changes will be posted on this page with an updated effective date.</p>

        <h2 className="text-2xl font-semibold mt-10 mb-3">Contact</h2>
        <p className="mb-6">
          For any questions regarding these Terms, email
          <a className="text-primary hover:underline ml-1" href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a>.
          {
        </p>
      </div>
    </div>
  );
};

export default Terms;
