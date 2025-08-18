#!/usr/bin/env python
"""
Quick test script to identify the specific 500 error in API endpoints
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.test.client import Client
from django.contrib.auth import get_user_model
import json

User = get_user_model()

def test_endpoints():
    """Test the specific endpoints that are failing"""
    
    print("🧪 TESTING FAILING API ENDPOINTS")
    print("=" * 50)
    
    # Create a test client
    client = Client()
    
    # Get or create a test user for authentication
    try:
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            print("❌ No superuser found")
            return
        client.force_login(user)
        print(f"✅ Authenticated as user: {user.username}")
    except Exception as e:
        print(f"❌ Authentication failed: {str(e)}")
        return

    # Test 1: Boxes API
    print("\n📦 TESTING BOXES API:")
    try:
        response = client.get('/api/v1/boxes/')
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Boxes API working correctly")
        else:
            print(f"❌ Boxes API failed with status {response.status_code}")
            if hasattr(response, 'content'):
                content = response.content.decode()[:500]
                print(f"Response: {content}")
    except Exception as e:
        print(f"❌ Boxes API test failed: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

    # Test 2: Analytics API
    print("\n📊 TESTING ANALYTICS API:")
    try:
        url = '/api/v1/analytics/?start_date=2025-07-19&end_date=2025-08-18'
        response = client.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Analytics API working correctly")
        else:
            print(f"❌ Analytics API failed with status {response.status_code}")
            if hasattr(response, 'content'):
                content = response.content.decode()[:500]
                print(f"Response: {content}")
    except Exception as e:
        print(f"❌ Analytics API test failed: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

    # Test 3: Box model query directly
    print("\n🔍 TESTING BOX MODEL QUERIES:")
    try:
        from fuel.models import Box
        
        # Test basic Box query
        boxes = Box.objects.all()[:5]
        box_list = list(boxes)
        print(f"✅ Box.objects.all() returned {len(box_list)} items")
        
        # Test Box with select_related including verified_by
        boxes_with_relations = Box.objects.select_related(
            'assigned_to', 'received_by', 'verified_by'
        )[:5]
        list(boxes_with_relations)
        print("✅ Box select_related query with verified_by works")
        
    except Exception as e:
        print(f"❌ Box model query failed: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_endpoints()
