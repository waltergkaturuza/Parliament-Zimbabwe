"""
Simple test to check if Django server is accessible
"""

import requests
import time

def test_server_connection():
    print("🔍 Testing server connection...")
    
    try:
        # Test basic connection
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Server is accessible! Status: {response.status_code}")
        
        # Test API endpoint
        try:
            api_response = requests.get("http://localhost:8000/api/v1/", timeout=5)
            print(f"✅ API is accessible! Status: {api_response.status_code}")
        except Exception as e:
            print(f"⚠️  API not accessible: {e}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server on http://localhost:8000")
        print("💡 Make sure Django server is running with: python manage.py runserver --settings=config.settings.local")
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    test_server_connection()
