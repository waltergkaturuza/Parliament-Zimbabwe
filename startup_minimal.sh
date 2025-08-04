#!/bin/bash

# Minimal Azure Startup for Parliament Fuel System
echo "🚀 Parliament Fuel System - Starting..."

# Set environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"

# Change to app directory
cd /home/site/wwwroot

# Quick dependency check
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

# Essential migrations only
python manage.py migrate --noinput

# Create admin user
python -c "
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2024!')
    print('Admin created: admin/Parliament2024!')
"

# Collect static files
python manage.py collectstatic --noinput --clear

echo "✅ Starting server..."
echo "Admin: https://parliament-fuel-system.azurewebsites.net/admin/"

#!/bin/bash

# Emergency minimal startup for immediate Azure fix
echo "=== MINIMAL STARTUP SCRIPT ==="
echo "Time: $(date)"
echo "Working dir: $(pwd)"

# Start gunicorn directly with minimal config
echo "Starting gunicorn server..."
exec gunicorn config.wsgi:application 
    --bind=0.0.0.0:8000 
    --workers=1 
    --timeout=60 
    --access-logfile=- 
    --error-logfile=- 
    --log-level=info
