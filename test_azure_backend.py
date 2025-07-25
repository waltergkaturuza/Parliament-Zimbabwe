import requests
import json

# Azure Backend URL
BASE_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

def test_backend_health():
    """Test if the backend is responding"""
    print("🔍 Testing Backend Health...")
    
    try:
        # Test root endpoint
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"✅ Root endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    try:
        # Test API endpoint
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        print(f"✅ API endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ API endpoint failed: {e}")

def test_cors_headers():
    """Test CORS headers from frontend domain"""
    print("\n🌐 Testing CORS Headers...")
    
    headers = {
        'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
    }
    
    try:
        # Test preflight request
        response = requests.options(f"{BASE_URL}/api/v1/auth/login/", headers=headers, timeout=10)
        print(f"✅ CORS Preflight: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        print("   CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"     {header}: {value}")
            else:
                print(f"     ❌ {header}: Missing")
                
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication Endpoints...")
    
    # Test both auth paths
    auth_paths = [
        "/api/v1/auth/login/",
        "/api/auth/login/"
    ]
    
    for path in auth_paths:
        try:
            response = requests.options(f"{BASE_URL}{path}", timeout=10)
            print(f"✅ {path}: {response.status_code}")
        except Exception as e:
            print(f"❌ {path}: {e}")

def test_api_endpoints():
    """Test various API endpoints"""
    print("\n📊 Testing API Endpoints...")
    
    endpoints = [
        "/api/v1/",
        "/api/v1/fuel/",
        "/api/v1/users/",
        "/api/v1/dashboard/",
        "/admin/",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            print(f"✅ {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   📄 JSON Response: {len(str(data))} characters")
                except:
                    print(f"   📄 HTML Response: {len(response.text)} characters")
                    
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

def test_create_test_data():
    """Test creating some test data via API"""
    print("\n🧪 Testing Data Creation...")
    
    # Test user registration
    test_user_data = {
        "username": "test_user_" + str(int(requests.get("http://worldtimeapi.org/api/timezone/Etc/UTC").json()['unixtime']))[:-3],
        "email": "test@parliament.gov.zw",
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register/",
            json=test_user_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        print(f"✅ User Registration: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print(f"   📄 Success: {response.json()}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ User registration failed: {e}")

def test_database_connection():
    """Test if database is responding"""
    print("\n💾 Testing Database Connection...")
    
    try:
        # Try to access admin panel
        response = requests.get(f"{BASE_URL}/admin/login/", timeout=10)
        if response.status_code == 200:
            print("✅ Database/Admin accessible")
        else:
            print(f"❌ Database/Admin not accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Database test failed: {e}")

if __name__ == "__main__":
    print("🚀 TESTING AZURE BACKEND")
    print("=" * 50)
    print(f"Backend URL: {BASE_URL}")
    print("=" * 50)
    
    test_backend_health()
    test_cors_headers()
    test_auth_endpoints()
    test_api_endpoints()
    test_database_connection()
    test_create_test_data()
    
    print("\n" + "=" * 50)
    print("🎯 BACKEND TESTING COMPLETE")
    print("=" * 50)
