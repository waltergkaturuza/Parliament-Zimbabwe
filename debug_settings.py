#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Import Django and setup
import django
from django.conf import settings

try:
    django.setup()
    print("Django setup successful!")
    print(f"DEBUG = {settings.DEBUG}")
    print(f"DATABASES = {settings.DATABASES}")
    print(f"INSTALLED_APPS count = {len(settings.INSTALLED_APPS)}")
    
    # Test database connection
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"Database connection test: {result}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
