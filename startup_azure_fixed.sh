#!/bin/bash
# Reliable Azure Startup Script
set -euo pipefail

echo "[STARTUP] Starting Django application for Azure..."

# Set defaults for required environment variables
export PORT=${PORT:-8000}
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.production}

echo "[STARTUP] Port: $PORT"
echo "[STARTUP] Django settings: $DJANGO_SETTINGS_MODULE"

# Run migrations if in production
if [ "$DJANGO_SETTINGS_MODULE" = "config.settings.production" ]; then
    echo "[STARTUP] Running migrations..."
    python manage.py migrate --noinput || echo "[STARTUP] Migration failed - continuing"
    
    echo "[STARTUP] Collecting static files..."
    python manage.py collectstatic --noinput --clear || echo "[STARTUP] Static collection failed - continuing"
fi

# Check if daphne is available for WebSocket support
if command -v daphne >/dev/null 2>&1; then
    echo "[STARTUP] Starting Daphne for ASGI/WebSocket support..."
    exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
elif command -v gunicorn >/dev/null 2>&1; then
    echo "[STARTUP] Starting Gunicorn..."
    exec gunicorn config.wsgi:application --bind=0.0.0.0:$PORT --workers=2 --timeout=600
else
    echo "[STARTUP] No server found, using Django runserver..."
    exec python manage.py runserver 0.0.0.0:$PORT
fi
