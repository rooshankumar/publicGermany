$keystorePath = "$env:USERPROFILE\.android\debug.keystore"

Write-Host "Getting SHA-1 fingerprint from debug keystore..."
Write-Host ""

keytool -list -v -keystore $keystorePath -alias androiddebugkey -storepass android -keypass android | Select-String "SHA1"

Write-Host ""
Write-Host "Copy the SHA1 value above and use it in Google Cloud Console"
