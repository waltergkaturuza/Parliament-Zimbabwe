#!/usr/bin/env python
"""
Simple test to check Django URL routing and view accessibility
"""
import os
import sys
import django

# Add project to path
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    
    # Test basic Django functionality
    from django.test import Client
    from django.contrib.auth import get_user_model
    from fuel.models import User
    
    print("Testing Django setup...")
    
    # Create test client
    client = Client()
    
    # Test basic endpoint
    response = client.get('/api/v1/audit/compliance-reports/')
    print(f"GET /api/v1/audit/compliance-reports/ → {response.status_code}")
    
    # Test specific download endpoint
    response = client.get('/api/v1/audit/compliance-reports/test-123/download/')
    print(f"GET /api/v1/audit/compliance-reports/test-123/download/ → {response.status_code}")
    
    # Check if it's an authentication issue
    if response.status_code == 401:
        print("   → Authentication required, creating test user...")
        
        # Create or get test user
        try:
            user = User.objects.create_user(
                username='testuser',
                password='testpass',
                role='AUDITOR'
            )
            print(f"   → Created test user: {user.username}")
        except:
            user = User.objects.filter(username='testuser').first()
            if user:
                print(f"   → Using existing test user: {user.username}")
            else:
                print("   → Could not create or find test user")
                sys.exit(1)
        
        # Login and test again
        client.login(username='testuser', password='testpass')
        response = client.get('/api/v1/audit/compliance-reports/test-123/download/')
        print(f"GET /api/v1/audit/compliance-reports/test-123/download/ (authenticated) → {response.status_code}")
        
        if response.status_code == 200:
            print("   → Success! Endpoint working with authentication")
        elif response.status_code == 404:
            print("   → Still 404 - URL pattern issue")
        else:
            print(f"   → Other status: {response.status_code}")
    
    # Test URL patterns directly
    print("\nTesting URL patterns...")
    from django.urls import resolve
    
    try:
        match = resolve('/api/v1/audit/compliance-reports/test-123/download/')
        print(f"✅ URL resolves to: {match.func.__name__}")
        print(f"✅ View name: {match.view_name}")
        print(f"✅ Kwargs: {match.kwargs}")
    except Exception as e:
        print(f"❌ URL resolution failed: {e}")
    
    # Test function import
    print("\nTesting function import...")
    try:
        from fuel.views import download_compliance_report
        print("✅ Function imported successfully")
        
        # Try to call function directly
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/test/')
        request.user = user if 'user' in locals() else None
        
        response = download_compliance_report(request, 'test-123')
        print(f"✅ Function call successful, response type: {type(response)}")
        
    except Exception as e:
        print(f"❌ Function test failed: {e}")
        import traceback
        traceback.print_exc()

except Exception as e:
    print(f"❌ Setup failed: {e}")
    import traceback
    traceback.print_exc()
