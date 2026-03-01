import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type WorkExperienceEntry = {
  id: string;
  profile_id: string;
  job_title: string | null;
  organisation: string | null;
  city_country: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  order_index: number;
  created_at: string;
};

export const useWorkExperiences = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WorkExperienceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkExperiences = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_work_experiences')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading work experience',
        description: err?.message || 'Failed to load work experience entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addWorkExperience = async (entry: Omit<WorkExperienceEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_work_experiences')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Work experience added',
          description: 'Your work experience entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding work experience',
        description: err?.message || 'Failed to add work experience entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateWorkExperience = async (id: string, entry: Partial<WorkExperienceEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_work_experiences')
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Work experience updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating work experience',
        description: err?.message || 'Failed to update work experience entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteWorkExperience = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_work_experiences')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Work experience removed',
        description: 'Your work experience entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting work experience',
        description: err?.message || 'Failed to delete work experience entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderWorkExperiences = async (sortedIds: string[]) => {
    try {
      for (let idx = 0; idx < sortedIds.length; idx++) {
        const { error } = await supabase
          .from('profile_work_experiences')
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
        description: err?.message || 'Failed to reorder work experiences',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchWorkExperiences,
    addWorkExperience,
    updateWorkExperience,
    deleteWorkExperience,
    reorderWorkExperiences,
  };
};
