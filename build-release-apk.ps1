# publicGermany - Build Signed Release APK (All-in-One)

Write-Host "🚀 Building Signed Release APK for publicGermany" -ForegroundColor Green
Write-Host ""

# Step 1: Check keystore
if (!(Test-Path "publicgermany.keystore")) {
    Write-Host "❌ Keystore not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please generate keystore first:" -ForegroundColor Yellow
    Write-Host ".\generate-keystore.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Android Studio:" -ForegroundColor Yellow
    Write-Host "Build → Generate Signed Bundle / APK → Create new keystore" -ForegroundColor White
    exit
}

Write-Host "✅ Keystore found" -ForegroundColor Green

# Step 2: Build web app
Write-Host ""
Write-Host "📦 Building web app..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed!" -ForegroundColor Red
    exit
}

Write-Host "✅ Web app built" -ForegroundColor Green

# Step 3: Sync with Capacitor
Write-Host ""
Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit
}

Write-Host "✅ Capacitor synced" -ForegroundColor Green

# Step 4: Open Android Studio
Write-Host ""
Write-Host "📱 Opening Android Studio..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "In Android Studio:" -ForegroundColor Yellow
Write-Host "1. Wait for Gradle sync to complete" -ForegroundColor White
Write-Host "2. Go to: Build → Generate Signed Bundle / APK" -ForegroundColor White
Write-Host "3. Select: APK" -ForegroundColor White
Write-Host "4. Choose keystore: publicgermany.keystore" -ForegroundColor White
Write-Host "5. Enter your passwords" -ForegroundColor White
Write-Host "6. Select: release build variant" -ForegroundColor White
Write-Host "7. Click Finish" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 APK will be at:" -ForegroundColor Cyan
Write-Host "android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""

npx cap open android
