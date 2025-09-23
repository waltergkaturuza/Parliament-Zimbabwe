#!/usr/bin/env python
"""Check dispatch table for missing values and data issues."""

import requests
import json
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def check_dispatch_data():
    """Check dispatch table for missing values."""
    print("🧪 Checking Dispatch Table Data")
    print("=" * 50)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get dispatch data
    print("📡 Getting dispatch data...")
    response = requests.get(f'{BASE_URL}/dispatches/', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        dispatches = data.get('results', data) if isinstance(data, dict) else data
        
        print(f"✅ Found {len(dispatches)} dispatches")
        
        for i, dispatch in enumerate(dispatches, 1):
            print(f"\n📦 Dispatch {i}:")
            print(f"   ID: {dispatch.get('id')}")
            print(f"   Dispatch ID: {dispatch.get('dispatch_id')}")
            print(f"   Status: {dispatch.get('status')}")
            
            # Check subcenter information
            print(f"   to_center_id: {dispatch.get('to_center_id')}")
            print(f"   to_center: {dispatch.get('to_center')}")
            print(f"   sub_center_name: {dispatch.get('sub_center_name')}")
            print(f"   subCenterName: {dispatch.get('subCenterName')}")
            
            # Check books and coupons
            print(f"   total_books: {dispatch.get('total_books')}")
            print(f"   total_coupons: {dispatch.get('total_coupons')}")
            print(f"   books: {dispatch.get('books')}")
            
            # Check value information
            print(f"   total_value_usd: {dispatch.get('total_value_usd')}")
            print(f"   total_value_zwg: {dispatch.get('total_value_zwg')}")
            
            # Check timestamps
            print(f"   created: {dispatch.get('created')}")
            print(f"   dispatched_at: {dispatch.get('dispatched_at')}")
            print(f"   dispatch_time: {dispatch.get('dispatch_time')}")
            
            # Print all available fields for debugging
            print("   📋 All Available Fields:")
            for key, value in dispatch.items():
                if key not in ['id', 'dispatch_id', 'status']:
                    print(f"      {key}: {value}")
    else:
        print(f"❌ API call failed: {response.status_code}")
        print(f"Response: {response.text}")

def check_database_dispatch_data():
    """Check dispatch data directly from database using Django shell."""
    print("\n🗄️ Checking Database Dispatch Data")
    print("=" * 50)
    
    # This will be run through Django shell
    django_commands = '''
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from fuel.models import BookDispatch, SubCenter

print("📦 Checking BookDispatch records:")
dispatches = BookDispatch.objects.all()
for dispatch in dispatches:
    print(f"\\nDispatch ID: {dispatch.id}")
    print(f"   dispatch_id: {dispatch.dispatch_id}")
    print(f"   to_center_id: {dispatch.to_center_id}")
    print(f"   to_center: {dispatch.to_center}")
    print(f"   status: {dispatch.status}")
    print(f"   total_books: {dispatch.total_books}")
    print(f"   total_coupons: {dispatch.total_coupons}")
    print(f"   created: {dispatch.created}")
    print(f"   dispatched_at: {dispatch.dispatched_at}")
    
    # Check if to_center exists
    if dispatch.to_center_id:
        try:
            subcenter = SubCenter.objects.get(id=dispatch.to_center_id)
            print(f"   ✅ SubCenter found: {subcenter.name} ({subcenter.code})")
        except SubCenter.DoesNotExist:
            print(f"   ❌ SubCenter with ID {dispatch.to_center_id} does NOT exist!")
    else:
        print(f"   ⚠️ No to_center_id assigned")

print("\\n🏢 Available SubCenters:")
subcenters = SubCenter.objects.all()
for sc in subcenters:
    print(f"   ID: {sc.id}, Name: {sc.name}, Code: {sc.code}")
'''
    
    return django_commands

if __name__ == "__main__":
    check_dispatch_data()
    
    print("\n" + "="*50)
    print("Django commands to run in shell:")
    print("="*50)
    print(check_database_dispatch_data())