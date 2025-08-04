# PowerShell script to fix Azure App Service startup command

Write-Host "🔧 Fixing Azure App Service Startup Command..." -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed and logged in
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "✅ Azure CLI logged in as: $($account.user.name)" -ForegroundColor Green
        
        # Fix the startup command
        Write-Host "🔄 Setting correct startup command..." -ForegroundColor Yellow
        
        # Option 1: Try with startup script
        az webapp config set --resource-group "parliament-fuel-rg" --name "parliament-fuel-system" --startup-file "bash startup.sh"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Startup command set successfully!" -ForegroundColor Green
            Write-Host "Command set to: bash startup.sh" -ForegroundColor White
        } else {
            Write-Host "⚠️ Script method failed, trying direct gunicorn..." -ForegroundColor Yellow
            
            # Option 2: Direct gunicorn command
            az webapp config set --resource-group "parliament-fuel-rg" --name "parliament-fuel-system" --startup-file "gunicorn config.wsgi:application --bind=0.0.0.0:8000"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Direct gunicorn command set!" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to set startup command via CLI" -ForegroundColor Red
            }
        }
        
        # Restart the app service
        Write-Host "🔄 Restarting App Service..." -ForegroundColor Yellow
        az webapp restart --resource-group "parliament-fuel-rg" --name "parliament-fuel-system"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ App Service restarted successfully!" -ForegroundColor Green
        }
        
    } else {
        Write-Host "❌ Azure CLI not logged in" -ForegroundColor Red
        Write-Host "Please run: az login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Azure CLI not installed or not available" -ForegroundColor Red
    Write-Host "Please install Azure CLI or fix startup manually in Azure Portal" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Manual Fix Instructions (if CLI failed):" -ForegroundColor Cyan
Write-Host "1. Go to Azure Portal" -ForegroundColor White
Write-Host "2. Navigate to parliament-fuel-system App Service" -ForegroundColor White
Write-Host "3. Go to Configuration > General settings" -ForegroundColor White
Write-Host "4. In 'Startup Command' field, enter:" -ForegroundColor White
Write-Host "   bash startup.sh" -ForegroundColor Yellow
Write-Host "5. Click Save and then Restart the app" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Alternative startup commands to try:" -ForegroundColor Cyan
Write-Host "   Option 1: bash startup.sh" -ForegroundColor White
Write-Host "   Option 2: gunicorn config.wsgi:application --bind=0.0.0.0:8000" -ForegroundColor White
Write-Host "   Option 3: python -m gunicorn config.wsgi:application" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
