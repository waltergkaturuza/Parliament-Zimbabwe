#!/usr/bin/env python3
"""
Quick Azure health check - test if the service is accessible
"""
import requests
import time
import sys

def quick_health_check():
    """Test basic connectivity to Azure App Service"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    endpoints = [
        f"{base_url}/",
        f"{base_url}/admin/",
        f"{base_url}/api/",
        f"{base_url}/api/v1/",
    ]
    
    print("🔍 QUICK AZURE HEALTH CHECK")
    print("=" * 40)
    
    for url in endpoints:
        print(f"\n📍 Testing: {url}")
        try:
            response = requests.get(url, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ WORKING")
            elif response.status_code == 500:
                print("   ❌ 500 ERROR - Server issue")
                print(f"   Error preview: {response.text[:100]}...")
            elif response.status_code == 404:
                print("   ⚠️  404 - Endpoint not found (might be normal)")
            elif response.status_code == 403:
                print("   🔒 403 - Authentication required (normal for protected endpoints)")
            elif response.status_code == 302:
                print("   🔄 302 - Redirect (might be normal)")
            else:
                print(f"   ⚠️  {response.status_code} - {response.reason}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ TIMEOUT - Service may be starting up")
        except requests.exceptions.ConnectionError:
            print("   ❌ CONNECTION ERROR - Service may be down")
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    # Try a simple ping test
    print(f"\n🏓 Testing basic connectivity...")
    try:
        response = requests.head(base_url, timeout=10)
        print(f"   HEAD request status: {response.status_code}")
        if response.status_code < 500:
            print("   ✅ Service is responding (not a complete 500 error)")
        else:
            print("   ❌ Service has issues")
    except Exception as e:
        print(f"   ❌ Connectivity test failed: {e}")

if __name__ == '__main__':
    quick_health_check()
