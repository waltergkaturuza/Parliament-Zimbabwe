#!/usr/bin/env python
"""
Simple deployment verification script
This will help us debug the Azure deployment issue
"""
import os
import sys

def check_environment():
    print("=== Deployment Check ===")
    print(f"Python version: {sys.version}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')}")
    
    # Check if settings can be imported
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
        import django
        django.setup()
        
        from django.conf import settings
        print(f"Settings loaded successfully")
        print(f"ROOT_URLCONF: {getattr(settings, 'ROOT_URLCONF', 'NOT FOUND')}")
        print(f"DEBUG: {getattr(settings, 'DEBUG', 'NOT FOUND')}")
        print(f"ALLOWED_HOSTS: {getattr(settings, 'ALLOWED_HOSTS', 'NOT FOUND')}")
        
    except Exception as e:
        print(f"Error loading Django settings: {e}")
    
    print("=== End Check ===")

if __name__ == "__main__":
    check_environment()
