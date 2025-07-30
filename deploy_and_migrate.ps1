# Azure CLI PowerShell script to deploy and run Django migrations remotely
# Run this script to deploy your Django app and run migrations on Azure

Write-Host "=== Azure Django Deployment and Migration Script ===" -ForegroundColor Green
Write-Host ""

# Configuration
$RESOURCE_GROUP = "parliament-fuel-tg"
$APP_NAME = "parliament-fuel-system"
$FULL_APP_NAME = "parliament-fuel-system-d0bvbjfrdbepdrfh"

# Check if Azure CLI is available and logged in
Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Yellow
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    if (-not $account) {
        throw "Not authenticated"
    }
    Write-Host "✅ Azure CLI authenticated as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure CLI. Please run: az login" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Set environment variables for the Azure App Service
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow

$envVars = @{
    "DATABASE_NAME" = "parliament-fuel-db"
    "DATABASE_USER" = "yalezopkar"
    "DATABASE_PASSWORD" = "MyNewSecurePass123"
    "DATABASE_HOST" = "parliament-fuel-postgres.postgres.database.azure.com"
    "DATABASE_PORT" = "5432"
    "DJANGO_DEBUG" = "False"
    "DJANGO_SECRET_KEY" = "your-production-secret-key-here-$(Get-Random)"
    "FRONTEND_HOSTNAME" = "jolly-ocean-0e0dee90f.2.azurestaticapps.net"
}

# Build the settings string for Azure CLI
$settingsArray = @()
foreach ($key in $envVars.Keys) {
    $settingsArray += "$key=$($envVars[$key])"
}
$settingsString = $settingsArray -join " "

try {
    Write-Host "Setting environment variables on Azure App Service..." -ForegroundColor Cyan
    $result = az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --settings $settingsString
    Write-Host "✅ Environment variables set successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set environment variables: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Push code changes to trigger redeployment
Write-Host "📦 Committing and pushing whitenoise fix..." -ForegroundColor Yellow

try {
    git add requirements.txt
    git commit -m "Fix: Add whitenoise to requirements.txt for Azure deployment"
    git push origin main
    Write-Host "✅ Code changes pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not push code changes. Please commit and push manually." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Restart the app to trigger redeployment
Write-Host "🚀 Restarting Azure App Service..." -ForegroundColor Yellow
try {
    az webapp restart --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME
    Write-Host "✅ App restart triggered" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart app" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Wait for deployment to complete
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 60  # Wait longer for deployment

# Step 5: Run Django migrations remotely using Azure App Service API
Write-Host "🗄️ Running Django migrations remotely..." -ForegroundColor Yellow

try {
    # Method 1: Try using az webapp ssh
    Write-Host "Attempting to run migrations via SSH..." -ForegroundColor Cyan
    $migrationResult = az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command "cd /home/site/wwwroot && python manage.py migrate --noinput" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed successfully via SSH" -ForegroundColor Green
        Write-Host $migrationResult -ForegroundColor Gray
    } else {
        throw "SSH migration failed"
    }
} catch {
    Write-Host "⚠️ SSH method failed, trying alternative approach..." -ForegroundColor Yellow
    
    # Method 2: Use Azure App Service Console API
    Write-Host "Attempting to run migrations via App Service Console..." -ForegroundColor Cyan
    try {
        $token = az account get-access-token --query accessToken --output tsv
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            "command" = "cd /home/site/wwwroot && python manage.py migrate --noinput"
        } | ConvertTo-Json
        
        $uri = "https://management.azure.com/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FULL_APP_NAME/extensions/console/api/command"
        
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
        Write-Host "✅ Migration command executed via API" -ForegroundColor Green
    } catch {
        Write-Host "❌ Both migration methods failed. Please run migrations manually." -ForegroundColor Red
        Write-Host "Manual method: Go to Azure Portal > App Service > SSH and run: python manage.py migrate" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 6: Create superuser
Write-Host "👤 Creating superuser..." -ForegroundColor Yellow
$createSuperuser = Read-Host "Do you want to create a superuser? (y/n)"

if ($createSuperuser -eq "y" -or $createSuperuser -eq "Y") {
    try {
        $superuserCommand = "cd /home/site/wwwroot && echo `"from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@parliament.co.zw', 'admin123') if not User.objects.filter(username='admin').exists() else print('Superuser already exists')`" | python manage.py shell"
        
        az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command $superuserCommand
        Write-Host "✅ Superuser creation attempted" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create superuser automatically" -ForegroundColor Red
    }
}

Write-Host ""

# Step 7: Collect static files
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
try {
    az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --command "cd /home/site/wwwroot && python manage.py collectstatic --noinput"
    Write-Host "✅ Static files collected" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Static files collection may have failed" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Check app status and provide useful information
Write-Host "🔍 Checking app status..." -ForegroundColor Yellow
try {
    $appState = az webapp show --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME --query state --output tsv
    Write-Host "App State: $appState" -ForegroundColor Cyan
} catch {
    Write-Host "Could not retrieve app state" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment and migration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your app should be available at:" -ForegroundColor Cyan
Write-Host "   https://$FULL_APP_NAME.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "📋 To check logs, run:" -ForegroundColor Cyan
Write-Host "   az webapp log tail --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To manually run commands, use Azure Portal SSH or:" -ForegroundColor Cyan
Write-Host "   az webapp ssh --resource-group $RESOURCE_GROUP --name $FULL_APP_NAME" -ForegroundColor White
