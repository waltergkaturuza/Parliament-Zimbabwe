#!/usr/bin/env bash
# Render build script

set -o errexit  # exit on error

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run database migrations
python manage.py migrate

echo "Build completed successfully!"
