import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/lib/sendEmail';

export interface Document {
  id: string;
  user_id: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_path: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: 'student' | 'admin';
  full_name: string | null;
  date_of_birth: string | null;
  country_of_education: string | null;
  class_10_marks: string | null;
  class_12_marks: string | null;
  class_12_stream: string | null;
  bachelor_degree_name: string | null;
  bachelor_field: string | null;
  bachelor_cgpa_percentage: string | null;
  bachelor_duration_years: number | null;
  bachelor_credits_ects: number | null;
  master_degree_name: string | null;
  master_field: string | null;
  master_cgpa_percentage: string | null;
  work_experience_years: number | null;
  work_experience_field: string | null;
  ielts_toefl_score: string | null;
  german_level: 'none' | 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | null;
  aps_pathway: 'stk' | 'bachelor_2_semesters' | 'master_applicants' | null;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // 1) Fetch minimal profile first (fast path for authZ checks)
      const { data: minimal, error: profileError } = await supabase
        .from('profiles')
        .select('id,user_id,role,full_name,created_at,updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (minimal) {
        // Set minimal profile immediately so routes can authorize quickly
        const nextProfile = (minimal as unknown) as Profile;
        setProfile(nextProfile);
        try {
          localStorage.setItem('pg_profile', JSON.stringify(nextProfile));
        } catch {}

        // 2) Fetch heavy data (documents) in background without blocking
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .then(({ data: documentsData, error: documentsError }) => {
            if (!documentsError) {
              setProfile((prev) => {
                if (!prev) return prev;
                const merged = { ...prev, documents: documentsData || [] } as Profile;
                try { localStorage.setItem('pg_profile', JSON.stringify(merged)); } catch {}
                return merged;
              });
            }
          });
      } else {
        // Profile may not be created yet (e.g., immediate post-signup before trigger runs).
        // Attempt to create a minimal profile client-side to avoid blocking the user.
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            const fullName = (user.user_metadata as any)?.full_name || null;
            const { error: insertErr } = await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                full_name: fullName,
                role: 'student',
              } as any);
            if (insertErr) {
              // If insert fails due to race/constraint, ignore and leave profile as null for now
              console.warn('Profile insert skipped/failed (likely race):', insertErr.message);
              setProfile(null);
            } else {
              // Re-fetch minimal profile
              const { data: createdProfile } = await supabase
                .from('profiles')
                .select('id,user_id,role,full_name,created_at,updated_at')
                .eq('user_id', user.id)
                .maybeSingle();
              if (createdProfile) {
                const next = { ...(profile || ({} as Profile)), ...createdProfile } as Profile;
                setProfile(next);
                try { localStorage.setItem('pg_profile', JSON.stringify(next)); } catch {}
              }
            }
          } else {
            setProfile(null);
          }
        } catch (e) {
          console.warn('Profile creation attempt failed:', e);
          setProfile(null);
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // 0) Hydrate cached profile to render app shell immediately
    try {
      const cached = localStorage.getItem('pg_profile');
      if (cached) {
        const parsed = JSON.parse(cached) as Profile;
        setProfile(parsed);
      }
    } catch {}

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.MODE !== 'production') {
          // Dev-only, avoid logging PII like email
          console.debug('Auth state change:', event);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (import.meta.env.MODE !== 'production') {
        // Dev-only, avoid logging PII like email
        console.debug('Initial session check');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;

      // Fire-and-forget welcome email (Auth confirmation still goes via Supabase SMTP)
      try {
        await sendEmail(
          email,
          'Welcome to publicGermany 🎉',
          `<p>Hi ${fullName || ''},</p>
           <p>Welcome to publicGermany! We're excited to help you on your Germany journey.</p>
           <p>If you didn't request this, you can ignore this email.</p>`
        );
        // Notify admin(s) of new signup
        try {
          await sendEmail(
            'publicgermany@outlook.com',
            'New student signed up',
            `<p>A new student just signed up.</p>
             <p><strong>Name:</strong> ${fullName || ''}<br/>
             <strong>Email:</strong> ${email}</p>`
          );
        } catch (_) { /* ignore admin email errors */ }
      } catch (_) {
        // Do not block signup on email failure
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Always redirect back to our dedicated OAuth callback route
      // Supabase will append the authorization code or tokens which we handle there
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    // Try to sign out from Supabase first. Even if it fails with session-missing, proceed to clear local state.
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        const msg = String((error as any)?.message || '').toLowerCase();
        // Ignore expected "no active session" conditions
        if (msg.includes('session missing') || msg.includes('no active session')) {
          if (import.meta.env.MODE !== 'production') {
            console.debug('Sign out: no active Supabase session, proceeding to clear local state');
          }
        } else {
          console.warn('Sign out error (non-fatal):', error);
        }
      }
    } catch (e) {
      // Network or other unexpected error; continue clearing local state to ensure UI signs out
      console.warn('Sign out request threw, proceeding anyway:', e);
    } finally {
      // Clear local state and app-specific cached data; avoid nuking unrelated storage (e.g., theme)
      setUser(null);
      setSession(null);
      setProfile(null);
      try { localStorage.removeItem('pg_profile'); } catch {}
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Refresh profile
      await fetchProfile(user.id);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refetchProfile: () => user && fetchProfile(user.id),
  };
};