import { format } from "date-fns";

export interface ContractData {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  servicePackage: string;
  serviceDescription?: string;
  serviceFee: string;
  paymentStructure?: string;
  startDate?: string;
  expectedEndDate?: string;
  contractReference?: string;
  contractDate?: string;
}

// Generate Contract Reference
export function generateContractReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PG-${year}-${random}`;
}

// Main Contract HTML Generator - Uses exact premium template
export function generateContractHTML(data: ContractData): string {
  const contractDate = format(new Date(), "MMMM d, yyyy");
  const contractRef = data.contractReference || generateContractReference();
  const studentPhone = data.studentPhone || '__________________';
  const serviceDescription = data.serviceDescription || 'As discussed';
  const paymentStructure = data.paymentStructure || 'As agreed';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>publicgermany - Freelancing Service Agreement</title>

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
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }

  .watermark {
    position: absolute;
    top: 45%; left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    opacity: 0.06;
    width: 300px;
    pointer-events: none;
  }

  .header { text-align: center; margin-bottom: 20px; }
  .header img { width: 90px; opacity: 0.85; margin-bottom: 5px; }

  .title {
    font-size: 26px; font-weight: bold;
    color: #1e3a8a; letter-spacing: 1px;
  }

  .subtitle {
    color: #555; font-size: 14px; margin-top: 4px;
  }

  .section-title {
    margin-top: 22px;
    font-size: 15px;
    font-weight: bold;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 4px;
  }

  .info-row {
    display: flex; margin: 6px 0;
  }

  .label {
    width: 200px;
    font-weight: 600;
    color: #374151;
  }

  .value { flex: 1; }

  .highlight {
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
  }

  .success-box {
    background: linear-gradient(90deg, #d1fae5, #a7f3d0);
    border-left: 4px solid #10b981;
    padding: 12px;
    border-radius: 4px;
    margin-top: 15px;
  }

  .signature-box { margin-top: 40px; text-align: center; }

  .signature-line {
    width: 260px;
    height: 30px;
    border-bottom: 1px solid #000;
    margin: 0 auto 6px;
  }

  .packages-table {
    width: 100%; border-collapse: collapse; margin-top: 12px;
  }

  .packages-table th {
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    color: #fff; padding: 12px; font-weight: 600;
  }

  .packages-table td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .packages-table tr:nth-child(even) td {
    background: #f9fafb;
  }

  .price { font-weight: bold; text-align: right; color: #059669; }

  .terms-list p {
    margin: 10px 0;
    padding-left: 20px;
    position: relative;
  }

  .terms-list p::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #1e3a8a;
    font-size: 16px;
  }

  .qr-section {
    padding: 20px;
    border-radius: 8px;
    margin-top: 25px;
    background: #f8fafc;
    text-align: center;
    border: 2px solid #e2e8f0;
  }

  .qr-section img {
    width: 130px;
    background: #fff;
    padding: 6px;
    border-radius: 6px;
    border: 2px solid #1e3a8a;
    margin-bottom: 8px;
  }

  .page-number {
    position: absolute;
    bottom: 10px;
    right: 20px;
    font-weight: 600;
    color: #1e3a8a;
  }
</style>
</head>

<body>

<!-- PAGE 1 -->
<div class="page">
  <img class="watermark" src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png">

  <div class="header">
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png">
    <div class="title">publicgermany</div>
    <div class="subtitle">Freelancing Service Agreement</div>
  </div>

  <div class="section-title">Client Declaration</div>

  <p style="font-size: 13px;">
    I, <span class="highlight">${data.studentName}</span>,
    hereby declare that all information provided to publicgermany is true, accurate and complete.
  </p>

  <div class="section-title">Contract Details</div>

  <div class="info-row"><div class="label">Contract Date:</div><div class="value"><span class="highlight">${contractDate}</span></div></div>
  <div class="info-row"><div class="label">Contract Reference:</div><div class="value"><span class="highlight">${contractRef}</span></div></div>

  <div class="section-title">Parties</div>

  <div class="info-row">
    <div class="label">Client (Student):</div>
    <div class="value"><strong>${data.studentName}</strong><br>${data.studentEmail} | ${studentPhone}</div>
  </div>

  <div class="info-row">
    <div class="label">Freelancer:</div>
    <div class="value"><strong>publicgermany</strong><br>publicgermany@outlook.com</div>
  </div>

  <div class="section-title">Service Specifications</div>

  <div class="info-row"><div class="label">Package Selected:</div><div class="value"><strong>${data.servicePackage}</strong></div></div>
  <div class="info-row"><div class="label">Description:</div><div class="value">${serviceDescription}</div></div>
  <div class="info-row"><div class="label">Total Fee:</div><div class="value"><span class="highlight">${data.serviceFee}</span></div></div>
  <div class="info-row"><div class="label">Payment Terms:</div><div class="value">${paymentStructure}</div></div>

  <div class="success-box">
    <strong>Service Confirmation: </strong>
    Client engages publicgermany for specialized Germany study-abroad guidance.
  </div>

  <div class="signature-box">
    <div style="margin-bottom: 10px;">Client Acknowledgment & Acceptance</div>
    <div class="signature-line"></div>
    Digital Signature / Full Name<br>
    <span>Date: ${contractDate}</span>
  </div>

  <p style="text-align:center; margin-top:15px; font-size:11px;">
    ✓ Legally binding upon digital acceptance.
  </p>

  <div class="page-number">Page 1 of 2</div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <img class="watermark" src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png">

  <div class="header">
    <div class="title">publicgermany</div>
    <div class="subtitle">Service Packages & Terms</div>
  </div>

  <div class="section-title">Service Packages</div>

  <table class="packages-table">
    <thead>
      <tr>
        <th>Service Package</th>
        <th>Key Deliverables</th>
        <th style="text-align:right;">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>General Profile Evaluation</td><td>Quick profile review + next steps</td><td class="price">₹1,000</td></tr>
      <tr><td>APS Assistance</td><td>APS help + tracking</td><td class="price">₹2,000</td></tr>
      <tr><td>SOP (1st Draft)</td><td>Statement of Purpose draft + revisions</td><td class="price">₹2,500</td></tr>
      <tr><td>SOP (Additional)</td><td>Extra SOP for new program/university</td><td class="price">₹2,000</td></tr>
      <tr><td>CV Preparation</td><td>German-format CV + 2 revisions</td><td class="price">₹3,000</td></tr>
      <tr><td>LOR Samples</td><td>Customizable templates + guidance</td><td class="price">₹3,000</td></tr>
      <tr><td>University Shortlisting</td><td>10+ universities based on your profile</td><td class="price">₹5,000</td></tr>
      <tr><td>Visa SOP</td><td>Visa-specific motivation letter</td><td class="price">₹5,000</td></tr>
      <tr><td>Visa Application Only</td><td>CSP + documentation + VFS support</td><td class="price">₹10,000</td></tr>
      <tr><td>Admission Package</td><td>Full support till admission (SOP, LOR, CV, shortlisting)</td><td class="price">₹25,000 – ₹30,000</td></tr>
      <tr><td>Visa Package</td><td>Admission + complete visa processing</td><td class="price">₹40,000</td></tr>
    </tbody>
  </table>

  <div class="section-title">Key Terms & Conditions</div>

  <div class="terms-list">
    <p><strong>Scope:</strong> All work handled by an experienced freelancer.</p>
    <p><strong>No Guarantees:</strong> No assurance of APS, admission, visa approval, or scholarships.</p>
    <p><strong>Client Obligations:</strong> Provide documents within 48 hours and attend scheduled calls.</p>
    <p><strong>Refund Policy:</strong> Refund only if no work is started. No refund after delivery.</p>
    <p><strong>Confidentiality:</strong> All client data is secure and never shared without consent.</p>
    <p><strong>Liability:</strong> Limited strictly to fee paid.</p>
  </div>

  <div class="section-title">Verification & Referral</div>

  <p><strong>Identity Verification:</strong> Please attach a passport copy for KYC.</p>

  <p>
    <strong>Referral Bonus:</strong>
    Use referral code <span class="highlight">${contractRef}</span>
    to receive 10% off when someone you refer purchases a service.
  </p>

  <div class="qr-section">
    <p><strong>Scan to Visit publicgermany</strong></p>
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/frame.png">
    <br>
    <strong>publicgermany.vercel.app</strong>
  </div>

  <div style="text-align:center; margin-top:20px; font-size:11px; color:#6b7280;">
    publicgermany@outlook.com | Independent Freelancer | Serving 50+ Students
  </div>

  <div class="page-number">Page 2 of 2</div>
</div>

</body>
</html>`;
}

// Validate essential fields
export function validateContractData(data: Partial<ContractData>) {
  if (!data.servicePackage?.trim() || !data.serviceFee?.trim()) {
    return { valid: false, error: "Please enter service package and fee to generate contract." };
  }
  return { valid: true };
}

// Download contract as PDF - opens in new window for print to PDF
export function downloadContractPDF(html: string, filename: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow popups to download the PDF. Then use Ctrl+P or Cmd+P and select "Save as PDF".');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = filename.replace('.pdf', '');

  // Wait for images to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 1000);
}
