# Render Migration Script for Parliament Zimbabwe (PowerShell Version)
# This script can be run in the Render shell to manually execute Django migrations

Write-Host "==================================================" -ForegroundColor Green
Write-Host "Parliament Zimbabwe - Django Migration Script" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Date: $(Get-Date)"
Write-Host "Environment: Production (Render.com)"
Write-Host ""

# Set environment variables for production
$env:DJANGO_SETTINGS_MODULE = "backend.settings"
$env:PYTHONPATH = "/opt/render/project/src;$env:PYTHONPATH"

# Change to the backend directory
try {
    Set-Location "/opt/render/project/src/backend"
    Write-Host "Current directory: $(Get-Location)"
} catch {
    Write-Host "ERROR: Could not change to backend directory" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check Django installation and version
Write-Host "1. Checking Django installation..."
try {
    $djangoVersion = python -c "import django; print(f'Django version: {django.get_version()}')"
    Write-Host $djangoVersion
    Write-Host "✓ Django is available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Django not found or not properly installed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check database connectivity
Write-Host "2. Checking database connectivity..."
try {
    python manage.py dbshell --command="SELECT 1;" 2>$null
    Write-Host "✓ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Database connection test failed - continuing anyway" -ForegroundColor Yellow
}
Write-Host ""

# Show current migration status
Write-Host "3. Current migration status:"
Write-Host "----------------------------------------"
$migrations = python manage.py showmigrations fuel
$migrations | Select-Object -First 20
Write-Host "..."
$migrations | Select-Object -Last 10
Write-Host "----------------------------------------"
Write-Host ""

# Check for unapplied migrations
Write-Host "4. Checking for unapplied migrations..."
$unappliedCount = (python manage.py showmigrations --plan | Select-String "\[ \]").Count
Write-Host "Number of unapplied migrations: $unappliedCount"
Write-Host ""

if ($unappliedCount -gt 0) {
    Write-Host "5. Found unapplied migrations. Running migration..."
    Write-Host "----------------------------------------"
    
    # Run migrations with verbose output
    try {
        python manage.py migrate --verbosity=2
        Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "----------------------------------------"
        Write-Host "Showing recent migration files for debugging:"
        Get-ChildItem fuel/migrations/ | Sort-Object LastWriteTime | Select-Object -Last 10
        Write-Host ""
        Write-Host "Checking for migration conflicts..."
        python manage.py showmigrations fuel | Select-String "(10014|10015|10016|10017|10018)"
        exit 1
    }
} else {
    Write-Host "5. No unapplied migrations found - database is up to date" -ForegroundColor Green
}

Write-Host ""
Write-Host "6. Final migration status check:"
Write-Host "----------------------------------------"
python manage.py showmigrations fuel | Select-Object -Last 10
Write-Host "----------------------------------------"
Write-Host ""

# Verify critical models exist
Write-Host "7. Verifying critical models..."
try {
    python -c @"
from fuel.models import PoliticalParty, BeneficiaryProfile, User
print('✓ PoliticalParty model accessible')
print('✓ BeneficiaryProfile model accessible') 
print('✓ User model accessible')
print('All critical models verified successfully')
"@
    Write-Host "✓ All critical models verified successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Model verification failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test API endpoint registration
Write-Host "8. Testing API endpoint registration..."
try {
    python -c @"
from django.urls import reverse
try:
    url = reverse('politicalparty-list')
    print(f'✓ Political parties API endpoint registered: {url}')
except:
    print('ERROR: Political parties API endpoint not registered')
    exit(1)
"@
    Write-Host "✓ API endpoint test passed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: API endpoint test failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==================================================" -ForegroundColor Green
Write-Host "✓ Migration script completed successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test API endpoints:"
Write-Host "   - GET /api/v1/political-parties/"
Write-Host "   - GET /api/v1/political-parties/active_parties/"
Write-Host "   - GET /api/v1/political-parties/statistics/"
Write-Host ""
Write-Host "2. Access Django Admin:"
Write-Host "   - Navigate to /admin/"
Write-Host "   - Look for 'Political Parties' section"
Write-Host ""
Write-Host "3. Monitor application logs for any issues"
Write-Host ""
Write-Host "Script completed at: $(Get-Date)"
