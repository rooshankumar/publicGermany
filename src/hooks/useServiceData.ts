import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PackageFeature {
  id: string;
  feature: string;
  display_order: number;
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
  /** Formatted "₹60,000". */
  priceLabel: string;
  /** Short payment blurb derived from advance_amount for UI display. */
  paymentLabel: string;
  /** Highlight styling for "pay after" packages. */
  highlighted: boolean;
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
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Fetch all active packages with their features. Cached 5 min. */
export function useServicePackages() {
  return useQuery({
    queryKey: ['service-packages'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<ServicePackageRow[]> => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*, package_features(id, feature, display_order)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any) => {
        const features: PackageFeature[] = (row.package_features || [])
          .slice()
          .sort((a: any, b: any) => a.display_order - b.display_order);
        const highlighted = row.slug?.startsWith('pay-after');
        const paymentLabel = row.advance_amount
          ? `${inr(row.advance_amount)} upfront · remainder later`
          : 'Paid before we begin';
        return {
          ...row,
          features,
          priceLabel: inr(row.price),
          paymentLabel,
          highlighted,
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
      return (data || []) as CatalogService[];
    },
  });
}
