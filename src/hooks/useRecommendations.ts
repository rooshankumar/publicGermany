import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RecommendationEntry = {
  id: string;
  profile_id: string;
  name: string;
  designation: string | null;
  institution: string | null;
  email: string | null;
  contact: string | null;
  lor_link: string | null;
  order_index: number;
  created_at: string;
};

export const useRecommendations = (userId: string) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<RecommendationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_recommendations')
        .select('*')
        .eq('profile_id', userId)
        .order('order_index');
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading recommendations',
        description: err?.message || 'Failed to load recommendation entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecommendation = async (entry: Omit<RecommendationEntry, 'id' | 'profile_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profile_recommendations')
        .insert([{ profile_id: userId, ...entry }] as any)
        .select();
      if (error) throw error;
      if (data) {
        setEntries([...entries, data[0]]);
        toast({
          title: 'Recommendation added',
          description: 'Your recommendation entry has been saved.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error adding recommendation',
        description: err?.message || 'Failed to add recommendation entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateRecommendation = async (id: string, entry: Partial<RecommendationEntry>) => {
    try {
      const { error } = await supabase
        .from('profile_recommendations')
        .update(entry as unknown as Record<string, any>)
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.map((e) => (e.id === id ? { ...e, ...entry } : e)));
      toast({
        title: 'Recommendation updated',
        description: 'Your changes have been saved.',
      });
    } catch (err: any) {
      toast({
        title: 'Error updating recommendation',
        description: err?.message || 'Failed to update recommendation entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_recommendations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: 'Recommendation removed',
        description: 'Your recommendation entry has been deleted.',
      });
    } catch (err: any) {
      toast({
        title: 'Error deleting recommendation',
        description: err?.message || 'Failed to delete recommendation entry',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderRecommendations = async (sortedIds: string[]) => {
    try {
      for (let idx = 0; idx < sortedIds.length; idx++) {
        const { error } = await supabase
          .from('profile_recommendations')
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
        description: err?.message || 'Failed to reorder recommendations',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    loading,
    fetchRecommendations,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    reorderRecommendations,
  };
};
