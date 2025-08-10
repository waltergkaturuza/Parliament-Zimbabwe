import requests
import json

# Get authentication token
print("🔍 DEBUGGING SPECIFIC FAILING ENDPOINTS")
print("="*50)

try:
    login_response = requests.post('http://127.0.0.1:8000/api/v1/auth/login/', 
                                  json={'username': 'admin', 'password': 'password123'})
    token = login_response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Authentication successful")

    # Test Box Creation (500 error)
    print("\n1. Testing Box Creation (was returning 500):")
    box_data = {
        'couponAmount': 20,
        'monetaryValueUSD': 15.50, 
        'fuelPricePerLitreUSD': 0.78,
        'exchangeRate': 1.25,
        'number_of_coupons': 100,
        'total_litres': 2000,
        'box_date': '2025-08-10',
        'sub_center': 1,
        'first_coupon_number': 'FC25081001',
        'last_coupon_number': 'FC25081100',
        'notes': 'Test box'
    }
    
    resp = requests.post('http://127.0.0.1:8000/api/v1/boxes/', json=box_data, headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code >= 400:
        print(f"   Error: {resp.text[:500]}")

    # Test other failing endpoints
    print("\n2. Testing other problematic endpoints:")
    endpoints = [
        ('Coupons', '/api/v1/coupons/'),
        ('Pool Vehicles', '/api/v1/pool-vehicles/'),
        ('Vehicle Assignments', '/api/v1/vehicle-assignments/'),
        ('System Alerts', '/api/v1/system-alerts/'),
        ('Analytics', '/api/v1/analytics/'),
    ]

    for name, endpoint in endpoints:
        resp = requests.get(f'http://127.0.0.1:8000{endpoint}', headers=headers)
        status_icon = "✅" if resp.status_code == 200 else "❌"
        print(f"   {status_icon} {name}: {resp.status_code}")
        if resp.status_code >= 400:
            error_text = resp.text[:200]
            print(f"      Error: {error_text}")

except Exception as e:
    print(f"❌ Error: {e}")
