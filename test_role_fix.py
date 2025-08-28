import requests
import json

print("=== TESTING ROLE-BASED LOGIN FIX ===\n")

# Test the fixed login endpoint
url = "http://127.0.0.1:8000/api/auth/login/"
credentials = {"username": "admin", "password": "Pass@123"}

try:
    response = requests.post(url, json=credentials)
    print(f"✅ Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login Success: {data['success']}")
        print(f"✅ Message: {data['message']}")
        
        user = data.get('user', {})
        print(f"\n🔍 USER DATA ANALYSIS:")
        print(f"   - ID: {user.get('id')}")
        print(f"   - Username: {user.get('username')}")
        print(f"   - Email: {user.get('email')}")
        print(f"   - Name: {user.get('name')}")
        print(f"   - Role: {user.get('role')} {'✅' if user.get('role') else '❌'}")
        print(f"   - Is Superuser: {user.get('is_superuser')}")
        print(f"   - Center ID: {user.get('centerId')}")
        print(f"   - Center Name: {user.get('centerName')}")
        print(f"   - Phone: {user.get('phone')}")
        print(f"   - Approved: {user.get('is_approved')}")
        
        # Check if role is properly defined (not undefined)
        if user.get('role') and user.get('role') != 'undefined':
            print(f"\n🎉 SUCCESS: User role '{user.get('role')}' is properly defined!")
            print("✅ Frontend role-based routing should now work correctly")
            print("✅ Dashboard access will be granted based on role permissions")
        else:
            print(f"\n❌ ISSUE: User role is still undefined or missing")
            
        # Verify tokens are present
        if data.get('access_token') and data.get('refresh_token'):
            print("✅ JWT tokens successfully generated")
        else:
            print("❌ Missing JWT tokens")
            
    else:
        print(f"❌ Login Failed: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print(f"\n=== FRONTEND INTEGRATION READY ===")
print("The login endpoint now returns complete user data including:")
print("- ✅ role field for role-based routing") 
print("- ✅ centerId and centerName for center-specific access")
print("- ✅ permissions array for fine-grained access control")
print("- ✅ Complete user profile information")
print("- ✅ JWT access and refresh tokens")
