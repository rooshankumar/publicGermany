import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EditorPermission {
  id: string;
  editor_user_id: string;
  student_user_id: string;
  can_view_profile: boolean;
  can_view_documents: boolean;
  can_view_applications: boolean;
  can_view_payments: boolean;
  can_view_contracts: boolean;
  created_at: string;
}

export const useEditorPermissions = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<EditorPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user || profile?.user_id !== user.id || profile?.role !== 'editor') {
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('editor_permissions')
        .select('*')
        .eq('editor_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPermissions((data || []) as EditorPermission[]);
    } catch (e) {
      console.error('Error fetching editor permissions:', e);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.role, user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    if (!profile || profile.user_id !== user.id) {
      setLoading(true);
      return;
    }

    if (profile.role !== 'editor') {
      setPermissions([]);
      setLoading(false);
      return;
    }

    fetchPermissions();

    const channel = supabase
      .channel(`editor-permissions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editor_permissions',
          filter: `editor_user_id=eq.${user.id}`,
        },
        () => {
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, fetchPermissions, profile, user]);

  const getPermissionForStudent = (studentId: string) =>
    permissions.find(p => p.student_user_id === studentId) || null;

  const assignedStudentIds = permissions.map(p => p.student_user_id);

  return {
    permissions,
    loading,
    assignedStudentIds,
    getPermissionForStudent,
    refetch: fetchPermissions,
  };
};
