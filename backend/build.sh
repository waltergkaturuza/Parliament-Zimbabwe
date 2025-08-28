#!/usr/bin/env bash
# Render build script for heavy Django app

set -o errexit  # exit on error

echo "Starting build with heavy libraries..."

# Upgrade pip for better dependency resolution
pip install --upgrade pip

# Install Python dependencies with optimizations
echo "Installing core Django packages..."
pip install --no-cache-dir Django==4.1.13 psycopg2-binary==2.9.7 djangorestframework==3.14.0

echo "Installing data science packages..."
pip install --no-cache-dir pandas numpy scipy matplotlib seaborn plotly scikit-learn

echo "Installing remaining packages..."
pip install --no-cache-dir -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully with heavy libraries!"

# Show installed package summary
echo "Installed packages summary:"
pip list | grep -E "(Django|pandas|numpy|tensorflow|torch|opencv)" || true
