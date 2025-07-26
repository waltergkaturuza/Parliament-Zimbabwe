import requests
import time
from datetime import datetime

def monitor_azure_deployment():
    """Monitor Azure backend deployment status"""
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🚀 MONITORING AZURE DEPLOYMENT")
    print("=" * 60)
    print(f"Backend URL: {backend_url}")
    print(f"Start time: {datetime.now()}")
    print("=" * 60)
    
    attempt = 1
    while attempt <= 20:  # Monitor for up to 10 minutes (20 * 30s)
        print(f"\n📍 Check {attempt}/20 - {datetime.now().strftime('%H:%M:%S')}")
        
        try:
            response = requests.get(backend_url + "/", timeout=15)
            status_code = response.status_code
            response_time = response.elapsed.total_seconds()
            
            print(f"   Status: {status_code}")
            print(f"   Response time: {response_time:.2f}s")
            
            if status_code == 200:
                print("✅ SUCCESS! Backend is now responding with 200 OK")
                
                # Test a few key endpoints
                endpoints_to_test = [
                    "/api/",
                    "/api/v1/",
                    "/admin/",
                    "/api/v1/auth/login/"
                ]
                
                print("\n🔍 Testing key endpoints:")
                for endpoint in endpoints_to_test:
                    try:
                        resp = requests.get(backend_url + endpoint, timeout=10)
                        print(f"   ✅ {endpoint}: {resp.status_code}")
                    except Exception as e:
                        print(f"   ❌ {endpoint}: {str(e)[:50]}...")
                
                return True
                
            elif status_code == 503:
                print("   ⏳ Still getting 503 - deployment in progress...")
            else:
                print(f"   ⚠️  Unexpected status code: {status_code}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ Request timed out - deployment may still be in progress")
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}...")
        
        if attempt < 20:
            print("   ⏳ Waiting 30 seconds before next check...")
            time.sleep(30)
        
        attempt += 1
    
    print("\n❌ Deployment monitoring completed - backend still not responding properly")
    return False

if __name__ == "__main__":
    success = monitor_azure_deployment()
    
    if success:
        print("\n🎉 DEPLOYMENT SUCCESSFUL!")
        print("Your Azure backend is now ready for testing.")
    else:
        print("\n⚠️  DEPLOYMENT MAY NEED MORE TIME")
        print("Check Azure Portal for detailed deployment logs.")
