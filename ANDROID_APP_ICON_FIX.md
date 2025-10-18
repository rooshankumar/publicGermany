# Android App Icon Fix Guide

## Problem
The app is showing the default Capacitor icon (blue X) instead of the publicGermany logo.

## Solution

### Step 1: Prepare Your Logo

1. **Get your logo file**
   - Use your publicGermany logo (preferably PNG with transparent background)
   - Recommended size: 1024x1024px
   - Should be square format

2. **Use an Icon Generator Tool**
   
   **Option A: Online Tool (Easiest)**
   - Go to: https://icon.kitchen/ or https://easyappicon.com/
   - Upload your 1024x1024px logo
   - Select "Android" platform
   - Download the generated icon pack

   **Option B: Android Studio**
   - Open Android Studio
   - Right-click on `res` folder → New → Image Asset
   - Choose "Launcher Icons (Adaptive and Legacy)"
   - Upload your logo
   - Configure foreground and background
   - Click "Next" then "Finish"

### Step 2: Replace Icon Files

The generated pack will contain folders like:
- `mipmap-mdpi/`
- `mipmap-hdpi/`
- `mipmap-xhdpi/`
- `mipmap-xxhdpi/`
- `mipmap-xxxhdpi/`

**Copy these folders to:**
```
d:\Roshan\my-germany-path\android\app\src\main\res\
```

Replace all existing `ic_launcher*.png` files in each mipmap folder.

### Step 3: Update Icon Configuration Files

**File 1: `android/app/src/main/res/drawable/ic_launcher_background.xml`**

Change the background color to match your brand:
```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M0,0h108v108h-108z" />
</vector>
```
Change `#FFFFFF` to your brand color (e.g., `#0066CC` for blue).

**File 2: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`**

Verify it looks like this:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

### Step 4: Clean and Rebuild

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Step 5: Rebuild APK/AAB

**For Debug Build:**
```bash
cd android
./gradlew assembleDebug
```

**For Release Build:**
```bash
cd android
./gradlew bundleRelease
```

The APK will be in: `android/app/build/outputs/apk/debug/` or `release/`

### Step 6: Reinstall App

1. Uninstall the old app from your device
2. Install the new APK
3. The new icon should appear

## Quick Fix Script (PowerShell)

```powershell
# Navigate to project
cd d:\Roshan\my-germany-path

# Clean build
cd android
./gradlew clean
cd ..

# Sync Capacitor
npx cap sync android

# Build new APK
cd android
./gradlew assembleRelease
cd ..

Write-Host "✅ New APK built! Check android/app/build/outputs/apk/release/"
```

## Troubleshooting

### Icon Still Not Changing?
1. **Clear app data** on device
2. **Uninstall completely** before reinstalling
3. **Restart device** after installation
4. Check if you replaced ALL icon files in ALL mipmap folders

### Icon Looks Distorted?
- Use a square logo (1:1 aspect ratio)
- Ensure transparent background
- Use high resolution (1024x1024px minimum)

### Build Errors?
```bash
# Clean everything
cd android
./gradlew clean
rm -rf build
rm -rf app/build
cd ..

# Sync again
npx cap sync android
```

## Resources

- **Icon Generator**: https://icon.kitchen/
- **Android Icon Guide**: https://developer.android.com/studio/write/image-asset-studio
- **Capacitor Docs**: https://capacitorjs.com/docs/guides/splash-screens-and-icons
