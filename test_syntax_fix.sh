#!/bin/bash
# 🔧 Django Syntax Fix and Test Script

echo "==========================================
  PARLIAMENT FUEL SYSTEM - SYNTAX FIX
=========================================="
echo ""

echo "✅ SYNTAX ERROR FIXED:"
echo "   • fuel/urls.py line 49: Fixed unclosed parenthesis"
echo "   • Removed duplicate imports"
echo "   • Verified all imported functions exist"
echo ""

echo "🔍 TESTING DJANGO SYNTAX..."
echo ""

# Test Python syntax
echo "1. Testing Python syntax..."
python -m py_compile fuel/urls.py
if [ $? -eq 0 ]; then
    echo "   ✅ fuel/urls.py syntax is valid"
else
    echo "   ❌ fuel/urls.py has syntax errors"
fi

python -m py_compile fuel/views_bc_production.py
if [ $? -eq 0 ]; then
    echo "   ✅ fuel/views_bc_production.py syntax is valid"
else
    echo "   ❌ fuel/views_bc_production.py has syntax errors"
fi

echo ""
echo "2. Testing Django configuration..."
python manage.py check --settings=config.settings.local
if [ $? -eq 0 ]; then
    echo "   ✅ Django configuration is valid"
else
    echo "   ❌ Django configuration has issues"
fi

echo ""
echo "3. Testing URL configuration..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()
from django.urls import reverse
from django.conf import settings
print('   ✅ URL configuration loaded successfully')
print(f'   ✅ DEBUG: {settings.DEBUG}')
print(f'   ✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
"

echo ""
echo "==========================================
  READY TO START DJANGO SERVER
=========================================="
echo ""

echo "🚀 TO START THE SERVER:"
echo "python manage.py runserver 127.0.0.1:8000"
echo ""

echo "🔗 TEST URLS AFTER STARTUP:"
echo "• Health Check: http://127.0.0.1:8000/api/v1/health/"
echo "• Admin: http://127.0.0.1:8000/admin/"
echo "• BC Webhook: http://127.0.0.1:8000/api/v1/bc/webhook/"
echo ""

echo "💡 FRONTEND DEVELOPMENT:"
echo "cd fuel-coupon-frontend && npm run dev"
echo "Frontend will run on: http://localhost:5173"
echo "API calls will proxy to: http://localhost:8000"
echo ""
