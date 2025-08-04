#!/bin/bash
# Simple Azure startup script
cd /home/site/wwwroot
python -m pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind=0.0.0.0:${PORT:-8000} --timeout 600
