@echo off
REM Windows batch script for Azure deployment with migration triggers
REM Run this script to deploy with automatic migrations

echo 🚀 AZURE DEPLOYMENT: MainCenter Migration Deployment
echo ==================================================

REM Activate virtual environment if it exists
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    echo ✅ Virtual environment activated
)

REM Set production settings
set DJANGO_SETTINGS_MODULE=config.settings

echo 📦 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo 🗄️ Running Django migrations...
python manage.py migrate --noinput

echo 📊 Checking migration status...
python manage.py showmigrations fuel

echo 🔍 Validating MainCenter fields...
python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from fuel.models import SubCenter, Box; print('✅ SubCenter fields:', [f.name for f in SubCenter._meta.fields if 'contact' in f.name or 'email' in f.name]); print('✅ Box fields:', [f.name for f in Box._meta.fields if 'received' in f.name])"

echo 🔧 Collecting static files...
python manage.py collectstatic --noinput

echo ✅ DEPLOYMENT COMPLETE!
echo MainCenter frontend-backend alignment deployed with migrations
pause
