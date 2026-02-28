import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PublicationEntry = {
  id: string;
  profile_id: string;
  title: string;
  journal: string | null;
  year: number | null;
  doi_url: string | null;
  description: string | null;
  order_index: number;
  created_at: string;
};

export const usePublications = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PublicationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_publications')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading publications',
        description: err?.message || 'Failed to load publication entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPublication = async (entry: Omit<PublicationEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_publications')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Publication added',
          description: 'Your publication entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding publication',
        description: err?.message || 'Failed to add publication entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updatePublication = async (id: string, entry: Partial<PublicationEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_publications')
        // @ts-expect-error - Supabase type resolver issue with new tables
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Publication updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating publication',
        description: err?.message || 'Failed to update publication entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deletePublication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_publications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Publication removed',
        description: 'Your publication entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting publication',
        description: err?.message || 'Failed to delete publication entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderPublications = async (sortedIds: string[]) => {
    try {
      for (let idx = 0; idx < sortedIds.length; idx++) {
        const { error } = await supabase
          .from('profile_publications')
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
        description: err?.message || 'Failed to reorder publications',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchPublications,
    addPublication,
    updatePublication,
    deletePublication,
    reorderPublications,
  };
};
