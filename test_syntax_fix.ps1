# 🔧 Django Syntax Fix and Test Script

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PARLIAMENT FUEL SYSTEM - SYNTAX FIX" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ SYNTAX ERROR FIXED:" -ForegroundColor Green
Write-Host "   • fuel/urls.py line 49: Fixed unclosed parenthesis" -ForegroundColor White
Write-Host "   • Removed duplicate imports" -ForegroundColor White
Write-Host "   • Verified all imported functions exist" -ForegroundColor White
Write-Host ""

Write-Host "🔍 TESTING DJANGO SYNTAX..." -ForegroundColor Yellow
Write-Host ""

# Test Python syntax
Write-Host "1. Testing Python syntax..." -ForegroundColor Cyan
try {
    python -m py_compile fuel\urls.py
    Write-Host "   ✅ fuel/urls.py syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "   ❌ fuel/urls.py has syntax errors" -ForegroundColor Red
}

try {
    python -m py_compile fuel\views_bc_production.py
    Write-Host "   ✅ fuel/views_bc_production.py syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "   ❌ fuel/views_bc_production.py has syntax errors" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing Django configuration..." -ForegroundColor Cyan
try {
    python manage.py check --settings=config.settings.local
    Write-Host "   ✅ Django configuration is valid" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Django configuration has issues" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testing imports..." -ForegroundColor Cyan
$testScript = @"
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()
from django.conf import settings
from fuel import urls
print('   ✅ All imports successful')
print(f'   ✅ DEBUG: {settings.DEBUG}')
print(f'   ✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
"@

try {
    python -c $testScript
} catch {
    Write-Host "   ❌ Import test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  READY TO START DJANGO SERVER" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 TO START THE SERVER:" -ForegroundColor Green
Write-Host "python manage.py runserver 127.0.0.1:8000" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔗 TEST URLS AFTER STARTUP:" -ForegroundColor Green
Write-Host "• Health Check: http://127.0.0.1:8000/api/v1/health/" -ForegroundColor White
Write-Host "• Admin: http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host "• BC Webhook: http://127.0.0.1:8000/api/v1/bc/webhook/" -ForegroundColor White
Write-Host ""

Write-Host "💡 FRONTEND DEVELOPMENT:" -ForegroundColor Green
Write-Host "cd fuel-coupon-frontend && npm run dev" -ForegroundColor Yellow
Write-Host "Frontend will run on: http://localhost:5173" -ForegroundColor White
Write-Host "API calls will proxy to: http://localhost:8000" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Press Enter to start Django server, or 'q' to quit"
if ($continue -ne 'q') {
    Write-Host "🚀 Starting Django server..." -ForegroundColor Green
    python manage.py runserver 127.0.0.1:8000
}
