#!/usr/bin/env python
"""
Test script for API endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_login():
    """Test login and get JWT token"""
    print("Testing login...")
    
    login_data = {
        "username": "admin",
        "password": "pass@123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Login successful!")
            print(f"Access token: {data.get('access', 'Not found')[:50]}...")
            return data.get('access')
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_user_profile(token):
    """Test getting current user profile"""
    print("\nTesting user profile...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/user/", headers=headers)
        print(f"User Profile Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("User profile retrieved successfully!")
            print(f"User: {data.get('username')} - {data.get('first_name')} {data.get('last_name')}")
            return data
        else:
            print(f"User profile failed: {response.text}")
            return None
    except Exception as e:
        print(f"User profile error: {e}")
        return None

def test_box_creation(token, user_data):
    """Test creating a new box"""
    print("\nTesting box creation...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # First, try to get existing boxes to see the next box number
    try:
        response = requests.get(f"{BASE_URL}/boxes/", headers=headers)
        print(f"Get Boxes Status: {response.status_code}")
        
        if response.status_code == 200:
            boxes_data = response.json()
            existing_boxes = boxes_data.get('results', boxes_data) if isinstance(boxes_data, dict) else boxes_data
            print(f"Found {len(existing_boxes) if isinstance(existing_boxes, list) else 0} existing boxes")
            
            # Generate next box number
            import datetime
            year = datetime.datetime.now().year
            month = f"{datetime.datetime.now().month:02d}"
            next_num = len(existing_boxes) + 1 if isinstance(existing_boxes, list) else 1
            box_code = f"FCB-{year}-{month}-{next_num:04d}"
            
        else:
            print(f"Failed to get existing boxes: {response.text}")
            # Use default box code
            box_code = "FCB-2025-08-TEST-001"
            
    except Exception as e:
        print(f"Error getting boxes: {e}")
        box_code = "FCB-2025-08-TEST-002"
    
    # Current user name for received_by
    received_by = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or user_data.get('username', 'Test User')
    
    box_data = {
        "box_code": box_code,
        "barcode": f"BC{box_code.replace('-', '')}",
        "supplier": "Test Supplier Ltd",
        "fuel_type": "DIESEL",
        "number_of_books": 50,
        "coupon_amount": 20,
        "coupons_per_book": 10,
        "first_coupon_id": "D202508001001",
        "last_coupon_id": "D202508001500",
        "received_by": received_by,
        "received_at": "2025-08-12T11:30:00Z",
        "status": "RECEIVED",
        "notes": "Test box creation from API script"
    }
    
    print(f"Creating box with code: {box_code}")
    print(f"Received by: {received_by}")
    
    try:
        response = requests.post(f"{BASE_URL}/boxes/", json=box_data, headers=headers)
        print(f"Box Creation Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("Box created successfully!")
            print(f"Box ID: {data.get('id')}")
            print(f"Box Code: {data.get('box_code')}")
            return data
        else:
            print(f"Box creation failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"Box creation error: {e}")
        return None

def main():
    print("=== API Testing Script ===")
    
    # Test login
    token = test_login()
    if not token:
        print("Cannot continue without valid token")
        return
    
    # Test user profile
    user_data = test_user_profile(token)
    if not user_data:
        print("Cannot get user data")
        return
    
    # Test box creation
    box_data = test_box_creation(token, user_data)
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()
