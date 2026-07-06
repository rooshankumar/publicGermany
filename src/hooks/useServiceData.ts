import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PackageFeature {
  id: string;
  feature: string;
  display_order: number;
}

export interface PackageFAQ {
  question: string;
  answer: string;
}

export interface ServicePackageRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  advance_amount: number | null;
  badge: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  features: PackageFeature[];
  priceLabel: string;
  paymentLabel: string;
  highlighted: boolean;
  // Extended fields for the redesigned UI (DB-backed when available, sensible fallbacks otherwise)
  shortDescription: string;
  fullDescription: string;
  paymentSummary: string;
  paymentTerms: string;
  includedFeatures: string[];
  exclusions: string[];
  processSteps: string[];
  faqs: PackageFAQ[];
  popular: boolean;
  riskFree: boolean;
}

export interface CatalogService {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price_inr: number | null;
  category: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  kind: string;
  // Extended for the redesigned UI
  shortDescription: string;
  fullDescription: string;
  priceLabel: string;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const EXCLUSIONS_ADMISSION = [
  'University application fees (paid to each university)',
  'APS certificate fee',
  'TestAS exam fee',
  'dMAT exam fee',
  'IELTS / PTE exam fee',
  'Blocked account setup',
  'Health insurance',
  'Courier / postage charges',
];

const EXCLUSIONS_VISA = [
  'Visa application fee',
  'VFS service fee',
  'IELTS / PTE exam fee',
  'Blocked account setup',
  'Health insurance',
  'Courier / postage charges',
];

const PROCESS_STEPS_ADMISSION = [
  'Profile Evaluation',
  'University Shortlisting',
  'Document Preparation',
  'University Applications',
  'Admission Processing',
];

const PROCESS_STEPS_VISA = [
  'Profile Evaluation',
  'Document Preparation',
  'Visa Application',
  'VFS Appointment',
  'Visa Processing',
];

const FAQS_DEFAULT: PackageFAQ[] = [
  { question: 'When do I pay the remaining amount?', answer: 'Payment milestones are clearly outlined in your contract. Generally, the advance amount is paid upfront and the balance is due upon achieving the milestone (admission offer or visa approval).' },
  { question: 'Are university application fees included?', answer: 'No, university application fees are paid directly by the student to the respective university. Our service fee covers consultation, documentation, and application support only.' },
  { question: 'How many universities will you apply to?', answer: 'We typically apply to 7–8 universities per student, selected based on your profile, preferences, and admission chances.' },
  { question: 'Can I change my university preferences?', answer: 'Yes, you can update your preferences during the shortlisting phase. Changes after applications are submitted may incur additional fees.' },
  { question: 'How long does the process take?', answer: 'The timeline varies by package and individual circumstances. Our team provides a personalized timeline after the initial profile evaluation.' },
];

const FULL_DESCS: Record<string, string> = {
  'pay-after-admission': 'Perfect for students who want complete admission assistance while paying the majority of the service fee only after receiving an admission offer. This package covers everything from profile evaluation to university applications, with minimal upfront commitment.',
  'pay-after-visa': 'Ideal for students who need end-to-end visa support with minimal upfront payment. Pay only a small advance to begin, and the remaining balance after your visa is approved.',
  'standard-admission': 'Complete admission support package for students who prefer to pay upfront before the application process begins. Includes profile evaluation, university shortlisting, document preparation, and application submission.',
  'standard-visa': 'Focused visa application support for students who already have an admission offer or are handling admissions independently. Covers the complete visa process from document preparation to VFS appointment.',
};

const PAYMENT_TERMS: Record<string, string> = {
  'pay-after-admission': '\u2022 Advance amount payable to begin the process\n\u2022 Remaining amount payable only after receiving an admission offer',
  'pay-after-visa': '\u2022 Advance amount payable to begin the process\n\u2022 Remaining amount payable only after visa approval',
  'standard-admission': '\u2022 Full payment is required before the application process begins\n\u2022 No hidden fees during the process',
  'standard-visa': '\u2022 Full payment is required before the visa process begins\n\u2022 No hidden fees during the process',
};

const PAYMENT_SUMMARIES: Record<string, string> = {
  'pay-after-admission': '\u20222,000 to begin \u2022 Pay remaining after admission',
  'pay-after-visa': '\u20222,000 to begin \u2022 Pay remaining after visa approval',
  'standard-admission': 'Paid before we begin',
  'standard-visa': 'Paid before we begin',
};

const CORE_SLUGS = new Set([
  'pay-after-admission',
  'pay-after-visa',
  'standard-admission',
  'standard-visa',
]);

/** Fetch only the 4 core packages with their features. Cached 5 min. */
export function useServicePackages() {
  return useQuery({
    queryKey: ['service-packages-core'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<ServicePackageRow[]> => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*, package_features(id, feature, display_order)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || [])
        .filter((row: any) => CORE_SLUGS.has(row.slug))
        .map((row: any) => {
          const features: PackageFeature[] = (row.package_features || [])
            .slice()
            .sort((a: any, b: any) => a.display_order - b.display_order);
          const highlighted = row.slug === 'pay-after-admission' || row.slug === 'pay-after-visa';
          const slug = row.slug || '';
          const popular = true; // all core packages are popular
          return {
            ...row,
            features,
            priceLabel: inr(row.price),
            paymentLabel: row.advance_amount ? `${inr(row.advance_amount)} to begin` : 'Paid before we begin',
            highlighted,
            shortDescription: row.description || '',
            fullDescription: FULL_DESCS[slug] || row.description || '',
            paymentSummary: PAYMENT_SUMMARIES[slug] || '',
            paymentTerms: PAYMENT_TERMS[slug] || '',
            includedFeatures: features.map((f) => f.feature),
            exclusions: slug.includes('admission') ? EXCLUSIONS_ADMISSION : EXCLUSIONS_VISA,
            processSteps: slug.includes('admission') ? PROCESS_STEPS_ADMISSION : PROCESS_STEPS_VISA,
            faqs: FAQS_DEFAULT,
            popular,
            riskFree: highlighted,
          } as ServicePackageRow;
        });
    },
  });
}

/** Fetch all active individual services. Cached 5 min. */
export function useServicesCatalog() {
  return useQuery({
    queryKey: ['services-catalog'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<CatalogService[]> => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        shortDescription: s.description || '',
        fullDescription: s.description || '',
        priceLabel: s.price_inr ? inr(s.price_inr) : 'Contact us',
      })) as CatalogService[];
    },
  });
}
