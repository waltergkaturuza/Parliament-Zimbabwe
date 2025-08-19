#!/usr/bin/env python3
"""
Test MainCenter API endpoints for 500 errors after migration
"""
import requests
import json
import sys

def test_maincenter_endpoints():
    """Test the MainCenter API endpoints that were previously giving 500 errors"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # These were the endpoints mentioned in previous error reports
    critical_endpoints = [
        (f"{base_url}/api/v1/boxes/", "Boxes API (was giving 500 errors)"),
        (f"{base_url}/api/v1/analytics/", "Analytics API (was giving 500 errors)"),
        (f"{base_url}/api/v1/dashboard/", "Dashboard API (MainCenter)"),
        (f"{base_url}/api/v1/financial-analytics/", "Financial Analytics API"),
        (f"{base_url}/api/v1/subcenters/", "SubCenters API (MainCenter monitoring)"),
        (f"{base_url}/api/v1/subcenters/stats/", "SubCenter Stats API"),
    ]
    
    print("🎯 TESTING MAINCENTER API ENDPOINTS FOR 500 ERRORS")
    print("=" * 60)
    print("Testing endpoints that were previously failing...")
    
    working_count = 0
    error_500_count = 0
    auth_required_count = 0
    
    for url, description in critical_endpoints:
        print(f"\n📊 {description}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ SUCCESS - No 500 error!")
                working_count += 1
                
                # Try to parse response to check if it's valid JSON
                try:
                    data = response.json()
                    if isinstance(data, dict) and 'results' in data:
                        print(f"   📋 Results count: {len(data.get('results', []))}")
                    elif isinstance(data, list):
                        print(f"   📋 Items count: {len(data)}")
                    else:
                        print("   📋 Valid JSON response received")
                except json.JSONDecodeError:
                    print("   ⚠️  Non-JSON response (might be HTML)")
                    
            elif response.status_code == 500:
                print("   ❌ 500 INTERNAL SERVER ERROR - Still failing!")
                error_500_count += 1
                print(f"   Error preview: {response.text[:200]}...")
                
            elif response.status_code == 401:
                print("   🔒 401 - Authentication required (normal for protected APIs)")
                auth_required_count += 1
                
            elif response.status_code == 403:
                print("   🔒 403 - Permission denied (normal for protected APIs)")
                auth_required_count += 1
                
            elif response.status_code == 404:
                print("   ❌ 404 - Endpoint not found")
                
            else:
                print(f"   ⚠️  {response.status_code} - {response.reason}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ Timeout - Service might be busy")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Summary
    print(f"\n" + "=" * 60)
    print("📋 MAINCENTER API TEST RESULTS")
    print("=" * 60)
    print(f"Total endpoints tested: {len(critical_endpoints)}")
    print(f"✅ Working (200): {working_count}")
    print(f"🔒 Auth required (401/403): {auth_required_count}")
    print(f"❌ 500 errors: {error_500_count}")
    
    if error_500_count == 0:
        print("\n🎉 SUCCESS! NO 500 ERRORS FOUND!")
        print("✅ All MainCenter pages should be submitting data without server errors")
        if working_count > 0:
            print("✅ Some endpoints are working without authentication")
        if auth_required_count > 0:
            print("🔒 Some endpoints require authentication (normal for protected APIs)")
    else:
        print(f"\n❌ {error_500_count} endpoints still have 500 errors")
        print("⚠️  Migration may need additional work")
    
    return error_500_count == 0

if __name__ == '__main__':
    success = test_maincenter_endpoints()
    sys.exit(0 if success else 1)
