#!/bin/bash
# RENDER DIAGNOSTIC SCRIPT - Run this to understand the file structure

echo "🔍 RENDER ENVIRONMENT DIAGNOSTIC"
echo "================================="

echo ""
echo "📍 Current working directory:"
pwd

echo ""
echo "📁 Contents of /opt/render/project/:"
ls -la /opt/render/project/

echo ""
echo "📁 Contents of /opt/render/project/src/:"
ls -la /opt/render/project/src/

echo ""
echo "📁 Contents of /opt/render/project/src/backend/:"
ls -la /opt/render/project/src/backend/

echo ""
echo "🔍 Looking for settings.py files:"
find /opt/render/project/src -name "settings.py" -type f

echo ""
echo "🔍 Looking for backend directory structure:"
find /opt/render/project/src -name "backend" -type d

echo ""
echo "🔍 Contents of backend directory:"
if [ -d "/opt/render/project/src/backend/backend" ]; then
    echo "Found /opt/render/project/src/backend/backend/"
    ls -la /opt/render/project/src/backend/backend/
else
    echo "❌ /opt/render/project/src/backend/backend/ does not exist"
fi

echo ""
echo "🔍 Looking for manage.py:"
find /opt/render/project/src -name "manage.py" -type f

echo ""
echo "🔍 Python path test:"
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$PYTHONPATH"
echo "PYTHONPATH=$PYTHONPATH"

echo ""
echo "🔍 Testing Python imports:"
cd /opt/render/project/src
python -c "import sys; print('Python sys.path:'); [print(f'  {p}') for p in sys.path]"

echo ""
echo "🔍 Testing different settings imports:"
echo "Trying: import backend.settings"
python -c "try: import backend.settings; print('✅ backend.settings works'); except Exception as e: print(f'❌ backend.settings failed: {e}')"

echo ""
echo "🔍 Testing Django setup:"
cd /opt/render/project/src/backend
python -c "try: 
import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
print('✅ Django setup successful')
except Exception as e: 
print(f'❌ Django setup failed: {e}')
"

echo ""
echo "🔧 DIAGNOSTIC COMPLETE"
echo "======================"
