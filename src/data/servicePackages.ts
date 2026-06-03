export interface ServicePackage {
  id: string;
  slug: string;
  name: string;
  price: number; // INR
  priceLabel: string;
  shortDescription: string;
  included: string[];
  payment: string;
  bestFor: string;
  notes?: string[];
  popular?: boolean;
}

// Display order is the array order.
export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'visa-only',
    slug: 'visa-application-only',
    name: 'Visa Application Only',
    price: 20000,
    priceLabel: '₹20,000',
    shortDescription:
      'Already have an admission offer? We will assist you with the complete German student visa process.',
    included: [
      'Visa SOP preparation',
      'Visa document checklist & review',
      'VFS appointment assistance',
      'Visa application guidance',
    ],
    payment: 'Payable before the visa process begins.',
    bestFor: 'Students who already have admission and only need visa support.',
  },
  {
    id: 'admission',
    slug: 'admission-package',
    name: 'Admission Package',
    price: 30000,
    priceLabel: '₹30,000',
    shortDescription:
      'Complete admission support for Germany, from profile evaluation to university application submission.',
    included: [
      'Profile evaluation & university shortlisting',
      'SOP, LOR & CV preparation',
      '7–8 university applications',
      'Application document review',
      'Application submission guidance',
    ],
    payment:
      'The package fee becomes payable after the first university application has been submitted.',
    bestFor: 'Students who need admission support only.',
  },
  {
    id: 'admission-visa',
    slug: 'admission-visa-package',
    name: 'Admission + Visa Package',
    price: 50000,
    priceLabel: '₹50,000',
    shortDescription:
      'Complete support from university applications to visa submission.',
    included: [
      'Everything in the Admission Package',
      'APS guidance (if applicable)',
      'Visa SOP preparation',
      'Visa document review',
      'VFS appointment assistance',
      'Pre-visa checklist support',
    ],
    payment:
      'The package fee becomes payable after the first university application has been submitted.',
    bestFor:
      'Students who want complete admission and visa support under one package.',
    popular: true,
  },
  {
    id: 'pay-after-admission',
    slug: 'pay-after-admission-package',
    name: 'Pay After Admission Package',
    price: 60000,
    priceLabel: '₹60,000',
    shortDescription:
      'Complete admission support with minimal upfront commitment. Pay the majority of the fee only after receiving an admission offer.',
    included: [
      'Profile evaluation & university shortlisting',
      'SOP, LOR & CV preparation',
      '7–8 university applications',
      'Application document preparation',
      'APS guidance (if applicable)',
    ],
    payment:
      '₹2,000 registration fee to start the process. Remaining ₹58,000 payable only after receiving an admission offer.',
    bestFor: 'Students who prefer to pay after securing admission.',
    notes: [
      'University application fees are paid directly by the student.',
      'Visa support is not included and can be added separately.',
    ],
  },
];
