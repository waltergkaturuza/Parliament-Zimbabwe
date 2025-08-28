import requests
import json

# Test the production login endpoint
url = 'https://parliament-zimbabwe.onrender.com/api/auth/login/'
data = {'username': 'admin', 'password': 'admin123'}

try:
    response = requests.post(url, json=data)
    print(f'Production Status: {response.status_code}')
    if response.status_code == 200:
        resp_data = response.json()
        print('Production login successful!')
        if 'user' in resp_data and 'role' in resp_data['user']:
            print(f'User role: {resp_data["user"]["role"]}')
            print(f'User data: {json.dumps(resp_data["user"], indent=2)}')
        else:
            print('Role data missing from response')
    else:
        print(f'Production login failed: {response.text}')
except Exception as e:
    print(f'Error: {e}')
