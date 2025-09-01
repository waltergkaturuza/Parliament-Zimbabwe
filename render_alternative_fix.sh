#!/bin/bash
# ALTERNATIVE RENDER MIGRATION APPROACH
# This bypasses PYTHONPATH issues by using Django's built-in mechanisms

echo "🚀 ALTERNATIVE RENDER MIGRATION APPROACH"
echo "========================================"

# Navigate to the backend directory where manage.py is located
cd /opt/render/project/src/backend

echo "📍 Current directory: $(pwd)"
echo ""

# List contents to verify we're in the right place
echo "📁 Contents of current directory:"
ls -la

echo ""
echo "🔍 Looking for settings module directly:"
if [ -f "backend/settings.py" ]; then
    echo "✅ Found backend/settings.py"
else
    echo "❌ backend/settings.py not found"
    echo "Looking for settings files:"
    find . -name "settings.py" -type f
fi

echo ""
echo "🔧 METHOD 1: Using Django's default approach"
echo "============================================"

# Set minimal environment - let Django find settings relative to manage.py
unset PYTHONPATH
export DJANGO_SETTINGS_MODULE="backend.settings"

echo "Testing basic Django command:"
python manage.py --version

echo ""
echo "Testing settings access:"
python manage.py check --deploy --fail-level=WARNING 2>/dev/null || echo "Settings check had warnings (normal for production)"

echo ""
echo "🗂️  Checking migration status:"
python manage.py showmigrations fuel --verbosity=0 2>/dev/null | tail -10 || echo "Migration check failed"

echo ""
echo "🚀 Attempting migration:"
python manage.py migrate --verbosity=1

echo ""
echo "🔧 METHOD 2: Direct Python approach"
echo "===================================="

# Try direct Python setup
python << 'EOF'
import os
import sys
import django

# Add current directory to path
sys.path.insert(0, os.getcwd())

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    django.setup()
    print("✅ Django setup successful")
    
    # Test model import
    from fuel.models import PoliticalParty
    print("✅ PoliticalParty model imported successfully")
    
    # Test URL reverse
    from django.urls import reverse
    url = reverse('politicalparty-list')
    print(f"✅ API endpoint registered: {url}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
EOF

echo ""
echo "🔧 METHOD 3: Alternative settings path"
echo "====================================="

# Try different settings module configurations
for settings_module in "backend.settings" "settings" "backend.backend.settings"; do
    echo "Testing DJANGO_SETTINGS_MODULE=$settings_module"
    export DJANGO_SETTINGS_MODULE="$settings_module"
    python -c "
try:
    import django
    from django.conf import settings
    django.setup()
    print(f'✅ {settings_module} works!')
except Exception as e:
    print(f'❌ {settings_module} failed: {e}')
" 2>/dev/null
done

echo ""
echo "🎯 FINAL ATTEMPT"
echo "================"

# Reset and try the most likely working configuration
cd /opt/render/project/src/backend
export DJANGO_SETTINGS_MODULE="backend.settings"
unset PYTHONPATH

echo "Final migration attempt with clean environment:"
python manage.py migrate --verbosity=2 2>&1 | head -20

echo ""
echo "🔍 Final status check:"
python manage.py showmigrations fuel 2>/dev/null | tail -5 || echo "Status check failed"

echo ""
echo "✅ Script completed!"
