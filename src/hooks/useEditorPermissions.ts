import { useState, useEffect } from 'react';
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
  const { user, profile } = useAuth();
  const [permissions, setPermissions] = useState<EditorPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('editor_permissions')
        .select('*')
        .eq('editor_user_id', user.id);
      if (error) throw error;
      setPermissions((data || []) as EditorPermission[]);
    } catch (e) {
      console.error('Error fetching editor permissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'editor') {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

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
