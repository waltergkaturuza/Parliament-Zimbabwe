# URGENT: Manual Azure Deployment Commands
# Copy and paste these commands one by one to deploy the box_code fix

# 1. First, login to Azure (run this in your terminal)
Write-Host "🔐 Step 1: Login to Azure" -ForegroundColor Yellow
Write-Host "az login" -ForegroundColor Cyan
Write-Host ""

# 2. Set the subscription (if needed)
Write-Host "💳 Step 2: Set subscription (if you have multiple)" -ForegroundColor Yellow  
Write-Host "az account set --subscription '77afc77a-93cd-43d5-ab2d-151f5ea770b4'" -ForegroundColor Cyan
Write-Host ""

# 3. Trigger deployment sync
Write-Host "🚀 Step 3: Deploy to Azure App Service" -ForegroundColor Yellow
Write-Host "az webapp deployment source sync --name 'parliament-fuel-system-d0bvbjfrdbepdrfh' --resource-group 'DefaultResourceGroup-EAN'" -ForegroundColor Cyan
Write-Host ""

# 4. Alternative: Restart the app to pull latest code
Write-Host "🔄 Step 4: Alternative - Restart app service" -ForegroundColor Yellow
Write-Host "az webapp restart --name 'parliament-fuel-system-d0bvbjfrdbepdrfh' --resource-group 'DefaultResourceGroup-EAN'" -ForegroundColor Cyan
Write-Host ""

# 5. Check deployment status
Write-Host "📊 Step 5: Check deployment logs" -ForegroundColor Yellow
Write-Host "az webapp log tail --name 'parliament-fuel-system-d0bvbjfrdbepdrfh' --resource-group 'DefaultResourceGroup-EAN'" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Expected Result: No more '400 Bad Request - box code already exists' errors!" -ForegroundColor Green
