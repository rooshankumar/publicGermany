import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LanguageSkillEntry = {
  id: string;
  profile_id: string;
  language_name: string;
  mother_tongue: boolean;
  listening: CEFRLevel | null;
  reading: CEFRLevel | null;
  writing: CEFRLevel | null;
  speaking: CEFRLevel | null;
  ielts_score: number | null;
  created_at: string;
};

export const useLanguageSkills = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LanguageSkillEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLanguageSkills = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_language_skills')
        .select('*')
        .eq('profile_id', userId);
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading language skills',
        description: err?.message || 'Failed to load language skill entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addLanguageSkill = async (entry: Omit<LanguageSkillEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_language_skills')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Language skill added',
          description: 'Your language skill entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding language skill',
        description: err?.message || 'Failed to add language skill entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateLanguageSkill = async (id: string, entry: Partial<LanguageSkillEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_language_skills')
        // @ts-expect-error - Supabase type resolver issue with new tables
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Language skill updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating language skill',
        description: err?.message || 'Failed to update language skill entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteLanguageSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_language_skills')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Language skill removed',
        description: 'Your language skill entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting language skill',
        description: err?.message || 'Failed to delete language skill entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    entries,
    loading,
    fetchLanguageSkills,
    addLanguageSkill,
    updateLanguageSkill,
    deleteLanguageSkill,
  };
};
