#!/bin/bash

#!/bin/bash
# Minimal startup script for debugging
echo "Starting Parliament Fuel System (Minimal)"
cd /home/site/wwwroot

export DJANGO_SETTINGS_MODULE=config.settings.production
python -c "import django; print('Django import OK')"

# Install critical dependencies
pip install daphne gunicorn djangorestframework django-cors-headers

# Run migrations without output
python manage.py migrate --run-syncdb &> /dev/null

# Collect static files quickly  
python manage.py collectstatic --noinput &> /dev/null

# Start with Gunicorn (more reliable than Daphne for debugging)
echo "Starting Gunicorn server..."
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120

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
