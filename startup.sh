#!/bin/bash

# Azure App Service Startup Script for Parliament Fuel System
# Enhanced version with comprehensive error handling
set -e  # Exit on any error

echo "🚀 Starting Parliament Fuel System Django Application"
echo "=================================================="

# Set environment variables
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"config.settings.production"}
export PYTHONPATH=${PYTHONPATH:-"/home/site/wwwroot"}
export PORT=${PORT:-8000}

# Print environment info
echo "🔧 Environment Configuration:"
echo "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "   PYTHONPATH: $PYTHONPATH"
echo "   PORT: $PORT"
echo "   WEBSITES_PORT: $WEBSITES_PORT"
echo "   Python Version: $(python --version)"
echo "   Working Directory: $(pwd)"

# Install dependencies with error handling
echo "📦 Installing Dependencies..."
if ! pip install -r requirements.txt --no-cache-dir; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Test Django configuration
echo "🔍 Testing Django Configuration..."
if ! python -c "
try:
    import django
    django.setup()
    from django.conf import settings
    print('✅ Django settings loaded successfully')
    print(f'   Database Engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
    print(f'   Allowed Hosts: {settings.ALLOWED_HOSTS[:3]}...')
    print('✅ Django configuration test passed')
except Exception as e:
    print(f'❌ Django configuration error: {e}')
    exit(1)
"; then
    echo "❌ Django configuration test failed"
    exit 1
fi

# Deploy check (with timeout)
echo "🛡️ Running Deployment Security Check..."
timeout 60 python manage.py check --deploy || echo "⚠️ Deploy check had issues - continuing"

# Collect static files (with timeout and error handling)
echo "📁 Collecting Static Files..."
if ! timeout 90 python manage.py collectstatic --noinput; then
    echo "⚠️ Static files collection failed - continuing with startup"
fi

# Run database migrations (with timeout)
echo "📊 Running Database Migrations..."
if ! timeout 180 python manage.py migrate --noinput; then
    echo "⚠️ Database migration failed - continuing with startup"
    echo "   This might be due to database connectivity issues"
fi

# Create superuser if needed
echo "👤 Setting up Admin User..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2025!')
        print('✅ Admin user created successfully')
    else:
        print('✅ Admin user already exists')
except Exception as e:
    print(f'⚠️ Admin user setup issue: {e}')
" || echo "⚠️ Admin user setup had issues - continuing"

echo "🌐 Starting Gunicorn Server..."
echo "   Binding to: 0.0.0.0:$PORT"
echo "   Workers: 2"
echo "   Timeout: 600 seconds"

# Start gunicorn with production-ready configuration
exec gunicorn \
    --bind=0.0.0.0:$PORT \
    --workers=2 \
    --timeout=600 \
    --keep-alive=2 \
    --max-requests=1000 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    --preload \
    config.wsgi:application
