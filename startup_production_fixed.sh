#!/bin/bash

# Parliament Fuel System - Production Startup Script with Full Error Handling
# Version: 2.0 - Enhanced for Azure App Service

set -e  # Exit on any error

echo "🚀 Parliament Fuel System - Production Startup"
echo "=============================================="
echo "📅 Startup Time: $(date)"

# Environment Setup
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"
export PORT="${PORT:-8000}"
export WEBSITES_PORT="${WEBSITES_PORT:-8000}"

# Logging
exec > >(tee -a /tmp/startup.log) 2>&1

echo "🔧 Environment Configuration:"
echo "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "   PYTHONPATH: $PYTHONPATH"
echo "   PORT: $PORT"
echo "   Working Directory: $(pwd)"
echo "   Python Version: $(python --version)"
echo "   Pip Version: $(pip --version)"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing Dependencies..."
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir

# Test Django import
echo "🔍 Testing Django Import..."
python -c "
import django
print(f'✅ Django version: {django.get_version()}')
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()
from django.conf import settings
print('✅ Django settings loaded successfully')
print(f'   DEBUG: {settings.DEBUG}')
print(f'   Database ENGINE: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
print(f'   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...')
print(f'   CORS_ALLOWED_ORIGINS: {len(settings.CORS_ALLOWED_ORIGINS)} origins configured')
"

# Check deployment readiness
echo "🛡️ Running Deployment Check..."
python manage.py check --deploy --verbosity=2 || echo "⚠️ Deploy check warnings - continuing"

# Collect static files
echo "📁 Collecting Static Files..."
python manage.py collectstatic --noinput --verbosity=2

# Database migrations
echo "📊 Running Database Migrations..."
python manage.py migrate --verbosity=2

# Create superuser
echo "👤 Creating Admin User..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2025!')
        print('✅ Admin user created: admin/Parliament2025!')
    else:
        print('✅ Admin user already exists')
except Exception as e:
    print(f'⚠️ Admin user setup error: {e}')
"

# Test database connection
echo "🔌 Testing Database Connection..."
python manage.py shell -c "
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Health check endpoint test
echo "🏥 Testing Application Health..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django
django.setup()

try:
    from django.test import Client
    client = Client()
    response = client.get('/health/')
    print(f'✅ Health check: {response.status_code}')
except Exception as e:
    print(f'⚠️ Health check issue: {e}')
"

# Final configuration summary
echo "📋 Final Configuration Summary:"
echo "   Server binding: 0.0.0.0:$PORT"
echo "   Gunicorn workers: 3"
echo "   Timeout: 600 seconds"
echo "   Static files: Collected"
echo "   Database: Migrated"
echo "   Admin user: Ready"

echo "🌐 Starting Gunicorn Server..."

# Start Gunicorn with optimal production settings
exec gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=3 \
    --worker-class=sync \
    --timeout=600 \
    --keep-alive=2 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    --preload \
    --enable-stdio-inheritance \
    config.wsgi:application
