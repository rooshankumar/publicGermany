# Google OAuth Setup - Quick Steps

## ✅ Code Changes Complete!

The native Google Sign-In is now implemented. Follow these steps to complete the setup:

## Step 1: Get Google OAuth Credentials

### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create one named "publicGermany")

### B. Enable Google Sign-In API
1. Go to **APIs & Services** → **Library**
2. Search for "Google Sign-In API"
3. Click **Enable**

### C. Create OAuth 2.0 Credentials

**For Android App:**
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Android**
4. Package name: `com.publicgermany.app`
5. SHA-1 fingerprint: (see below how to get it)

**Get SHA-1 Fingerprint:**

Open PowerShell and run:

```powershell
# For Debug builds (testing)
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-1** value and paste it in Google Console.

**For Release builds** (when publishing):
```powershell
# Replace with your actual keystore path
keytool -list -v -keystore path\to\your\release.keystore -alias your-alias
```

**For Web Client (Required!):**
1. Create another **OAuth 2.0 Client ID**
2. Select **Web application**
3. Name: "publicGermany Web"
4. Authorized redirect URIs: 
   - `https://rzbnrlfujjxyrypbafdp.supabase.co/auth/v1/callback`
5. Click **Create**
6. **Copy the Client ID** - you'll need this!

## Step 2: Update Your Code

### A. Update `nativeGoogleAuth.ts`

Open: `src/lib/nativeGoogleAuth.ts`

Replace this line:
```typescript
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

With your actual Web Client ID from Step 1:
```typescript
const GOOGLE_WEB_CLIENT_ID = '123456789-abcdefg.apps.googleusercontent.com';
```

### B. Update Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers**
4. Enable **Google**
5. Enter:
   - **Client ID**: (Web Client ID from Google Console)
   - **Client Secret**: (Web Client Secret from Google Console)
6. Click **Save**

## Step 3: Update capacitor.config.ts

Open: `capacitor.config.ts`

Add Google Auth configuration:

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
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace this!
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
```

## Step 4: Build and Test

```bash
# Build the web app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Build → Clean Project
2. Build → Rebuild Project
3. Run on your device

## Step 5: Test Google Sign-In

1. Open the app on your Android device
2. Click "Sign in with Google"
3. **Expected behavior:**
   - ✅ Opens Google account picker (in-app, not browser)
   - ✅ Shows your device's Google accounts
   - ✅ After selecting account, returns to app
   - ✅ Successfully logs in
   - ✅ No infinite loading

## Troubleshooting

### Issue: "Sign-in failed" or "Invalid client"
**Fix**: Double-check your Client IDs match:
- Web Client ID in `nativeGoogleAuth.ts`
- Web Client ID in `capacitor.config.ts`
- Web Client ID in Supabase Dashboard

### Issue: SHA-1 fingerprint error
**Fix**: Make sure you added SHA-1 for BOTH:
- Debug keystore (for testing)
- Release keystore (for production)

### Issue: Still opens external browser
**Fix**: 
1. Make sure you ran `npx cap sync android`
2. Rebuild the app completely in Android Studio
3. Uninstall old app before installing new one

### Issue: "Developer Error" or "API not enabled"
**Fix**: 
1. Enable "Google Sign-In API" in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate

## Quick Checklist

- [ ] Created Android OAuth Client ID in Google Console
- [ ] Created Web OAuth Client ID in Google Console
- [ ] Added SHA-1 fingerprint to Android client
- [ ] Updated `GOOGLE_WEB_CLIENT_ID` in `nativeGoogleAuth.ts`
- [ ] Updated `capacitor.config.ts` with Web Client ID
- [ ] Configured Google provider in Supabase Dashboard
- [ ] Ran `npm run build`
- [ ] Ran `npx cap sync android`
- [ ] Rebuilt app in Android Studio
- [ ] Tested on device

## Summary of Changes Made

✅ Installed `@codetrix-studio/capacitor-google-auth`
✅ Created `src/lib/nativeGoogleAuth.ts` for native auth
✅ Updated `src/hooks/useAuth.ts` to use native Google Sign-In
✅ Synced with Android project

**Next**: Follow steps 1-5 above to complete the setup!
