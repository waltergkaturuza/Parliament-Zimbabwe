import requests

# Get token
response = requests.post('http://127.0.0.1:8000/api/v1/auth/login/', json={'username': 'admin', 'password': 'password123'})
token = response.json()['access']

# Test problematic endpoints
headers = {'Authorization': f'Bearer {token}'}

print("Testing problematic endpoints:")
print("="*50)

endpoints = [
    '/api/v1/pool-vehicles/',
    '/api/v1/vehicle-assignments/', 
    '/api/v1/system-alerts/',
    '/api/v1/analytics/'
]

for endpoint in endpoints:
    try:
        resp = requests.get(f'http://127.0.0.1:8000{endpoint}', headers=headers)
        print(f"{endpoint}: {resp.status_code}")
        if resp.status_code >= 400:
            print(f"  Error: {resp.text[:200]}")
    except Exception as e:
        print(f"{endpoint}: Error - {e}")
