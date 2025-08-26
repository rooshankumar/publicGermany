import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AutoSaveOptions {
  enabled?: boolean;
  delay?: number;
  onSave?: (data: any) => Promise<void>;
  showIndicator?: boolean;
}

export const useAutoSave = (
  data: any,
  tableName: string,
  options: AutoSaveOptions = {}
) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  
  const {
    enabled = true,
    delay = 2000,
    onSave,
    showIndicator = true
  } = options;

  useEffect(() => {
    if (!enabled || !profile?.user_id || !data) return;

    const currentData = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        
        if (onSave) {
          await onSave(data);
        } else {
          // For auto-save to profiles table specifically
          if (tableName === 'profiles') {
            const { error } = await supabase
              .from('profiles')
              .update({
                ...data,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', profile.user_id);

            if (error) throw error;
          } else {
            // Generic save for other tables
            console.log('Auto-save for table:', tableName, 'Data:', data);
          }
        }

        lastSavedRef.current = currentData;
        setSaveStatus('saved');
        
        // Reset status after showing success
        setTimeout(() => setSaveStatus('idle'), 2000);
        
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
        
        if (showIndicator) {
          toast({
            title: "Auto-save failed",
            description: "Please save manually to avoid losing your changes.",
            variant: "destructive",
          });
        }
        
        // Reset error status
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, profile?.user_id, tableName, onSave, showIndicator, toast]);

  return { saveStatus };
};