#!/usr/bin/env python3
"""
Quick test script to check if the Azure backend is working
"""
import requests
import time

# Azure backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        print(f"Testing health endpoint: {BACKEND_URL}/api/health/")
        response = requests.get(f"{BACKEND_URL}/api/health/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_api_v1_endpoint():
    """Test the API v1 endpoint"""
    try:
        print(f"\nTesting API v1 endpoint: {BACKEND_URL}/api/v1/")
        response = requests.get(f"{BACKEND_URL}/api/v1/", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"Response Text: {response.text[:500]}")
        return response.status_code == 200
    except Exception as e:
        print(f"API v1 test failed: {e}")
        return False

def test_admin_endpoint():
    """Test the admin endpoint"""
    try:
        print(f"\nTesting admin endpoint: {BACKEND_URL}/admin/")
        response = requests.get(f"{BACKEND_URL}/admin/", timeout=10)
        print(f"Status Code: {response.status_code}")
        # Admin should redirect to login, so 302 or 200 is good
        return response.status_code in [200, 302]
    except Exception as e:
        print(f"Admin test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Parliament Fuel System Backend...")
    print("=" * 50)
    
    # Wait a moment for Azure to deploy
    print("⏳ Waiting 15 seconds for Azure deployment...")
    time.sleep(15)
    
    tests_passed = 0
    total_tests = 3
    
    if test_health_endpoint():
        tests_passed += 1
        print("✅ Health check PASSED")
    else:
        print("❌ Health check FAILED")
    
    if test_api_v1_endpoint():
        tests_passed += 1
        print("✅ API v1 endpoint PASSED")
    else:
        print("❌ API v1 endpoint FAILED")
    
    if test_admin_endpoint():
        tests_passed += 1
        print("✅ Admin endpoint PASSED")
    else:
        print("❌ Admin endpoint FAILED")
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print(f"⚠️  {total_tests - tests_passed} tests failed. Backend may need more time to deploy.")
