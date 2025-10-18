import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Replace with your actual Web Client ID from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

/**
 * Initialize Google Auth for native platforms
 * Call this once when the app starts
 */
export async function initializeGoogleAuth() {
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleAuth.initialize({
        clientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ Google Auth initialized for native platform');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
    }
  }
}

/**
 * Sign in with Google - works on both web and native
 */
export async function signInWithGoogleNative() {
  try {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      console.log('🔐 Using native Google Sign-In');
      
      // Native Google Sign-In for Android/iOS
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser || !googleUser.authentication?.idToken) {
        throw new Error('Failed to get Google ID token');
      }

      console.log('✅ Got Google user, signing into Supabase...');
      
      // Sign in to Supabase with Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
      });

      if (error) throw error;
      
      console.log('✅ Successfully signed in to Supabase');
      return { data, error: null };
      
    } else {
      console.log('🌐 Using web OAuth flow');
      
      // Web OAuth flow for browser
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      return { data, error };
    }
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to sign in with Google' 
    };
  }
}

/**
 * Sign out from Google
 */
export async function signOutGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Refresh Google authentication
 */
export async function refreshGoogleAuth() {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await GoogleAuth.refresh();
      return result;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh Google auth:', error);
    return null;
  }
}
