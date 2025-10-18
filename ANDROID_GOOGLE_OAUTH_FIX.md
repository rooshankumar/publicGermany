# Android Google OAuth Fix Guide

## Problems
1. ❌ OAuth opens in external browser instead of in-app
2. ❌ After login, app keeps loading and doesn't complete authentication
3. ❌ Not using device's registered Google account automatically

## Root Cause
The issue is that Supabase Auth is using web-based OAuth flow instead of native Android OAuth. For Android apps, you need to use **Google Sign-In SDK** for a native experience.

## Solution: Implement Native Google Sign-In

### Step 1: Install Required Packages

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync
```

### Step 2: Configure Google Sign-In

**File: `capacitor.config.ts`**

Add Google Auth plugin configuration:

```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.publicgermany.app',
  appName: 'publicGermany',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
```

### Step 3: Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create new one)
3. **Enable Google Sign-In API**:
   - APIs & Services → Library
   - Search "Google Sign-In API"
   - Click Enable

4. **Create OAuth 2.0 Credentials**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   
   **For Android:**
   - Application type: Android
   - Package name: `com.publicgermany.app` (from AndroidManifest.xml)
   - SHA-1 certificate fingerprint: (see below)

5. **Get SHA-1 Fingerprint**:

```bash
# For Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For Release keystore (if you have one)
keytool -list -v -keystore path/to/your/release.keystore -alias your-alias
```

Copy the SHA-1 fingerprint and paste it in Google Console.

6. **Also create Web Client ID**:
   - Create another OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

### Step 4: Update Android Manifest

**File: `android/app/src/main/AndroidManifest.xml`**

Add inside `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
```

### Step 5: Update Your Auth Code

**Create new file: `src/lib/googleAuth.ts`**

```typescript
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Initialize Google Auth
export async function initializeGoogleAuth() {
  if (Capacitor.isNativePlatform()) {
    await GoogleAuth.initialize({
      clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  }
}

// Sign in with Google (Native)
export async function signInWithGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native Google Sign-In for Android/iOS
      const googleUser = await GoogleAuth.signIn();
      
      console.log('Google user:', googleUser);
      
      // Sign in to Supabase with Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
      });

      if (error) throw error;
      
      return { data, error: null };
    } else {
      // Web OAuth flow for browser
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      return { data, error };
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
}

// Sign out
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
```

### Step 6: Update Your Login Component

**File: `src/pages/Auth.tsx` (or wherever you handle login)**

```typescript
import { signInWithGoogle, initializeGoogleAuth } from '@/lib/googleAuth';
import { useEffect } from 'react';

export default function Auth() {
  // Initialize on component mount
  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('Login error:', error);
        toast.error('Failed to sign in with Google');
        return;
      }
      
      if (data?.user) {
        toast.success('Successfully signed in!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
}
```

### Step 7: Update Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Authentication → Providers**
3. **Enable Google Provider**
4. **Add your OAuth credentials**:
   - Client ID: (Web Client ID from Google Console)
   - Client Secret: (from Google Console)
5. **Save**

### Step 8: Handle Deep Links

**File: `android/app/src/main/AndroidManifest.xml`**

Add intent filter for deep linking:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">
    
    <!-- Existing intent filters -->
    
    <!-- Add this for Supabase callback -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="your-project.supabase.co"
            android:pathPrefix="/auth/v1/callback" />
    </intent-filter>
</activity>
```

### Step 9: Rebuild and Test

```bash
# Sync Capacitor
npx cap sync android

# Build
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Alternative: Use Custom Tabs (Simpler)

If native Google Sign-In is too complex, you can use Custom Tabs instead of external browser:

**Install plugin:**
```bash
npm install @capacitor/browser
npx cap sync
```

**Update auth code:**
```typescript
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';

export async function signInWithGoogleCustomTabs() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'com.publicgermany.app://callback',
      skipBrowserRedirect: true,
    },
  });

  if (data?.url) {
    // Open in Custom Tabs (in-app browser)
    await Browser.open({ 
      url: data.url,
      presentationStyle: 'popover',
    });
  }
}
```

## Troubleshooting

### Issue: "Sign-in failed" or "Invalid client"
**Fix**: Double-check your Client IDs match in:
- Google Console
- `capacitor.config.ts`
- Supabase Dashboard

### Issue: SHA-1 fingerprint mismatch
**Fix**: Make sure you're using the correct keystore:
- Debug builds use `~/.android/debug.keystore`
- Release builds use your release keystore

### Issue: Still opens external browser
**Fix**: 
1. Ensure `@codetrix-studio/capacitor-google-auth` is installed
2. Run `npx cap sync android`
3. Rebuild the app completely

### Issue: Infinite loading after login
**Fix**: Check deep link configuration in AndroidManifest.xml

## Testing Checklist

- [ ] Google Sign-In opens in-app (not external browser)
- [ ] Shows device's Google accounts
- [ ] Successfully authenticates
- [ ] Redirects back to app
- [ ] User session is created in Supabase
- [ ] User can access protected routes

## Resources

- **Capacitor Google Auth**: https://github.com/CodetrixStudio/CapacitorGoogleAuth
- **Supabase Auth**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Google Sign-In**: https://developers.google.com/identity/sign-in/android/start
