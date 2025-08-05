#!/bin/bash

# Parliament Fuel System - Simplified Azure Startup
echo "🏛️ Starting Parliament Fuel System (Simplified)..."

# Set working directory
cd /home/site/wwwroot || exit 1

# Set Django environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"

# Check if requirements are already installed
if [ ! -d ".azure_deps_installed" ]; then
    echo "📦 Installing requirements..."
    python -m pip install -r requirements.txt --no-cache-dir
    touch .azure_deps_installed
else
    echo "📦 Requirements already installed, skipping..."
fi

# Try basic Django check first
echo "🔍 Testing Django configuration..."
python manage.py check --deploy || echo "⚠️ Django check failed - continuing anyway"

# Create health check endpoint test
echo "🏥 Testing health endpoints..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django
django.setup()
from django.test import Client
client = Client()
try:
    response = client.get('/health/simple/')
    print(f'Health check status: {response.status_code}')
except Exception as e:
    print(f'Health check failed: {e}')
" || echo "⚠️ Health check test failed"

# Run migrations only if database is available
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput || echo "⚠️ Migrations failed - database might not be available"

# Skip static files for now to avoid errors
echo "📁 Skipping static files collection for simplified startup..."

# Start with minimal configuration
echo "🚀 Starting gunicorn server on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind=0.0.0.0:${PORT:-8000} \
    --workers=1 \
    --timeout=120 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=debug \
    --capture-output
