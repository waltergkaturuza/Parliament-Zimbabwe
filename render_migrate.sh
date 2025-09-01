#!/bin/bash

# Render Migration Script for Parliament Zimbabwe
# This script can be run in the Render shell to manually execute Django migrations
# Usage: Run this script in the Render shell environment

echo "=================================================="
echo "Parliament Zimbabwe - Django Migration Script"
echo "=================================================="
echo "Date: $(date)"
echo "Environment: Production (Render.com)"
echo ""

# Set environment variables for production
export DJANGO_SETTINGS_MODULE=backend.settings
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH"

# Change to the backend directory
cd /opt/render/project/src/backend || {
    echo "ERROR: Could not change to backend directory"
    exit 1
}

echo "Current directory: $(pwd)"
echo ""

# Check Django installation and version
echo "1. Checking Django installation..."
python -c "import django; print(f'Django version: {django.get_version()}')" || {
    echo "ERROR: Django not found or not properly installed"
    exit 1
}
echo "✓ Django is available"
echo ""

# Check database connectivity
echo "2. Checking database connectivity..."
python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1 && {
    echo "✓ Database connection successful"
} || {
    echo "WARNING: Database connection test failed - continuing anyway"
}
echo ""

# Show current migration status
echo "3. Current migration status:"
echo "----------------------------------------"
python manage.py showmigrations fuel | head -20
echo "..."
python manage.py showmigrations fuel | tail -10
echo "----------------------------------------"
echo ""

# Check for unapplied migrations
echo "4. Checking for unapplied migrations..."
UNAPPLIED=$(python manage.py showmigrations --plan | grep -c "\[ \]")
echo "Number of unapplied migrations: $UNAPPLIED"
echo ""

if [ "$UNAPPLIED" -gt 0 ]; then
    echo "5. Found unapplied migrations. Running migration..."
    echo "----------------------------------------"
    
    # Run migrations with verbose output
    python manage.py migrate --verbosity=2 || {
        echo ""
        echo "ERROR: Migration failed!"
        echo "----------------------------------------"
        echo "Showing recent migration files for debugging:"
        ls -la fuel/migrations/ | tail -10
        echo ""
        echo "Checking for migration conflicts..."
        python manage.py showmigrations fuel | grep -E "(10014|10015|10016|10017|10018)"
        exit 1
    }
    
    echo "✓ Migrations completed successfully"
else
    echo "5. No unapplied migrations found - database is up to date"
fi

echo ""
echo "6. Final migration status check:"
echo "----------------------------------------"
python manage.py showmigrations fuel | tail -10
echo "----------------------------------------"
echo ""

# Verify critical models exist
echo "7. Verifying critical models..."
python -c "
from fuel.models import PoliticalParty, BeneficiaryProfile, User
print('✓ PoliticalParty model accessible')
print('✓ BeneficiaryProfile model accessible') 
print('✓ User model accessible')
print('All critical models verified successfully')
" || {
    echo "ERROR: Model verification failed"
    exit 1
}
echo ""

# Test API endpoint registration
echo "8. Testing API endpoint registration..."
python -c "
from django.urls import reverse
try:
    url = reverse('politicalparty-list')
    print(f'✓ Political parties API endpoint registered: {url}')
except:
    print('ERROR: Political parties API endpoint not registered')
    exit(1)
" || {
    echo "ERROR: API endpoint test failed"
    exit 1
}
echo ""

echo "=================================================="
echo "✓ Migration script completed successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Test API endpoints:"
echo "   - GET /api/v1/political-parties/"
echo "   - GET /api/v1/political-parties/active_parties/"
echo "   - GET /api/v1/political-parties/statistics/"
echo ""
echo "2. Access Django Admin:"
echo "   - Navigate to /admin/"
echo "   - Look for 'Political Parties' section"
echo ""
echo "3. Monitor application logs for any issues"
echo ""
echo "Script completed at: $(date)"
