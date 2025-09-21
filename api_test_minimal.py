import requests
import json

print("Testing bidirectional allocation API...")

try:
    url = "http://127.0.0.1:8000/api/boxes/calculate/"
    data = {
        "coupon_amounts": [5, 10, 20, 25],
        "mode": "first-last", 
        "serial_start": "FC001001",
        "serial_end": "FC001050"
    }
    
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")