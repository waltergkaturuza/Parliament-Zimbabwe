import requests
import time
from datetime import datetime

def test_azure_backend_after_config():
    """Test Azure backend after environment variable configuration"""
    backend_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🚀 TESTING AZURE BACKEND AFTER CONFIGURATION")
    print("=" * 60)
    print(f"Backend URL: {backend_url}")
    print(f"Test time: {datetime.now()}")
    print("=" * 60)
    
    # Wait a moment for restart to complete
    print("⏳ Waiting 30 seconds for app service restart to complete...")
    time.sleep(30)
    
    attempt = 1
    max_attempts = 10
    
    while attempt <= max_attempts:
        print(f"\n📍 Test {attempt}/{max_attempts} - {datetime.now().strftime('%H:%M:%S')}")
        
        try:
            response = requests.get(backend_url + "/", timeout=20)
            status_code = response.status_code
            response_time = response.elapsed.total_seconds()
            
            print(f"   Status: {status_code}")
            print(f"   Response time: {response_time:.2f}s")
            
            if status_code == 200:
                print("✅ SUCCESS! Backend is now responding with 200 OK")
                
                # Test key endpoints
                endpoints_to_test = [
                    "/api/",
                    "/api/v1/",
                    "/admin/",
                    "/api/v1/health/",
                    "/api/v1/auth/"
                ]
                
                print("\n🔍 Testing key endpoints:")
                for endpoint in endpoints_to_test:
                    try:
                        resp = requests.get(backend_url + endpoint, timeout=10)
                        print(f"   ✅ {endpoint}: {resp.status_code}")
                    except Exception as e:
                        print(f"   ⚠️ {endpoint}: {str(e)[:50]}...")
                
                # Test CORS
                print("\n🌐 Testing CORS:")
                try:
                    headers = {
                        'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type,Authorization'
                    }
                    resp = requests.options(backend_url + "/api/v1/auth/login/", headers=headers, timeout=10)
                    print(f"   ✅ CORS Preflight: {resp.status_code}")
                    cors_origin = resp.headers.get('Access-Control-Allow-Origin')
                    if cors_origin:
                        print(f"   ✅ CORS Allow Origin: {cors_origin}")
                    else:
                        print("   ⚠️ CORS Allow Origin: Not set")
                except Exception as e:
                    print(f"   ❌ CORS Test: {str(e)[:50]}...")
                
                return True
                
            elif status_code == 503:
                print("   ⏳ Still getting 503 - app may need more time to start...")
            elif status_code == 500:
                print("   ⚠️ Getting 500 - there may be a configuration issue")
            else:
                print(f"   ⚠️ Unexpected status: {status_code}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ Request timed out - app may still be starting...")
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}...")
        
        if attempt < max_attempts:
            print("   ⏳ Waiting 30 seconds before next test...")
            time.sleep(30)
        
        attempt += 1
    
    print(f"\n❌ Backend still not responding properly after {max_attempts} attempts")
    return False

if __name__ == "__main__":
    success = test_azure_backend_after_config()
    
    if success:
        print("\n🎉 BACKEND IS NOW WORKING!")
        print("Your Django backend is properly configured and running.")
        print("You can now test the frontend-backend integration.")
    else:
        print("\n⚠️ BACKEND STILL HAS ISSUES")
        print("Check Azure Portal logs for more details.")
        print("The environment variables are set, but there may be other issues.")
