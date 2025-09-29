#!/usr/bin/env python3
"""
Test Django URL routing for fuel entitlements
Run with: python manage.py shell < debug_django_urls.py
"""

import os
import django
from django.conf import settings
from django.urls import reverse
from rest_framework import routers
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

# Print URL routing debug info
print("🔧 Django URL Routing Debug")
print("=" * 50)

try:
    # Test URL reversing
    print("1. Testing URL reverse resolution:")
    try:
        url = reverse('fuel-entitlement-list')
        print(f"  ✅ fuel-entitlement-list -> {url}")
    except Exception as e:
        print(f"  ❌ fuel-entitlement-list -> {e}")
    
    try:
        url = reverse('fuel-entitlement-detail', kwargs={'pk': 1})
        print(f"  ✅ fuel-entitlement-detail -> {url}")
    except Exception as e:
        print(f"  ❌ fuel-entitlement-detail -> {e}")
    
    try:
        url = reverse('fuel-entitlement-approve', kwargs={'pk': 1})
        print(f"  ✅ fuel-entitlement-approve -> {url}")
    except Exception as e:
        print(f"  ❌ fuel-entitlement-approve -> {e}")

    print("\n2. Checking if FuelEntitlementViewSet is imported:")
    try:
        from fuel.views_main import FuelEntitlementViewSet
        print(f"  ✅ FuelEntitlementViewSet imported successfully")
        
        # Check if approve action exists
        if hasattr(FuelEntitlementViewSet, 'approve'):
            print(f"  ✅ approve action exists in ViewSet")
        else:
            print(f"  ❌ approve action not found in ViewSet")
            
        # List all actions
        actions = [attr for attr in dir(FuelEntitlementViewSet) if not attr.startswith('_')]
        print(f"  📋 Available actions: {[a for a in actions if 'approve' in a.lower()]}")
        
    except Exception as e:
        print(f"  ❌ Import error: {e}")

    print("\n3. Testing ViewSet instance:")
    try:
        from fuel.views_main import FuelEntitlementViewSet
        viewset = FuelEntitlementViewSet()
        
        # Check if approve is in the action map
        if hasattr(viewset, 'get_extra_actions'):
            extra_actions = viewset.get_extra_actions()
            approve_actions = [action for action in extra_actions if 'approve' in action.__name__]
            print(f"  📋 Approve actions found: {[action.__name__ for action in approve_actions]}")
        else:
            print(f"  ⚠️  get_extra_actions not available")
            
    except Exception as e:
        print(f"  ❌ ViewSet instance error: {e}")

    print("\n4. Checking Router registration:")
    try:
        from fuel.urls import router
        print(f"  📋 Registered routes:")
        for prefix, viewset, basename in router.registry:
            if 'fuel' in prefix.lower():
                print(f"    ✅ {prefix} -> {viewset.__name__} (basename: {basename})")
                
                # Check if this viewset has approve action
                if hasattr(viewset, 'approve'):
                    print(f"      ✅ Has approve action")
                else:
                    print(f"      ❌ No approve action")
                    
    except Exception as e:
        print(f"  ❌ Router check error: {e}")
        
    print("\n5. Testing actual request simulation:")
    try:
        from fuel.views_main import FuelEntitlementViewSet
        from django.test import RequestFactory
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        factory = RequestFactory()
        
        # Test GET to list endpoint
        request = factory.get('/api/v1/fuel-entitlements/')
        request.user = AnonymousUser()
        
        viewset = FuelEntitlementViewSet()
        viewset.request = request
        viewset.format_kwarg = None
        
        # This should work (though return 401)
        print(f"  ✅ ViewSet instantiation successful")
        
        # Test if approve action can be called
        if hasattr(viewset, 'approve'):
            print(f"  ✅ approve method exists and callable")
        else:
            print(f"  ❌ approve method not found")
            
    except Exception as e:
        print(f"  ❌ Request simulation error: {e}")
        
except Exception as e:
    print(f"❌ Script error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("🏁 Debug complete")