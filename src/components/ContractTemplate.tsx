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
  contractDate: string;
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
  contractDate,
}: ContractTemplateProps) {
  return (
    <div className="bg-white text-gray-900 p-8 font-sans text-sm leading-relaxed">
      {/* PAGE 1 */}
      <div className="border-b-4 border-double border-gray-800 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-wider">publicgermany</h1>
        <p className="text-base text-gray-600 mt-1">SERVICE AGREEMENT</p>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex">
          <span className="font-semibold w-44 text-gray-600">Date:</span>
          <span>{contractDate}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-44 text-gray-600">Contract Reference:</span>
          <span className="font-bold">{contractReference}</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wider">
          Party Details
        </h2>
        
        <div className="mb-4">
          <p className="font-semibold text-gray-800 mb-2">STUDENT (CLIENT):</p>
          <div className="space-y-1 ml-4">
            <div className="flex">
              <span className="font-medium w-40 text-gray-600">Full Name:</span>
              <span>{studentName}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-40 text-gray-600">Email:</span>
              <span>{studentEmail}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-40 text-gray-600">Phone:</span>
              <span>{studentPhone || '_________________________ (to be filled)'}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-800 mb-2">SERVICE PROVIDER:</p>
          <div className="space-y-1 ml-4">
            <div className="flex">
              <span className="font-medium w-40 text-gray-600">Organization:</span>
              <span>publicgermany</span>
            </div>
            <div className="flex">
              <span className="font-medium w-40 text-gray-600">Email:</span>
              <span>publicgermany@outlook.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wider">
          Service Details
        </h2>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Service Package:</span>
            <span className="font-bold">{servicePackage}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Description:</span>
            <span>{serviceDescription || 'As per service agreement'}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Total Service Fee:</span>
            <span className="font-bold">{serviceFee}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Payment Structure:</span>
            <span>{paymentStructure || 'As agreed'}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Service Start Date:</span>
            <span>{startDate || 'Upon agreement signing'}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-44 text-gray-600">Expected End Date:</span>
            <span>{expectedEndDate || 'As per service scope'}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-6">
        <p className="font-semibold mb-2">ACKNOWLEDGMENT (PAGE 1)</p>
        <p className="text-gray-700">
          This agreement confirms that the student has requested the above services from publicgermany. 
          Full terms and conditions are provided on Page 2.
        </p>
      </div>

      <div className="flex justify-between mt-10">
        <div className="w-[45%]">
          <div className="border-b border-gray-800 h-10 mb-1"></div>
          <p className="text-xs text-gray-600">Student Signature</p>
          <p className="text-xs text-gray-600 mt-1">Date: ____________</p>
        </div>
        <div className="w-[45%]">
          <div className="border-b border-gray-800 h-10 mb-1"></div>
          <p className="text-xs text-gray-600">Service Provider (publicgermany Team)</p>
          <p className="text-xs text-gray-600 mt-1">Date: ____________</p>
        </div>
      </div>

      {/* PAGE BREAK INDICATOR */}
      <div className="border-t-2 border-dashed border-gray-400 my-8 text-center">
        <span className="bg-white px-4 text-gray-500 text-xs relative -top-3">PAGE BREAK</span>
      </div>

      {/* PAGE 2 - Terms & Conditions */}
      <div className="border-b-4 border-double border-gray-800 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-wider">publicgermany</h1>
        <p className="text-base text-gray-600 mt-1">TERMS & CONDITIONS</p>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-bold text-gray-800">1. SCOPE OF SERVICES</h3>
          <p className="text-gray-700 mt-1">
            publicgermany agrees to provide the services outlined in this agreement including but not limited to: 
            profile evaluation, document preparation (SOP, CV, LORs), university shortlisting, application guidance, 
            and ongoing support during the application process.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">2. EXCLUSIONS / NO GUARANTEES</h3>
          <ul className="text-gray-700 mt-1 list-disc ml-5 space-y-1">
            <li>Admission to any university is NOT guaranteed</li>
            <li>Visa approval is NOT guaranteed</li>
            <li>Scholarship approval is NOT guaranteed</li>
            <li>This service provides guidance only</li>
            <li>Final decisions rest with APS, universities, VFS, and embassies</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">3. CLIENT RESPONSIBILITIES</h3>
          <p className="text-gray-700 mt-1">
            The student agrees to: provide accurate and truthful information, respond to queries within 48 hours, 
            submit required documents on time, and pay fees as per the agreed schedule.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">4. REFUND POLICY</h3>
          <p className="text-gray-700 mt-1">
            <strong>Advance payments are strictly NON-REFUNDABLE.</strong> Refunds will NOT be issued if: the student 
            decides to drop their plan for personal reasons, change of mood/interest/goals, delay or failure to submit 
            documents, the student stops responding, the student disagrees with realistic university options, external 
            delays (APS, university, embassy, VFS), or unrealistic reasons. Refunds may only be considered if absolutely 
            NO work has started, and only at the discretion of publicgermany.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">5. CONFIDENTIALITY & DATA USE</h3>
          <p className="text-gray-700 mt-1">
            All personal information is kept strictly confidential. Data is used only for service delivery purposes. 
            Information may be shared with partner institutions as needed. Data is stored securely and can be deleted upon request.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">6. LIMITATION OF LIABILITY</h3>
          <p className="text-gray-700 mt-1">
            publicgermany's liability is limited strictly to the service fee paid. We are not liable for indirect, 
            consequential, or special damages under any circumstances.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">7. TERMINATION CLAUSE</h3>
          <p className="text-gray-700 mt-1">
            Either party may terminate this agreement with 7 days written notice. Work completed will be delivered. 
            Fees are NOT refundable after service work has begun.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-800">8. ACCEPTANCE OF TERMS</h3>
          <p className="text-gray-700 mt-1">
            By signing below, both parties confirm they have read, understood, and agree to be bound by these terms and conditions.
          </p>
        </div>
      </div>

      <h2 className="text-xs font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 mt-8 uppercase tracking-wider">
        Final Acceptance
      </h2>

      <div className="flex justify-between mt-8">
        <div className="w-[45%]">
          <div className="border-b border-gray-800 h-10 mb-1"></div>
          <p className="text-xs text-gray-600">Student Signature</p>
          <p className="text-xs text-gray-600">Name: {studentName}</p>
          <p className="text-xs text-gray-600 mt-1">Date: ____________</p>
        </div>
        <div className="w-[45%]">
          <div className="border-b border-gray-800 h-10 mb-1"></div>
          <p className="text-xs text-gray-600">Service Provider</p>
          <p className="text-xs text-gray-600">Organization: publicgermany</p>
          <p className="text-xs text-gray-600 mt-1">Date: ____________</p>
        </div>
      </div>

      <div className="text-center mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
        Contact: publicgermany@outlook.com
      </div>
    </div>
  );
}
