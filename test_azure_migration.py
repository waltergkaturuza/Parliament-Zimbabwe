#!/usr/bin/env python3
"""
Test Azure deployment and verify MainCenter migration status
"""
import requests
import json
import sys

def test_api_endpoint(url, description):
    """Test an API endpoint and check response"""
    print(f"🔍 Testing {description}...")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url, headers={'Accept': 'application/json'}, timeout=30)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   ✅ Response received successfully")
                return True, data
            except json.JSONDecodeError:
                print(f"   ❌ Invalid JSON response")
                print(f"   Raw response: {response.text[:200]}...")
                return False, None
        else:
            print(f"   ❌ Error response: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False, None

def check_maincenter_fields(data):
    """Check if MainCenter alignment fields are present"""
    if not data:
        return False
    
    # Handle different response structures
    items = []
    if isinstance(data, dict):
        if 'results' in data:
            items = data['results']
        elif 'data' in data:
            items = [data['data']] if data['data'] else []
        else:
            items = [data]
    elif isinstance(data, list):
        items = data
    
    if not items:
        print("   ⚠️  No data items to check")
        return False
    
    item = items[0]
    expected_fields = ['contact_number', 'email']
    found_fields = []
    
    for field in expected_fields:
        if field in item:
            found_fields.append(field)
            print(f"   ✅ Field '{field}' found: {item.get(field, 'None')}")
        else:
            print(f"   ❌ Field '{field}' missing")
    
    return len(found_fields) == len(expected_fields)

def main():
    """Main test function"""
    print("🚀 AZURE MIGRATION VERIFICATION")
    print("=" * 50)
    
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    tests = [
        (f"{base_url}/api/v1/subcenters/", "SubCenter API - Check for new fields"),
        (f"{base_url}/api/v1/dashboard/", "MainCenter Dashboard API"),
        (f"{base_url}/api/v1/boxes/", "Box API - Check for is_received field"),
    ]
    
    successful_tests = 0
    migration_fields_found = False
    
    for url, description in tests:
        print(f"\n📊 {description}")
        success, data = test_api_endpoint(url, description)
        
        if success:
            successful_tests += 1
            
            # Check for MainCenter fields specifically in SubCenter endpoint
            if "subcenters" in url:
                migration_fields_found = check_maincenter_fields(data)
        else:
            print(f"   ❌ Test failed for {description}")
    
    # Summary
    print(f"\n" + "=" * 50)
    print("📋 MIGRATION VERIFICATION SUMMARY")
    print("=" * 50)
    print(f"API Tests: {successful_tests}/{len(tests)} passed")
    print(f"MainCenter Fields: {'✅ Found' if migration_fields_found else '❌ Missing'}")
    
    if successful_tests == len(tests) and migration_fields_found:
        print("🎉 MIGRATION SUCCESSFUL! MainCenter alignment is live!")
        return True
    else:
        print("⚠️  Migration may still be in progress or failed")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
