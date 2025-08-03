#!/usr/bin/env python3
"""
Azure Backend Health Check Script
Tests all critical endpoints of the deployed Parliament Fuel System
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
TIMEOUT = 30

def test_endpoint(url, method="GET", data=None, headers=None):
    """Test a single endpoint and return results"""
    try:
        print(f"\n🔍 Testing {method} {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=TIMEOUT, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=TIMEOUT, headers=headers)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                json_data = response.json()
                print(f"   Response: {json.dumps(json_data, indent=2)[:200]}...")
            except:
                print(f"   Response: {response.text[:200]}...")
        else:
            print(f"   Response: {response.text[:200]}...")
        
        return {
            'url': url,
            'status_code': response.status_code,
            'success': 200 <= response.status_code < 400,
            'response_time': response.elapsed.total_seconds(),
            'error': None
        }
    
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return {
            'url': url,
            'status_code': None,
            'success': False,
            'response_time': None,
            'error': str(e)
        }

def main():
    """Run comprehensive backend health checks"""
    print("🏥 Parliament Fuel System - Backend Health Check")
    print("=" * 50)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    # Test endpoints
    results = []
    
    # Basic endpoints
    endpoints = [
        "/",
        "/api/health/",
        "/api/cors-test/",
        "/auth/login/",
        "/api/setup/database-status/",
        "/api/debug/health/",
        "/api/home/stats/",
        "/admin/",
    ]
    
    for endpoint in endpoints:
        url = f"{BACKEND_URL}{endpoint}"
        result = test_endpoint(url)
        results.append(result)
    
    # Test CORS preflight
    print(f"\n🔍 Testing CORS Preflight")
    try:
        response = requests.options(f"{BACKEND_URL}/auth/login/", 
                                  headers={
                                      'Origin': 'https://parliament-fuel-system.azurewebsites.net',
                                      'Access-Control-Request-Method': 'POST',
                                      'Access-Control-Request-Headers': 'Content-Type,Authorization'
                                  }, 
                                  timeout=TIMEOUT)
        print(f"   Status Code: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        
        results.append({
            'url': f"{BACKEND_URL}/auth/login/ (CORS)",
            'status_code': response.status_code,
            'success': response.status_code == 200,
            'response_time': response.elapsed.total_seconds(),
            'error': None
        })
    except Exception as e:
        print(f"   ❌ CORS Error: {str(e)}")
        results.append({
            'url': f"{BACKEND_URL}/auth/login/ (CORS)",
            'status_code': None,
            'success': False,
            'response_time': None,
            'error': str(e)
        })
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 30)
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {total - successful}")
    print(f"Success Rate: {(successful/total)*100:.1f}%")
    
    # Failed tests details
    failed_tests = [r for r in results if not r['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   {test['url']}: {test['error'] or f'Status {test['status_code']}'}")
    
    # Successful tests
    successful_tests = [r for r in results if r['success']]
    if successful_tests:
        print(f"\n✅ Successful Tests:")
        for test in successful_tests:
            print(f"   {test['url']}: {test['status_code']} ({test['response_time']:.2f}s)")
    
    # Exit with error code if any tests failed
    if failed_tests:
        print(f"\n⚠️  Some tests failed. Check Azure App Service logs for details.")
        sys.exit(1)
    else:
        print(f"\n🎉 All tests passed! Backend is healthy.")
        sys.exit(0)

if __name__ == "__main__":
    main()
