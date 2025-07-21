#!/usr/bin/env python
"""
Django management command to test subcenter endpoints internally
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, Box, Book, Coupon, FuelTransaction, Handover, BookDispatch
from fuel.views import SubCenterViewSet
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate

User = get_user_model()

def test_subcenter_endpoints():
    print("🧪 Testing SubCenter Endpoints Internally")
    print("=" * 50)
    
    # Create a test subcenter if none exist
    subcenter, created = SubCenter.objects.get_or_create(
        name="Test SubCenter",
        defaults={"location": "Test Location"}
    )
    if created:
        print(f"✅ Created test subcenter: {subcenter.name} (ID: {subcenter.id})")
    else:
        print(f"✅ Using existing subcenter: {subcenter.name} (ID: {subcenter.id})")
    
    # Create a test user
    user, created = User.objects.get_or_create(
        username="testuser",
        defaults={
            "role": "MAIN_CENTER",
            "email": "test@example.com"
        }
    )
    if created:
        print(f"✅ Created test user: {user.username}")
    else:
        print(f"✅ Using existing user: {user.username}")
    
    # Create a request factory
    factory = RequestFactory()
    
    # Test statistics endpoint
    print(f"\n📊 Testing statistics endpoint for subcenter {subcenter.id}")
    try:
        request = factory.get(f'/api/v1/subcenters/{subcenter.id}/statistics/')
        force_authenticate(request, user=user)
        
        view = SubCenterViewSet()
        view.action = 'statistics'
        view.request = request
        view.format_kwarg = None
        
        # Mock get_object to return our subcenter
        view.get_object = lambda: subcenter
        
        response = view.statistics(request, pk=subcenter.id)
        
        if response.status_code == 200:
            print(f"✅ Statistics endpoint works! Status: {response.status_code}")
            print(f"   Data: {response.data}")
        else:
            print(f"❌ Statistics endpoint failed! Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Statistics endpoint error: {e}")
    
    # Test recent activity endpoint
    print(f"\n📋 Testing recent activity endpoint for subcenter {subcenter.id}")
    try:
        request = factory.get(f'/api/v1/subcenters/{subcenter.id}/recent-activity/')
        force_authenticate(request, user=user)
        
        view = SubCenterViewSet()
        view.action = 'recent_activity'
        view.request = request
        view.format_kwarg = None
        
        # Mock get_object to return our subcenter
        view.get_object = lambda: subcenter
        
        response = view.recent_activity(request, pk=subcenter.id)
        
        if response.status_code == 200:
            print(f"✅ Recent activity endpoint works! Status: {response.status_code}")
            print(f"   Activities count: {len(response.data)}")
            if response.data:
                print(f"   Sample activity: {response.data[0]}")
        else:
            print(f"❌ Recent activity endpoint failed! Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Recent activity endpoint error: {e}")
    
    # Show some database stats
    print(f"\n📈 Database Statistics:")
    print(f"   SubCenters: {SubCenter.objects.count()}")
    print(f"   Boxes: {Box.objects.count()}")
    print(f"   Books: {Book.objects.count()}")
    print(f"   Coupons: {Coupon.objects.count()}")
    print(f"   Transactions: {FuelTransaction.objects.count()}")
    print(f"   Handovers: {Handover.objects.count()}")
    print(f"   Dispatches: {BookDispatch.objects.count()}")

if __name__ == "__main__":
    test_subcenter_endpoints()
