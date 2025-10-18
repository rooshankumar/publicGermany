$source = "C:\Users\priya\Downloads\IconKitchen-Output\android\res"
$dest = "d:\Roshan\my-germany-path\android\app\src\main\res"

Write-Host "Copying icons from Icon Kitchen..."

Copy-Item -Path "$source\mipmap-*" -Destination $dest -Recurse -Force

Write-Host "✅ Icons copied successfully!"
Write-Host "Now run: npx cap sync android"
