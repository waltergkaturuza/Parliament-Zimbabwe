# Azure Login and Deployment Helper
# Run this step by step

Write-Host "🔐 Azure Login Required" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Login to Azure CLI" -ForegroundColor Green
Write-Host "Please run the following command manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "az login --scope https://management.core.windows.net//.default" -ForegroundColor Cyan
Write-Host ""
Write-Host "After successful login, run this script again to continue deployment." -ForegroundColor Yellow
Write-Host ""

# Check if already logged in
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "✅ Already logged in as: $($account.user.name)" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Step 2: Finding your Azure resources..." -ForegroundColor Green
        
        # Try to list webapps
        try {
            $webapps = az webapp list --output json | ConvertFrom-Json
            
            Write-Host "Found web apps:" -ForegroundColor Yellow
            foreach ($app in $webapps) {
                Write-Host "   📱 $($app.name)" -ForegroundColor Cyan
                Write-Host "      Resource Group: $($app.resourceGroup)" -ForegroundColor White
                Write-Host "      URL: https://$($app.defaultHostName)" -ForegroundColor White
                Write-Host ""
            }
            
            # Look for parliament fuel system
            $targetApp = $webapps | Where-Object { $_.name -like "*parliament*" -or $_.name -like "*fuel*" }
            
            if ($targetApp) {
                Write-Host "🎯 Found target app: $($targetApp.name)" -ForegroundColor Green
                Write-Host "   Resource Group: $($targetApp.resourceGroup)" -ForegroundColor White
                Write-Host "   Status: $($targetApp.state)" -ForegroundColor White
                Write-Host ""
                
                # Save the details for next deployment
                $deploymentInfo = @{
                    appName = $targetApp.name
                    resourceGroup = $targetApp.resourceGroup
                    url = "https://$($targetApp.defaultHostName)"
                }
                
                $deploymentInfo | ConvertTo-Json | Out-File -FilePath "azure_deployment_info.json"
                Write-Host "✅ Saved deployment info to azure_deployment_info.json" -ForegroundColor Green
                
                Write-Host ""
                Write-Host "Step 3: Ready to deploy!" -ForegroundColor Green
                Write-Host "Run: az webapp up --name '$($targetApp.name)' --resource-group '$($targetApp.resourceGroup)'" -ForegroundColor Cyan
            }
        }
        catch {
            Write-Host "❌ Error accessing Azure resources: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "You may need to login again with the management scope." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "❌ Not logged in to Azure CLI" -ForegroundColor Red
    Write-Host "Please run: az login --scope https://management.core.windows.net//.default" -ForegroundColor Yellow
}
