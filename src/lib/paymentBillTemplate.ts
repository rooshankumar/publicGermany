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
    billNumber,
    billDate,
    contractReference,
    serviceName,
    serviceDescription,
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
    ? `<br/><strong>Payment History:</strong><br/>` +
      payments.map((p) => `• Payment ${p.sequence}: ${currency} ${p.amount.toLocaleString()} on ${p.date} (${p.note})`).join('<br/>')
    : '';

  const content = [
    `<strong>${statusEmoji} ${paymentStatus.toUpperCase()} - Bill #${billNumber}</strong><br/><br/>`,
    `<strong>Bill Date:</strong> ${billDate}<br/>`,
    `<strong>Reference:</strong> ${contractReference}<br/><br/>`,
    `<strong>Service:</strong> ${serviceName}<br/>`,
    serviceDescription ? `${serviceDescription}<br/><br/>` : '<br/>',
    `<strong>Total Amount:</strong> ${currency} ${totalAmount.toLocaleString()}<br/>`,
    `<strong>Amount Received:</strong> ${currency} ${amountReceived.toLocaleString()}<br/>`,
    `<strong>Amount Pending:</strong> ${currency} ${amountPending.toLocaleString()}`,
    paymentHistoryHTML
  ].join('');

  // Import and use the unified template
  const APP_URL = 'https://publicgermany.vercel.app';
  const greeting = `Hi ${studentName},`;
  const signOff = 'Best regards,<br>publicGermany Team';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>publicGermany</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 16px; font-size:14px; line-height:1.6; color:#000000;">
      ${greeting}<br><br>
      ${content}
      <br><br>
      ${signOff}
    </td>
  </tr>
  <tr>
    <td style="padding:10px 16px; text-align:center; font-size:12px; color:#374151;">
      <em>
        Refer your friends and get <strong>₹1,000 instant cashback</strong> once they enroll.
      </em>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 16px; text-align:center; font-size:12px; color:#111827;">
      <a href="${APP_URL}" style="font-weight:bold; color:#111827; text-decoration:none;">
        publicGermany
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
