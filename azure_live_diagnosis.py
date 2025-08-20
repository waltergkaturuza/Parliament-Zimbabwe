#!/usr/bin/env python3
"""
Azure Live Endpoint Tester - Direct 500 Error Diagnosis

This script tests the live Azure endpoints to see the actual error responses
and determine if the issue is authentication, database, or code-related.
"""

import requests
import json
from datetime import datetime

def test_azure_endpoint(url, description=""):
    """Test an Azure endpoint and return detailed error information"""
    print(f"\n🧪 Testing: {description}")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 500:
            print("   ❌ 500 Internal Server Error detected!")
            
            # Try to get error details from response
            try:
                if 'application/json' in response.headers.get('content-type', ''):
                    error_data = response.json()
                    print(f"   Error JSON: {json.dumps(error_data, indent=2)}")
                else:
                    error_text = response.text[:500]  # First 500 chars
                    print(f"   Error Text: {error_text}")
            except:
                print("   Could not parse error response")
                
        elif response.status_code == 401:
            print("   🔐 Authentication required (this is expected for protected endpoints)")
        elif response.status_code == 404:
            print("   ❓ Endpoint not found")
        elif response.status_code == 200:
            print("   ✅ Success!")
            
    except requests.exceptions.Timeout:
        print("   ⏱️  Request timed out")
    except requests.exceptions.ConnectionError:
        print("   🔌 Connection error")
    except Exception as e:
        print(f"   💥 Error: {str(e)}")

def main():
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔍 AZURE LIVE ENDPOINT DIAGNOSIS")
    print("=" * 60)
    print(f"Testing Azure deployment at: {base_url}")
    print(f"Started at: {datetime.now()}")
    
    # Test the problematic endpoints
    endpoints = [
        ("/api/v1/analytics/received-breakdown/?period=month", "Analytics Received Breakdown"),
        ("/api/v1/analytics/available-by-center/", "Analytics Available by Center"),
        ("/api/v1/boxes/", "Boxes API"),
        ("/api/v1/boxes/?ordering=-box_code&limit=1&search=FCB-2025-", "Boxes Search"),
        ("/api/v1/boxes/?status=received&ordering=-received_at", "Boxes Filtered"),
        ("/", "Root URL"),
        ("/admin/", "Django Admin"),
        ("/api/", "API Root"),
    ]
    
    for endpoint, description in endpoints:
        test_azure_endpoint(f"{base_url}{endpoint}", description)
    
    print("\n" + "=" * 60)
    print("🎯 ANALYSIS:")
    print("")
    print("If you see 500 errors above, the most likely causes are:")
    print("1. ❌ Azure is still using config.settings (SQLite) instead of config.settings.production (PostgreSQL)")
    print("2. ❌ DATABASE_URL environment variable not set in Azure")
    print("3. ❌ Database migrations not applied on Azure PostgreSQL")
    print("4. ❌ Missing required environment variables")
    print("")
    print("🚀 IMMEDIATE FIXES:")
    print("1. Set DJANGO_SETTINGS_MODULE=config.settings.production in Azure")
    print("2. Set DATABASE_URL in Azure environment variables")
    print("3. Run migrations on Azure: python manage.py migrate")
    print("4. Restart Azure App Service")

if __name__ == "__main__":
    main()
