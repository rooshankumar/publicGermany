# Quick Fix: Google OAuth Infinite Loading on APK

## The Problem
Your APK redirects to Google but gets stuck loading because:
1. Missing GoogleAuth plugin configuration
2. APK was loading from Vercel URL instead of local build
3. Need proper Google OAuth credentials for Android

## ✅ Already Fixed in Code
- Updated `capacitor.config.ts` with GoogleAuth plugin
- Changed server config to use local build

## 🔧 What You Need to Do (5 minutes)

### Step 1: Get Your Google Web Client ID

**Option A: If you already have Google OAuth working on web**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your existing **Web client** OAuth 2.0 Client ID
3. Copy the Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)

**Option B: If you need to create new credentials**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Name: "publicGermany Web"
5. Authorized redirect URIs: `https://rzbnrlfujjxyrypbafdp.supabase.co/auth/v1/callback`
6. Click **Create**
7. Copy the Client ID

### Step 2: Update Your Code

Open: `d:\Roshan\my-germany-path\capacitor.config.ts`

Find this line:
```typescript
serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
```

Replace with your actual Client ID:
```typescript
serverClientId: '123456789-abc123.apps.googleusercontent.com',
```

### Step 3: Update nativeGoogleAuth.ts

Open: `d:\Roshan\my-germany-path\src\lib\nativeGoogleAuth.ts`

Find this line:
```typescript
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

Replace with the SAME Client ID:
```typescript
const GOOGLE_WEB_CLIENT_ID = '123456789-abc123.apps.googleusercontent.com';
```

### Step 4: Create Android OAuth Client (for SHA-1)

**If you can't run keytool, use Android Studio:**

1. Open Android Studio
2. Open your project: `d:\Roshan\my-germany-path\android`
3. In the right sidebar, click **Gradle**
4. Navigate to: **app** → **Tasks** → **android** → **signingReport**
5. Double-click **signingReport**
6. In the output, find **SHA1** fingerprint
7. Copy it

**Then:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Android**
4. Package name: `com.publicgermany.app`
5. Paste the SHA-1 fingerprint
6. Click **Create**

### Step 5: Rebuild and Test

```bash
# Build web app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Build → Clean Project
2. Build → Rebuild Project
3. Run on device

### Step 6: Test Google Sign-In

1. Click "Sign in with Google"
2. **Expected**: Opens Google account picker IN-APP (not browser)
3. Select your Google account
4. **Expected**: Returns to app and logs in successfully
5. **No more infinite loading!**

## 🚨 Common Issues

### Still opens browser?
- Make sure you ran `npx cap sync android`
- Rebuild completely in Android Studio
- Uninstall old app before installing new one

### "Developer Error" or "Invalid Client"?
- Double-check Client ID matches in BOTH files
- Make sure you created Android OAuth client with correct SHA-1
- Wait 5-10 minutes after creating credentials

### Can't find SHA-1?
**Alternative method:**
1. Build your APK in Android Studio
2. Go to: https://developers.google.com/android/guides/client-auth
3. Use the online tool to extract SHA-1 from your APK

## 📋 Quick Checklist

- [ ] Got Web Client ID from Google Console
- [ ] Updated `capacitor.config.ts` with Client ID
- [ ] Updated `src/lib/nativeGoogleAuth.ts` with Client ID
- [ ] Got SHA-1 fingerprint (via Android Studio or keytool)
- [ ] Created Android OAuth client with SHA-1
- [ ] Ran `npm run build`
- [ ] Ran `npx cap sync android`
- [ ] Rebuilt app in Android Studio
- [ ] Tested on device

**Once done, Google Sign-In will work natively in your APK!** 🎉
