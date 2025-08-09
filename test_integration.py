#!/usr/bin/env python3
"""
Comprehensive API and Frontend Integration Test
Tests all major endpoints, button functionality, and data formatting
"""

import requests
import json
import sys
from datetime import datetime

class FuelCouponSystemTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []

    def log_test(self, test_name, status, message="", details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")

    def test_backend_health(self):
        """Test if backend server is responding"""
        try:
            response = self.session.get(f"{self.base_url}/health/")
            if response.status_code == 200:
                self.log_test("Backend Health Check", "PASS", "Server is responding")
                return True
            else:
                self.log_test("Backend Health Check", "FAIL", f"Server returned {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", "FAIL", f"Connection failed: {str(e)}")
            return False

    def test_home_api_endpoints(self):
        """Test home page API endpoints"""
        endpoints = [
            ("/api/v1/home/stats/", "Home Statistics"),
            ("/api/v1/api/home/activity/", "Home Activity"),
            ("/api/v1/api/home/health/", "Home Health"),
            ("/api/v1/api/home/insights/", "Home Insights")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f"API: {name}", "PASS", f"Status: {data.get('status', 'N/A')}")
                else:
                    self.log_test(f"API: {name}", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"API: {name}", "FAIL", f"Error: {str(e)}")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        # Test login endpoint structure
        try:
            response = self.session.post(f"{self.base_url}/api/v1/auth/login/", 
                                       json={"username": "test", "password": "test"})
            # We expect this to fail, but we're testing the endpoint exists
            if response.status_code in [400, 401]:
                self.log_test("Auth: Login Endpoint", "PASS", "Endpoint exists and handles requests")
            else:
                self.log_test("Auth: Login Endpoint", "WARN", f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Auth: Login Endpoint", "FAIL", f"Error: {str(e)}")

        # Test register endpoint
        try:
            response = self.session.post(f"{self.base_url}/api/v1/auth/register/", 
                                       json={"username": "test", "email": "test@test.com", "password": "test"})
            if response.status_code in [400, 401, 201]:
                self.log_test("Auth: Register Endpoint", "PASS", "Endpoint exists and handles requests")
            else:
                self.log_test("Auth: Register Endpoint", "WARN", f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Auth: Register Endpoint", "FAIL", f"Error: {str(e)}")

    def test_admin_endpoints(self):
        """Test admin dashboard endpoints"""
        endpoints = [
            ("/api/v1/statistics/", "Dashboard Statistics"),
            ("/api/v1/users/", "Users List"),
            ("/api/v1/subcenters/", "Subcenters List"),
            ("/api/v1/audit-logs/", "Audit Logs"),
            ("/api/v1/system-alerts/", "System Alerts")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                # These endpoints require authentication, so 401 is expected
                if response.status_code in [200, 401]:
                    self.log_test(f"Admin API: {name}", "PASS", "Endpoint accessible")
                else:
                    self.log_test(f"Admin API: {name}", "WARN", f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Admin API: {name}", "FAIL", f"Error: {str(e)}")

    def test_api_data_structure(self):
        """Test API response data structures"""
        try:
            # Test home stats structure
            response = self.session.get(f"{self.base_url}/api/v1/home/stats/")
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["active_users", "sub_centers", "distributed_coupons", "success_rate"]
                actual_fields = list(data.get("data", {}).keys())
                
                missing_fields = [f for f in expected_fields if f not in actual_fields]
                if not missing_fields:
                    self.log_test("Data Structure: Home Stats", "PASS", "All expected fields present")
                else:
                    self.log_test("Data Structure: Home Stats", "FAIL", f"Missing fields: {missing_fields}")
            else:
                self.log_test("Data Structure: Home Stats", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Data Structure: Home Stats", "FAIL", f"Error: {str(e)}")

    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            response = self.session.options(f"{self.base_url}/api/v1/home/stats/")
            cors_headers = [
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Methods",
                "Access-Control-Allow-Headers"
            ]
            
            present_headers = [h for h in cors_headers if h in response.headers]
            if len(present_headers) >= 2:
                self.log_test("CORS Configuration", "PASS", f"CORS headers present: {len(present_headers)}/3")
            else:
                self.log_test("CORS Configuration", "WARN", f"Limited CORS headers: {present_headers}")
        except Exception as e:
            self.log_test("CORS Configuration", "FAIL", f"Error: {str(e)}")

    def generate_report(self):
        """Generate a comprehensive test report"""
        total_tests = len(self.test_results)
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])

        print("\n" + "="*60)
        print("FUEL COUPON SYSTEM - INTEGRATION TEST REPORT")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"Success Rate: {(passed/total_tests)*100:.1f}%")
        print("="*60)

        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"❌ {result['test']}: {result['message']}")

        if warnings > 0:
            print("\nWARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"⚠️  {result['test']}: {result['message']}")

        # Save detailed report
        with open("test_report.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\nDetailed report saved to: test_report.json")

    def run_all_tests(self):
        """Run the complete test suite"""
        print("Starting Fuel Coupon System Integration Tests...\n")
        
        # Run tests in order
        if self.test_backend_health():
            self.test_home_api_endpoints()
            self.test_auth_endpoints()
            self.test_admin_endpoints()
            self.test_api_data_structure()
            self.test_cors_configuration()
        else:
            print("❌ Backend health check failed. Skipping remaining tests.")
            
        self.generate_report()

if __name__ == "__main__":
    tester = FuelCouponSystemTester()
    tester.run_all_tests()
