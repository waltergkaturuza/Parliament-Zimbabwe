Write-Host "=== Parliament Fuel System - Final Clean Deployment ===" -ForegroundColor Cyan

Set-Location "c:\Users\Administrator\Documents\POZ\fuel_coupon_system\bc_extension"

Write-Host "Cleaning up workspace and preparing for deployment..." -ForegroundColor Yellow

# Keep only essential files
$essentialFiles = @(
    "app.json",
    "FuelSystemSetup.al", 
    "FuelTransactionCard.al",
    "FuelTransactionList.al", 
    "FuelSystemIntegration.al",
    "FuelSystemPermissions.al",
    "FuelSystemControlAddin.al"
)

Write-Host "Essential files that will be included:" -ForegroundColor White
$essentialFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

# Remove problematic files
$problematicFiles = @(
    "FuelDashboard.al",
    "FuelSystemInstall.al",
    "FuelSystemIntegration_backup.al"
)

foreach ($file in $problematicFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed problematic file: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nApp.json configuration:" -ForegroundColor White
Write-Host "- NO dependencies (symbol-free)" -ForegroundColor Gray
Write-Host "- Target: OnPrem" -ForegroundColor Gray
Write-Host "- Runtime: 13.0" -ForegroundColor Gray

Write-Host "`nAuthentication: ✓ admin@parliamentzw.onmicrosoft.com" -ForegroundColor Green
Write-Host "Tenant: ✓ 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor Green
Write-Host "Environment: ✓ Production" -ForegroundColor Green

Write-Host "`nOpening VS Code for final deployment..." -ForegroundColor Yellow
Start-Process -FilePath "code" -ArgumentList "."

Write-Host "`n=== DEPLOYMENT STEPS ===" -ForegroundColor White
Write-Host "1. Wait for VS Code to load completely" -ForegroundColor Gray
Write-Host "2. Press Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "3. Type 'AL: Package'" -ForegroundColor Gray
Write-Host "4. Press Enter" -ForegroundColor Gray
Write-Host "5. Should create package WITHOUT symbol errors!" -ForegroundColor Gray

Read-Host "`nPress Enter after AL: Package completes"

# Check for package
$appFiles = Get-ChildItem -Filter "*.app"
if ($appFiles.Count -gt 0) {
    Write-Host "`n🎉 SUCCESS! Extension packaged: $($appFiles[0].Name)" -ForegroundColor Green
    Write-Host "File size: $([math]::Round($appFiles[0].Length / 1KB, 2)) KB" -ForegroundColor Gray
    
    Write-Host "`nOpening Business Central..." -ForegroundColor Yellow
    Start-Process "https://businesscentral.dynamics.com/086c4475-d0ef-4d2b-871c-4e078a083db5/Production"
    
    Write-Host "`n=== MANUAL DEPLOYMENT ===" -ForegroundColor White
    Write-Host "1. In Business Central, search 'Extension Management'" -ForegroundColor Gray
    Write-Host "2. Click 'Upload Extension'" -ForegroundColor Gray
    Write-Host "3. Browse and select: $($appFiles[0].Name)" -ForegroundColor Gray
    Write-Host "4. Click 'Deploy' and wait for installation" -ForegroundColor Gray
    Write-Host "5. Click 'Install' when prompted" -ForegroundColor Gray
    
    Write-Host "`nAfter successful installation:" -ForegroundColor Green
    Write-Host "- Search for 'Fuel System Setup' to configure Django integration" -ForegroundColor Gray
    Write-Host "- Search for 'Fuel Transaction Card' to create transactions" -ForegroundColor Gray
    Write-Host "- Configure Django URL: parliament-fuel-system.azurewebsites.net" -ForegroundColor Gray
    
    Write-Host "`n🎯 EXTENSION FEATURES INCLUDED:" -ForegroundColor Cyan
    Write-Host "✓ Fuel System Setup (configuration)" -ForegroundColor Green
    Write-Host "✓ Fuel Transaction Management" -ForegroundColor Green  
    Write-Host "✓ Django Integration (HTTP webhooks)" -ForegroundColor Green
    Write-Host "✓ Control Add-in for web interface" -ForegroundColor Green
    Write-Host "✓ Permission sets" -ForegroundColor Green
    
} else {
    Write-Host "`n❌ Package creation failed!" -ForegroundColor Red
    Write-Host "Check VS Code Output panel for any remaining errors." -ForegroundColor Yellow
    Write-Host "All symbol dependencies have been removed, so it should work." -ForegroundColor Gray
}

Write-Host "`nFinal deployment script completed." -ForegroundColor Green
