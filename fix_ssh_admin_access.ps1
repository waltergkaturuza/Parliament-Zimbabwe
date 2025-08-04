#!/usr/bin/env powershell
# Azure App Service SSH and Admin Access Diagnostic

Write-Host "🏛️ PARLIAMENT FUEL SYSTEM - SSH & ADMIN ACCESS FIX" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

Write-Host "`n🔍 DIAGNOSING AZURE APP SERVICE STATUS..." -ForegroundColor Yellow

# Check if Azure CLI is available
try {
    $azAccount = az account show 2>$null | ConvertFrom-Json
    if ($azAccount) {
        Write-Host "✅ Azure CLI logged in as: $($azAccount.user.name)" -ForegroundColor Green
        
        Write-Host "`n📊 Checking App Service Status..." -ForegroundColor Yellow
        $appStatus = az webapp show --resource-group "parliament-fuel-rg" --name "parliament-fuel-system" --query "state" -o tsv 2>$null
        
        if ($appStatus) {
            Write-Host "📱 App Service Status: $appStatus" -ForegroundColor $(if ($appStatus -eq "Running") { "Green" } else { "Red" })
        }
        
        # Get app service URL
        $appUrl = az webapp show --resource-group "parliament-fuel-rg" --name "parliament-fuel-system" --query "defaultHostName" -o tsv 2>$null
        if ($appUrl) {
            Write-Host "🌐 App URL: https://$appUrl" -ForegroundColor White
        }
        
        # Check if SSH is enabled
        Write-Host "`n🔧 SSH Access Options:" -ForegroundColor Yellow
        Write-Host "   1. Browser SSH: https://parliament-fuel-system.scm.azurewebsites.net/webssh/host" -ForegroundColor White
        Write-Host "   2. Kudu Console: https://parliament-fuel-system.scm.azurewebsites.net/DebugConsole" -ForegroundColor White
        Write-Host "   3. Azure CLI SSH: az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system" -ForegroundColor White
        
        # Try to restart app service
        Write-Host "`n🔄 Would you like to restart the App Service? (y/n): " -ForegroundColor Yellow -NoNewline
        $restart = Read-Host
        if ($restart -eq "y" -or $restart -eq "Y") {
            Write-Host "🔄 Restarting App Service..." -ForegroundColor Yellow
            az webapp restart --resource-group "parliament-fuel-rg" --name "parliament-fuel-system"
            Write-Host "✅ App Service restart initiated. Wait 2-3 minutes then test." -ForegroundColor Green
        }
        
    } else {
        Write-Host "❌ Azure CLI not logged in" -ForegroundColor Red
        Write-Host "   Run: az login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Azure CLI not available" -ForegroundColor Red
}

Write-Host "`n🚀 MANUAL FIXES TO TRY:" -ForegroundColor Green

Write-Host "`n1. 🔧 AZURE PORTAL FIXES:" -ForegroundColor Cyan
Write-Host "   • Go to: Azure Portal → parliament-fuel-system" -ForegroundColor White
Write-Host "   • Configuration → General Settings" -ForegroundColor White
Write-Host "   • Change startup command to: bash startup-simple.sh" -ForegroundColor Yellow
Write-Host "   • Save and Restart" -ForegroundColor White

Write-Host "`n2. 🌐 ENVIRONMENT VARIABLES:" -ForegroundColor Cyan
Write-Host "   • Configuration → Application Settings" -ForegroundColor White
Write-Host "   • Add: DJANGO_SETTINGS_MODULE = config.settings.production" -ForegroundColor Yellow
Write-Host "   • Add: DATABASE_URL = (your PostgreSQL connection string)" -ForegroundColor Yellow
Write-Host "   • Add: PYTHONPATH = /home/site/wwwroot" -ForegroundColor Yellow

Write-Host "`n3. 📋 SSH ACCESS METHODS:" -ForegroundColor Cyan
Write-Host "   • Browser SSH: Development Tools → SSH" -ForegroundColor White
Write-Host "   • Kudu Console: Advanced Tools → Go → Debug Console" -ForegroundColor White
Write-Host "   • Azure CLI: az webapp ssh --resource-group parliament-fuel-rg --name parliament-fuel-system" -ForegroundColor White

Write-Host "`n4. 🔐 ADMIN PAGE ACCESS:" -ForegroundColor Cyan
Write-Host "   • Once app is running, go to: https://parliament-fuel-system.azurewebsites.net/admin/" -ForegroundColor White
Write-Host "   • If no admin user, create via SSH: python manage.py createsuperuser" -ForegroundColor Yellow

Write-Host "`n🎯 TROUBLESHOOTING CHECKLIST:" -ForegroundColor Green
Write-Host "   ☐ App Service Status = Running" -ForegroundColor White
Write-Host "   ☐ Startup command = bash startup-simple.sh" -ForegroundColor White
Write-Host "   ☐ DATABASE_URL environment variable set" -ForegroundColor White
Write-Host "   ☐ DJANGO_SETTINGS_MODULE = config.settings.production" -ForegroundColor White
Write-Host "   ☐ Check Log Stream for errors" -ForegroundColor White

Write-Host "`n📞 TEST URLS AFTER FIXES:" -ForegroundColor Yellow
Write-Host "   • Health: https://parliament-fuel-system.azurewebsites.net/" -ForegroundColor White
Write-Host "   • Admin: https://parliament-fuel-system.azurewebsites.net/admin/" -ForegroundColor White
Write-Host "   • API: https://parliament-fuel-system.azurewebsites.net/api/health/" -ForegroundColor White

Write-Host "`n✅ Run this script again after making changes to verify status!" -ForegroundColor Green

Read-Host "`nPress Enter to continue"
