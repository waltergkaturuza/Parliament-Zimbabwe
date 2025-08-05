#!/bin/bash

# Parliament Fuel System - Azure App Service Startup Script
echo "🚀 Parliament Fuel System - Azure Deployment Starting..."
echo "=========================================================="

# Set environment
export DJANGO_SETTINGS_MODULE=config.settings.production
export PYTHONPATH="/home/site/wwwroot:$PYTHONPATH"

# Navigate to app directory
cd /home/site/wwwroot

# Show Python and Django versions
echo "🐍 Python Environment:"
python --version
pip --version

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
print(f'   ALLOWED_HOSTS: {len(settings.ALLOWED_HOSTS)} hosts configured')
print(f'   CORS_ALLOWED_ORIGINS: {len(settings.CORS_ALLOWED_ORIGINS)} origins configured')
"

# Install dependencies if needed
echo "📦 Installing Dependencies..."
pip install -r requirements.txt --no-cache-dir

# Collect static files
echo "📁 Collecting Static Files..."
python manage.py collectstatic --noinput --clear

# Database migrations
echo "📊 Running Database Migrations..."
python manage.py migrate --run-syncdb

# Create superuser (if needed)
echo "👤 Creating Admin User (if needed)..."
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
    print(f'⚠️ Admin user creation: {e}')
"

# Load initial data
echo "💾 Loading Initial Data..."
python manage.py shell -c "
from fuel.models import FuelData
if not FuelData.objects.exists():
    FuelData.objects.create(
        petrol_price_usd=1.45,
        diesel_price_usd=1.38,
        usd_zwg_exchange_rate=28.50
    )
    print('✅ Initial fuel data created')
else:
    print('✅ Fuel data already exists')
"

# Start the application
echo "🚀 Starting Gunicorn Server..."
echo "   Listening on 0.0.0.0:8000"
echo "   CORS enabled for frontend domains"
echo "   Production settings active"
echo "=========================================================="

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --worker-class gthread \
    --threads 2 \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 30 \
    --keep-alive 2 \
    --access-logfile '-' \
    --error-logfile '-' \
    --log-level info 
    --workers 4 
    --worker-class sync 
    --worker-connections 1000 
    --max-requests 1000 
    --max-requests-jitter 100 
    --timeout 120 
    --keep-alive 2 
    --access-logfile '-' 
    --error-logfile '-' 
    --log-level info 
    --capture-outputStartup Script (Optimized)
# Version: 2.2 - Faster startup for Azure App Service

set -e  # Exit on any error

echo "🚀 Parliament Fuel System - Production Startup (Fast Mode)"
echo "=========================================================="
echo "📅 Startup Time: $(date)"

# Environment Setup - FORCE production settings
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"
export PORT="${PORT:-8000}"
export WEBSITES_PORT="${WEBSITES_PORT:-8000}"
export PYTHONUNBUFFERED=1

# Confirm settings module
echo "🔧 Environment Configuration:"
echo "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "   PYTHONPATH: $PYTHONPATH"
echo "   PORT: $PORT"
echo "   Working Directory: $(pwd)"
echo "   Python Version: $(python --version)"

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Dependencies (streamlined)..."
    pip install --upgrade pip --quiet
    pip install -r requirements.txt --no-cache-dir --quiet
else
    echo "❌ requirements.txt not found!"
    exit 1
fi

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
