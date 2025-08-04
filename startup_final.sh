#!/bin/bash

# Final production startup script for Azure App Service
# This script fixes the 502 Bad Gateway issue and ensures proper Django startup

echo "========================="
echo "STARTUP FINAL FIX v1.0"
echo "========================="
date

# First, check critical environment variables
echo "Environment Check:"
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-NOT SET}"
echo "DATABASE_URL exists: ${DATABASE_URL:+YES}"
echo "SECRET_KEY exists: ${SECRET_KEY:+YES}"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# Install missing dependencies if any (critical fix)
echo "Installing requirements..."
pip install -r requirements.txt --no-cache-dir

# Collect static files first
echo "Collecting static files..."
python manage.py collectstatic --noinput --verbosity=2

# Run migrations (critical for database consistency)
echo "Running database migrations..."
python manage.py migrate --verbosity=2

# Test Django configuration before starting server
echo "Testing Django configuration..."
python manage.py check --deploy

# Create superuser if needed (non-interactive)
echo "Ensuring superuser exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'temp123!')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Start gunicorn with production settings
echo "Starting gunicorn server..."
gunicorn config.wsgi:application \
    --bind=0.0.0.0:8000 \
    --workers=2 \
    --timeout=120 \
    --keep-alive=2 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info \
    --capture-output
