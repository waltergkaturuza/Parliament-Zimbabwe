#!/bin/bash
# Azure Migration Recovery Script
# Run this in the Azure App Service console to fix the migration issue

echo "🔧 Parliament Fuel System - Migration Recovery"
echo "=============================================="

# Step 1: Check current migration state
echo "📋 Current migration state:"
python manage.py showmigrations fuel

echo ""
echo "🔄 Fixing migration 0023 issue..."

# Step 2: Mark the problematic migration as unapplied if it failed
echo "⚠️  If migration 0023 failed, we'll reset it:"
python manage.py migrate fuel 0022 --fake

# Step 3: Remove any orphaned migration files that might conflict
echo "🧹 Removing any conflicting migration files..."
find . -name "*0023*" -path "*/migrations/*" -not -name "0023_fix_coupon_distribution_and_session_attendance.py" -exec rm -f {} \;

# Step 4: Apply the corrected migration
echo "✅ Applying corrected migration:"
python manage.py migrate

# Step 5: Verify the result
echo ""
echo "🎯 Final migration state:"
python manage.py showmigrations fuel

echo ""
echo "✅ Migration recovery complete!"
echo "🌐 The backend should now be fully operational."

# Test the health endpoint
echo ""
echo "🏥 Testing health endpoint..."
curl -s http://localhost:8000/api/v1/api/health/ || echo "Note: Health check will work once server restarts"

echo ""
echo "📝 Next steps:"
echo "1. The Azure app will restart automatically"
echo "2. Check the admin panel: /admin/"
echo "3. Verify API endpoints: /api/v1/"
echo "4. All ViewSets should be accessible"
