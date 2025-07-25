import requests
import json
import time
from datetime import datetime

def diagnose_azure_backend():
    """Comprehensive diagnostic of Azure backend issues"""
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔧 AZURE BACKEND DIAGNOSTIC")
    print("=" * 60)
    print(f"Timestamp: {datetime.now()}")
    print(f"Backend URL: {backend_url}")
    print("=" * 60)
    
    # Test 1: Basic connectivity
    print("\n📡 Test 1: Basic Connectivity")
    try:
        response = requests.get(backend_url, timeout=30)
        print(f"✅ Connection established")
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response Time: {response.elapsed.total_seconds():.2f}s")
        
        # Get full response details
        print(f"✅ Headers:")
        for key, value in response.headers.items():
            print(f"     {key}: {value}")
        
        print(f"✅ Content (first 500 chars):")
        print(response.text[:500])
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    # Test 2: Check if it's a Django error page
    print("\n🐍 Test 2: Django Error Analysis")
    if "Application Error" in response.text:
        print("❌ Azure Application Error detected")
        print("   This usually means:")
        print("   - Django failed to start")
        print("   - Database connection issues")
        print("   - Missing environment variables")
        print("   - Python/package installation problems")
    
    # Test 3: Check specific endpoints that might work
    print("\n🔍 Test 3: Endpoint Testing")
    test_endpoints = [
        "/admin/",
        "/api/",
        "/static/",
        "/.well-known/",
        "/robots.txt"
    ]
    
    for endpoint in test_endpoints:
        try:
            resp = requests.get(backend_url + endpoint, timeout=10)
            print(f"✅ {endpoint}: {resp.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)[:50]}...")
    
    # Test 4: Check if GitHub Actions deployment is still running
    print("\n🚀 Test 4: Deployment Status Check")
    print("   Check GitHub Actions at:")
    print("   https://github.com/waltergkaturuza/Parliament-Zimbabwe/actions")
    
    # Test 5: Common Azure App Service URLs
    print("\n🔧 Test 5: Azure Service URLs")
    azure_urls = [
        f"{backend_url}/",
        f"{backend_url.replace('https://', 'https://www.')}/",  # www variant
        f"{backend_url}/health",
        f"{backend_url}/api/v1/"
    ]
    
    for url in azure_urls:
        try:
            resp = requests.head(url, timeout=10)
            print(f"✅ {url}: {resp.status_code}")
        except Exception as e:
            print(f"❌ {url}: {str(e)[:50]}...")
    
    return True

def get_troubleshooting_steps():
    """Provide troubleshooting steps"""
    print("\n🛠️  TROUBLESHOOTING STEPS")
    print("=" * 60)
    
    steps = [
        "1. Check Azure App Service logs in Azure Portal",
        "2. Verify environment variables are set correctly",
        "3. Check if PostgreSQL database is accessible",
        "4. Restart the Azure App Service",
        "5. Redeploy from GitHub Actions",
        "6. Check requirements.txt for package conflicts",
        "7. Verify Django settings for production",
        "8. Check if ALLOWED_HOSTS includes the domain"
    ]
    
    for step in steps:
        print(f"   {step}")
    
    print("\n📋 Quick Fixes to Try:")
    print("   - Restart Azure App Service")
    print("   - Check GitHub Actions deployment logs")
    print("   - Verify database connection string")
    print("   - Check CORS and security settings")

if __name__ == "__main__":
    success = diagnose_azure_backend()
    get_troubleshooting_steps()
    
    if not success:
        print("\n❌ Backend is completely unreachable")
    else:
        print("\n⚠️  Backend is reachable but returning 503 errors")
        print("   This indicates an application-level problem")
