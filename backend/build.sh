#!/usr/bin/env bash
# Render build script - optimized for stability

set -o errexit  # exit on error

echo "Starting optimized build process..."

# Upgrade pip and setuptools first
pip install --upgrade pip setuptools wheel

# Install core dependencies first
echo "Installing Django and core packages..."
pip install --no-cache-dir Django==4.1.13 
pip install --no-cache-dir psycopg2-binary==2.9.7 
pip install --no-cache-dir djangorestframework==3.14.0
pip install --no-cache-dir django-model-utils==4.3.1

# Install data science packages (lighter versions)
echo "Installing data science packages..."
pip install --no-cache-dir numpy==1.24.3
pip install --no-cache-dir pandas==1.5.3
pip install --no-cache-dir matplotlib==3.7.2

# Install remaining packages
echo "Installing remaining packages..."
pip install --no-cache-dir -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"

# Show key installed packages
echo "Key packages installed:"
pip list | grep -E "(Django|pandas|numpy|requests)" || echo "Package check completed"
