#!/bin/bash
# EMERGENCY RENDER MIGRATION FIX
# Run this in Render shell to fix the Python path and migration issues

echo "🔧 Emergency Render Migration Fix - Parliament Zimbabwe"
echo "====================================================="

# First, let's understand the current directory structure
echo "📁 Current directory structure:"
pwd
ls -la

echo ""
echo "📁 Contents of /opt/render/project/src:"
ls -la /opt/render/project/src/

echo ""
echo "📁 Contents of backend directory:"
ls -la /opt/render/project/src/backend/

echo ""
echo "🔍 Checking if settings.py exists:"
ls -la /opt/render/project/src/backend/backend/

echo ""
echo "🚀 FIXED MIGRATION COMMANDS:"
echo "============================="

# Navigate to the correct directory
cd /opt/render/project/src

# Set correct Python path (the key fix!)
export PYTHONPATH="/opt/render/project/src:/opt/render/project/src/backend:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="backend.settings"

echo "✅ Environment variables set:"
echo "PYTHONPATH=$PYTHONPATH"
echo "DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
echo ""

# Change to backend directory for manage.py commands
cd /opt/render/project/src/backend

echo "📍 Current working directory: $(pwd)"
echo ""

echo "🔍 Testing Django setup..."
python -c "import django; print(f'Django version: {django.get_version()}')"

echo ""
echo "🔍 Testing settings import..."
python -c "from backend import settings; print('✅ Settings imported successfully')"

echo ""
echo "🗂️  Checking migration status..."
python manage.py showmigrations fuel | tail -10

echo ""
echo "🚀 Running migrations..."
python manage.py migrate --verbosity=2

echo ""
echo "✅ Final migration status check:"
python manage.py showmigrations fuel | tail -5

echo ""
echo "🧪 Testing PoliticalParty model..."
python -c "from fuel.models import PoliticalParty; print('✅ PoliticalParty model accessible')"

echo ""
echo "🧪 Testing API endpoints..."
python -c "from django.urls import reverse; print('✅ API endpoint:', reverse('politicalparty-list'))"

echo ""
echo "🎉 Migration fix completed!"
echo "=========================="
echo "Next: Test these URLs in your browser:"
echo "- https://parliament-zimbabwe.onrender.com/api/v1/political-parties/"
echo "- https://parliament-zimbabwe.onrender.com/api/v1/political-parties/statistics/"
