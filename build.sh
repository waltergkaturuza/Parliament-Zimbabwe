#!/bin/bash
# Vercel build script for Django

echo "🚀 Starting Django build for Vercel..."

# Install Python dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Set Django settings
export DJANGO_SETTINGS_MODULE=config.settings.vercel

# Run Django checks
echo "🔍 Running Django system checks..."
python manage.py check --deploy

# Collect static files
echo "📂 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"
