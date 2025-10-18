@echo off
echo Copying app logo to all locations...

REM Create directories
mkdir android\app\src\main\res\drawable 2>nul
mkdir android\app\src\main\res\mipmap-hdpi 2>nul
mkdir android\app\src\main\res\mipmap-mdpi 2>nul
mkdir android\app\src\main\res\mipmap-xhdpi 2>nul
mkdir android\app\src\main\res\mipmap-xxhdpi 2>nul
mkdir android\app\src\main\res\mipmap-xxxhdpi 2>nul

REM Copy to splash screen
copy /Y public\logos.png android\app\src\main\res\drawable\splash.png

REM Copy to all mipmap folders
copy /Y public\logos.png android\app\src\main\res\mipmap-hdpi\ic_launcher.png
copy /Y public\logos.png android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png

copy /Y public\logos.png android\app\src\main\res\mipmap-mdpi\ic_launcher.png
copy /Y public\logos.png android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png

copy /Y public\logos.png android\app\src\main\res\mipmap-xhdpi\ic_launcher.png
copy /Y public\logos.png android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png

copy /Y public\logos.png android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png
copy /Y public\logos.png android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png

copy /Y public\logos.png android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png
copy /Y public\logos.png android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png

echo.
echo Done! Logo copied to all locations.
echo.
echo Next steps:
echo 1. npm run build
echo 2. npx cap sync android
echo 3. Rebuild APK in Android Studio
pause
