#!/usr/bin/env python
"""
Test script for the analytics endpoint with new program/session filtering
"""
import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

def test_analytics_endpoint():
    """Test the analytics dispatches timeline endpoint"""
    
    print("🚀 Testing Analytics Dispatches Timeline Endpoint")
    print("=" * 60)
    
    # Test 1: Basic endpoint without filters
    print("\n1. Testing basic endpoint (no filters)...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/dispatches-timeline/")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Returned {len(data.get('timeline', []))} timeline entries")
            
            # Check for new program/session breakdown fields
            if 'by_program' in data:
                print(f"   ✅ by_program field present with {len(data['by_program'])} entries")
            else:
                print("   ⚠️  by_program field missing")
                
            if 'by_session' in data:
                print(f"   ✅ by_session field present with {len(data['by_session'])} entries")
            else:
                print("   ⚠️  by_session field missing")
                
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 2: Test with program_id filter
    print("\n2. Testing with program_id filter...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/dispatches-timeline/?program_id=1")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Filtered by program_id=1")
            print(f"   Timeline entries: {len(data.get('timeline', []))}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 3: Test with session_id filter
    print("\n3. Testing with session_id filter...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/dispatches-timeline/?session_id=1")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Filtered by session_id=1")
            print(f"   Timeline entries: {len(data.get('timeline', []))}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    # Test 4: Test both filters together
    print("\n4. Testing with both program_id and session_id filters...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/dispatches-timeline/?program_id=1&session_id=1")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Filtered by both program_id=1 and session_id=1")
            print(f"   Timeline entries: {len(data.get('timeline', []))}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Analytics endpoint testing complete!")

if __name__ == "__main__":
    test_analytics_endpoint()
