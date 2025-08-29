import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  delay?: number;
  tableName: string;
  userId?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useAutoSave({
  delay = 3000, // 3 seconds default
  tableName,
  userId,
  onSuccess,
  onError
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef<any>(null);

  const save = useCallback(async (data: any) => {
    if (!userId) {
      console.warn('Cannot auto-save: userId is missing');
      return;
    }

    try {
      setStatus('saving');
      
      const { error } = await supabase
        .from(tableName as any)
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;

      setStatus('saved');
      setLastSaved(new Date());
      onSuccess?.();
      
      toast({
        title: "Changes saved",
        description: "Your information has been automatically saved.",
        duration: 2000,
      });

      // Reset to idle after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setStatus('error');
      onError?.(error);
      
      toast({
        title: "Save failed",
        description: "Unable to save changes. Please try again.",
        variant: "destructive",
        duration: 4000,
      });

      // Reset to idle after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [userId, tableName, onSuccess, onError, toast]);

  const debouncedSave = useCallback((data: any) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store the latest data
    dataRef.current = data;

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (dataRef.current) {
        save(dataRef.current);
      }
    }, delay);
  }, [save, delay]);

  const saveNow = useCallback((data: any) => {
    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Save immediately
    save(data);
  }, [save]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSaved,
    debouncedSave,
    saveNow
  };
}