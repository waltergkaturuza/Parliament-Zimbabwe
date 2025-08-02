#!/usr/bin/env python3
"""
Simple test to check Azure App Service status
"""
import requests
import time

def check_app_service():
    url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.azurewebsites.net/"
    
    print(f"Checking: {url}")
    print("=" * 50)
    
    try:
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ App Service is running correctly!")
            print(f"Response: {response.text[:200]}...")
        elif response.status_code == 502:
            print("❌ Still getting 502 - App not starting correctly")
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_app_service()
