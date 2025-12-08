import { format } from "date-fns";

export interface ContractData {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  intake?: string;
  intendedMasterCourse?: string;
  bachelorUniversity?: string;
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

// Main Contract HTML Generator - Uses exact user template
export function generateContractHTML(data: ContractData): string {
  const contractDate = format(new Date(), "MMMM d, yyyy");
  const contractRef = data.contractReference || generateContractReference();
  const studentPhone = data.studentPhone || '';
  const intake = data.intake || '';
  const intendedMasterCourse = data.intendedMasterCourse || '';
  const bachelorUniversity = data.bachelorUniversity || '';
  const serviceDescription = data.serviceDescription || 'As discussed';
  const paymentStructure = data.paymentStructure || 'As agreed';
  // Clean the fee - remove existing ₹ symbol if present
  const cleanFee = data.serviceFee.replace(/₹/g, '').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>publicgermany - Freelancing Service Agreement</title>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    color: #222;
    background: #fff;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    margin: 0;
    background: #fff;
    position: relative;
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    opacity: 0.05;
    width: 500px;
    pointer-events: none;
    z-index: 0;
  }

  .watermark img {
    width: 100%;
    opacity: 0.05;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 10;
  }

  .header img {
    width: 90px;
    height: auto;
    margin-bottom: 10px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .title {
    font-size: 24px;
    font-weight: bold;
    color: #1e3a8a;
    margin: 5px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
    margin: 5px 0 0 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 5px;
    margin-top: 15px;
    margin-bottom: 10px;
  }

  .info-row {
    display: flex;
    margin: 8px 0;
    position: relative;
    z-index: 10;
  }

  .label {
    width: 150px;
    font-weight: 600;
    color: #374151;
    flex-shrink: 0;
  }

  .value {
    flex: 1;
    word-break: break-word;
  }

  .highlight {
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    display: inline-block;
    max-width: 100%;
    white-space: normal;
    word-break: break-word;
  }

  .generated-date {
    position: absolute;
    top: 15mm;
    right: 15mm;
    font-size: 11px;
    color: #6b7280;
    z-index: 11;
  }

  .success-box {
    background: #d1fae5;
    border-left: 4px solid #10b981;
    padding: 12px;
    margin: 15px 0;
    border-radius: 4px;
    position: relative;
    z-index: 10;
  }

  .signature-box {
    text-align: center;
    margin-top: 30px;
    position: relative;
    z-index: 10;
  }

  .signature-line {
    width: 250px;
    height: 1px;
    border-bottom: 1px solid #000;
    margin: 20px auto 5px;
  }

  .packages-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    position: relative;
    z-index: 10;
  }

  .packages-table th {
    background: #1e3a8a;
    color: white;
    padding: 10px;
    text-align: left;
    font-weight: bold;
    font-size: 11px;
  }

  .packages-table td {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 11px;
  }

  .packages-table tr:nth-child(even) td {
    background: #f9fafb;
  }

  .price {
    font-weight: bold;
    text-align: right;
    color: #059669;
  }

  .terms-list {
    position: relative;
    z-index: 10;
  }

  .terms-list p {
    margin: 8px 0;
    padding-left: 18px;
    position: relative;
    font-size: 11px;
  }

  .terms-list p::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #1e3a8a;
    font-weight: bold;
  }

  .qr-section {
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    padding: 15px;
    text-align: center;
    margin-top: 20px;
    background: #f8fafc;
    position: relative;
    z-index: 10;
  }

  .qr-section img {
    width: 120px;
    height: auto;
    margin: 10px auto;
    border: 2px solid #1e3a8a;
    border-radius: 4px;
  }

  .page-number {
    position: absolute;
    bottom: 15mm;
    right: 15mm;
    font-weight: bold;
    color: #1e3a8a;
    font-size: 11px;
  }

  p {
    margin: 8px 0;
    line-height: 1.5;
  }

  strong {
    font-weight: 600;
  }

  br {
    display: block;
    content: "";
    margin: 2px 0;
  }
</style>
</head>

<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="generated-date">Generated on: ${contractDate}</div>
  <img class="watermark" src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" crossorigin="anonymous">

  <div class="header">
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" crossorigin="anonymous">
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
    <div class="value"><strong>${data.studentName}</strong><br>${data.studentEmail}${studentPhone ? ` | ${studentPhone}` : ''}</div>
  </div>

  <div class="info-row">
    <div class="label">Freelancer:</div>
    <div class="value"><strong>publicgermany</strong><br>publicgermany@outlook.com</div>
  </div>

  <div class="section-title">Service Specifications</div>

  <div class="info-row"><div class="label">Package Selected:</div><div class="value"><strong>${data.servicePackage}</strong></div></div>
  <div class="info-row"><div class="label">Description:</div><div class="value">${serviceDescription}</div></div>
  <div class="info-row"><div class="label">Total Fee:</div><div class="value"><span class="highlight">₹${cleanFee}</span></div></div>
  <div class="info-row"><div class="label">Payment Terms:</div><div class="value">${paymentStructure}</div></div>

  <div class="success-box">
    <strong>Service Confirmation: </strong>
    Client engages publicgermany for specialized Germany study-abroad guidance.
  </div>

  <!-- SIGNATURE (Physical Required) -->
  <div class="signature-box">
    <div style="margin-bottom: 10px;">Client Acknowledgment & Acceptance</div>
    <div class="signature-line"></div>
    Physical Signature Required<br>
    <span>Date: ______________________</span>
  </div>

  <!-- MOVED SECTION BELOW SIGNATURE -->
  <div class="section-title" style="margin-top:35px;">Verification & Referral</div>

  <p><strong>Identity Verification:</strong> Please attach a passport copy for KYC.</p>

  <p>
    <strong>Referral Bonus:</strong>
    Use referral code <span class="highlight">${contractRef}</span>
    to receive 10% off when someone you refer purchases a service.
  </p>

  <p style="text-align:center; margin-top:18px; font-size:11px; color:#6b7280;">
    This online version is valid and enforceable between the Client and Freelancer as per mutual agreement.
  </p>

  <div class="page-number">Page 1 of 2</div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <img class="watermark" src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png" crossorigin="anonymous">

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

  <div class="qr-section">
    <p><strong>Scan to Visit publicgermany</strong></p>
    <img src="https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/frame.png" crossorigin="anonymous">
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

// Download contract as PDF using html2canvas and jsPDF
export async function downloadContractPDF(html: string, filename: string): Promise<void> {
  try {
    console.log('Starting PDF generation:', filename);
    
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Create container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '-10000px';
    container.style.width = '210mm';
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.backgroundColor = '#fff';

    document.body.appendChild(container);
    console.log('Container added to DOM');

    // Wait for DOM to settle
    await new Promise(r => setTimeout(r, 1000));

    // Wait for images to load
    const images = container.querySelectorAll('img');
    console.log('Found images:', images.length);

    const imagePromises = Array.from(images).map((img: any, idx: number) => {
      return new Promise<void>(resolve => {
        if (img.complete) {
          console.log(`Image ${idx} already loaded`);
          resolve();
        } else {
          const timeout = setTimeout(() => {
            console.warn(`Image ${idx} timeout`);
            resolve();
          }, 5000);

          const onLoad = () => {
            clearTimeout(timeout);
            console.log(`Image ${idx} loaded`);
            resolve();
          };

          const onError = () => {
            clearTimeout(timeout);
            console.warn(`Image ${idx} failed to load`);
            resolve();
          };

          img.onload = onLoad;
          img.onerror = onError;
        }
      });
    });

    await Promise.all(imagePromises);
    console.log('All images processed');

    // Wait for final rendering
    await new Promise(r => setTimeout(r, 500));

    // Get all pages
    const pages = container.querySelectorAll('.page');
    console.log('Found pages:', pages.length);

    if (pages.length === 0) {
      throw new Error('No pages found in contract');
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    let firstPage = true;

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      console.log(`Processing page ${i + 1}`);

      try {
        // Convert page to canvas
        const canvas = await html2canvas(page, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false,
          windowHeight: page.scrollHeight,
          windowWidth: page.scrollWidth
        });

        // Calculate image dimensions
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add page to PDF
        if (!firstPage) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        console.log(`Page ${i + 1} added to PDF`);
        firstPage = false;

      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
      }
    }

    // Save PDF
    pdf.save(filename);
    console.log('PDF saved successfully');

    // Cleanup
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
