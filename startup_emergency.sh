#!/bin/bash

# Emergency Azure Startup - Ultra Minimal
echo "🚨 EMERGENCY STARTUP - Parliament Fuel System"

# Set basic environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"
export PORT=${PORT:-8000}

# Navigate to app
cd /home/site/wwwroot

echo "📍 Current directory: $(pwd)"
echo "📁 Files present:"
ls -la

# Check Python and Django
echo "🐍 Python version: $(python --version)"
echo "📦 Django check:"
python -c "import django; print(f'Django version: {django.get_version()}')" || echo "❌ Django import failed"

# Install requirements with error handling
echo "📦 Installing requirements..."
pip install --no-cache-dir -r requirements.txt 2>&1 | tail -10

# Test Django settings
echo "⚙️ Testing Django settings..."
python manage.py check --settings=config.settings.production 2>&1 | tail -10

# Quick migration without failing
echo "🗄️ Database setup..."
python manage.py migrate --noinput 2>&1 | tail -5

# Create admin with error handling
echo "👤 Admin setup..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django
django.setup()
from django.contrib.auth import get_user_model
try:
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2024!')
        print('✅ Admin created')
    else:
        print('✅ Admin exists')
except Exception as e:
    print(f'⚠️ Admin setup: {e}')
" 2>&1

# Static files
echo "📁 Static files..."
python manage.py collectstatic --noinput 2>&1 | tail -5

# Final check
echo "🔍 Final Django check..."
python manage.py check 2>&1 | tail -5

echo "🚀 Starting Gunicorn..."
echo "   Binding to: 0.0.0.0:$PORT"

# Start with maximum logging
exec gunicorn config.wsgi:application \
    --bind=0.0.0.0:$PORT \
    --workers=1 \
    --timeout=120 \
    --log-level=debug \
    --access-logfile=- \
    --error-logfile=- \
    --capture-output
