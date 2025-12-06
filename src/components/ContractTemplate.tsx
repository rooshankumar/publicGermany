import { format } from 'date-fns';

interface ContractTemplateProps {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  servicePackage: string;
  serviceDescription?: string;
  serviceFee: string;
  paymentStructure?: string;
  startDate?: string;
  expectedEndDate?: string;
  contractReference: string;
  contractDate?: string;
}

export default function ContractTemplate({
  studentName,
  studentEmail,
  studentPhone,
  servicePackage,
  serviceDescription,
  serviceFee,
  paymentStructure,
  startDate,
  expectedEndDate,
  contractReference,
}: ContractTemplateProps) {
  const contractDate = format(new Date(), 'MMMM d, yyyy');
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white text-gray-900 font-serif text-[11px] leading-relaxed">
      {/* PAGE 1 */}
      <div className="relative min-h-[842px] p-8 overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[100px] font-bold text-gray-900/[0.04] tracking-[8px] whitespace-nowrap select-none">
            publicgermany
          </span>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-gray-800" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-gray-800" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-gray-800" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-gray-800" />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6 pb-5 border-b-2 border-gray-800">
            <h1 className="text-3xl font-bold text-gray-800 tracking-[4px] lowercase">publicgermany</h1>
            <p className="text-sm text-gray-600 mt-2 tracking-[3px] uppercase font-medium">Service Agreement</p>
            <p className="text-[10px] text-gray-500 mt-1 italic">Freelancing Service Contract</p>
          </div>

          {/* Contract Info */}
          <div className="mb-5 space-y-1">
            <div className="flex text-[11px]">
              <span className="font-semibold w-40 text-gray-600">Contract Date:</span>
              <span className="font-bold">{contractDate}</span>
            </div>
            <div className="flex text-[11px]">
              <span className="font-semibold w-40 text-gray-600">Contract Reference:</span>
              <span className="font-bold">{contractReference}</span>
            </div>
          </div>

          {/* Party Details */}
          <div className="mb-5">
            <h2 className="text-[10px] font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-[2px]">
              Party Details
            </h2>
            
            <div className="mb-4 pl-3 border-l-[3px] border-gray-200">
              <p className="font-bold text-gray-800 mb-2 text-[10px] uppercase tracking-wider">Student (Client)</p>
              <div className="space-y-1">
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Full Name:</span>
                  <span>{studentName || '__________________'}</span>
                </div>
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Email:</span>
                  <span>{studentEmail || '__________________'}</span>
                </div>
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Phone:</span>
                  <span>{studentPhone || '__________________'}</span>
                </div>
              </div>
            </div>

            <div className="pl-3 border-l-[3px] border-gray-200">
              <p className="font-bold text-gray-800 mb-2 text-[10px] uppercase tracking-wider">Service Provider (Freelancer)</p>
              <div className="space-y-1">
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Name:</span>
                  <span>Roshan Gupta</span>
                </div>
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Organization:</span>
                  <span>publicgermany</span>
                </div>
                <div className="flex text-[11px]">
                  <span className="font-medium w-36 text-gray-600">Email:</span>
                  <span>publicgermany@outlook.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-5">
            <h2 className="text-[10px] font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-[2px]">
              Service Details
            </h2>
            <div className="space-y-1">
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Service Package:</span>
                <span className="font-bold">{servicePackage || '__________________'}</span>
              </div>
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Description:</span>
                <span>{serviceDescription || 'As per agreed service scope'}</span>
              </div>
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Total Service Fee:</span>
                <span className="font-bold">{serviceFee || '__________________'}</span>
              </div>
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Payment Structure:</span>
                <span>{paymentStructure || 'As agreed between parties'}</span>
              </div>
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Service Start Date:</span>
                <span>{startDate || 'Upon agreement signing'}</span>
              </div>
              <div className="flex text-[11px]">
                <span className="font-medium w-40 text-gray-600">Expected End Date:</span>
                <span>{expectedEndDate || 'As per service scope'}</span>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded border-l-4 border-gray-800 mb-4">
            <p className="font-bold mb-2 text-[10px]">ACKNOWLEDGMENT</p>
            <p className="text-gray-700 text-[10px] leading-relaxed">
              This agreement confirms that the student (client) has engaged publicgermany for the above-mentioned services. 
              By signing below, the student acknowledges understanding and acceptance of the service terms. 
              Complete terms and conditions are provided on Page 2 of this contract.
            </p>
          </div>

          {/* Confidentiality Warning */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 border-l-4 border-l-orange-500 p-3 rounded mb-4">
            <p className="text-[9px] text-amber-800 font-medium">
              <strong className="text-red-600">⚠️ CONFIDENTIALITY NOTICE:</strong> This contract is strictly confidential. 
              Sharing, posting, forwarding, or distributing this contract to any third party will result in{' '}
              <strong className="text-red-600">immediate cancellation of services</strong> without refund.
            </p>
          </div>

          {/* Signature Section */}
          <div className="flex justify-between mt-8 gap-8">
            <div className="flex-1 text-center">
              <div className="border-b border-gray-800 h-12 mb-2"></div>
              <p className="text-[9px] text-gray-600 font-bold">Student Signature</p>
              <p className="text-[9px] text-gray-600">Name: {studentName || '__________________'}</p>
              <p className="text-[9px] text-gray-600 mt-1">Date: __________________</p>
            </div>
            <div className="flex-1 text-center">
              <div className="border-b border-dashed border-gray-400 h-12 mb-2"></div>
              <p className="text-[9px] text-gray-600 font-bold">Service Provider</p>
              <p className="text-[9px] text-gray-600">publicgermany</p>
              <p className="text-[8px] text-gray-400 italic mt-1">No signature required</p>
            </div>
          </div>

          {/* No Signature Note */}
          <div className="bg-gray-100 p-3 rounded text-center mt-4">
            <p className="text-[9px] text-gray-600 italic">
              ✓ This contract is valid without a physical or digital signature from publicgermany.
            </p>
          </div>
        </div>

        {/* Page Number */}
        <div className="absolute bottom-3 right-6 text-[8px] text-gray-400">Page 1 of 2</div>
      </div>

      {/* PAGE BREAK */}
      <div className="border-t-2 border-dashed border-gray-400 my-4 text-center print:hidden">
        <span className="bg-white px-4 text-gray-500 text-xs relative -top-3">PAGE BREAK</span>
      </div>

      {/* PAGE 2 */}
      <div className="relative min-h-[842px] p-8 overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[100px] font-bold text-gray-900/[0.04] tracking-[8px] whitespace-nowrap select-none">
            publicgermany
          </span>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-gray-800" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-gray-800" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-gray-800" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-gray-800" />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-5 pb-4 border-b-2 border-gray-800">
            <h1 className="text-3xl font-bold text-gray-800 tracking-[4px] lowercase">publicgermany</h1>
            <p className="text-sm text-gray-600 mt-2 tracking-[3px] uppercase font-medium">Terms & Conditions</p>
          </div>

          {/* Terms */}
          <div className="space-y-3 text-[10px]">
            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">1. SCOPE OF SERVICES</h3>
              <p className="text-gray-700 mt-1">
                publicgermany agrees to provide the services outlined in this agreement including but not limited to: 
                profile evaluation, document preparation (SOP, CV, LORs), university shortlisting, application guidance, 
                APS assistance, visa file preparation, interview preparation, and ongoing support.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">2. EXCLUSIONS / NO GUARANTEES</h3>
              <ul className="text-gray-700 mt-1 list-disc ml-4 space-y-0.5 text-[9px]">
                <li>Admission to any university is <strong>NOT guaranteed</strong></li>
                <li>Visa approval is <strong>NOT guaranteed</strong></li>
                <li>Scholarship approval is <strong>NOT guaranteed</strong></li>
                <li>APS certificate issuance is <strong>NOT guaranteed</strong></li>
                <li>Final decisions rest with APS, universities, VFS, and embassies</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">3. CLIENT RESPONSIBILITIES</h3>
              <p className="text-gray-700 mt-1 text-[9px]">
                The student agrees to: provide accurate information, respond within 48 hours, submit documents on time, 
                attend scheduled calls, and pay fees as per the agreed schedule.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">4. REFUND POLICY</h3>
              <div className="bg-red-50 border border-red-200 p-2 rounded mt-1">
                <p className="text-red-700 font-bold text-[9px]">⚠️ Advance payments are strictly NON-REFUNDABLE.</p>
              </div>
              <p className="text-gray-700 mt-1 text-[9px]">
                Refunds will NOT be issued for: personal reasons, change of interest, document delays, non-responsiveness, 
                disagreement with options, or external delays. Refunds considered only if NO work has started.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">5. CONFIDENTIALITY & DATA USE</h3>
              <p className="text-gray-700 mt-1 text-[9px]">
                All information is kept confidential, used only for service delivery, and may be shared with partner institutions as needed.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">6. LIMITATION OF LIABILITY</h3>
              <p className="text-gray-700 mt-1 text-[9px]">
                Liability is limited to the service fee paid. Not liable for indirect or consequential damages.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">7. TERMINATION CLAUSE</h3>
              <p className="text-gray-700 mt-1 text-[9px]">
                Either party may terminate with 7 days notice. Completed work delivered. Fees NOT refundable after work begins.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-[10px]">8. ACCEPTANCE OF TERMS</h3>
              <p className="text-gray-700 mt-1 text-[9px]">
                By signing on Page 1, the student confirms acceptance of all terms herein.
              </p>
            </div>
          </div>

          {/* Service Packages Table */}
          <div className="mt-4">
            <h2 className="text-[10px] font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-[2px]">
              Service Packages & Pricing
            </h2>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 text-left font-semibold tracking-wider">Service Package</th>
                  <th className="p-2 text-right font-semibold tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-2">APS Assistance</td>
                  <td className="p-2 text-right font-bold text-gray-800">₹4,999</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="p-2">University Shortlisting</td>
                  <td className="p-2 text-right font-bold text-gray-800">₹7,999</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-2">SOP/LOR Support</td>
                  <td className="p-2 text-right font-bold text-gray-800">₹6,500</td>
                </tr>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="p-2">Visa File + Interview Prep</td>
                  <td className="p-2 text-right font-bold text-gray-800">₹8,499</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="p-2 font-bold">Complete Germany Package</td>
                  <td className="p-2 text-right font-bold text-gray-800">₹24,999</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* QR Section */}
          <div className="flex items-center justify-center gap-5 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded mt-4">
            <div className="w-16 h-16 border-2 border-dashed border-gray-800 flex items-center justify-center text-[8px] text-gray-500 bg-white">
              QR Code
            </div>
            <div className="text-[10px] text-gray-800">
              <p className="font-bold mb-1">📱 Scan to download our app</p>
              <a href="https://publicgermany.app" className="text-blue-600 hover:underline text-[9px]">
                publicgermany.app
              </a>
            </div>
          </div>

          {/* Confidentiality Reminder */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 border-l-4 border-l-orange-500 p-3 rounded mt-4">
            <p className="text-[8px] text-amber-800 font-medium">
              <strong>⚠️ REMINDER:</strong> This contract is confidential. Any unauthorized sharing or distribution will 
              result in immediate service cancellation without refund.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-5 pt-4 border-t border-gray-300 text-[9px] text-gray-500">
            <p>Feel free to write to us at{' '}
              <a href="mailto:publicgermany@outlook.com" className="text-gray-800 font-semibold hover:underline">
                publicgermany@outlook.com
              </a>
            </p>
            <p className="text-[8px] text-gray-400 mt-2">© {currentYear} publicgermany. All rights reserved.</p>
          </div>
        </div>

        {/* Page Number */}
        <div className="absolute bottom-3 right-6 text-[8px] text-gray-400">Page 2 of 2</div>
      </div>
    </div>
  );
}
