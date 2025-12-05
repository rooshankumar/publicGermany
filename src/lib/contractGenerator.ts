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
  const contractDate = data.contractDate || format(new Date(), 'MMMM d, yyyy');
  const contractRef = data.contractReference || generateContractReference();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Agreement - ${contractRef}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    @media print { .page-break { page-break-before: always; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px double #1a1a2e; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { font-size: 24pt; font-weight: bold; color: #1a1a2e; letter-spacing: 2px; }
    .subtitle { font-size: 14pt; color: #4a4a5a; margin-top: 5px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12pt; font-weight: bold; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { font-weight: 600; min-width: 180px; color: #555; }
    .info-value { flex: 1; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { width: 45%; }
    .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px; }
    .signature-label { font-size: 10pt; color: #666; }
    .terms-list { padding-left: 20px; }
    .terms-list li { margin-bottom: 10px; }
    .terms-item h4 { font-size: 11pt; color: #1a1a2e; margin-bottom: 5px; }
    .terms-item p { color: #444; font-size: 10pt; }
    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10pt; color: #666; }
    .page-break { page-break-before: always; margin-top: 0; }
    .acknowledgment { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- PAGE 1 -->
    <div class="header">
      <div class="logo">publicgermany</div>
      <div class="subtitle">SERVICE AGREEMENT</div>
    </div>

    <div class="section">
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${contractDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contract Reference:</span>
        <span class="info-value"><strong>${contractRef}</strong></span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Party Details</div>
      
      <div style="margin-bottom: 15px;">
        <div style="font-weight: 600; color: #1a1a2e; margin-bottom: 5px;">STUDENT (CLIENT):</div>
        <div class="info-row">
          <span class="info-label">Full Name:</span>
          <span class="info-value">${data.studentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${data.studentEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${data.studentPhone || '_________________________ (to be filled)'}</span>
        </div>
      </div>

      <div>
        <div style="font-weight: 600; color: #1a1a2e; margin-bottom: 5px;">SERVICE PROVIDER:</div>
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
        <span class="info-value"><strong>${data.servicePackage}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Description:</span>
        <span class="info-value">${data.serviceDescription || 'As per service agreement'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Service Fee:</span>
        <span class="info-value"><strong>${data.serviceFee}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Structure:</span>
        <span class="info-value">${data.paymentStructure || 'As agreed'}</span>
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
      <strong>ACKNOWLEDGMENT (PAGE 1)</strong>
      <p style="margin-top: 10px;">This agreement confirms that the student has requested the above services from publicgermany. Full terms and conditions are provided on Page 2.</p>
    </div>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Student Signature</div>
        <div class="signature-label" style="margin-top: 5px;">Date: ____________</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Service Provider (publicgermany Team)</div>
        <div class="signature-label" style="margin-top: 5px;">Date: ____________</div>
      </div>
    </div>

    <!-- PAGE 2 -->
    <div class="page-break">
      <div class="header">
        <div class="logo">publicgermany</div>
        <div class="subtitle">TERMS & CONDITIONS</div>
      </div>

      <div class="section">
        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>1. SCOPE OF SERVICES</h4>
          <p>publicgermany agrees to provide the services outlined in this agreement including but not limited to: profile evaluation, document preparation (SOP, CV, LORs), university shortlisting, application guidance, and ongoing support during the application process.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>2. EXCLUSIONS / NO GUARANTEES</h4>
          <ul style="padding-left: 20px; font-size: 10pt; color: #444;">
            <li>Admission to any university is NOT guaranteed</li>
            <li>Visa approval is NOT guaranteed</li>
            <li>Scholarship approval is NOT guaranteed</li>
            <li>This service provides guidance only</li>
            <li>Final decisions rest with APS, universities, VFS, and embassies</li>
          </ul>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>3. CLIENT RESPONSIBILITIES</h4>
          <p>The student agrees to: provide accurate and truthful information, respond to queries within 48 hours, submit required documents on time, and pay fees as per the agreed schedule.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>4. REFUND POLICY</h4>
          <p><strong>Advance payments are strictly NON-REFUNDABLE.</strong></p>
          <p style="margin-top: 5px;">Refunds will NOT be issued if: the student decides to drop their plan for personal reasons, change of mood/interest/goals, delay or failure to submit documents, the student stops responding, the student disagrees with realistic university options, external delays (APS, university, embassy, VFS), or unrealistic reasons.</p>
          <p style="margin-top: 5px;">Refunds may only be considered if absolutely NO work has started, and only at the discretion of publicgermany.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>5. CONFIDENTIALITY & DATA USE</h4>
          <p>All personal information is kept strictly confidential. Data is used only for service delivery purposes. Information may be shared with partner institutions as needed. Data is stored securely and can be deleted upon request.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>6. LIMITATION OF LIABILITY</h4>
          <p>publicgermany's liability is limited strictly to the service fee paid. We are not liable for indirect, consequential, or special damages under any circumstances.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>7. TERMINATION CLAUSE</h4>
          <p>Either party may terminate this agreement with 7 days written notice. Work completed will be delivered. Fees are NOT refundable after service work has begun.</p>
        </div>

        <div class="terms-item" style="margin-bottom: 15px;">
          <h4>8. ACCEPTANCE OF TERMS</h4>
          <p>By signing below, both parties confirm they have read, understood, and agree to be bound by these terms and conditions.</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Final Acceptance</div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Student Signature</div>
          <div class="signature-label">Name: ${data.studentName}</div>
          <div class="signature-label" style="margin-top: 5px;">Date: ____________</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Service Provider</div>
          <div class="signature-label">Organization: publicgermany</div>
          <div class="signature-label" style="margin-top: 5px;">Date: ____________</div>
        </div>
      </div>

      <div class="footer">
        Contact: publicgermany@outlook.com
      </div>
    </div>
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
  if (!data.studentName?.trim()) {
    return { valid: false, error: 'Missing required student information: Student Name' };
  }
  if (!data.studentEmail?.trim()) {
    return { valid: false, error: 'Missing required student information: Student Email' };
  }
  if (!data.servicePackage?.trim()) {
    return { valid: false, error: 'Missing required student information: Service Package' };
  }
  if (!data.serviceFee?.trim()) {
    return { valid: false, error: 'Missing required student information: Service Fee' };
  }
  return { valid: true };
}
