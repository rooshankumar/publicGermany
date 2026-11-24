import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RefundPolicy: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="german-stripe w-full" />
    <main className="max-w-3xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
        <Link to="/"><ArrowLeft className="h-4 w-4" />Back to home</Link>
      </Button>
      <h1 className="text-3xl font-bold">Refund and Cancellation Policy</h1>
      <p className="mt-2 mb-8 text-muted-foreground">Effective Date: November 2026</p>

      <p className="mb-6">
        Public Germany is operated by <strong>ROSHN GLOBAL</strong>, a sole proprietorship registered in Patna, Bihar, India
        (Udyam Registration Number: <strong>UDYAM-BR-26-0260208</strong>). This policy applies to paid educational support services purchased through our website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cancellation requests</h2>
      <p className="mb-6">
        If you want to cancel, contact us as soon as possible at{' '}
        <a className="text-primary hover:underline" href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a>{' '}
        with your name, the service purchased, and the payment or order reference. Requests made before personalized consultation or customized work begins may be eligible for cancellation and a refund. We will confirm the outcome by email.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Refund eligibility</h2>
      <ul className="list-disc pl-6 space-y-3 mb-6">
        <li>Fees are generally non-refundable after personalized consultation or customized work has begun, subject to applicable law.</li>
        <li>If we are unable to deliver the service you purchased, contact us so we can review the request and any appropriate refund.</li>
        <li>Approved refunds are processed to the original payment method within 5–7 business days. Your bank or payment provider may take additional time to show the funds.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="mb-6">
        For a cancellation or refund request, email{' '}
        <a className="text-primary hover:underline" href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a>.
        Public Germany is operated by ROSHN GLOBAL in Patna, Bihar, India.
      </p>

      <p className="mb-6">
        See also our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </main>
  </div>
);

export default RefundPolicy;