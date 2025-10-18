# publicGermany - Generate Signing Keystore

Write-Host "🔐 Generating Signing Keystore for publicGermany" -ForegroundColor Green
Write-Host ""

# Check if keystore already exists
if (Test-Path "publicgermany.keystore") {
    Write-Host "⚠️  Keystore already exists!" -ForegroundColor Yellow
    Write-Host "Location: $(Get-Location)\publicgermany.keystore" -ForegroundColor Cyan
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "❌ Cancelled. Using existing keystore." -ForegroundColor Red
        exit
    }
}

Write-Host "📝 Please provide the following information:" -ForegroundColor Cyan
Write-Host ""

# Collect information
$keystorePassword = Read-Host "Enter keystore password (remember this!)" -AsSecureString
$keystorePasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

$keyPassword = Read-Host "Enter key password (can be same as keystore)" -AsSecureString
$keyPasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

$fullName = Read-Host "Your full name"
$organization = Read-Host "Organization (default: publicGermany)" 
if ([string]::IsNullOrWhiteSpace($organization)) { $organization = "publicGermany" }

$city = Read-Host "City"
$state = Read-Host "State/Province"
$country = Read-Host "Country code (e.g., IN, US)"

Write-Host ""
Write-Host "🔨 Generating keystore..." -ForegroundColor Cyan

# Generate keystore using keytool
$keytoolCmd = "keytool -genkey -v -keystore publicgermany.keystore -alias publicgermany -keyalg RSA -keysize 2048 -validity 10000 -storepass `"$keystorePasswordText`" -keypass `"$keyPasswordText`" -dname `"CN=$fullName, OU=publicGermany, O=$organization, L=$city, ST=$state, C=$country`""

try {
    Invoke-Expression $keytoolCmd
    
    Write-Host ""
    Write-Host "✅ Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Location: $(Get-Location)\publicgermany.keystore" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT - Save this information:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "Keystore File: publicgermany.keystore" -ForegroundColor White
    Write-Host "Keystore Password: $keystorePasswordText" -ForegroundColor White
    Write-Host "Key Alias: publicgermany" -ForegroundColor White
    Write-Host "Key Password: $keyPasswordText" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💾 BACKUP THIS FILE AND PASSWORDS!" -ForegroundColor Red
    Write-Host "   If you lose them, you cannot update your app!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Backup publicgermany.keystore to a safe location" -ForegroundColor White
    Write-Host "2. Save passwords in a password manager" -ForegroundColor White
    Write-Host "3. Run: .\configure-signing.ps1" -ForegroundColor White
    Write-Host "4. Build signed APK in Android Studio" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Error generating keystore!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Java/keytool is installed and in PATH" -ForegroundColor Yellow
}
