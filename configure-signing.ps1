# publicGermany - Configure Release Signing

Write-Host "🔧 Configuring Release Signing for publicGermany" -ForegroundColor Green
Write-Host ""

# Check if keystore exists
if (!(Test-Path "publicgermany.keystore")) {
    Write-Host "❌ Keystore not found!" -ForegroundColor Red
    Write-Host "Please run: .\generate-keystore.ps1 first" -ForegroundColor Yellow
    exit
}

# Get passwords
Write-Host "📝 Enter your keystore credentials:" -ForegroundColor Cyan
$keystorePassword = Read-Host "Keystore password"
$keyPassword = Read-Host "Key password"

# Read current build.gradle
$buildGradlePath = "android\app\build.gradle"
$buildGradleContent = Get-Content $buildGradlePath -Raw

# Check if signing config already exists
if ($buildGradleContent -match "signingConfigs") {
    Write-Host "⚠️  Signing config already exists in build.gradle" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to update it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "❌ Cancelled." -ForegroundColor Red
        exit
    }
}

# Create signing config
$signingConfig = @"

    signingConfigs {
        release {
            storeFile file('../../publicgermany.keystore')
            storePassword '$keystorePassword'
            keyAlias 'publicgermany'
            keyPassword '$keyPassword'
        }
    }
"@

# Update buildTypes to use signing config
$buildTypesUpdate = @"
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
"@

# Backup original file
Copy-Item $buildGradlePath "$buildGradlePath.backup" -Force
Write-Host "✅ Backed up build.gradle to build.gradle.backup" -ForegroundColor Green

# Add signing config before buildTypes
if ($buildGradleContent -match "(?s)(android\s*\{.*?)(buildTypes\s*\{)") {
    $buildGradleContent = $buildGradleContent -replace "(android\s*\{.*?)(buildTypes\s*\{)", "`$1$signingConfig`n`n    `$2"
    
    # Update buildTypes to use signingConfig
    $buildGradleContent = $buildGradleContent -replace "buildTypes\s*\{[^}]*release\s*\{[^}]*\}", $buildTypesUpdate
    
    # Save updated file
    $buildGradleContent | Out-File -FilePath $buildGradlePath -Encoding UTF8 -Force
    
    Write-Host "✅ Signing configuration added to build.gradle!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Android Studio: npx cap open android" -ForegroundColor White
    Write-Host "2. Build → Generate Signed Bundle / APK → APK" -ForegroundColor White
    Write-Host "3. Select 'release' build variant" -ForegroundColor White
    Write-Host "4. Find APK at: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
    Write-Host ""
    Write-Host "Or build from command line:" -ForegroundColor Cyan
    Write-Host "cd android && .\gradlew assembleRelease" -ForegroundColor White
    
} else {
    Write-Host "❌ Could not find buildTypes section in build.gradle" -ForegroundColor Red
    Write-Host "Please configure manually using RELEASE_APK_GUIDE.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⚠️  Security Note:" -ForegroundColor Yellow
Write-Host "Passwords are stored in build.gradle. For production, use environment variables!" -ForegroundColor Yellow
