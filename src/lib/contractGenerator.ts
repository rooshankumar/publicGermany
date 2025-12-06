import { format } from 'date-fns';

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

export function generateContractReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PG-${year}-${random}`;
}

export function generateContractHTML(data: ContractData): string {
  const contractDate = format(new Date(), 'MMMM d, yyyy'); // Always use today's date
  const contractRef = data.contractReference || generateContractReference();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Agreement - ${contractRef}</title>
  <style>
    @page { 
      size: A4; 
      margin: 15mm; 
    }
    @media print { 
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Georgia', 'Times New Roman', serif; 
      font-size: 10pt; 
      line-height: 1.6; 
      color: #1a1a1a; 
      background: #fff;
    }
    
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 25mm 20mm;
      background: #fff;
      overflow: hidden;
    }
    
    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120pt;
      font-weight: bold;
      color: rgba(26, 26, 46, 0.06);
      letter-spacing: 8px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      font-family: 'Georgia', serif;
    }
    
    /* Corner Accents */
    .corner-accent {
      position: absolute;
      width: 60px;
      height: 60px;
      pointer-events: none;
      z-index: 1;
    }
    .corner-tl { top: 10mm; left: 10mm; border-top: 3px solid #1a1a2e; border-left: 3px solid #1a1a2e; }
    .corner-tr { top: 10mm; right: 10mm; border-top: 3px solid #1a1a2e; border-right: 3px solid #1a1a2e; }
    .corner-bl { bottom: 10mm; left: 10mm; border-bottom: 3px solid #1a1a2e; border-left: 3px solid #1a1a2e; }
    .corner-br { bottom: 10mm; right: 10mm; border-bottom: 3px solid #1a1a2e; border-right: 3px solid #1a1a2e; }
    
    .content {
      position: relative;
      z-index: 2;
    }
    
    .header {
      text-align: center;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a1a2e;
    }
    
    .logo {
      font-size: 28pt;
      font-weight: bold;
      color: #1a1a2e;
      letter-spacing: 4px;
      text-transform: lowercase;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 12pt;
      color: #4a4a5a;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .contract-type {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
      font-style: italic;
    }
    
    .section {
      margin-bottom: 18px;
    }
    
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      color: #1a1a2e;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 6px;
      font-size: 10pt;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 160px;
      color: #444;
    }
    
    .info-value {
      flex: 1;
      color: #1a1a1a;
    }
    
    .party-title {
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .party-block {
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 3px solid #e0e0e0;
    }
    
    .acknowledgment {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 15px 18px;
      border-radius: 4px;
      margin: 20px 0;
      border-left: 4px solid #1a1a2e;
    }
    
    .acknowledgment-title {
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    
    .acknowledgment p {
      font-size: 9pt;
      color: #333;
      line-height: 1.5;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      gap: 30px;
    }
    
    .signature-box {
      flex: 1;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      margin-bottom: 8px;
      height: 45px;
    }
    
    .signature-label {
      font-size: 9pt;
      color: #555;
      line-height: 1.4;
    }
    
    .no-signature-note {
      background: #f0f4f8;
      padding: 10px 15px;
      border-radius: 4px;
      font-size: 8pt;
      color: #555;
      text-align: center;
      margin-top: 15px;
      font-style: italic;
    }
    
    .confidentiality-warning {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
      border: 1px solid #ffc107;
      border-left: 4px solid #ff9800;
      padding: 12px 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 8pt;
      color: #856404;
      font-weight: 500;
    }
    
    .confidentiality-warning strong {
      color: #d63031;
    }
    
    /* PAGE 2 STYLES */
    .terms-item {
      margin-bottom: 14px;
    }
    
    .terms-item h4 {
      font-size: 10pt;
      color: #1a1a2e;
      margin-bottom: 5px;
      font-weight: 700;
    }
    
    .terms-item p, .terms-item ul {
      font-size: 9pt;
      color: #333;
      line-height: 1.5;
    }
    
    .terms-item ul {
      padding-left: 18px;
      margin-top: 5px;
    }
    
    .terms-item li {
      margin-bottom: 3px;
    }
    
    .refund-highlight {
      background: #fff5f5;
      border: 1px solid #fed7d7;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 5px;
    }
    
    .packages-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9pt;
    }
    
    .packages-table th {
      background: #1a1a2e;
      color: #fff;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    .packages-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .packages-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .packages-table .price {
      font-weight: 700;
      color: #1a1a2e;
      text-align: right;
    }
    
    .qr-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 15px 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    
    .qr-placeholder {
      width: 80px;
      height: 80px;
      border: 2px dashed #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #666;
      text-align: center;
      background: #fff;
    }
    
    .qr-text {
      font-size: 10pt;
      color: #1a1a2e;
    }
    
    .qr-text strong {
      display: block;
      margin-bottom: 3px;
    }
    
    .qr-text a {
      color: #2563eb;
      text-decoration: none;
      font-size: 9pt;
    }
    
    .footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
    }
    
    .footer a {
      color: #1a1a2e;
      text-decoration: none;
      font-weight: 600;
    }
    
    .page-number {
      position: absolute;
      bottom: 12mm;
      right: 20mm;
      font-size: 8pt;
      color: #999;
    }
  </style>
</head>
<body>
  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="watermark">publicgermany</div>
    <div class="corner-accent corner-tl"></div>
    <div class="corner-accent corner-tr"></div>
    <div class="corner-accent corner-bl"></div>
    <div class="corner-accent corner-br"></div>
    
    <div class="content">
      <div class="header">
        <div class="logo">publicgermany</div>
        <div class="subtitle">Service Agreement</div>
        <div class="contract-type">Freelancing Service Contract</div>
      </div>

      <div class="section">
        <div class="info-row">
          <span class="info-label">Contract Date:</span>
          <span class="info-value"><strong>${contractDate}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Contract Reference:</span>
          <span class="info-value"><strong>${contractRef}</strong></span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Party Details</div>
        
        <div class="party-block">
          <div class="party-title">Student (Client)</div>
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${data.studentName || '__________________'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.studentEmail || '__________________'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.studentPhone || '__________________'}</span>
          </div>
        </div>

        <div class="party-block">
          <div class="party-title">Service Provider (Freelancer)</div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">Roshan Gupta</span>
          </div>
          <div class="info-row">
            <span class="info-label">Organization:</span>
            <span class="info-value">publicgermany</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">publicgermany@outlook.com</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="info-row">
          <span class="info-label">Service Package:</span>
          <span class="info-value"><strong>${data.servicePackage || '__________________'}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Description:</span>
          <span class="info-value">${data.serviceDescription || 'As per agreed service scope'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Service Fee:</span>
          <span class="info-value"><strong>${data.serviceFee || '__________________'}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Structure:</span>
          <span class="info-value">${data.paymentStructure || 'As agreed between parties'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Service Start Date:</span>
          <span class="info-value">${data.startDate || 'Upon agreement signing'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expected End Date:</span>
          <span class="info-value">${data.expectedEndDate || 'As per service scope'}</span>
        </div>
      </div>

      <div class="acknowledgment">
        <div class="acknowledgment-title">ACKNOWLEDGMENT</div>
        <p>This agreement confirms that the student (client) has engaged publicgermany for the above-mentioned services. By signing below, the student acknowledges understanding and acceptance of the service terms. Complete terms and conditions are provided on Page 2 of this contract.</p>
      </div>

      <div class="confidentiality-warning">
        <strong>⚠️ CONFIDENTIALITY NOTICE:</strong> This contract is strictly confidential. Sharing, posting, forwarding, or distributing this contract to any third party will result in <strong>immediate cancellation of services</strong> without refund.
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">
            <strong>Student Signature</strong><br>
            Name: ${data.studentName || '__________________'}<br>
            Date: __________________
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line" style="border-bottom: 1px dashed #999;"></div>
          <div class="signature-label">
            <strong>Service Provider</strong><br>
            publicgermany<br>
            <em style="font-size: 8pt; color: #888;">No signature required</em>
          </div>
        </div>
      </div>

      <div class="no-signature-note">
        ✓ This contract is valid without a physical or digital signature from publicgermany.
      </div>
    </div>
    
    <div class="page-number">Page 1 of 2</div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page page-break">
    <div class="watermark">publicgermany</div>
    <div class="corner-accent corner-tl"></div>
    <div class="corner-accent corner-tr"></div>
    <div class="corner-accent corner-bl"></div>
    <div class="corner-accent corner-br"></div>
    
    <div class="content">
      <div class="header">
        <div class="logo">publicgermany</div>
        <div class="subtitle">Terms & Conditions</div>
      </div>

      <div class="section">
        <div class="terms-item">
          <h4>1. SCOPE OF SERVICES</h4>
          <p>publicgermany agrees to provide the services outlined in this agreement including but not limited to: profile evaluation, document preparation (SOP, CV, LORs), university shortlisting, application guidance, APS assistance, visa file preparation, interview preparation, and ongoing support during the application process.</p>
        </div>

        <div class="terms-item">
          <h4>2. EXCLUSIONS / NO GUARANTEES</h4>
          <ul>
            <li>Admission to any university is <strong>NOT guaranteed</strong></li>
            <li>Visa approval is <strong>NOT guaranteed</strong></li>
            <li>Scholarship approval is <strong>NOT guaranteed</strong></li>
            <li>APS certificate issuance is <strong>NOT guaranteed</strong></li>
            <li>This service provides guidance and support only</li>
            <li>Final decisions rest with APS, universities, VFS, and embassies</li>
          </ul>
        </div>

        <div class="terms-item">
          <h4>3. CLIENT RESPONSIBILITIES</h4>
          <p>The student agrees to: provide accurate and truthful information, respond to queries within 48 hours, submit required documents on time, attend scheduled calls/meetings, and pay fees as per the agreed schedule.</p>
        </div>

        <div class="terms-item">
          <h4>4. REFUND POLICY</h4>
          <div class="refund-highlight">
            <p><strong>⚠️ Advance payments are strictly NON-REFUNDABLE.</strong></p>
          </div>
          <p style="margin-top: 8px;">Refunds will NOT be issued if: the student decides to drop for personal reasons, change of mood/interest/goals, delay in submitting documents, the student stops responding, disagreement with realistic options, external delays (APS, university, embassy), or any other unrealistic reasons. Refunds may only be considered if NO work has started, at the sole discretion of publicgermany.</p>
        </div>

        <div class="terms-item">
          <h4>5. CONFIDENTIALITY & DATA USE</h4>
          <p>All personal information is kept strictly confidential. Data is used only for service delivery purposes. Information may be shared with partner institutions as needed. Data is stored securely and can be deleted upon written request.</p>
        </div>

        <div class="terms-item">
          <h4>6. LIMITATION OF LIABILITY</h4>
          <p>publicgermany's liability is limited strictly to the service fee paid. We are not liable for indirect, consequential, or special damages under any circumstances.</p>
        </div>

        <div class="terms-item">
          <h4>7. TERMINATION CLAUSE</h4>
          <p>Either party may terminate with 7 days written notice. Completed work will be delivered. Fees are NOT refundable after service work has begun.</p>
        </div>

        <div class="terms-item">
          <h4>8. ACCEPTANCE OF TERMS</h4>
          <p>By signing on Page 1, the student confirms they have read, understood, and agree to be bound by all terms and conditions stated herein.</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Packages & Pricing</div>
        <table class="packages-table">
          <thead>
            <tr>
              <th>Service Package</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>APS Assistance</td>
              <td class="price">₹4,999</td>
            </tr>
            <tr>
              <td>University Shortlisting</td>
              <td class="price">₹7,999</td>
            </tr>
            <tr>
              <td>SOP/LOR Support</td>
              <td class="price">₹6,500</td>
            </tr>
            <tr>
              <td>Visa File + Interview Prep</td>
              <td class="price">₹8,499</td>
            </tr>
            <tr>
              <td><strong>Complete Germany Package</strong></td>
              <td class="price"><strong>₹24,999</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="qr-section">
        <div class="qr-placeholder">
          <span>QR Code</span>
        </div>
        <div class="qr-text">
          <strong>📱 Scan to download our app</strong>
          <a href="https://publicgermany.app" target="_blank">publicgermany.app</a>
        </div>
      </div>

      <div class="confidentiality-warning">
        <strong>⚠️ REMINDER:</strong> This contract is confidential. Any unauthorized sharing or distribution will result in immediate service cancellation without refund.
      </div>

      <div class="footer">
        <p>Feel free to write to us at <a href="mailto:publicgermany@outlook.com">publicgermany@outlook.com</a></p>
        <p style="margin-top: 8px; font-size: 8pt; color: #999;">© ${new Date().getFullYear()} publicgermany. All rights reserved.</p>
      </div>
    </div>
    
    <div class="page-number">Page 2 of 2</div>
  </div>
</body>
</html>
  `.trim();
}

export function downloadContractPDF(html: string, filename: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export function validateContractData(data: Partial<ContractData>): { valid: boolean; error?: string } {
  // Allow generation even with missing fields - just show blanks
  if (!data.studentName?.trim() && !data.studentEmail?.trim() && !data.servicePackage?.trim()) {
    return { valid: false, error: 'Error: Missing required student information. Please provide at least a name, email, or service package.' };
  }
  return { valid: true };
}
