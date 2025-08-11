#!/bin/bash
# URGENT: Azure Production Migration Fix
# Purpose: Fix ProgrammingError - column fuel_user.digital_signature does not exist

echo "🚨 URGENT: Applying missing migration to Azure production..."
echo "Migration: 0008_enhance_book_coupon_tracking"

# Show current migration status
echo "📋 Checking current migration status..."
python manage.py showmigrations fuel

# Apply the specific migration
echo "🔄 Applying migration 0008..."
python manage.py migrate fuel 0008_enhance_book_coupon_tracking

# Apply all remaining migrations
echo "🔄 Applying all migrations..."
python manage.py migrate

# Verify completion
echo "✅ Verifying migration status..."
python manage.py showmigrations fuel

echo "🎉 Migration completed! Production should now work."
