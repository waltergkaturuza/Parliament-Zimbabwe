#!/usr/bin/env python
"""
Test script to check Django startup and import issues
"""
import os
import sys
import django

# Add project to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    # Initialize Django
    django.setup()
    print("✅ Django setup successful!")
    
    # Test imports
    from fuel.urls import urlpatterns
    print("✅ fuel.urls imported successfully!")
    
    # Test Django check
    from django.core.management import execute_from_command_line
    print("✅ Testing Django check...")
    execute_from_command_line(['manage.py', 'check'])
    print("✅ Django check passed!")
    
    print("\n🚀 All tests passed! Django should start normally.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
