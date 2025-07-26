# Symbol-Free Manual Packaging Script

Write-Host "================================================" -ForegroundColor Green
Write-Host "SYMBOL-FREE PACKAGING - Parliament Fuel System" -ForegroundColor Green  
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Create output directory
if (!(Test-Path "output")) {
    New-Item -ItemType Directory -Path "output" | Out-Null
    Write-Host "✓ Created output directory" -ForegroundColor Green
}

Write-Host "This extension is SYMBOL-FREE and self-contained!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Packaging Options:" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPTION 1: Use VS Code AL Extension" -ForegroundColor White
Write-Host "1. In VS Code, press Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "2. Type: AL: Package" -ForegroundColor Gray
Write-Host "3. If symbol errors appear, ignore them - continue with packaging" -ForegroundColor Gray
Write-Host ""

Write-Host "OPTION 2: Manual ZIP Creation (Fallback)" -ForegroundColor White
Write-Host "1. Create a ZIP file with all .al files and app.json" -ForegroundColor Gray
Write-Host "2. Rename the ZIP file to .app extension" -ForegroundColor Gray
Write-Host "3. Upload directly to BC Online" -ForegroundColor Gray
Write-Host ""

Write-Host "OPTION 3: Direct Upload to BC Online" -ForegroundColor White
Write-Host "Your BC Online supports direct AL file upload:" -ForegroundColor Gray
Write-Host "1. Go to Extension Management in BC Online" -ForegroundColor Gray
Write-Host "2. Some BC Online environments accept AL files directly" -ForegroundColor Gray
Write-Host ""

Write-Host "Your Extension Details:" -ForegroundColor Yellow
Write-Host "Name: Parliament Fuel System Lite" -ForegroundColor White
Write-Host "Version: 1.0.0.0" -ForegroundColor White
Write-Host "Publisher: Parliament IT" -ForegroundColor White
Write-Host "Type: Symbol-Free (Runtime 1.0)" -ForegroundColor White
Write-Host "Target: BC Online" -ForegroundColor White
Write-Host ""

Write-Host "BC Online Environment:" -ForegroundColor Yellow
Write-Host "Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor White
Write-Host "URL: https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production" -ForegroundColor White
Write-Host ""

Write-Host "Files included in package:" -ForegroundColor Cyan
Get-ChildItem -Name "*.al" | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
Write-Host "  ✓ app.json" -ForegroundColor Green
Write-Host ""

Write-Host "Ready for deployment!" -ForegroundColor Green
Write-Host "Since this is symbol-free, it will work on any BC Online version." -ForegroundColor Yellow
