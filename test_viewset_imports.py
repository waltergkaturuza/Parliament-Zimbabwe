#!/usr/bin/env python3
# ViewSet import test script

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, 'backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

def test_viewset_import(name):
    """Test importing a ViewSet"""
    try:
        from fuel import views_main
        viewset = getattr(views_main, name)
        print(f"✅ {name}: Successfully imported")
        return True
    except Exception as e:
        print(f"❌ {name}: Import failed - {e}")
        return False

def test_model_import(name):
    """Test importing a model"""
    try:
        from fuel import models
        model = getattr(models, name)
        print(f"✅ {name} model: Successfully imported")
        return True
    except Exception as e:
        print(f"❌ {name} model: Import failed - {e}")
        return False

if __name__ == "__main__":
    print("Testing ViewSet and Model imports...")
    print("-" * 50)
    
    # Test models first
    models_to_test = ['SubCenter', 'Box', 'Book', 'Coupon', 'FuelEntitlement']
    for model_name in models_to_test:
        test_model_import(model_name)
    
    print("-" * 50)
    
    # Test ViewSets
    viewsets_to_test = ['SubCenterViewSet', 'BoxViewSet', 'BookViewSet', 'CouponViewSet']
    for viewset_name in viewsets_to_test:
        test_viewset_import(viewset_name)
    
    print("-" * 50)
    
    # Test router registration
    try:
        from fuel.urls import router
        registered_routes = [route.pattern._route for route in router.urls]
        print(f"Router has {len(registered_routes)} registered routes:")
        for route in registered_routes[:10]:  # Show first 10
            print(f"  - {route}")
        if len(registered_routes) > 10:
            print(f"  ... and {len(registered_routes) - 10} more")
    except Exception as e:
        print(f"❌ Router import failed: {e}")
