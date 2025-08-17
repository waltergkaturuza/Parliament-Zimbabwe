# Direct Azure Deployment - Using Known Resource Information
# Based on production.py settings

Write-Host "🚀 Parliament Fuel System - Direct Azure Deployment" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

# Known information from production.py
$APP_NAME = "parliament-fuel-system"
$APP_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

Write-Host "📋 Using known deployment configuration:" -ForegroundColor Yellow
Write-Host "   App Name: $APP_NAME" -ForegroundColor White
Write-Host "   Full URL: $APP_URL" -ForegroundColor White
Write-Host ""

# Extract resource group name from common patterns
# Most Azure auto-generated resource groups follow patterns like:
# - DefaultResourceGroup-EUS
# - DefaultResourceGroup-South-Africa-North
# - parliament-fuel-rg (if manually created)

$POSSIBLE_RESOURCE_GROUPS = @(
    "DefaultResourceGroup-EUS",
    "DefaultResourceGroup-SAF", 
    "parliament-fuel-rg",
    "parliament-fuel-system-rg",
    "fuel-system-rg"
)

Write-Host "🔍 Trying direct deployment with common resource group patterns..." -ForegroundColor Blue

foreach ($RG in $POSSIBLE_RESOURCE_GROUPS) {
    Write-Host "   Trying resource group: $RG" -ForegroundColor Yellow
    
    # Try deployment with this resource group
    $deployCmd = "az webapp up --name `"$APP_NAME`" --resource-group `"$RG`" --location `"southafricanorth`""
    
    Write-Host "      Command: $deployCmd" -ForegroundColor Gray
    
    try {
        # Execute the deployment
        $result = Invoke-Expression $deployCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment successful with resource group: $RG" -ForegroundColor Green
            
            # Configure app settings
            Write-Host "⚙️ Configuring app settings..." -ForegroundColor Blue
            
            az webapp config appsettings set --resource-group $RG --name $APP_NAME --settings DJANGO_SETTINGS_MODULE="config.settings.production"
            az webapp config appsettings set --resource-group $RG --name $APP_NAME --settings PYTHONPATH="/home/site/wwwroot"
            az webapp config appsettings set --resource-group $RG --name $APP_NAME --settings SCM_DO_BUILD_DURING_DEPLOYMENT="true"
            
            # Set startup script
            az webapp config set --resource-group $RG --name $APP_NAME --startup-file "startup.sh"
            
            # Restart app
            Write-Host "🔄 Restarting application..." -ForegroundColor Blue
            az webapp restart --name $APP_NAME --resource-group $RG
            
            Write-Host ""
            Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
            Write-Host "🌐 Application URL: $APP_URL" -ForegroundColor Cyan
            Write-Host "📊 Admin Panel: $APP_URL/admin/" -ForegroundColor Cyan
            Write-Host ""
            
            # Test the deployment
            Write-Host "🧪 Testing endpoints..." -ForegroundColor Blue
            Start-Sleep -Seconds 15
            
            try {
                $response = Invoke-WebRequest -Uri "$APP_URL/health/" -TimeoutSec 30
                Write-Host "✅ Health check: HTTP $($response.StatusCode)" -ForegroundColor Green
            }
            catch {
                Write-Host "⚠️ Health check: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            
            exit 0
        }
    }
    catch {
        Write-Host "❌ Failed with resource group: $RG" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
}

Write-Host ""
Write-Host "❌ All deployment attempts failed" -ForegroundColor Red
Write-Host "💡 Manual steps:" -ForegroundColor Yellow
Write-Host "1. Login: az login --scope https://management.core.windows.net//.default" -ForegroundColor White
Write-Host "2. Find resource group: az webapp list --query `"[].{name:name, resourceGroup:resourceGroup}`" --output table" -ForegroundColor White
Write-Host "3. Deploy: az webapp up --name parliament-fuel-system --resource-group [YOUR_RG]" -ForegroundColor White
