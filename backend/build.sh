#!/usr/bin/env bash
# Render build script - optimized for stability

set -o errexit  # exit on error

echo "Starting optimized build process..."

# Upgrade pip and setuptools first (Python 3.12 compatible)
pip install --upgrade pip "setuptools>=69.0.0" wheel

# Install core dependencies first
echo "Installing Django and core packages..."
pip install --no-cache-dir Django==4.1.13 
pip install --no-cache-dir psycopg2-binary==2.9.7 
pip install --no-cache-dir djangorestframework==3.14.0
pip install --no-cache-dir django-model-utils==4.3.1

# Install data science packages (Python 3.12 compatible versions)
echo "Installing data science packages..."
pip install --no-cache-dir "numpy>=1.26.0,<2.0"
# pip install --no-cache-dir "pandas>=2.0.0,<3.0"  # Temporarily disabled
pip install --no-cache-dir "matplotlib>=3.8.0,<4.0"

# Install remaining packages
echo "Installing remaining packages..."
pip install --no-cache-dir -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Creating migrations if needed..."
python manage.py makemigrations --noinput

echo "Running database migrations..."
python manage.py migrate

echo "Creating admin superuser..."
python manage.py create_admin

echo "Build completed successfully!"

# Show key installed packages
echo "Key packages installed:"
pip list | grep -E "(Django|pandas|numpy|requests)" || echo "Package check completed"
