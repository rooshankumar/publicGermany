import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CertificationEntry = {
  id: string;
  profile_id: string;
  title: string;
  institution: string | null;
  date: string | null;
  certificate_url: string | null;
  order_index: number;
  created_at: string;
};

export const useCertifications = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<CertificationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCertifications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_certifications')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading certifications',
        description: err?.message || 'Failed to load certification entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCertification = async (entry: Omit<CertificationEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_certifications')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Certification added',
          description: 'Your certification entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding certification',
        description: err?.message || 'Failed to add certification entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateCertification = async (id: string, entry: Partial<CertificationEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_certifications')
        // @ts-expect-error - Supabase type resolver issue with new tables
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Certification updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating certification',
        description: err?.message || 'Failed to update certification entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteCertification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_certifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Certification removed',
        description: 'Your certification entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting certification',
        description: err?.message || 'Failed to delete certification entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderCertifications = async (sortedIds: string[]) => {
    try {
      for (let idx = 0; idx < sortedIds.length; idx++) {
        const { error } = await supabase
          .from('profile_certifications')
          // @ts-expect-error - Supabase type resolver issue with new tables
          .update({ order_index: idx })
          .eq('id', sortedIds[idx]);
        if (error) throw error;
      }
      const newEntries = [...entries].sort(
        (a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id)
      );
      setEntries(newEntries);
    } catch (err: any) {
      toast({
        title: 'Error reordering',
        description: err?.message || 'Failed to reorder certifications',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchCertifications,
    addCertification,
    updateCertification,
    deleteCertification,
    reorderCertifications,
  };
};
