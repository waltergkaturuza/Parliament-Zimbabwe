#!/usr/bin/env python
"""
Test the System Alerts API functionality
"""
import requests
import json

# API base URL
BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api_endpoint(endpoint, method="GET", data=None, headers=None):
    """Test an API endpoint and return response"""
    if headers is None:
        headers = {'Content-Type': 'application/json'}
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        
        print(f"\n🔍 Testing {method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response:")
            print(json.dumps(result, indent=2)[:500] + "..." if len(json.dumps(result, indent=2)) > 500 else json.dumps(result, indent=2))
            return result
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return None

def main():
    print("🚀 Testing System Alerts API...")
    
    # Test 1: Get all alerts
    alerts = test_api_endpoint("/system-alerts/")
    
    # Test 2: Get alert statistics
    stats = test_api_endpoint("/system-alerts/stats/")
    
    # Test 3: Get active alerts
    active_alerts = test_api_endpoint("/system-alerts/active/")
    
    # Test 4: Get critical alerts
    critical_alerts = test_api_endpoint("/system-alerts/critical/")
    
    # Summary
    print(f"\n📊 API Test Summary:")
    print(f"• Alerts endpoint: {'✅ Working' if alerts is not None else '❌ Failed'}")
    print(f"• Stats endpoint: {'✅ Working' if stats is not None else '❌ Failed'}")
    print(f"• Active alerts: {'✅ Working' if active_alerts is not None else '❌ Failed'}")
    print(f"• Critical alerts: {'✅ Working' if critical_alerts is not None else '❌ Failed'}")
    
    if alerts:
        print(f"• Total alerts found: {len(alerts)}")
    
    if stats:
        print(f"• Active alerts: {stats.get('active_alerts', 0)}")
        print(f"• Critical alerts: {stats.get('active_critical', 0)}")

if __name__ == '__main__':
    main()