#!/usr/bin/env python
import requests
import json

# First, let's login to get a token
def test_frontend_dispatch_api():
    session = requests.Session()
    
    try:
        # Test login first (directly to Django backend)
        print("1. Testing login...")
        login_response = session.post('http://localhost:8000/api/login/', 
                                    json={'username': 'admin', 'password': 'admin'},
                                    timeout=10)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('access_token')
            if token:
                print(f"✅ Login successful, got token")
                
                # Now test the dispatch API with authentication (directly to Django)
                print("\n2. Testing dispatch API with authentication...")
                headers = {'Authorization': f'Bearer {token}'}
                dispatch_response = session.get('http://localhost:8000/api/dispatches/', 
                                              headers=headers, timeout=10)
                print(f"Dispatch API status: {dispatch_response.status_code}")
                
                if dispatch_response.status_code == 200:
                    data = dispatch_response.json()
                    dispatches = data.get('results', data) if isinstance(data, dict) else data
                    
                    print(f"✅ Found {len(dispatches)} dispatches")
                    
                    if dispatches:
                        dispatch = dispatches[0]
                        print(f"\n--- Testing Dispatch Data Fields ---")
                        print(f"ID: {dispatch.get('id')}")
                        print(f"Dispatch ID: {dispatch.get('dispatch_id')}")
                        
                        # Test the fields that were missing in frontend
                        print(f"\n🔍 SubCenter Fields:")
                        print(f"  subCenterId: {dispatch.get('subCenterId')}")
                        print(f"  subCenterName: {dispatch.get('subCenterName')}")
                        print(f"  sub_center_id: {dispatch.get('sub_center_id')}")
                        print(f"  sub_center_name: {dispatch.get('sub_center_name')}")
                        print(f"  to_center: {dispatch.get('to_center')}")
                        
                        print(f"\n💰 Value Fields:")
                        print(f"  total_litres: {dispatch.get('total_litres')}")
                        print(f"  totalLitres: {dispatch.get('totalLitres')}")
                        print(f"  total_value_usd: {dispatch.get('total_value_usd')}")
                        print(f"  totalValueUsd: {dispatch.get('totalValueUsd')}")
                        print(f"  total_value_zwg: {dispatch.get('total_value_zwg')}")
                        print(f"  totalValueZwg: {dispatch.get('totalValueZwg')}")
                        
                        print(f"\n📚 Other Fields:")
                        print(f"  books: {len(dispatch.get('books', []))}")
                        print(f"  total_books: {dispatch.get('total_books')}")
                        print(f"  status: {dispatch.get('status')}")
                        
                        # Check if the frontend mapping will work
                        subCenterId = dispatch.get('subCenterId') or dispatch.get('sub_center_id')
                        subCenterName = dispatch.get('subCenterName') or dispatch.get('sub_center_name')
                        totalLitres = dispatch.get('total_litres') or dispatch.get('totalLitres')
                        totalValueUsd = dispatch.get('total_value_usd') or dispatch.get('totalValueUsd')
                        totalValueZwg = dispatch.get('total_value_zwg') or dispatch.get('totalValueZwg')
                        
                        print(f"\n✅ Frontend Mapping Test:")
                        print(f"  SubCenter ID: {subCenterId} {'✅' if subCenterId else '❌'}")
                        print(f"  SubCenter Name: {subCenterName} {'✅' if subCenterName else '❌'}")
                        print(f"  Total Litres: {totalLitres} {'✅' if totalLitres else '❌'}")
                        print(f"  Total Value USD: {totalValueUsd} {'✅' if totalValueUsd else '❌'}")
                        print(f"  Total Value ZWG: {totalValueZwg} {'✅' if totalValueZwg else '❌'}")
                        
                else:
                    print(f"❌ Dispatch API error: {dispatch_response.status_code}")
                    print(f"Response: {dispatch_response.text}")
            else:
                print("❌ No token in login response")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_frontend_dispatch_api()