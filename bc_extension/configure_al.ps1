# PowerShell script to configure AL extension for existing project
Write-Host "==========================================" -ForegroundColor Green
Write-Host " PARLIAMENT FUEL SYSTEM - AL CONFIGURATION" -ForegroundColor Green  
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Opening VS Code in current extension directory..." -ForegroundColor Yellow
Start-Process "code" -ArgumentList "." -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "MANUAL STEPS TO COMPLETE IN VS CODE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Press Ctrl + Shift + P" -ForegroundColor White
Write-Host "2. Type: AL: Download symbols" -ForegroundColor White
Write-Host "   (This will NOT create a new project)" -ForegroundColor Green
Write-Host ""
Write-Host "3. If connection dialog appears:" -ForegroundColor White
Write-Host "   - Server: https://businesscentral.dynamics.com" -ForegroundColor Yellow
Write-Host "   - Tenant: 086c4475-d0ef-4d2b-871c-4e078a083db5" -ForegroundColor Yellow
Write-Host "   - Environment: Production" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Authenticate with your Business Central account" -ForegroundColor White
Write-Host ""
Write-Host "5. Wait for symbols to download (may take 2-3 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "6. When symbols are ready:" -ForegroundColor White
Write-Host "   - Press Ctrl + Shift + P" -ForegroundColor White
Write-Host "   - Type: AL: Publish" -ForegroundColor White
Write-Host "   - Select 'Parliament Production' configuration" -ForegroundColor White
Write-Host ""
Write-Host "Your extension will be published to Business Central!" -ForegroundColor Green

Read-Host "Press Enter when you've completed the steps above"
