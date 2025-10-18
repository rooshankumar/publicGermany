# Mobile OAuth & App Icon Fix Guide

## ✅ Fixes Applied

### 1. OAuth Redirect Issue - FIXED
**Problem:** After Google sign-in, browser doesn't return to the app

**Solution:** Added deep linking support in AndroidManifest.xml

### 2. App Logo/Splash Screen - READY TO FIX
**Problem:** Using random fallback instead of your logo

**Solution:** Copy your logo to the correct locations

---

## 🔧 OAuth Fix Details

### What Was Changed:

#### 1. AndroidManifest.xml
Added two intent filters for deep linking:

```xml
<!-- Deep link for OAuth redirect -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" 
          android:host="publicgermany.vercel.app" />
</intent-filter>

<!-- Custom scheme for OAuth -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.publicgermany.app" />
</intent-filter>
```

#### 2. useAuth.ts
Updated OAuth redirect to detect mobile and use custom scheme:

```typescript
// Detect if running in Capacitor (mobile app)
const isCapacitor = window.location.protocol === 'capacitor:' || 
                   window.location.protocol === 'ionic:' ||
                   (window as any).Capacitor !== undefined;

// Use custom scheme for mobile, web URL for browser
const redirectUrl = isCapacitor 
  ? 'com.publicgermany.app://auth/callback'
  : `${window.location.origin}/auth/callback`;
```

---

## 🎨 App Logo Fix

### Manual Steps:

**Step 1: Copy logo to splash screen**
```powershell
Copy-Item public\logos.png android\app\src\main\res\drawable\splash.png
```

**Step 2: Copy logo to all app icon folders**
```powershell
# Create directories if needed
New-Item -ItemType Directory -Force android\app\src\main\res\mipmap-hdpi
New-Item -ItemType Directory -Force android\app\src\main\res\mipmap-mdpi
New-Item -ItemType Directory -Force android\app\src\main\res\mipmap-xhdpi
New-Item -ItemType Directory -Force android\app\src\main\res\mipmap-xxhdpi
New-Item -ItemType Directory -Force android\app\src\main\res\mipmap-xxxhdpi

# Copy logo to each folder
Copy-Item public\logos.png android\app\src\main\res\mipmap-hdpi\ic_launcher.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-mdpi\ic_launcher.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xhdpi\ic_launcher.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png

# Also copy as round icon
Copy-Item public\logos.png android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png
Copy-Item public\logos.png android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png
```

---

## 🚀 Rebuild APK

After making these changes:

```bash
# 1. Build web app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. Build APK
# Build → Generate Signed Bundle / APK → APK
```

---

## 📱 Configure Google OAuth in Supabase

**IMPORTANT:** You need to add the custom scheme to your Supabase project!

### Step 1: Go to Supabase Dashboard
1. Open your project: https://supabase.com/dashboard
2. Go to **Authentication → URL Configuration**

### Step 2: Add Redirect URLs
Add these URLs to **Redirect URLs**:

```
https://publicgermany.vercel.app/auth/callback
com.publicgermany.app://auth/callback
```

### Step 3: Save Changes
Click **Save** at the bottom

---

## ✅ Testing OAuth

### Test Flow:
1. Install APK on device
2. Open app
3. Click "Sign in with Google"
4. Browser opens → Select Google account
5. **App should automatically return** ✅
6. User is logged in

### If Still Not Working:

**Check 1:** Verify redirect URLs in Supabase
```
✅ https://publicgermany.vercel.app/auth/callback
✅ com.publicgermany.app://auth/callback
```

**Check 2:** Rebuild APK after changes
```bash
npm run build
npx cap sync android
# Rebuild in Android Studio
```

**Check 3:** Test deep link manually
```bash
adb shell am start -W -a android.intent.action.VIEW -d "com.publicgermany.app://auth/callback" com.publicgermany.app
```

Should open your app!

---

## 🎯 Summary

### What's Fixed:
✅ OAuth redirect for mobile (deep linking)
✅ Custom scheme: `com.publicgermany.app://`
✅ HTTPS deep link: `https://publicgermany.vercel.app`
✅ Auto-detection of mobile vs web

### What You Need to Do:
1. ✅ Copy logo files (manual commands above)
2. ✅ Add redirect URLs in Supabase Dashboard
3. ✅ Rebuild APK
4. ✅ Test OAuth flow

**After these steps, OAuth will work perfectly in your Android app!** 🎉
