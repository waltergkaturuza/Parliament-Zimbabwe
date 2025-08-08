#!/usr/bin/env python3
"""
Quick Azure deployment status checker
"""
import requests
import time
from datetime import datetime

def check_azure_status():
    # Your Azure app URLs
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    frontend_url = "https://jolly-ocean-0e0dee90f.2.azurestaticapps.net"
    
    print(f"🔍 Checking Azure deployment status at {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)
    
    # Check backend
    try:
        print(f"📡 Checking backend: {backend_url}")
        response = requests.get(f"{backend_url}/health/", timeout=30)
        print(f"✅ Backend Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   Error: {response.text[:200]}...")
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend Error: {str(e)}")
    
    # Check frontend
    try:
        print(f"🌐 Checking frontend: {frontend_url}")
        response = requests.get(frontend_url, timeout=15)
        print(f"✅ Frontend Status: {response.status_code}")
        if response.status_code != 200:
            print(f"   Error: {response.text[:200]}...")
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend Error: {str(e)}")
    
    # Check admin API
    try:
        print(f"🔧 Checking admin API: {backend_url}/api/admin/")
        response = requests.get(f"{backend_url}/api/admin/dashboard/", timeout=20)
        print(f"   Admin API Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Admin API Error: {str(e)}")
    
    print("=" * 60)

if __name__ == "__main__":
    check_azure_status()
