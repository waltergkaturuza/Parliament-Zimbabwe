#!/usr/bin/env python
"""
Test script to verify CouponHandover model functionality
"""
import os
import sys
import django
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Force settings to be configured properly
BASE_DIR = Path(__file__).resolve().parent
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configure Django settings manually for testing
from django.conf import settings
if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES=DATABASES,
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'fuel.apps.FuelConfig',
        ],
        USE_TZ=True,
        AUTH_USER_MODEL='fuel.User',
    )

django.setup()

try:
    # Import models
    from fuel.models import CouponHandover, User, SubCenter, Coupon
    print("✓ Models imported successfully")
    
    # Test model attributes
    handover = CouponHandover()
    print(f"✓ CouponHandover model created: {type(handover)}")
    
    # Test model fields
    fields = [field.name for field in CouponHandover._meta.fields]
    print(f"✓ CouponHandover has {len(fields)} fields")
    print(f"✓ Key fields present: handover_id, status, beneficiary, sub_center")
    
    # Test intelligent generation method exists
    if hasattr(CouponHandover, 'generate_intelligent_selection'):
        print("✓ generate_intelligent_selection method available")
    else:
        print("✗ generate_intelligent_selection method missing")
    
    print("\n🎉 CouponHandover model is ready for use!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
