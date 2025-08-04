#!/usr/bin/env python3
"""
🏛️ Parliament Fuel System - Azure Deployment Diagnostic
Quick diagnostic to identify deployment issues
"""
import os
import sys
import django
from pathlib import Path

def check_environment():
    print("🔍 ENVIRONMENT DIAGNOSTIC")
    print("=" * 50)
    
    # Basic environment
    print(f"Python Version: {sys.version}")
    print(f"Current Directory: {os.getcwd()}")
    print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'NOT SET')}")
    
    # Django environment
    django_settings = os.environ.get('DJANGO_SETTINGS_MODULE', 'NOT SET')
    print(f"DJANGO_SETTINGS_MODULE: {django_settings}")
    
    # Azure specific
    websites_port = os.environ.get('WEBSITES_PORT', 'NOT SET')
    port = os.environ.get('PORT', 'NOT SET')
    print(f"WEBSITES_PORT: {websites_port}")
    print(f"PORT: {port}")
    
    return django_settings != 'NOT SET'

def check_django_config():
    print("\n🔧 DJANGO CONFIGURATION")
    print("=" * 50)
    
    try:
        # Set Django settings if not set
        if not os.environ.get('DJANGO_SETTINGS_MODULE'):
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
        
        django.setup()
        
        from django.conf import settings
        
        print(f"✅ Django setup successful")
        print(f"DEBUG: {settings.DEBUG}")
        print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        
        # Database check
        db_config = settings.DATABASES['default']
        print(f"Database Engine: {db_config['ENGINE']}")
        if 'postgresql' in db_config['ENGINE']:
            print(f"Database Host: {db_config.get('HOST', 'localhost')}")
            print(f"Database Name: {db_config.get('NAME', 'NOT SET')}")
        
        # CORS check
        if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
            print(f"CORS Origins: {settings.CORS_ALLOWED_ORIGINS}")
        
        return True
        
    except Exception as e:
        print(f"❌ Django configuration error: {e}")
        return False

def check_files():
    print("\n📁 FILE SYSTEM CHECK")
    print("=" * 50)
    
    required_files = [
        'manage.py',
        'config/wsgi.py',
        'config/settings/production.py',
        'requirements.txt',
        'startup.sh'
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")

def check_imports():
    print("\n📦 IMPORT CHECK")
    print("=" * 50)
    
    critical_imports = [
        'django',
        'psycopg2',
        'corsheaders',
        'rest_framework',
        'gunicorn'
    ]
    
    for module in critical_imports:
        try:
            __import__(module)
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module} - {e}")

def main():
    print("🏛️ PARLIAMENT FUEL SYSTEM - DEPLOYMENT DIAGNOSTIC")
    print("=" * 60)
    
    env_ok = check_environment()
    files_ok = check_files()
    
    if env_ok:
        django_ok = check_django_config()
    else:
        django_ok = False
        print("⚠️ Skipping Django check due to environment issues")
    
    check_imports()
    
    print("\n🎯 SUMMARY")
    print("=" * 50)
    
    if env_ok and django_ok:
        print("✅ Configuration appears ready for deployment")
        print("\n🚀 NEXT STEPS:")
        print("1. Update Azure startup command to: bash startup.sh")
        print("2. Verify environment variables in Azure Portal")
        print("3. Restart the App Service")
    else:
        print("❌ Configuration issues detected")
        print("\n🔧 REQUIRED FIXES:")
        if not env_ok:
            print("- Set DJANGO_SETTINGS_MODULE environment variable")
        if not django_ok:
            print("- Fix Django configuration errors")
        print("- Review AZURE_STARTUP_FIX_URGENT.md for detailed steps")

if __name__ == "__main__":
    main()
