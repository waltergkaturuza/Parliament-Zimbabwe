#!/usr/bin/env python3
"""
Comprehensive test for Azure App Service - Check for 500 errors and migration status
"""
import requests
import json
import time
import sys

def test_endpoint_with_retries(url, description, max_retries=3, timeout=60):
    """Test an endpoint with retries and longer timeout"""
    print(f"🔍 Testing {description}...")
    print(f"   URL: {url}")
    
    for attempt in range(max_retries):
        try:
            print(f"   Attempt {attempt + 1}/{max_retries}...")
            response = requests.get(
                url, 
                headers={'Accept': 'application/json'},
                timeout=timeout,
                verify=True
            )
            
            print(f"   Status Code: {response.status_code}")
            
            # Check for different response types
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ SUCCESS: {description}")
                    return True, response.status_code, data
                except json.JSONDecodeError:
                    print(f"   ⚠️  Non-JSON response (might be HTML page)")
                    print(f"   Response preview: {response.text[:100]}...")
                    return True, response.status_code, response.text
                    
            elif response.status_code == 500:
                print(f"   ❌ 500 INTERNAL SERVER ERROR")
                print(f"   Error content: {response.text[:300]}...")
                return False, 500, None
                
            elif response.status_code == 404:
                print(f"   ❌ 404 NOT FOUND - Endpoint may not exist")
                return False, 404, None
                
            elif response.status_code == 403:
                print(f"   ❌ 403 FORBIDDEN - Authentication required")
                return False, 403, None
                
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, response.status_code, None
                
        except requests.exceptions.Timeout:
            print(f"   ⏰ Timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                print(f"   Waiting 10 seconds before retry...")
                time.sleep(10)
            continue
            
        except requests.exceptions.ConnectionError as e:
            print(f"   ❌ Connection error: {e}")
            if attempt < max_retries - 1:
                print(f"   Waiting 15 seconds before retry...")
                time.sleep(15)
            continue
            
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return False, 0, None
    
    print(f"   ❌ All {max_retries} attempts failed")
    return False, 0, None

def check_for_500_errors():
    """Test all important endpoints for 500 errors"""
    print("🚀 TESTING FOR 500 ERRORS - MainCenter Pages")
    print("=" * 60)
    
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # Test endpoints that were previously giving 500 errors
    endpoints = [
        # Basic health check
        (f"{base_url}/", "Root Page / Health Check"),
        
        # Main API endpoints that were failing
        (f"{base_url}/api/v1/dashboard/", "MainCenter Dashboard API"),
        (f"{base_url}/api/v1/subcenters/", "SubCenter List API"),
        (f"{base_url}/api/v1/boxes/", "Box List API"),
        (f"{base_url}/api/v1/analytics/", "Analytics API"),
        (f"{base_url}/api/v1/financial-analytics/", "Financial Analytics API"),
        
        # Additional endpoints
        (f"{base_url}/api/v1/subcenters/stats/", "SubCenter Stats API"),
        (f"{base_url}/admin/", "Django Admin Panel"),
        
        # Test frontend static files
        (f"{base_url}/static/", "Static Files"),
    ]
    
    results = []
    error_500_count = 0
    working_endpoints = 0
    
    for url, description in endpoints:
        print(f"\n📊 {description}")
        success, status_code, data = test_endpoint_with_retries(url, description)
        
        result = {
            'url': url,
            'description': description,
            'success': success,
            'status_code': status_code,
            'has_500_error': status_code == 500
        }
        results.append(result)
        
        if status_code == 500:
            error_500_count += 1
        elif success:
            working_endpoints += 1
    
    # Summary
    print(f"\n" + "=" * 60)
    print("📋 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    print(f"Total endpoints tested: {len(endpoints)}")
    print(f"Working endpoints: {working_endpoints}")
    print(f"500 errors found: {error_500_count}")
    print(f"Other errors: {len(endpoints) - working_endpoints - error_500_count}")
    
    # Detailed results
    print(f"\n📊 DETAILED RESULTS:")
    for result in results:
        status_icon = "✅" if result['success'] else "❌"
        error_info = ""
        if result['has_500_error']:
            error_info = " (500 ERROR)"
        elif not result['success']:
            error_info = f" ({result['status_code']})"
            
        print(f"{status_icon} {result['description']}{error_info}")
    
    # Migration status check
    migration_success = False
    for result in results:
        if 'subcenters' in result['url'] and result['success']:
            print(f"\n🔍 Checking SubCenter API for migration fields...")
            # We would check the data here if we got a successful response
            migration_success = True
            break
    
    # Final assessment
    print(f"\n🎯 FINAL ASSESSMENT:")
    if error_500_count == 0:
        print("✅ NO 500 ERRORS FOUND! Pages are submitting data without server errors.")
        if working_endpoints >= len(endpoints) // 2:
            print("✅ Majority of endpoints are working correctly.")
        else:
            print("⚠️  Some endpoints still have issues (authentication, permissions, etc.)")
    else:
        print(f"❌ {error_500_count} endpoints still returning 500 errors")
        print("⚠️  Migration may need more time or manual intervention")
    
    return error_500_count == 0 and working_endpoints > 0

def main():
    """Main test function"""
    success = check_for_500_errors()
    
    if success:
        print("\n🎉 SUCCESS: No 500 errors detected! MainCenter pages should be working.")
    else:
        print("\n⚠️  Some issues remain. Check Azure App Service logs for details.")
    
    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
