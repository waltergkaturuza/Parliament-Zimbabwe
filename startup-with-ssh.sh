#!/bin/bash

# Parliament Fuel System - Azure Startup with SSH Support
echo "🏛️ Starting Parliament Fuel System..."

# Enable SSH for debugging
echo "🔧 Configuring SSH access..."
service ssh start 2>/dev/null || echo "⚠️ SSH service not available"

# Set working directory
cd /home/site/wwwroot || exit 1

# Set Django environment
export DJANGO_SETTINGS_MODULE="config.settings.production"
export PYTHONPATH="/home/site/wwwroot"

echo "📦 Installing requirements..."
python -m pip install -r requirements.txt --no-cache-dir

echo "🗄️ Running database migrations..."
python manage.py migrate --noinput || echo "⚠️ Migrations failed - continuing"

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ Static collection failed - continuing"

echo "👤 Setting up default admin user..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'AdminPass2025!')
    print('✅ Admin user created: admin/AdminPass2025!')
else:
    print('✅ Admin user already exists')
" 2>/dev/null || echo "⚠️ Admin user setup skipped"

echo "🚀 Starting gunicorn server on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind=0.0.0.0:${PORT:-8000} \
    --workers=2 \
    --timeout=300 \
    --access-logfile=- \
    --error-logfile=- \
    --log-level=info
