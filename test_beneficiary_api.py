#!/usr/bin/env python
"""
Test script to verify beneficiary API is working after fixing serializer
"""
import requests
import json

def test_beneficiary_api():
    base_url = "http://127.0.0.1:8000/api"
    
    # First, get JWT token
    print("1. Testing login...")
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f'{base_url}/auth/login/', json=login_data)
        if response.status_code == 200:
            token = response.json().get('access')
            print("✅ Login successful")
            
            # Test beneficiary list endpoint
            print("\n2. Testing beneficiary list API...")
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f'{base_url}/beneficiary-profiles/', headers=headers)
            
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"✅ API Success! Found {len(results)} beneficiaries")
                
                # Show details of first few beneficiaries
                for i, beneficiary in enumerate(results[:3]):
                    print(f"\nBeneficiary {i+1}:")
                    print(f"  - Employee ID: {beneficiary.get('employee_id', 'N/A')}")
                    print(f"  - Position: {beneficiary.get('position', 'N/A')}")
                    print(f"  - User: {beneficiary.get('user', {}).get('username', 'N/A')}")
                    print(f"  - Pending Entitlements: {beneficiary.get('pending_entitlements', 'N/A')}")
                    print(f"  - Monthly Entitlement: {beneficiary.get('monthly_entitlement_litres', 'N/A')} L")
                
                return True
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Try to create admin user first
            print("\n2. Creating admin user...")
            admin_data = {
                'username': 'admin',
                'email': 'admin@test.com',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User'
            }
            response = requests.post(f'{base_url}/auth/register/', json=admin_data)
            print(f"Registration response: {response.status_code}")
            if response.status_code == 201:
                print("✅ Admin user created, trying login again...")
                response = requests.post(f'{base_url}/auth/login/', json=login_data)
                if response.status_code == 200:
                    token = response.json().get('access')
                    print("✅ Login successful")
                    
                    # Test beneficiary list
                    headers = {'Authorization': f'Bearer {token}'}
                    response = requests.get(f'{base_url}/beneficiary-profiles/', headers=headers)
                    print(f"Beneficiary API Status: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        results = data.get('results', data) if isinstance(data, dict) else data
                        print(f"✅ API Success! Found {len(results)} beneficiaries")
                        return True
                    else:
                        print(f"❌ Beneficiary API Error: {response.text}")
                        return False
            return False
    
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Beneficiary API after Serializer Fix")
    print("=" * 50)
    success = test_beneficiary_api()
    print("=" * 50)
    if success:
        print("🎉 All tests passed! Beneficiary API is working correctly.")
    else:
        print("💥 Tests failed. Check the issues above.")
