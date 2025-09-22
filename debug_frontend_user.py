#!/usr/bin/env python
"""
Quick script to check current user info from the API perspective
"""
import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import SubCenter, PoolVehicle, User
from django.contrib.auth import get_user_model

def simulate_frontend_request():
    """Simulate what the frontend user sees"""
    
    User = get_user_model()
    
    # Get the most recent user (likely the one the frontend is using)
    recent_user = User.objects.filter(is_active=True).order_by('-last_login', '-id').first()
    
    if not recent_user:
        print("No active users found")
        return
    
    print(f"Testing with most recent user: {recent_user.username}")
    print(f"User details:")
    print(f"  ID: {recent_user.id}")
    print(f"  Email: {recent_user.email}")
    print(f"  Role: {recent_user.role}")
    print(f"  Sub Center: {recent_user.sub_center.code if recent_user.sub_center else 'None'}")
    print(f"  Is Active: {recent_user.is_active}")
    print(f"  Last Login: {recent_user.last_login}")
    
    # Test API access
    client = APIClient()
    refresh = RefreshToken.for_user(recent_user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test vehicle access
    print(f"\n--- Testing Vehicle Access ---")
    response = client.get('/api/pool-vehicles/')
    
    if response.status_code == 200:
        data = response.data
        results_count = len(data.get('results', []))
        print(f"✅ Vehicle API: {results_count} vehicles returned")
        print(f"Response structure: count={data.get('count', 'N/A')}, results length={results_count}")
        
        if results_count == 0:
            print("\n🔍 Why no vehicles?")
            total_vehicles = PoolVehicle.objects.count()
            print(f"  - Total vehicles in DB: {total_vehicles}")
            
            if recent_user.role == 'MAIN_CENTER':
                print(f"  - User is MAIN_CENTER, should see all vehicles")
            elif recent_user.role == 'SUB_CENTER':
                if recent_user.sub_center:
                    vehicles_in_subcenter = PoolVehicle.objects.filter(assigned_subcenter=recent_user.sub_center).count()
                    print(f"  - User is SUB_CENTER assigned to {recent_user.sub_center.code}")
                    print(f"  - Vehicles in their subcenter: {vehicles_in_subcenter}")
                else:
                    print(f"  - User is SUB_CENTER but has no subcenter assigned")
            else:
                print(f"  - User role '{recent_user.role}' may not have vehicle access")
        
    else:
        print(f"❌ Vehicle API failed: {response.status_code}")
        print(f"Error: {response.data if hasattr(response, 'data') else response.content}")

if __name__ == '__main__':
    print("=== Simulating Frontend User Request ===\n")
    
    try:
        simulate_frontend_request()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()