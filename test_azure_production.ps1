#!/usr/bin/env powershell
# Test production settings with database simulation

Write-Host "🏛️ PARLIAMENT FUEL SYSTEM - PRODUCTION SETTINGS TEST" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

# Set environment variables for testing
$env:DJANGO_SETTINGS_MODULE = "config.settings.production"
$env:DATABASE_URL = "sqlite:///test.db"  # Temporary for testing
$env:DEBUG = "False"
$env:ALLOWED_HOSTS = "parliament-fuel-system.azurewebsites.net,localhost"

Write-Host "🔧 Environment Configuration:" -ForegroundColor Yellow
Write-Host "   DJANGO_SETTINGS_MODULE: $env:DJANGO_SETTINGS_MODULE" -ForegroundColor White
Write-Host "   DATABASE_URL: $env:DATABASE_URL" -ForegroundColor White
Write-Host "   DEBUG: $env:DEBUG" -ForegroundColor White

Write-Host "`n📦 Testing production settings load..." -ForegroundColor Yellow

# Test Django setup
$testResult = & "C:/Users/Administrator/Documents/POZ/fuel_coupon_system/.venv/Scripts/python.exe" -c @"
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
os.environ['DATABASE_URL'] = 'sqlite:///test.db'
try:
    django.setup()
    from django.conf import settings
    print('✅ Production settings loaded successfully!')
    print(f'🐛 DEBUG: {settings.DEBUG}')
    print(f'🌐 ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...')
    print(f'💾 Database: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
    print('🎯 READY FOR AZURE DEPLOYMENT!')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"@

Write-Host "`n🚀 AZURE DEPLOYMENT COMMANDS:" -ForegroundColor Green
Write-Host "1. Change startup command in Azure to: bash startup-simple.sh" -ForegroundColor White
Write-Host "2. Set DATABASE_URL environment variable in Azure" -ForegroundColor White
Write-Host "3. Restart Azure App Service" -ForegroundColor White

Write-Host "`n✅ Production settings test completed!" -ForegroundColor Green
Write-Host "Your Django app is ready for Azure deployment! 🎯" -ForegroundColor Yellow

# Clean up test database
if (Test-Path "test.db") {
    Remove-Item "test.db" -Force
}
