import requests
import json

# Test creating an alert via API
url = "http://127.0.0.1:8000/api/system-alerts/"

# Login first to get token
login_url = "http://127.0.0.1:8000/api/login/"
login_data = {
    "username": "admin", 
    "password": "admin123"
}

print("Testing SystemAlert creation via API...")
print("1. Logging in...")

try:
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        print("✅ Login successful")
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test alert data
        alert_data = {
            "title": "Test Alert - Database Fix",
            "message": "Testing if the database constraint fix worked",
            "alert_type": "info",
            "priority": "medium",
            "target_roles": ["admin"],
            "is_dismissible": True
        }
        
        print("2. Creating alert...")
        response = requests.post(url, json=alert_data, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 201:
            print("✅ SUCCESS: Alert created successfully!")
            alert = response.json()
            print(f"   Alert ID: {alert.get('id')}")
            print(f"   Title: {alert.get('title')}")
        else:
            print(f"❌ FAILED: {response.status_code}")
            
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)

except Exception as e:
    print(f"❌ Error: {e}")
