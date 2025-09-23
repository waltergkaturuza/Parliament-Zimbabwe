#!/usr/bin/env python
"""Test dispatch creation workflow as maincenter user."""

import requests
import os
import json

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_dispatch_creation():
    """Test dispatch creation workflow with maincenter user."""
    print("🧪 Testing Dispatch Creation Workflow")
    print("=" * 50)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    user_info = response.json()['user']
    print(f"✅ Logged in as: {user_info['username']} (Role: {user_info.get('role', 'N/A')})")
    
    # Get subcenters for dispatch
    print(f"\n1️⃣ Getting subcenters for dispatch destination...")
    response = requests.get(f'{BASE_URL}/subcenters/', headers=headers)
    
    if response.status_code != 200:
        print("❌ Failed to get subcenters")
        return
        
    subcenters = response.json()
    if isinstance(subcenters, dict) and 'results' in subcenters:
        subcenters = subcenters['results']
    
    print(f"✅ Found {len(subcenters)} subcenters available for dispatch:")
    for sc in subcenters:
        print(f"   - {sc.get('name', 'N/A')} (ID: {sc.get('id', 'N/A')}, Code: {sc.get('code', 'N/A')})")
    
    if not subcenters:
        print("❌ No subcenters found - cannot create dispatch")
        return
    
    # Get books for dispatch
    print(f"\n2️⃣ Getting available books for dispatch...")
    response = requests.get(f'{BASE_URL}/books/', headers=headers)
    
    if response.status_code != 200:
        print("❌ Failed to get books")
        return
        
    books = response.json()
    if isinstance(books, dict) and 'results' in books:
        books = books['results']
    
    print(f"✅ Found {len(books)} books available for dispatch")
    
    if not books:
        print("❌ No books found - cannot create dispatch")
        return
    
    # Show first few books
    for book in books[:3]:
        print(f"   - Book ID: {book.get('id', 'N/A')}, Box: {book.get('box_id', 'N/A')}, Status: {book.get('status', 'N/A')}")
    
    # Try to create a dispatch
    first_subcenter = subcenters[0]
    first_book = books[0]
    
    print(f"\n3️⃣ Testing dispatch creation...")
    print(f"   Target Subcenter: {first_subcenter.get('name', 'N/A')} (ID: {first_subcenter.get('id', 'N/A')})")
    print(f"   Book to dispatch: {first_book.get('id', 'N/A')}")
    
    # Create dispatch payload (based on what frontend would send)
    dispatch_data = {
        'to_center': first_subcenter['id'],  # or 'subCenterId'
        'status': 'DISPATCHED',
        'books': [
            {
                'bookId': first_book['id'],
                'id': first_book['id']
            }
        ]
    }
    
    response = requests.post(f'{BASE_URL}/dispatches/', json=dispatch_data, headers=headers)
    
    print(f"📡 Dispatch creation response: {response.status_code}")
    
    if response.status_code in [200, 201]:
        result = response.json()
        print("✅ Dispatch creation successful!")
        print(f"   Created dispatch ID: {result.get('id', 'N/A')}")
        print(f"   Status: {result.get('status', 'N/A')}")
        print(f"   To Center: {result.get('to_center', 'N/A')}")
    else:
        print("❌ Dispatch creation failed")
        try:
            error = response.json()
            print(f"   Error: {json.dumps(error, indent=2)}")
        except:
            print(f"   Raw response: {response.text}")

if __name__ == "__main__":
    test_dispatch_creation()