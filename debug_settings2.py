#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    # Test the settings import step by step
    print("Testing settings import...")
    
    # Import settings module directly
    from config import settings
    
    # Check if DATABASES is defined
    if hasattr(settings, 'DATABASES'):
        print(f"DATABASES found: {settings.DATABASES}")
    else:
        print("DATABASES not found in settings")
    
    # Check if INSTALLED_APPS is defined
    if hasattr(settings, 'INSTALLED_APPS'):
        print(f"INSTALLED_APPS found: {len(settings.INSTALLED_APPS)} apps")
    else:
        print("INSTALLED_APPS not found in settings")
        
    # Check BASE_DIR
    if hasattr(settings, 'BASE_DIR'):
        print(f"BASE_DIR: {settings.BASE_DIR}")
    else:
        print("BASE_DIR not found")
        
except Exception as e:
    print(f"Error importing settings: {e}")
    import traceback
    traceback.print_exc()
