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

// Display order = array order. Short names to match the iOS-style redesign.
export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'visa-only',
    slug: 'visa-application-only',
    name: 'Visa Only',
    price: 20000,
    priceLabel: '₹20,000',
    shortDescription:
      'Already have an admission offer? We handle your German student visa end-to-end.',
    included: [
      'Visa SOP preparation',
      'Document checklist & review',
      'VFS appointment assistance',
    ],
    payment: 'Payable before the visa process begins.',
    bestFor: 'Students who already have admission and only need visa support.',
  },
  {
    id: 'admission',
    slug: 'admission-package',
    name: 'Admission',
    price: 30000,
    priceLabel: '₹30,000',
    shortDescription:
      'Full admission support — profile evaluation to application submission.',
    included: [
      'Profile evaluation & shortlisting',
      'SOP, LOR & CV preparation',
      '7–8 university applications',
    ],
    payment: 'Due after the first university application has been submitted.',
    bestFor: 'Students who need admission support only.',
  },
  {
    id: 'admission-visa',
    slug: 'admission-visa-package',
    name: 'Admission + Visa',
    price: 50000,
    priceLabel: '₹50,000',
    shortDescription:
      'Complete support from university applications to visa submission.',
    included: [
      'Everything in Admission',
      'APS guidance (if applicable)',
      'Visa SOP & VFS assistance',
    ],
    payment: 'Due after the first university application has been submitted.',
    bestFor: 'Students who want admission and visa support in one package.',
  },
  {
    id: 'pay-after-admission',
    slug: 'pay-after-admission-package',
    name: 'Pay After Admission',
    price: 60000,
    priceLabel: '₹60,000',
    shortDescription:
      'Admission support with minimal upfront commitment — pay the rest after your offer.',
    included: [
      'Profile evaluation & shortlisting',
      'SOP, LOR & CV preparation',
      '7–8 university applications',
    ],
    payment: '₹2,000 now, remaining ₹58,000 after receiving an admission offer.',
    bestFor: 'Students who prefer to pay after securing admission.',
    notes: [
      'University application fees are paid directly by the student.',
      'Visa support is not included and can be added separately.',
    ],
    popular: true,
  },
];
