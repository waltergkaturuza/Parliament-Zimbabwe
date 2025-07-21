#!/usr/bin/env python
"""
Quick test script to check if the subcenter endpoints work with actual IDs
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_with_auth():
    # First login
    login_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json().get('access')
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("✅ Login successful")
    
    # Test subcenters list first
    print("\n🔍 Testing subcenters list...")
    list_response = requests.get(f"{BASE_URL}/subcenters/", headers=headers)
    print(f"Subcenters list: {list_response.status_code}")
    
    if list_response.status_code == 200:
        subcenters = list_response.json()
        print(f"Found {len(subcenters)} subcenters")
        if subcenters:
            # Use the first subcenter's ID
            subcenter_id = subcenters[0]['id']
            print(f"Using subcenter ID: {subcenter_id}")
            
            # Test statistics endpoint
            print(f"\n📊 Testing statistics endpoint...")
            stats_response = requests.get(f"{BASE_URL}/subcenters/{subcenter_id}/statistics/", headers=headers)
            print(f"Statistics: {stats_response.status_code}")
            if stats_response.status_code == 200:
                print("✅ Statistics endpoint working!")
                print(f"Data: {json.dumps(stats_response.json(), indent=2)}")
            else:
                print(f"❌ Statistics failed: {stats_response.text}")
            
            # Test recent activity endpoint
            print(f"\n📋 Testing recent activity endpoint...")
            activity_response = requests.get(f"{BASE_URL}/subcenters/{subcenter_id}/recent-activity/", headers=headers)
            print(f"Recent activity: {activity_response.status_code}")
            if activity_response.status_code == 200:
                print("✅ Recent activity endpoint working!")
                print(f"Data: {json.dumps(activity_response.json(), indent=2)}")
            else:
                print(f"❌ Recent activity failed: {activity_response.text}")
        else:
            print("No subcenters found, creating a test subcenter...")
            # Create a test subcenter
            create_response = requests.post(f"{BASE_URL}/subcenters/", 
                json={"name": "Test SubCenter", "location": "Test Location"}, 
                headers=headers)
            print(f"Create subcenter: {create_response.status_code}")
            if create_response.status_code == 201:
                subcenter_id = create_response.json()['id']
                print(f"Created subcenter with ID: {subcenter_id}")
                # Test with the new ID
                stats_response = requests.get(f"{BASE_URL}/subcenters/{subcenter_id}/statistics/", headers=headers)
                print(f"Statistics: {stats_response.status_code}")
    else:
        print(f"❌ Subcenters list failed: {list_response.text}")

if __name__ == "__main__":
    try:
        test_with_auth()
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the Django server running on port 8000?")
    except Exception as e:
        print(f"❌ Error: {e}")
