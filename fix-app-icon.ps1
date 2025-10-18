# Fix App Icon and Splash Screen

Write-Host "🎨 Setting up app logo and splash screen..." -ForegroundColor Green

$logoSource = "public\logos.png"
$splashDest = "android\app\src\main\res\drawable\splash.png"

# Check if source logo exists
if (!(Test-Path $logoSource)) {
    Write-Host "❌ Logo not found at: $logoSource" -ForegroundColor Red
    exit
}

# Create drawable directory if it doesn't exist
$drawableDir = "android\app\src\main\res\drawable"
if (!(Test-Path $drawableDir)) {
    New-Item -ItemType Directory -Path $drawableDir -Force | Out-Null
}

# Copy logo as splash screen
Copy-Item $logoSource -Destination $splashDest -Force

Write-Host "✅ Splash screen updated with your logo!" -ForegroundColor Green
Write-Host "Location: $splashDest" -ForegroundColor Cyan

# Also copy to all mipmap folders for app icon
$mipmapFolders = @(
    "android\app\src\main\res\mipmap-hdpi",
    "android\app\src\main\res\mipmap-mdpi",
    "android\app\src\main\res\mipmap-xhdpi",
    "android\app\src\main\res\mipmap-xxhdpi",
    "android\app\src\main\res\mipmap-xxxhdpi"
)

foreach ($folder in $mipmapFolders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    Copy-Item $logoSource -Destination "$folder\ic_launcher.png" -Force
    Copy-Item $logoSource -Destination "$folder\ic_launcher_round.png" -Force
}

Write-Host "✅ App icons updated in all resolutions!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next: Rebuild APK to see changes" -ForegroundColor Cyan
Write-Host 'npx cap sync android' -ForegroundColor White
