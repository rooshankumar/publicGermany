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
      // First, fetch the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      // Then, fetch the user's documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);
      
      if (documentsError) throw documentsError;
      
      // Combine profile and documents data
      setProfile({
        ...profileData,
        documents: documentsData || []
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
          
          // If this is a sign-in event and we're on the auth page, redirect to dashboard
          if (event === 'SIGNED_IN' && window.location.pathname === '/auth') {
            window.location.href = '/dashboard';
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
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
      const redirectUrl = `${window.location.origin}/`;
      
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
            'roshlingua@gmail.com',
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
      
      if (data.user) {
        // Force page reload after successful sign in
        window.location.href = '/dashboard';
      }
      
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
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear any stored data in localStorage
      localStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Redirect to home page after successful sign out
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, still try to redirect to home page
      window.location.href = '/';
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