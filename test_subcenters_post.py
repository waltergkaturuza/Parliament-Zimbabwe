import requests
import json

print("Testing subcenters POST endpoint...")

try:
    # Test the subcenters POST endpoint
    url = "http://127.0.0.1:8000/api/v1/subcenters/"
    data = {
        "capacity": 100,
        "code": "SC-HRE-02",
        "is_active": True,
        "location": "Harare Mt Hampden",
        "managed_by": 2,
        "name": "Sub-Center-B"
    }

    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

except Exception as e:
    print(f"Error: {e}")