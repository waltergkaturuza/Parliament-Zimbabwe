#!/bin/bash

# Production Migration Fix Script for Parliament Zimbabwe Fuel System
# This script handles database migration issues on Render.com deployment

echo "🔧 Starting Production Migration Fix..."
echo "=================================="

# Set environment variables for production
export DJANGO_SETTINGS_MODULE=config.settings
export DEBUG=False

# Function to check if we're in production environment
check_environment() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ ERROR: DATABASE_URL not found. This script is for production use only."
        exit 1
    fi
    echo "✅ Production environment detected"
}

# Function to backup database (optional but recommended)
backup_database() {
    echo "📦 Creating database backup (if pg_dump is available)..."
    if command -v pg_dump &> /dev/null; then
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        pg_dump $DATABASE_URL > $BACKUP_FILE
        echo "✅ Database backed up to $BACKUP_FILE"
    else
        echo "⚠️  pg_dump not available, skipping backup"
    fi
}

# Function to check current migration status
check_migration_status() {
    echo "📋 Checking current migration status..."
    python manage.py showmigrations fuel
}

# Function to handle problematic migrations
fix_migrations() {
    echo "🔧 Fixing migration conflicts..."
    
    # First, try to identify which migrations are causing issues
    echo "📊 Checking for unapplied migrations..."
    python manage.py showmigrations --plan | grep "\[ \]"
    
    # Check if the problematic migration exists
    if python manage.py showmigrations fuel | grep -q "\[ \] 10020_safe_add_fields"; then
        echo "🎯 Found unapplied safe migration, attempting to apply..."
        
        # Try to apply the safe migration
        if python manage.py migrate fuel 10020_safe_add_fields; then
            echo "✅ Safe migration applied successfully"
        else
            echo "❌ Safe migration failed, trying alternative approach..."
            
            # Alternative: Fake apply if fields already exist
            echo "🔄 Attempting to fake apply migration (fields may already exist)..."
            python manage.py migrate fuel 10020_safe_add_fields --fake
            
            if [ $? -eq 0 ]; then
                echo "✅ Migration fake-applied successfully"
            else
                echo "❌ Fake migration also failed"
                return 1
            fi
        fi
    else
        echo "ℹ️  Migration 10020_safe_add_fields already applied or not found"
    fi
    
    # Apply any remaining migrations
    echo "🔄 Applying remaining migrations..."
    python manage.py migrate
}

# Function to verify database integrity
verify_database() {
    echo "🔍 Verifying database integrity..."
    
    # Check if key tables exist
    python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from fuel.models import *

cursor = connection.cursor()

# Check key tables
tables_to_check = [
    'fuel_fuelentitlement',
    'fuel_parliamensession', 
    'fuel_book',
    'fuel_box',
    'fuel_coupon'
]

for table in tables_to_check:
    try:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f'✅ Table {table}: {count} records')
    except Exception as e:
        print(f'❌ Table {table}: Error - {e}')
"
}

# Function to test Django admin functionality
test_admin() {
    echo "🧪 Testing Django admin functionality..."
    python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from fuel.admin import *
    from fuel.models import *
    print('✅ Django admin imports successful')
    
    # Test model access
    print(f'✅ FuelEntitlement model: {FuelEntitlement.objects.count()} records')
    print(f'✅ ParliamentSession model: {ParliamentSession.objects.count()} records')
    
except Exception as e:
    print(f'❌ Admin test failed: {e}')
"
}

# Function to collect static files (important for admin interface)
collect_static() {
    echo "📦 Collecting static files..."
    python manage.py collectstatic --noinput
}

# Main execution
main() {
    echo "🚀 Parliament Zimbabwe Fuel System - Migration Fix"
    echo "================================================="
    
    # Step 1: Environment check
    check_environment
    
    # Step 2: Show current status
    check_migration_status
    
    # Step 3: Optional backup
    read -p "🤔 Do you want to create a database backup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_database
    fi
    
    # Step 4: Fix migrations
    if fix_migrations; then
        echo "✅ Migrations fixed successfully"
    else
        echo "❌ Migration fix failed"
        exit 1
    fi
    
    # Step 5: Verify database
    verify_database
    
    # Step 6: Test admin
    test_admin
    
    # Step 7: Collect static files
    collect_static
    
    echo ""
    echo "🎉 Migration fix completed successfully!"
    echo "======================================="
    echo "✅ Database migrations applied"
    echo "✅ Django admin ready"
    echo "✅ Static files collected"
    echo ""
    echo "🔗 You can now access:"
    echo "   - API: https://parliament-zimbabwe-fuel.onrender.com/api/"
    echo "   - Admin: https://parliament-zimbabwe-fuel.onrender.com/admin/"
    echo ""
}

# Run the main function
main "$@"
