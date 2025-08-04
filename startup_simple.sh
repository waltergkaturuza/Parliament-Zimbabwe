#!/bin/bash

# Simplified Azure Startup Script
set -e

echo "🚀 Parliament Fuel System - Starting..."

# Set environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"

# Install requirements if needed
pip install -r requirements.txt --quiet --no-cache-dir || echo "Dependencies already installed"

# Collect static files
python manage.py collectstatic --noinput --clear || echo "Static files issue - continuing"

# Run migrations
python manage.py migrate --noinput || echo "Migration issue - continuing"

# Start the application
echo "🌐 Starting server on port ${PORT:-8000}..."
exec gunicorn --bind=0.0.0.0:${PORT:-8000} --workers=2 --timeout=600 config.wsgi:application
