# URGENT: Azure Production Migration Fix
# Purpose: Fix ProgrammingError - column fuel_user.digital_signature does not exist

Write-Host "🚨 URGENT: Applying missing migration to Azure production..." -ForegroundColor Red
Write-Host "Migration: 0008_enhance_book_coupon_tracking" -ForegroundColor Yellow

# Show current migration status
Write-Host "📋 Checking current migration status..." -ForegroundColor Cyan
python manage.py showmigrations fuel

# Apply the specific migration
Write-Host "🔄 Applying migration 0008..." -ForegroundColor Yellow
python manage.py migrate fuel 0008_enhance_book_coupon_tracking

# Apply all remaining migrations
Write-Host "🔄 Applying all migrations..." -ForegroundColor Yellow
python manage.py migrate

# Verify completion
Write-Host "✅ Verifying migration status..." -ForegroundColor Green
python manage.py showmigrations fuel

Write-Host "🎉 Migration completed! Production should now work." -ForegroundColor Green
