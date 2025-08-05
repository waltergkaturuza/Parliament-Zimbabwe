#!/bin/bash

# Pre-deployment validation script
echo "🔍 PRE-DEPLOYMENT VALIDATION"
echo "============================"

# Check requirements.txt
echo "📦 Checking requirements.txt..."
if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt exists"
    echo "   Dependencies: $(cat requirements.txt | grep -v '^#' | grep -v '^$' | wc -l) packages"
else
    echo "❌ requirements.txt missing!"
    exit 1
fi

# Check Django settings
echo "🔧 Checking Django settings..."
if [ -f "config/settings/production.py" ]; then
    echo "✅ Production settings exist"
    # Check for critical settings
    if grep -q "parliament-fuel-system.azurewebsites.net" config/settings/production.py; then
        echo "✅ Correct backend URL configured"
    else
        echo "⚠️  Backend URL may be incorrect"
    fi
else
    echo "❌ Production settings missing!"
    exit 1
fi

# Check manage.py
echo "📋 Checking Django project structure..."
if [ -f "manage.py" ]; then
    echo "✅ manage.py exists"
else
    echo "❌ manage.py missing!"
    exit 1
fi

# Check models
echo "📊 Checking models..."
if [ -f "fuel/models.py" ]; then
    echo "✅ Fuel models exist"
else
    echo "❌ Fuel models missing!"
    exit 1
fi

# Check startup script
echo "🚀 Checking startup script..."
if [ -f "startup.sh" ]; then
    echo "✅ startup.sh exists"
    chmod +x startup.sh
else
    echo "⚠️  startup.sh missing (will use default)"
fi

# Test Django import locally
echo "🧪 Testing Django configuration..."
export DJANGO_SETTINGS_MODULE=config.settings.production

python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
try:
    django.setup()
    from django.conf import settings
    print('✅ Django settings load successfully')
    print(f'   ALLOWED_HOSTS: {len(settings.ALLOWED_HOSTS)} configured')
    print(f'   CORS_ALLOWED_ORIGINS: {len(settings.CORS_ALLOWED_ORIGINS)} configured')
    
    # Test models
    from fuel.models import FuelData, User
    print('✅ Models import successfully')
    
    # Test views
    from fuel.views import FuelDataViewSet
    print('✅ Views import successfully')
    
except Exception as e:
    print(f'❌ Django configuration error: {e}')
    exit(1)
"

echo ""
echo "🎯 VALIDATION COMPLETE"
echo "======================"
echo "✅ Ready for Azure deployment!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Production deployment ready'"
echo "3. git push origin main"
echo ""
