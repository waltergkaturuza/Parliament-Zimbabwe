#!/usr/bin/env python
"""
Debugging script to test ViewSet imports and router registration.
This will help us identify why API endpoints are returning 404.
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

def test_viewset_imports():
    """Test if ViewSets can be imported successfully"""
    print("Testing ViewSet imports...")
    
    try:
        from fuel import views_main
        print("✅ Successfully imported views_main")
        
        # Test individual ViewSet imports
        viewsets_to_test = [
            'UserViewSet', 'SubCenterViewSet', 'BoxViewSet', 'BookViewSet', 
            'CouponViewSet', 'BookDispatchViewSet', 'CouponAllocationViewSet'
        ]
        
        for viewset_name in viewsets_to_test:
            try:
                viewset = getattr(views_main, viewset_name)
                print(f"✅ {viewset_name}: {viewset}")
            except AttributeError as e:
                print(f"❌ {viewset_name}: {e}")
                
    except ImportError as e:
        print(f"❌ Failed to import views_main: {e}")
        return False
        
    return True

def test_safe_get_viewset():
    """Test the safe_get_viewset function from urls.py"""
    print("\nTesting safe_get_viewset function...")
    
    try:
        from fuel.urls import safe_get_viewset
        
        # Test a few key ViewSets
        test_viewsets = ['BoxViewSet', 'UserViewSet', 'SubCenterViewSet']
        
        for viewset_name in test_viewsets:
            result = safe_get_viewset(viewset_name)
            if result:
                print(f"✅ {viewset_name}: {result}")
            else:
                print(f"❌ {viewset_name}: None (registration will be skipped)")
                
    except Exception as e:
        print(f"❌ Error testing safe_get_viewset: {e}")

def test_router_registration():
    """Test router registration"""
    print("\nTesting router registration...")
    
    try:
        from fuel.urls import router
        print(f"Router URLs: {len(router.urls)} registered")
        
        for url_pattern in router.urls[:10]:  # Show first 10
            print(f"  - {url_pattern.pattern}")
            
        if len(router.urls) == 0:
            print("❌ No URLs registered in router!")
        else:
            print(f"✅ {len(router.urls)} URLs registered")
            
    except Exception as e:
        print(f"❌ Error testing router: {e}")

def test_permission_imports():
    """Test if there are any import errors causing ViewSet registration to fail"""
    print("\nTesting permission imports...")
    
    try:
        from fuel.permissions import (
            MainCenterPermission, SubCenterPermission, AuditorPermission, 
            BeneficiaryPermission, MainCenterOrSubCenterPermission
        )
        print("✅ All permission classes imported successfully")
        
        # Test the new permission class specifically
        print(f"MainCenterOrSubCenterPermission: {MainCenterOrSubCenterPermission}")
        
    except ImportError as e:
        print(f"❌ Permission import error: {e}")
        print("This might be causing ViewSet registration to fail!")

if __name__ == "__main__":
    print("=== Django ViewSet Import Debugging ===")
    
    test_viewset_imports()
    test_permission_imports()
    test_safe_get_viewset()
    test_router_registration()
    
    print("\n=== Summary ===")
    print("If router has 0 URLs, ViewSet registration is failing.")
    print("Check for import errors in views_main.py or permissions.py")