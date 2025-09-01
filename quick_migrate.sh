#!/bin/bash
# Quick migration script for Render shell
# Usage: bash quick_migrate.sh

cd /opt/render/project/src/backend && \
export DJANGO_SETTINGS_MODULE=backend.settings && \
export PYTHONPATH="/opt/render/project/src:$PYTHONPATH" && \
echo "Running Django migrations..." && \
python manage.py migrate --verbosity=2 && \
echo "✓ Migrations completed successfully!" && \
echo "Checking migration status..." && \
python manage.py showmigrations fuel | tail -5 && \
echo "✓ Ready to test API endpoints!"
