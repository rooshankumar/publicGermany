import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AdditionalSectionEntry = {
  id: string;
  profile_id: string;
  section_title: string;
  section_content: string | null;
  order_index: number;
  created_at: string;
};

export const useAdditionalSections = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AdditionalSectionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdditionalSections = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_additional_sections')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading additional sections',
        description: err?.message || 'Failed to load additional section entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalSection = async (entry: Omit<AdditionalSectionEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_additional_sections')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Section added',
          description: 'Your additional section has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding section',
        description: err?.message || 'Failed to add additional section',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateAdditionalSection = async (id: string, entry: Partial<AdditionalSectionEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_additional_sections')
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Section updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating section',
        description: err?.message || 'Failed to update additional section',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteAdditionalSection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_additional_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Section removed',
        description: 'Your additional section has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting section',
        description: err?.message || 'Failed to delete additional section',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderAdditionalSections = async (sortedIds: string[]) => {
    try {
      for (let idx = 0; idx < sortedIds.length; idx++) {
        const { error } = await supabase
          .from('profile_additional_sections')
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
        description: err?.message || 'Failed to reorder sections',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchAdditionalSections,
    addAdditionalSection,
    updateAdditionalSection,
    deleteAdditionalSection,
    reorderAdditionalSections,
  };
};
