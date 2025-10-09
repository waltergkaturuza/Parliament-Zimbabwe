#!/usr/bin/env python
import requests
import json

try:
    print("Testing dispatch API endpoint...")
    response = requests.get('http://localhost:5177/api/dispatches/', timeout=10)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response data type: {type(data)}")
        
        if isinstance(data, dict):
            if 'results' in data:
                dispatches = data['results']
                print(f"Found {len(dispatches)} dispatches")
            else:
                dispatches = [data]
        else:
            dispatches = data
            print(f"Found {len(dispatches)} dispatches")
        
        # Check the first dispatch
        if dispatches:
            dispatch = dispatches[0]
            print(f"\n--- First Dispatch (ID: {dispatch.get('id')}) ---")
            print(f"Dispatch ID: {dispatch.get('dispatch_id')}")
            print(f"SubCenter ID: {dispatch.get('subCenterId', dispatch.get('sub_center_id'))}")
            print(f"SubCenter Name: {dispatch.get('subCenterName', dispatch.get('sub_center_name'))}")
            print(f"Total Litres: {dispatch.get('total_litres', dispatch.get('totalLitres'))}")
            print(f"Total Value USD: {dispatch.get('total_value_usd', dispatch.get('totalValueUsd'))}")
            print(f"Total Value ZWG: {dispatch.get('total_value_zwg', dispatch.get('totalValueZwg'))}")
            print(f"Books count: {len(dispatch.get('books', []))}")
            print(f"Status: {dispatch.get('status')}")
            
            # Check to_center structure
            to_center = dispatch.get('to_center')
            if to_center:
                print(f"to_center: {to_center}")
            
            print(f"\nAll available fields: {list(dispatch.keys())}")
        
    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
