import requests
import os

# Test the dispatch form endpoints
backend_url = "https://parliament-zimbabwe.onrender.com"

print("Testing dispatch form endpoints...")

# Test subcenters endpoint
try:
    response = requests.get(f"{backend_url}/api/subcenters/", timeout=10)
    print(f"Subcenters endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('results', data)) if isinstance(data, dict) else len(data)} subcenters")
except Exception as e:
    print(f"Subcenters endpoint error: {e}")

# Test books endpoint
try:
    response = requests.get(f"{backend_url}/api/books/", timeout=10)
    print(f"Books endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('results', data)) if isinstance(data, dict) else len(data)} books")
except Exception as e:
    print(f"Books endpoint error: {e}")

# Test available books for dispatch
try:
    response = requests.get(f"{backend_url}/api/books/available_for_dispatch/", timeout=10)
    print(f"Available books endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Available books data: {data}")
except Exception as e:
    print(f"Available books endpoint error: {e}")

# Test handovers endpoint
try:
    response = requests.get(f"{backend_url}/api/handovers/", timeout=10)
    print(f"Handovers endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Found {len(data.get('results', data)) if isinstance(data, dict) else len(data)} handovers")
except Exception as e:
    print(f"Handovers endpoint error: {e}")

print("\nTesting complete!")