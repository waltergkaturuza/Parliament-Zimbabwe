#!/bin/bash

# Streamlined Azure App Service startup script
echo "=== Parliament Fuel Coupon System - Quick Start ==="

# Basic environment setup
export DJANGO_SETTINGS_MODULE=config.settings

# Install minimal dependencies only
echo "Installing core dependencies..."
pip install -r requirements-minimal.txt

# Basic Django setup
echo "Running migrations..."
python manage.py migrate --verbosity=1

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "=== Starting Gunicorn ==="
exec gunicorn --bind=0.0.0.0:8000 --workers=2 --timeout=60 config.wsgi:application
