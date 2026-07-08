import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const sb = supabase as any;

export interface ReferralRow {
  id: string;
  owner_editor_id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  qualification: string | null;
  percentage: string | null;
  passing_year: string | null;
  passport_available: boolean | null;
  german_level: string | null;
  preferred_intake: string | null;
  lead_source: string | null;
  current_status: string;
  priority: string;
  next_followup_date: string | null;
  remarks: string | null;
  commission_status: string;
  converted_student_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  referral_services?: { id: string; service_key: string }[];
}

export function useMyReferrals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referrals', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referrals')
        .select('*, referral_services(id, service_key)')
        .eq('owner_editor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ReferralRow[];
    },
    staleTime: 30_000,
  });
}

export function useReferralsByEditor(editorId?: string) {
  return useQuery({
    queryKey: ['referrals', 'byEditor', editorId],
    enabled: !!editorId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referrals')
        .select('*, referral_services(id, service_key)')
        .eq('owner_editor_id', editorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ReferralRow[];
    },
  });
}

export function useReferral(id?: string) {
  return useQuery({
    queryKey: ['referral', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referrals')
        .select('*, referral_services(id, service_key)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as ReferralRow | null;
    },
  });
}

export function useReferralActivities(referralId?: string) {
  return useQuery({
    queryKey: ['referral-activities', referralId],
    enabled: !!referralId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referral_activities')
        .select('*')
        .eq('referral_id', referralId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useReferralTasks(referralId?: string) {
  return useQuery({
    queryKey: ['referral-tasks', referralId],
    enabled: !!referralId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referral_tasks')
        .select('*')
        .eq('referral_id', referralId!)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-tasks', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referral_tasks')
        .select('*, referrals!inner(full_name)')
        .eq('owner_editor_id', user!.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useReferralDocuments(referralId?: string) {
  return useQuery({
    queryKey: ['referral-docs', referralId],
    enabled: !!referralId,
    queryFn: async () => {
      const { data, error } = await sb
        .from('referral_documents')
        .select('*')
        .eq('referral_id', referralId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      referral: Partial<ReferralRow>;
      services: string[];
    }) => {
      const { data, error } = await sb
        .from('referrals')
        .insert({ ...payload.referral, owner_editor_id: user!.id })
        .select('*')
        .single();
      if (error) throw error;
      if (payload.services.length) {
        await sb.from('referral_services').insert(
          payload.services.map(k => ({ referral_id: data.id, service_key: k }))
        );
      }
      return data as ReferralRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}

export function useUpdateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<ReferralRow> }) => {
      const { error } = await sb.from('referrals').update(payload.patch).eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
      qc.invalidateQueries({ queryKey: ['referral', v.id] });
      qc.invalidateQueries({ queryKey: ['referral-activities', v.id] });
    },
  });
}

export function useSetReferralServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, services }: { id: string; services: string[] }) => {
      await sb.from('referral_services').delete().eq('referral_id', id);
      if (services.length) {
        await sb.from('referral_services').insert(
          services.map(k => ({ referral_id: id, service_key: k }))
        );
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['referral', v.id] });
      qc.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { referral_id: string; type: string; title?: string; body?: string }) => {
      const { error } = await sb.from('referral_activities').insert({
        ...payload,
        actor_user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['referral-activities', v.referral_id] });
    },
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { referral_id: string; title: string; due_date?: string | null }) => {
      const { error } = await sb.from('referral_tasks').insert({
        ...payload,
        owner_editor_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['referral-tasks', v.referral_id] });
      qc.invalidateQueries({ queryKey: ['referral-tasks', 'mine'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await sb.from('referral_tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referral-tasks'] });
    },
  });
}
