#!/usr/bin/env python3
"""
Test audit logs API directly using Django test client (bypasses HTTP)
"""
import os
import sys
import django

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from fuel.models import AuditLog

User = get_user_model()

def test_audit_logs_direct():
    print("Testing Audit Logs API using Django test client...")
    
    # Get a user for authentication
    user = User.objects.get(username='admin')
    
    # Create Django test client and force login
    client = Client()
    client.force_login(user)
    
    print(f"1. Logged in as: {user.username}")
    
    # Test audit logs endpoint
    print("2. Testing audit logs endpoint...")
    response = client.get('/api/v1/audit-logs/')
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Response data:")
        print(f"  - Count: {data.get('count', 0)}")
        print(f"  - Results: {len(data.get('results', []))}")
        
        results = data.get('results', [])
        if results:
            print("\nFirst few audit log entries:")
            for i, log in enumerate(results[:3]):
                print(f"  {i+1}. Action: {log.get('action')}")
                print(f"     Description: {log.get('description')}")
                print(f"     User: {log.get('user_details', {}).get('username', 'N/A')}")
                print(f"     Date: {log.get('created_at')}")
                print()
        else:
            print("No audit log entries in response.")
            
    else:
        print(f"Error: {response.status_code}")
        print(f"Response: {response.content.decode()}")
    
    # Also test direct database query
    print("\n3. Direct database check:")
    audit_count = AuditLog.objects.count()
    print(f"Total audit logs in database: {audit_count}")
    
    if audit_count > 0:
        recent_logs = AuditLog.objects.order_by('-created')[:5]
        print("Recent audit logs from database:")
        for log in recent_logs:
            print(f"  - {log.action}: {log.description} (User: {log.user})")

if __name__ == "__main__":
    test_audit_logs_direct()
