#!/bin/bash

# Vercel build script for Parliament Fuel System
echo "Starting Vercel build process..."

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Set Django settings for build
export DJANGO_SETTINGS_MODULE=config.settings.vercel

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build process completed successfully!"
