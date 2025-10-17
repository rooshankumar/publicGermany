# publicGermany - Android Setup Script

Write-Host "🚀 Setting up Android build for publicGermany..." -ForegroundColor Green

# Step 1: Build the web app
Write-Host "`n📦 Step 1: Building web app..." -ForegroundColor Cyan
npm run build

# Step 2: Copy icon to resources
Write-Host "`n🎨 Step 2: Setting up app icon..." -ForegroundColor Cyan
if (!(Test-Path "resources")) {
    New-Item -ItemType Directory -Path "resources"
}
Copy-Item "public\logos.png" -Destination "resources\icon.png" -Force

# Step 3: Sync with Capacitor
Write-Host "`n🔄 Step 3: Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync android

# Step 4: Generate icons (optional)
Write-Host "`n✨ Step 4: Generating app icons..." -ForegroundColor Cyan
Write-Host "Installing @capacitor/assets..." -ForegroundColor Yellow
npm install -g @capacitor/assets
npx capacitor-assets generate --android

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📱 Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx cap open android" -ForegroundColor White
Write-Host "2. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)" -ForegroundColor White
Write-Host "3. Find APK at: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host "`n🎉 Your app will work exactly like the PWA!" -ForegroundColor Green
