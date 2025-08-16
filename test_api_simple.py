import requests
import json

print('=== Testing Direct API Access ===')

# Test base API endpoint
base_url = 'http://127.0.0.1:8000'
try:
    response = requests.get(f'{base_url}/api/')
    print(f'API Root: {response.status_code}')
    if response.status_code == 200:
        print('API Root accessible')
except Exception as e:
    print(f'Error accessing API: {e}')

# Test token endpoint
try:
    login_data = {'username': 'admin', 'password': 'pass@123'}
    response = requests.post(f'{base_url}/api/token/', json=login_data)
    print(f'Token endpoint: {response.status_code}')
    if response.status_code == 200:
        tokens = response.json()
        print('✅ Got tokens successfully')
        
        headers = {'Authorization': f'Bearer {tokens["access"]}'}
        users_response = requests.get(f'{base_url}/api/users/', headers=headers)
        print(f'Users endpoint: {users_response.status_code}')
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            print(f'✅ Found {len(users_data.get("results", []))} users')
            
            # Try to get user stats
            stats_response = requests.get(f'{base_url}/api/users/stats/', headers=headers)
            print(f'User stats endpoint: {stats_response.status_code}')
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print(f'✅ Stats: Total={stats.get("total_users")}, Approved={stats.get("approved_users")}, Pending={stats.get("pending_users")}')
        else:
            print(f'❌ Users endpoint failed: {users_response.text}')
    else:
        print(f'❌ Login failed: {response.text}')
except Exception as e:
    print(f'Error testing API: {e}')

print('\n=== Test Complete ===')
