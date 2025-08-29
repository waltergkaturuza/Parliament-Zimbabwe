#!/usr/bin/env python
"""
Test script to verify subcenter API endpoints and data flow
"""
import requests
import json
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

BASE_URL = "http://localhost:8000/api/v1"

def login_user(username, password):
    """Login and get access token"""
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        response.raise_for_status()
        data = response.json()
        return data.get('access')
    except requests.exceptions.RequestException as e:
        print(f"Login failed: {e}")
        return None

def test_subcenter_statistics(token, subcenter_id):
    """Test subcenter statistics endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/subcenters/{subcenter_id}/statistics/", headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print("📊 Subcenter Statistics Response:")
        print(json.dumps(data, indent=2))
        
        # Check if frontend expected fields are present
        expected_fields = ['total_coupons_assigned', 'available_coupons', 'recently_distributed']
        missing_fields = [field for field in expected_fields if field not in data]
        
        if missing_fields:
            print(f"\n❌ Missing expected fields: {missing_fields}")
        else:
            print(f"\n✅ All expected fields are present!")
            
        return data
    except requests.exceptions.RequestException as e:
        print(f"Statistics API failed: {e}")
        return None

def test_recent_activity(token, subcenter_id):
    """Test subcenter recent activity endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/subcenters/{subcenter_id}/recent_activity/", headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print("📋 Recent Activity Response:")
        print(json.dumps(data, indent=2))
        
        # Check if frontend expected fields are present in activities
        if data and len(data) > 0:
            expected_fields = ['id', 'action', 'timestamp', 'user']
            sample_activity = data[0]
            missing_fields = [field for field in expected_fields if field not in sample_activity]
            
            if missing_fields:
                print(f"\n❌ Missing expected activity fields: {missing_fields}")
            else:
                print(f"\n✅ All expected activity fields are present!")
        else:
            print("\n📝 No activities found")
            
        return data
    except requests.exceptions.RequestException as e:
        print(f"Recent Activity API failed: {e}")
        return None

def main():
    print("🧪 Testing SubCenter API Endpoints")
    print("=" * 50)
    
    # Test credentials
    username = "test_subcenter_user"
    password = "admin123"
    subcenter_id = 2
    
    # Step 1: Login
    print(f"🔐 Logging in as {username}...")
    token = login_user(username, password)
    
    if not token:
        print("❌ Failed to login. Make sure the user exists and backend is running.")
        return
    
    print("✅ Login successful!")
    print(f"Token: {token[:50]}...")
    
    # Step 2: Test statistics endpoint
    print(f"\n📊 Testing statistics for subcenter {subcenter_id}...")
    stats = test_subcenter_statistics(token, subcenter_id)
    
    # Step 3: Test recent activity endpoint
    print(f"\n📋 Testing recent activity for subcenter {subcenter_id}...")
    activities = test_recent_activity(token, subcenter_id)
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
