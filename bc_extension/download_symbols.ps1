# Download symbols script for Business Central
Write-Host "Downloading symbols for Business Central..."

# Check if AL extension is installed
$alExtension = code --list-extensions | Where-Object { $_ -like "*ms-dynamics-smb.al*" }
if (-not $alExtension) {
    Write-Error "AL Language Extension is not installed!"
    exit 1
}

# Change to the extension directory
Set-Location "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"

# Clean symbols cache
Write-Host "Cleaning symbols cache..."
if (Test-Path ".alpackages") {
    Remove-Item -Path ".alpackages\*" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Please manually trigger 'AL: Download Symbols' from VS Code Command Palette (Ctrl+Shift+P)"
Write-Host "Or try reloading the VS Code window (Ctrl+Shift+P -> 'Developer: Reload Window')"
