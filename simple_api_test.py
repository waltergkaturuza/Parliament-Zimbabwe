import requests
import json
import sys

def test_api():
    url = "http://127.0.0.1:8000/api/boxes/calculate/"
    
    data = {
        "coupon_amounts": [5, 10, 20, 25],
        "mode": "first-last",
        "serial_start": "FC001001",
        "serial_end": "FC001050"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()