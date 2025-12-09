import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "./sendEmail";
import { generatePaymentBillEmailHTML, PaymentBillData } from "./paymentBillTemplate";

export interface PaymentEmailData {
  serviceId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  serviceType: string;
  serviceName?: string;
  serviceDescription?: string;
  serviceAmount: number;
  totalAmount: number;
  amountReceived: number;
  amountPending: number;
  paymentStatus: 'pending' | 'received' | 'cancelled' | 'partial';
  paymentMethod?: string;
  contractReference?: string;
  currency?: string;
  includeAdmin?: boolean;
}

/**
 * Generate and send payment bill email to student
 */
export async function sendPaymentBillEmail(data: PaymentEmailData) {
  const {
    serviceId,
    userId,
    studentName,
    studentEmail,
    studentPhone,
    serviceType,
    serviceName = serviceType.split('_').join(' '),
    serviceDescription = 'Study abroad service',
    serviceAmount,
    totalAmount,
    amountReceived,
    amountPending,
    paymentStatus,
    paymentMethod = 'UPI',
    contractReference = `REF-${serviceId.slice(0, 8).toUpperCase()}`,
    currency = 'INR',
    includeAdmin = true
  } = data;

  try {
    // Generate bill number based on serviceId and date
    const billNumber = `BILL-${new Date().getFullYear()}-${serviceId.slice(0, 8).toUpperCase()}`;
    const billDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const lastPaymentDate = amountReceived > 0 ? billDate : 'Not yet paid';

    // Fetch payment history
    const { data: paymentRows } = await supabase
      .from('service_payments')
      .select('amount, status, created_at')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });

    const payments = (paymentRows || [])
      .filter((p: any) => (p.status || '').toLowerCase() === 'received')
      .map((p: any, idx: number) => ({
        sequence: idx + 1,
        date: new Date(p.created_at).toLocaleDateString('en-IN'),
        amount: p.amount,
        note: 'Received'
      }));

    // Create bill data
    const billData: PaymentBillData = {
      studentName,
      studentEmail,
      studentPhone,
      billNumber,
      billDate,
      contractReference,
      paymentMethod,
      lastPaymentDate,
      serviceName,
      serviceDescription,
      serviceAmount,
      totalAmount,
      amountReceived,
      amountPending,
      paymentStatus,
      payments,
      currency
    };

    // Generate email HTML
    const emailHTML = generatePaymentBillEmailHTML(billData);

    // Send email to student
    await sendEmail(
      studentEmail,
      `Payment Bill - ${billNumber} (${paymentStatus.toUpperCase()})`,
      emailHTML
    );

    // Send admin notification
    if (includeAdmin) {
      const adminNotificationHTML = `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #1e3a8a; margin-bottom: 16px;">Payment Bill Email Sent</h2>
          <p>A payment bill email was sent to the student with the following details:</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${studentEmail}</p>
            <p style="margin: 0 0 8px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Bill Number:</strong> ${billNumber}</p>
            <p style="margin: 0 0 8px 0;"><strong>Total Amount:</strong> ${currency} ${totalAmount.toLocaleString()}</p>
            <p style="margin: 0 0 8px 0;"><strong>Amount Received:</strong> ${currency} ${amountReceived.toLocaleString()}</p>
            <p style="margin: 0;"><strong>Status:</strong> ${paymentStatus.toUpperCase()}</p>
          </div>
          
          <p style="color: #666; font-size: 13px; margin-top: 16px;">
            <strong>Request ID:</strong> ${serviceId}<br>
            <strong>Date/Time:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      await sendEmail(
        'publicgermany@outlook.com',
        `[Admin] Payment bill sent to ${studentName} - ${billNumber}`,
        adminNotificationHTML
      );
    }

    return {
      success: true,
      billNumber,
      message: `Payment bill sent successfully to ${studentEmail}`
    };
  } catch (error) {
    console.error('Error sending payment bill email:', error);
    throw error;
  }
}

/**
 * Generate printable payment bill HTML (for download/print)
 */
export async function generatePaymentBillPDF(
  serviceId: string,
  studentName: string,
  studentEmail: string,
  studentPhone: string,
  serviceType: string,
  serviceName?: string,
  serviceDescription?: string,
  serviceAmount?: number,
  totalAmount?: number,
  amountReceived?: number,
  amountPending?: number,
  currency?: string
) {
  const { generatePaymentBillHTML } = await import('./paymentBillTemplate');

  const billNumber = `BILL-${new Date().getFullYear()}-${serviceId.slice(0, 8).toUpperCase()}`;
  const billDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const lastPaymentDate = (amountReceived || 0) > 0 ? billDate : 'Not yet paid';

  // Fetch payment history
  const { data: paymentRows } = await supabase
    .from('service_payments')
    .select('amount, status, created_at')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: true });

  const payments = (paymentRows || [])
    .filter((p: any) => (p.status || '').toLowerCase() === 'received')
    .map((p: any, idx: number) => ({
      sequence: idx + 1,
      date: new Date(p.created_at).toLocaleDateString('en-IN'),
      amount: p.amount,
      note: 'Payment Received'
    }));

  const billData: PaymentBillData = {
    studentName,
    studentEmail,
    studentPhone,
    billNumber,
    billDate,
    contractReference: `REF-${serviceId.slice(0, 8).toUpperCase()}`,
    paymentMethod: 'UPI',
    lastPaymentDate,
    serviceName: serviceName || serviceType.split('_').join(' '),
    serviceDescription: serviceDescription || 'Study abroad service',
    serviceAmount: serviceAmount || 0,
    totalAmount: totalAmount || 0,
    amountReceived: amountReceived || 0,
    amountPending: amountPending || 0,
    paymentStatus: amountPending && amountPending > 0 
      ? (amountReceived && amountReceived > 0 ? 'partial' : 'pending')
      : 'received',
    payments,
    currency: currency || 'INR'
  };

  return generatePaymentBillHTML(billData);
}
