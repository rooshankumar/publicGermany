/**
 * Payment Bill HTML Template Generator
 * Generates professional payment bills in HTML format
 */

export interface PaymentBillData {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  billNumber: string;
  billDate: string;
  contractReference: string;
  paymentMethod: string;
  lastPaymentDate: string;
  serviceName: string;
  serviceDescription: string;
  serviceAmount: number;
  totalAmount: number;
  amountReceived: number;
  amountPending: number;
  paymentStatus: 'pending' | 'received' | 'cancelled' | 'partial';
  payments?: Array<{
    sequence: number;
    date: string;
    amount: number;
    note: string;
  }>;
  currency?: string;
}

export function generatePaymentBillHTML(data: PaymentBillData): string {
  const {
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
    payments = [],
    currency = 'INR'
  } = data;

  // Status pill color and text
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    received: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    partial: { bg: '#fce7f3', text: '#831843', border: '#f472b6' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
  };

  const statusColor = statusColors[paymentStatus] || statusColors.pending;

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Generate payment rows HTML
  const paymentRowsHTML = payments.map((p) => `
    <tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Payment ${p.sequence}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Received on ${p.date} (${p.note})</td>
      <td style="text-align: right; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${currency} ${p.amount.toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>publicgermany - Payment Bill</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400&display=swap">
<style>
  @page { size: A4; margin: 15mm; }
  @media print { body { -webkit-print-color-adjust: exact; } }

  body {
    font-family: "Segoe UI", Arial, sans-serif;
    margin: 0; padding: 0;
    font-size: 12px; color: #222;
    background: #fff;
  }

  .page {
    padding: 25px 20px;
    min-height: 100vh;
    position: relative;
  }

  .watermark {
    position: absolute;
    top: 45%; left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    opacity: 0.06;
    width: 300px;
    pointer-events: none;
  }

  .header {
    text-align: center;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header img {
    width: 80px;
    opacity: 0.9;
    margin-bottom: 4px;
    display: block;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    color: #1e3a8a;
    letter-spacing: 1px;
  }

  .subtitle {
    color: #555; font-size: 14px; margin-top: 4px;
  }

  .bill-tag {
    margin-top: 6px;
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    background: #e0f2fe;
    color: #1d4ed8;
    font-weight: 600;
    font-size: 11px;
  }

  .section-title {
    margin-top: 18px;
    font-size: 14px;
    font-weight: 700;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 4px;
  }

  .flex-row {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    gap: 30px;
  }

  .block-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    margin-bottom: 3px;
  }

  .block-value {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .bill-info-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 20px;
    margin-top: 10px;
  }

  .info-item-label {
    font-size: 11px;
    color: #6b7280;
  }

  .info-item-value {
    font-size: 13px;
    font-weight: 600;
  }

  .status-box {
    margin-top: 14px;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid;
    background: ${statusColor.bg};
    font-size: 12px;
    border-color: ${statusColor.border};
  }

  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    margin-right: 8px;
    color: ${statusColor.text};
    background: ${statusColor.bg};
    border: 1px solid ${statusColor.border};
  }

  .status-note {
    font-weight: 500;
    color: ${statusColor.text};
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 14px;
  }

  .items-table th {
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    color: #fff;
    padding: 8px 10px;
    font-weight: 600;
    font-size: 12px;
    text-align: left;
  }

  .items-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 12px;
  }

  .items-table tr:nth-child(even) td {
    background: #f9fafb;
  }

  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .totals-box {
    margin-top: 14px;
    max-width: 260px;
    margin-left: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    font-size: 12px;
  }

  .totals-row:nth-child(odd) {
    background: #f9fafb;
  }

  .totals-row.total {
    background: #111827;
    color: #f9fafb;
    font-weight: 700;
    font-size: 13px;
  }

  .footer-note {
    margin-top: 18px;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
  }

  .signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
  }

  .signature-block {
    text-align: center;
    width: 200px;
  }

  .digital-signature {
    font-family: "Kalam", "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: #1e3a8a;
    font-weight: 400;
    letter-spacing: 0.04em;
  }

  .page-number {
    position: absolute;
    bottom: 10px;
    right: 20px;
    font-weight: 600;
    color: #1e3a8a;
    font-size: 11px;
  }

  a {
    color: #1d4ed8;
    text-decoration: none;
  }
</style>
</head>
<body>

<div class="page">
  <img class="watermark" src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" alt="">

  <div class="header">
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" alt="publicgermany logo">
    <div class="title">publicgermany</div>
    <div class="subtitle">Payment Bill / Receipt</div>
    <div class="bill-tag">For Study Abroad Services</div>
  </div>

  <div class="section-title">Bill & Parties</div>

  <div class="flex-row">
    <div>
      <div class="block-label">Billed To</div>
      <div class="block-value">${studentName}</div>
      <div style="font-size:11px; color:#4b5563;">
        ${studentEmail}<br>
        ${studentPhone}
      </div>
    </div>
    <div style="text-align:right;">
      <div class="block-label">Issued By</div>
      <div class="block-value">publicgermany</div>
      <div style="font-size:11px; color:#4b5563;">
        <a href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a><br>
        <a href="https://publicgermany.vercel.app">publicgermany.vercel.app</a>
      </div>
    </div>
  </div>

  <div class="bill-info-grid">
    <div>
      <div class="info-item-label">Bill Number</div>
      <div class="info-item-value">${billNumber}</div>
    </div>
    <div>
      <div class="info-item-label">Bill Date</div>
      <div class="info-item-value">${billDate}</div>
    </div>
    <div>
      <div class="info-item-label">Reference / Contract</div>
      <div class="info-item-value">${contractReference}</div>
    </div>
    <div>
      <div class="info-item-label">Payment Method</div>
      <div class="info-item-value">${paymentMethod}</div>
    </div>
    <div>
      <div class="info-item-label">Last Payment Date</div>
      <div class="info-item-value">${lastPaymentDate}</div>
    </div>
    <div>
      <div class="info-item-label">Currency</div>
      <div class="info-item-value">${currency}</div>
    </div>
  </div>

  <div class="status-box">
    <span class="status-pill">${paymentStatus.toUpperCase()}</span>
    <span class="status-note">
      Total: ${currency} ${totalAmount.toLocaleString()} | Received: ${currency} ${amountReceived.toLocaleString()} | Pending: ${currency} ${amountPending.toLocaleString()}
    </span>
  </div>

  <div class="section-title">Service & Payment Details</div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40%;">Service</th>
        <th>Description</th>
        <th class="text-right" style="width:18%;">Amount (${currency})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${serviceName}</td>
        <td>${serviceDescription}</td>
        <td class="text-right">${currency} ${serviceAmount.toLocaleString()}</td>
      </tr>
      ${paymentRowsHTML}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row">
      <span>Total Amount</span>
      <span>${currency} ${totalAmount.toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Amount Received</span>
      <span>${currency} ${amountReceived.toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Amount Pending</span>
      <span>${currency} ${amountPending.toLocaleString()}</span>
    </div>
    <div class="totals-row total">
      <span>Balance Payable</span>
      <span>${currency} ${amountPending.toLocaleString()}</span>
    </div>
  </div>

  <div class="signature-row">
    <div class="signature-block">
      <div style="font-size:11px; margin-bottom:2px;">Client Signature</div>
      <div style="font-size:10px; color:#6b7280;">${studentName}</div>
    </div>
    <div class="signature-block">
      <div class="digital-signature">publicgermany</div>
      <div style="font-size:10px; color:#6b7280; margin-top:2px;">Authorized Signatory</div>
    </div>
  </div>

  <div class="footer-note">
    This is a computer-generated bill for services rendered by an independent freelancer.
    No tax invoice is issued unless specifically mentioned.
  </div>

  <div class="page-number">Page 1 of 1</div>
</div>

</body>
</html>`;
}

/**
 * Generate a simplified email version (non-printable)
 */
export function generatePaymentBillEmailHTML(data: PaymentBillData): string {
  const {
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
    payments = [],
    currency = 'INR'
  } = data;

  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    received: '✅',
    partial: '📊',
    cancelled: '❌'
  };

  const statusEmoji = statusEmojis[paymentStatus] || '📋';

  const paymentHistoryHTML = payments.length > 0
    ? `<div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:6px;padding:12px;">
         <p style="margin:0 0 8px 0;font-weight:600;color:#1e3a8a;">Payment History</p>
         <ul style="margin:0;padding-left:20px;color:#444;">
           ${payments.map((p) => `<li style="margin:4px 0;">Payment ${p.sequence}: ${currency} ${p.amount.toLocaleString()} on ${p.date} (${p.note})</li>`).join('')}
         </ul>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Bill - ${billNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0;">

<div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px; background: white; padding: 20px; border-radius: 8px; border-bottom: 4px solid #1e3a8a;">
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" alt="publicgermany" style="width: 60px; margin-bottom: 12px;">
    <h1 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 28px;">publicgermany</h1>
    <p style="margin: 0; color: #666; font-size: 14px;">Payment Bill / Receipt</p>
  </div>

  <!-- Main Content -->
  <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 16px;">
    
    <!-- Status -->
    <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: 600; color: #2e7d32;">
        ${statusEmoji} ${paymentStatus.toUpperCase()} - Bill #${billNumber}
      </p>
    </div>

    <!-- Student & Bill Info -->
    <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase;">Billed To</p>
          <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${studentName}</p>
          <p style="margin: 0; font-size: 12px; color: #666;">${studentEmail}<br>${studentPhone}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: uppercase;">Bill Information</p>
          <p style="margin: 0; font-size: 12px;"><strong>Bill Date:</strong> ${billDate}</p>
          <p style="margin: 0; font-size: 12px;"><strong>Reference:</strong> ${contractReference}</p>
        </div>
      </div>
    </div>

    <!-- Service Details -->
    <div style="margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">Service & Payment Details</p>
      <div style="background: #fafafa; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0;">
        <p style="margin: 0 0 4px 0; font-weight: 600;">${serviceName}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${serviceDescription}</p>
        <p style="margin: 0; font-size: 13px;"><strong>${currency} ${serviceAmount.toLocaleString()}</strong></p>
      </div>
    </div>

    <!-- Payment History (if any) -->
    ${paymentHistoryHTML}

    <!-- Totals -->
    <div style="margin-top: 20px; border-top: 2px solid #1e3a8a; padding-top: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #666;">Total Amount</span>
        <span style="font-weight: 600; font-size: 14px;">${currency} ${totalAmount.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #666;">Amount Received</span>
        <span style="font-weight: 600; font-size: 14px;">${currency} ${amountReceived.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; background: #1e3a8a; color: white; padding: 12px; border-radius: 4px; margin-top: 12px; font-weight: 600;">
        <span>Amount Pending</span>
        <span>${currency} ${amountPending.toLocaleString()}</span>
      </div>
    </div>

    <!-- Additional Info -->
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;"><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p style="margin: 0; font-size: 12px; color: #666;"><strong>Last Payment Date:</strong> ${lastPaymentDate}</p>
    </div>

  </div>

  <!-- Action Button -->
  <div style="text-align: center; margin-bottom: 16px;">
    <a href="https://publicgermany.vercel.app/" style="display: inline-block; padding: 12px 24px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Your Account</a>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 16px; color: #999; font-size: 11px; background: white; border-radius: 6px;">
    <p style="margin: 0 0 4px 0;">This is a computer-generated bill for services rendered by an independent freelancer.</p>
    <p style="margin: 0;">No tax invoice is issued unless specifically mentioned.</p>
    <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #eee;">publicgermany | <a href="https://publicgermany.vercel.app" style="color: #1d4ed8; text-decoration: none;">publicgermany.vercel.app</a></p>
  </div>

</div>

</body>
</html>`;
}
