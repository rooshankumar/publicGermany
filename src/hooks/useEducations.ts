import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type EducationEntry = {
  id: string;
  profile_id: string;
  degree_title: string;
  field_of_study: string;
  institution: string;
  country: string;
  start_year: number;
  end_year: number;
  final_grade: string | null;
  max_scale: number | null;
  total_credits: number | null;
  credit_system: string | null;
  thesis_title: string | null;
  key_subjects: string | null;
  academic_highlights: string | null;
  order_index: number;
  created_at: string;
};

export const useEducations = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEducations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_educations')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading educations',
        description: err?.message || 'Failed to load education entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEducation = async (entry: Omit<EducationEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_educations')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Education added',
          description: 'Your education entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding education',
        description: err?.message || 'Failed to add education entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateEducation = async (id: string, entry: Partial<EducationEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_educations')
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Education updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating education',
        description: err?.message || 'Failed to update education entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_educations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Education removed',
        description: 'Your education entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting education',
        description: err?.message || 'Failed to delete education entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderEducations = async (sortedIds: string[]) => {
    try {
      const updates = sortedIds.map((id, idx) => ({
        id,
        order_index: idx,
      }));
      for (const upd of updates) {
        const { error } = await supabase
          .from('profile_educations')
          .update({ order_index: upd.order_index })
          .eq('id', upd.id);
        if (error) throw error;
      }
      const newEntries = [...entries].sort(
        (a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id)
      );
      setEntries(newEntries);
    } catch (err: any) {
      toast({
        title: 'Error reordering',
        description: err?.message || 'Failed to reorder educations',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchEducations,
    addEducation,
    updateEducation,
    deleteEducation,
    reorderEducations,
  };
};
