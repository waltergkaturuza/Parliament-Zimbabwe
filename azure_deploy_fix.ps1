# Azure Deployment & Fix Script (PowerShell)
# This script deploys the enhanced backend and fixes database issues

Write-Host "🚀 AZURE DEPLOYMENT & 500 ERROR FIX" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "manage.py")) {
    Write-Error "manage.py not found. Please run this script from the Django project root."
    exit 1
}

Write-Status "Starting Azure deployment and fix process..."

# 1. Install any missing dependencies
Write-Status "Installing dependencies..."
try {
    pip install -r requirements.txt
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Warning "Some dependencies may have failed to install"
}

# 2. Collect static files
Write-Status "Collecting static files..."
try {
    python manage.py collectstatic --noinput
    Write-Success "Static files collected"
} catch {
    Write-Error "Failed to collect static files"
}

# 3. Run the migration fix
Write-Status "Running migration fix for Azure..."
try {
    python azure_migration_fix.py
    Write-Success "Migration fix completed"
} catch {
    Write-Error "Migration fix failed"
}

# 4. Apply any remaining migrations
Write-Status "Applying migrations..."
try {
    python manage.py makemigrations
    python manage.py migrate
    Write-Success "Migrations applied successfully"
} catch {
    Write-Error "Migration failed"
}

# 5. Create superuser if needed (optional)
Write-Status "Checking for admin user..."
python -c @"
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('No superuser found. You may want to create one manually.')
else:
    print('Superuser exists.')
"@

# 6. Run diagnostic script
Write-Status "Running Azure diagnostics..."
try {
    python azure_500_error_diagnostic.py
    Write-Success "Diagnostics completed"
} catch {
    Write-Warning "Diagnostics had issues"
}

# 7. Test key endpoints
Write-Status "Testing critical endpoints..."

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Name
    )
    
    Write-Status "Testing $Name endpoint..."
    
    # Get the app URL from environment or use localhost
    $AppUrl = $env:WEBSITE_HOSTNAME
    if (-not $AppUrl) {
        $AppUrl = "localhost:8000"
    }
    
    if ($AppUrl -notlike "http*") {
        $AppUrl = "https://$AppUrl"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$AppUrl$Endpoint" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "$Name endpoint working (200)"
        } else {
            Write-Warning "$Name endpoint returned ($($response.StatusCode))"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Warning "$Name endpoint requires authentication ($statusCode)"
        } else {
            Write-Error "$Name endpoint failed ($statusCode)"
        }
    }
}

# Test endpoints
Test-Endpoint "/api/v1/analytics/received-breakdown/" "Analytics Received Breakdown"
Test-Endpoint "/api/v1/analytics/available-by-center/" "Analytics Available by Center"
Test-Endpoint "/api/v1/boxes/" "Boxes API"
Test-Endpoint "/api/v1/health/" "Health Check"

# 8. Show environment status
Write-Status "Environment Information:"
$databaseUrl = $env:DATABASE_URL
if ($databaseUrl) {
    Write-Host "  DATABASE_URL: $($databaseUrl.Substring(0, [Math]::Min(30, $databaseUrl.Length)))..."
} else {
    Write-Host "  DATABASE_URL: Not set"
}
Write-Host "  DEBUG: $($env:DEBUG)"
Write-Host "  ALLOWED_HOSTS: $($env:ALLOWED_HOSTS)"
Write-Host "  WEBSITE_HOSTNAME: $($env:WEBSITE_HOSTNAME)"

# 9. Final recommendations
Write-Host ""
Write-Status "DEPLOYMENT COMPLETE!"
Write-Host ""
Write-Status "If you're still seeing 500 errors:"
Write-Host "  1. Check the application logs in Azure Portal"
Write-Host "  2. Verify environment variables are set correctly"
Write-Host "  3. Ensure DATABASE_URL points to your PostgreSQL database"
Write-Host "  4. Check that all migrations have been applied"
Write-Host ""
Write-Status "To monitor ongoing issues:"
Write-Host "  - Run: python azure_500_error_diagnostic.py"
Write-Host "  - Check logs: az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG"
Write-Host ""

# 10. Optional: Restart the web app if on Azure
if ($env:WEBSITE_HOSTNAME) {
    Write-Status "Detected Azure environment. Consider restarting the web app:"
    Write-Host "  az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG"
}

Write-Success "Deployment script completed!"
