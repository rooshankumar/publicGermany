import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealTimeSyncProps {
  table: string;
  callback: () => void;
  filter?: {
    column: string;
    value: string | null;
  };
}

export const useRealTimeSync = ({ table, callback, filter }: UseRealTimeSyncProps) => {
  useEffect(() => {
    let channel = supabase.channel(`${table}-changes`);

    // Set up the postgres changes listener
    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`
        },
        callback
      );
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        callback
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter]);
};

export default useRealTimeSync;