import requests
import time

def check_azure_status():
    """Simple Azure backend status check"""
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔍 Checking Azure App Service Status...")
    print(f"URL: {backend_url}")
    print("-" * 60)
    
    # Try multiple attempts with increasing timeouts
    for attempt in range(3):
        timeout = 30 + (attempt * 10)  # 30s, 40s, 50s
        print(f"\n📍 Attempt {attempt + 1}/3 (timeout: {timeout}s)")
        
        try:
            # Simple GET request with longer timeout
            response = requests.get(backend_url + "/", timeout=timeout)
            print(f"✅ Status Code: {response.status_code}")
            print(f"✅ Response Time: {response.elapsed.total_seconds():.2f}s")
            print(f"✅ Content Length: {len(response.content)} bytes")
            
            # Check if it's HTML or JSON
            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    print(f"✅ JSON Response: {response.json()}")
                except:
                    print("❌ Invalid JSON")
            else:
                print(f"✅ HTML Response (first 200 chars): {response.text[:200]}...")
            
            return True
            
        except requests.exceptions.Timeout:
            print(f"⏰ Request timed out after {timeout}s")
        except requests.exceptions.ConnectionError as e:
            print(f"❌ Connection Error: {e}")
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
        
        if attempt < 2:
            print(f"⏳ Waiting 10 seconds before retry...")
            time.sleep(10)
    
    print("\n❌ All attempts failed")
    return False

def check_azure_health_endpoint():
    """Check if there's a health endpoint"""
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("\n🏥 Checking Health Endpoints...")
    
    health_endpoints = [
        "/health/",
        "/api/health/",
        "/status/",
        "/.well-known/health",
        "/ping/"
    ]
    
    for endpoint in health_endpoints:
        try:
            response = requests.get(backend_url + endpoint, timeout=20)
            print(f"✅ {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"   Content: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)[:50]}...")

if __name__ == "__main__":
    print("🚀 AZURE BACKEND SIMPLE STATUS CHECK")
    print("=" * 60)
    
    if check_azure_status():
        check_azure_health_endpoint()
    
    print("\n" + "=" * 60)
    print("🎯 STATUS CHECK COMPLETE")
    print("=" * 60)
