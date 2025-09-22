#!/usr/bin/env python3
import os
import django
import requests

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

# Get the superuser to generate a token
try:
    user = User.objects.get(username='superadmin')
    token = AccessToken.for_user(user)
    
    # Test the drivers API
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('http://localhost:8000/api/v1/drivers/', headers=headers)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data.get('results', []))} drivers")
        if data.get('results'):
            first_driver = data['results'][0]
            print("First driver data:")
            print(f"  Name: {first_driver.get('first_name')} {first_driver.get('last_name')}")
            print(f"  Active vehicles: {first_driver.get('active_vehicles', [])}")
    else:
        print(f"Error: {response.text[:500]}")
        
except User.DoesNotExist:
    print("Superuser not found")
except Exception as e:
    print(f"Error: {e}")