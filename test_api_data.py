#!/usr/bin/env python3
"""
Quick API test to check beneficiary data and categories
"""

import requests
import json

def test_beneficiaries_api():
    """Test the beneficiaries API endpoint to see what data is returned"""
    print("🔍 Testing Beneficiaries API")
    print("=" * 50)
    
    # Test local development endpoint
    base_url = "http://localhost:8000/api"
    
    try:
        # Try to get beneficiaries data
        response = requests.get(f"{base_url}/beneficiaries/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ API Response successful")
            print(f"📊 Total results: {len(data.get('results', []))}")
            
            # Analyze categories in the response
            categories = {}
            vehicles_count = 0
            
            for beneficiary in data.get('results', []):
                # Check category structure
                category = beneficiary.get('category')
                if isinstance(category, dict):
                    cat_name = category.get('name', 'Unknown')
                elif isinstance(category, str):
                    cat_name = category
                else:
                    cat_name = 'No Category'
                
                categories[cat_name] = categories.get(cat_name, 0) + 1
                
                # Check vehicles
                vehicles = beneficiary.get('vehicles', [])
                if isinstance(vehicles, list) and len(vehicles) > 0:
                    vehicles_count += len(vehicles)
                elif isinstance(vehicles, int):
                    vehicles_count += vehicles
                
                # Check for vehicle info in other fields
                vehicle_info = beneficiary.get('vehicleInfo', {})
                if vehicle_info and (vehicle_info.get('make') or vehicle_info.get('model')):
                    vehicles_count += 1
            
            print("\n📋 Categories found:")
            for cat, count in sorted(categories.items()):
                print(f"  {cat}: {count}")
            
            print(f"\n🚗 Total vehicles: {vehicles_count}")
            
            # Show sample data structure
            if data.get('results'):
                print("\n🔍 Sample beneficiary structure:")
                sample = data['results'][0]
                print(f"  ID: {sample.get('id')}")
                print(f"  Name: {sample.get('name')}")
                print(f"  Category: {sample.get('category')}")
                print(f"  Status: {sample.get('status')}")
                print(f"  Vehicles: {sample.get('vehicles')}")
                print(f"  VehicleInfo: {sample.get('vehicleInfo')}")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the Django server running?")
        print("Try running: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_categories_api():
    """Test the categories API endpoint"""
    print("\n🔍 Testing Categories API")
    print("=" * 50)
    
    base_url = "http://localhost:8000/api"
    
    try:
        response = requests.get(f"{base_url}/beneficiary-categories/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Categories API Response successful")
            
            categories = data.get('results', []) if 'results' in data else data
            
            print(f"📊 Total categories: {len(categories)}")
            print("\n📋 Available categories:")
            for category in categories:
                if isinstance(category, dict):
                    print(f"  {category.get('name')} (ID: {category.get('id')})")
                else:
                    print(f"  {category}")
                    
        else:
            print(f"❌ Categories API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing categories: {e}")

if __name__ == '__main__':
    test_beneficiaries_api()
    test_categories_api()
    
    print("\n" + "=" * 50)
    print("💡 If the APIs show different data than expected:")
    print("1. Check that the Django server is running")
    print("2. Verify category names match frontend expectations")
    print("3. Check vehicle data structure in API responses")
    print("4. Ensure user statuses are correctly set")