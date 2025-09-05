import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RealTimeSyncProps {
  children: React.ReactNode;
}

export const RealTimeSync = ({ children }: RealTimeSyncProps) => {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.user_id) return;

    const channels: any[] = [];

    // Sync user's own data
    const userDataChannel = supabase
      .channel('user-data-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `user_id=eq.${profile.user_id}`
      }, () => {
        // Trigger profile refresh or specific callbacks
        console.log('Profile updated');
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'applications',
        filter: `user_id=eq.${profile.user_id}`
      }, () => {
        console.log('Applications updated');
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents',
        filter: `user_id=eq.${profile.user_id}`
      }, () => {
        console.log('Documents updated');
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_requests',
        filter: `user_id=eq.${profile.user_id}`
      }, () => {
        console.log('Service requests updated');
      })
      .subscribe();

    channels.push(userDataChannel);

    // Admin-specific sync
    if (profile.role === 'admin') {
      const adminDataChannel = supabase
        .channel('admin-data-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          console.log('All profiles updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
          console.log('All applications updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
          console.log('All service requests updated');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
          console.log('All payments updated');
        })
        .subscribe();

      channels.push(adminDataChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [profile?.user_id, profile?.role]);

  return <>{children}</>;
};

export default RealTimeSync;