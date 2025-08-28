#!/usr/bin/env python3
"""
Test script to authenticate and fetch audit logs from the API
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_audit_logs_api():
    print("Testing Audit Logs API...")
    
    # First, login to get an authentication token
    print("1. Attempting login...")
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/v1/test-login/", json=login_data)
        print(f"Login Response Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            auth_data = login_response.json()
            access_token = auth_data.get('access')
            print(f"Login successful! Token acquired.")
            
            # Set up headers with authentication
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test the audit logs endpoint
            print("\n2. Fetching audit logs...")
            audit_response = requests.get(f"{BASE_URL}/api/v1/audit-logs/", headers=headers)
            print(f"Audit Logs Response Status: {audit_response.status_code}")
            
            if audit_response.status_code == 200:
                audit_data = audit_response.json()
                print(f"Audit logs fetched successfully!")
                print(f"Total results: {audit_data.get('count', 0)}")
                
                results = audit_data.get('results', [])
                print(f"Records in current page: {len(results)}")
                
                if results:
                    print("\nFirst few audit log entries:")
                    for i, log in enumerate(results[:3]):
                        print(f"  {i+1}. Action: {log.get('action', 'N/A')}")
                        print(f"     Description: {log.get('description', 'N/A')}")
                        print(f"     User: {log.get('user_details', {}).get('username', 'N/A')}")
                        print(f"     Date: {log.get('created_at', 'N/A')}")
                        print()
                else:
                    print("No audit log entries found.")
                    
            else:
                print(f"Failed to fetch audit logs: {audit_response.text}")
                
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_audit_logs_api()
