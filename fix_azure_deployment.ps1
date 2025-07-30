# Azure Deployment Fix Script
# This script will help resolve the deployment issues

Write-Host "=== Azure Deployment Issue Resolution ===" -ForegroundColor Green
Write-Host ""

# Issue 1: GitHub Secrets Missing
Write-Host "GitHub Secrets Issue:" -ForegroundColor Yellow
Write-Host "The deployment is failing because AZURE_STATIC_WEB_APPS_API_TOKEN_PARLIAMENT_FUEL_FRONTEND is missing"
Write-Host ""

Write-Host "Steps to fix GitHub Secrets:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository: https://github.com/waltergkaturuza/Parliament-Zimbabwe"
Write-Host "2. Go to Settings > Secrets and variables > Actions"
Write-Host "3. Add new repository secret:"
Write-Host "   Name: AZURE_STATIC_WEB_APPS_API_TOKEN_PARLIAMENT_FUEL_FRONTEND"
Write-Host "   Value: [Get this from Azure Portal > Static Web Apps > parliament-fuel-frontend > Manage deployment token]"
Write-Host ""

# Issue 2: Backend App Service Deployment
Write-Host "Backend Deployment Fix:" -ForegroundColor Yellow
Write-Host "The backend is failing due to module import issues"
Write-Host ""

Write-Host "Steps to fix backend:" -ForegroundColor Cyan
Write-Host "1. Force redeploy the backend with proper dependencies"
Write-Host "2. Set environment variables in Azure App Service"
Write-Host "3. Run migrations remotely"
Write-Host ""

Write-Host "Running backend fixes..." -ForegroundColor Green

# Check if Azure CLI is available
try {
    $azVersion = az version 2>$null
    if ($azVersion) {
        Write-Host "Azure CLI is available" -ForegroundColor Green
        
        # Check if logged in
        $account = az account show 2>$null
        if ($account) {
            Write-Host "Logged into Azure CLI" -ForegroundColor Green
            
            # Set environment variables for backend
            Write-Host "Setting backend environment variables..." -ForegroundColor Yellow
            
            $envVars = @{
                "DATABASE_NAME" = "parliament-fuel-db"
                "DATABASE_USER" = "yalezopkar"
                "DATABASE_PASSWORD" = "MyNewSecurePass123"
                "DATABASE_HOST" = "parliament-fuel-postgres.postgres.database.azure.com"
                "DATABASE_PORT" = "5432"
                "DJANGO_SETTINGS_MODULE" = "config.settings"
                "DJANGO_SECRET_KEY" = "django-insecure-production-key-$(Get-Random)"
                "DJANGO_DEBUG" = "False"
            }
            
            foreach ($var in $envVars.GetEnumerator()) {
                Write-Host "Setting $($var.Key)..." -ForegroundColor Gray
                az webapp config appsettings set --resource-group "parliament-fuel-tg" --name "parliament-fuel-system-d0bvbjfrdbepdrfh" --settings "$($var.Key)=$($var.Value)" 2>$null
            }
            
            Write-Host "Environment variables set" -ForegroundColor Green
            
            # Restart the backend app
            Write-Host "Restarting backend app..." -ForegroundColor Yellow
            az webapp restart --resource-group "parliament-fuel-tg" --name "parliament-fuel-system-d0bvbjfrdbepdrfh"
            Write-Host "Backend restarted" -ForegroundColor Green
            
            # Run migrations remotely
            Write-Host "Running migrations remotely..." -ForegroundColor Yellow
            az webapp ssh --resource-group "parliament-fuel-tg" --name "parliament-fuel-system-d0bvbjfrdbepdrfh" --cmd "python manage.py migrate"
            
        } else {
            Write-Host "Not logged into Azure CLI. Run: az login" -ForegroundColor Red
        }
    } else {
        Write-Host "Azure CLI not available. Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    }
} catch {
    Write-Host "Error checking Azure CLI: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Manual Steps if CLI fails ===" -ForegroundColor Green
Write-Host "1. Azure Portal > App Services > parliament-fuel-system-d0bvbjfrdbepdrfh"
Write-Host "2. Go to Configuration > Application settings"
Write-Host "3. Add the database environment variables listed above"
Write-Host "4. Go to Development Tools > SSH and run: python manage.py migrate"
Write-Host ""
Write-Host "5. For frontend secrets:"
Write-Host "   - Azure Portal > Static Web Apps > parliament-fuel-frontend"
Write-Host "   - Copy the deployment token"
Write-Host "   - Add it to GitHub repository secrets"
