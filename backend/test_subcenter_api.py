#!/usr/bin/env python
"""
Test subcenter inventory API endpoints
"""
import requests
import json

def test_subcenter_apis():
    base_url = "http://127.0.0.1:8000/api"
    
    # Get JWT token for subcenter user
    print("1. Testing login for subcenter user...")
    login_data = {
        'username': 'sub_center_admin',
        'password': 'subcenter123'
    }
    
    try:
        response = requests.post(f'{base_url}/auth/login/', json=login_data)
        if response.status_code == 200:
            access_token = response.json().get('access_token') or response.json().get('access')
            print("✅ Login successful")
            
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # Test boxes API
            print("\n2. Testing boxes API...")
            response = requests.get(f'{base_url}/boxes/', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} boxes")
                if results:
                    box = results[0]
                    print(f"   Sample box: {box.get('box_code')} - {box.get('status')}")
            else:
                print(f"❌ Error: {response.text}")
            
            # Test books API
            print("\n3. Testing books API...")
            response = requests.get(f'{base_url}/books/', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} books")
                if results:
                    book = results[0]
                    print(f"   Sample book: {book.get('book_number')} - {book.get('first_coupon_number')}-{book.get('last_coupon_number')}")
            else:
                print(f"❌ Error: {response.text}")
            
            # Test books received API
            print("\n4. Testing books/received API...")
            response = requests.get(f'{base_url}/books/received/', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Found {len(data)} received books")
                if data:
                    book = data[0]
                    print(f"   Sample received book: {book.get('book_number')}")
            else:
                print(f"❌ Error: {response.text}")
            
            # Test allocations API
            print("\n5. Testing allocations API...")
            response = requests.get(f'{base_url}/allocations/', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data) if isinstance(data, dict) else data
                print(f"✅ Found {len(results)} allocations")
            else:
                print(f"❌ Error: {response.text}")
            
            print("\n" + "="*50)
            print("API TESTS COMPLETE")
            print("All subcenter inventory endpoints are working!")
            
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Testing SubCenter Inventory API Endpoints")
    print("=" * 50)
    test_subcenter_apis()
