#!/usr/bin/env python
"""
Quick test server to verify URL resolution
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Setup Django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

if __name__ == '__main__':
    django.setup()
    
    # Test URL resolution
    from django.urls import resolve
    from django.test import Client
    
    print("Testing URL patterns...")
    
    test_url = '/api/v1/audit/compliance-reports/test-123/download/'
    
    try:
        match = resolve(test_url)
        print(f"✅ URL {test_url} resolves to: {match.func.__name__}")
        print(f"   View name: {match.view_name}")
        print(f"   Kwargs: {match.kwargs}")
        
        # Test with test client
        client = Client()
        response = client.get(test_url)
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 401:
            print("   → Authentication required (expected)")
        elif response.status_code == 404:
            print("   → 404 Not Found (URL pattern issue)")
        elif response.status_code == 200:
            print("   → 200 Success!")
        else:
            print(f"   → Other status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    print("\nTesting all audit URLs...")
    test_urls = [
        '/api/v1/audit/compliance-reports/',
        '/api/v1/audit/compliance-reports/1/download/',
        '/api/v1/audit/generate-compliance-report/',
        '/api/v1/audit/transactions/',
    ]
    
    for url in test_urls:
        try:
            match = resolve(url)
            print(f"✅ {url} → {match.func.__name__}")
        except Exception as e:
            print(f"❌ {url} → {e}")
