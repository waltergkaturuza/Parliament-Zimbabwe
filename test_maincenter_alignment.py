#!/usr/bin/env python3
"""
MainCenter Frontend-Backend Alignment Test Script
Tests all API endpoints expected by MainCenter components
"""
import os
import sys
import json
import requests
from datetime import datetime

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import django
    django.setup()
    from fuel.models import User, SubCenter, Box, Book, Coupon
    from django.test import Client
    from django.contrib.auth import authenticate
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

class MainCenterAlignmentTester:
    def __init__(self):
        self.client = APIClient()
        self.base_url = 'http://localhost:8000'
        self.test_results = []
        
    def setup_test_user(self):
        """Create or get test user with MAIN_CENTER role"""
        try:
            user, created = User.objects.get_or_create(
                username='maincenter_test',
                defaults={
                    'email': 'maincenter@test.com',
                    'role': 'MAIN_CENTER',
                    'is_approved': True,
                    'is_active': True
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                print(f"✅ Created test user: {user.username}")
            else:
                print(f"✅ Using existing test user: {user.username}")
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
            return user
        except Exception as e:
            print(f"❌ Failed to setup test user: {e}")
            return None
    
    def test_endpoint(self, endpoint, expected_fields=None, method='GET'):
        """Test an API endpoint and validate response structure"""
        try:
            print(f"\n🔍 Testing {method} {endpoint}")
            
            if method == 'GET':
                response = self.client.get(endpoint)
            else:
                response = self.client.post(endpoint, {})
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ Response received")
                    
                    if expected_fields:
                        self.validate_fields(data, expected_fields, endpoint)
                    
                    return True, data
                except json.JSONDecodeError:
                    print(f"   ❌ Invalid JSON response")
                    return False, None
            else:
                print(f"   ❌ Error response: {response.content.decode()[:200]}")
                return False, None
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return False, None
    
    def validate_fields(self, data, expected_fields, endpoint):
        """Validate that response contains expected fields"""
        print(f"   📋 Validating fields for {endpoint}")
        
        # Handle different response structures
        items = []
        if isinstance(data, dict):
            if 'results' in data:
                items = data['results'][:1] if data['results'] else []
            elif 'data' in data:
                items = [data['data']] if data['data'] else []
            else:
                items = [data]
        elif isinstance(data, list):
            items = data[:1] if data else []
        
        if not items:
            print(f"   ⚠️  No data items to validate")
            return
        
        item = items[0]
        missing_fields = []
        present_fields = []
        
        for field in expected_fields:
            if field in item:
                present_fields.append(field)
            else:
                missing_fields.append(field)
        
        print(f"   ✅ Present fields ({len(present_fields)}): {', '.join(present_fields[:5])}")
        if len(present_fields) > 5:
            print(f"      ... and {len(present_fields) - 5} more")
        
        if missing_fields:
            print(f"   ❌ Missing fields ({len(missing_fields)}): {', '.join(missing_fields)}")
        
        self.test_results.append({
            'endpoint': endpoint,
            'total_expected': len(expected_fields),
            'present': len(present_fields),
            'missing': len(missing_fields),
            'missing_fields': missing_fields,
            'success': len(missing_fields) == 0
        })
    
    def test_main_dashboard(self):
        """Test main dashboard endpoint - MainCenterDashboard.tsx"""
        expected_fields = [
            'totalBoxesReceived', 'totalBooksDispatched', 'pendingReceipts',
            'activeSubCenters', 'totalCouponsDistributed', 'fuelValueUSD',
            'systemAlerts', 'recentActivities', 'monthlyTrends'
        ]
        return self.test_endpoint('/api/v1/dashboard/', expected_fields)
    
    def test_subcenter_monitoring(self):
        """Test subcenter monitoring - SubCenterMonitoring.tsx"""
        expected_fields = [
            'id', 'name', 'code', 'manager_name', 'contact_number', 'email',
            'total_books', 'books_remaining', 'performance_score', 'alerts_count',
            'total_value_usd', 'monthly_consumption_usd', 'status'
        ]
        return self.test_endpoint('/api/v1/subcenters/', expected_fields)
    
    def test_subcenter_stats(self):
        """Test subcenter statistics endpoint"""
        expected_fields = [
            'total_subcenters', 'active_subcenters', 'results'
        ]
        return self.test_endpoint('/api/v1/subcenters/stats/', expected_fields)
    
    def test_boxes_endpoint(self):
        """Test boxes endpoint"""
        expected_fields = [
            'id', 'box_code', 'fuel_type', 'denomination', 'total_coupons_calculated',
            'status', 'assigned_to', 'verified_by', 'is_received'
        ]
        return self.test_endpoint('/api/v1/boxes/', expected_fields)
    
    def test_analytics_endpoint(self):
        """Test analytics endpoint"""
        return self.test_endpoint('/api/v1/analytics/')
    
    def test_financial_analytics(self):
        """Test financial analytics endpoint"""
        return self.test_endpoint('/api/v1/financial-analytics/')
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 MainCenter Frontend-Backend Alignment Test Suite")
        print("=" * 60)
        
        # Setup
        user = self.setup_test_user()
        if not user:
            print("❌ Cannot proceed without test user")
            return
        
        # Test all endpoints
        tests = [
            ("Main Dashboard", self.test_main_dashboard),
            ("SubCenter Monitoring", self.test_subcenter_monitoring),
            ("SubCenter Stats", self.test_subcenter_stats),
            ("Boxes Endpoint", self.test_boxes_endpoint),
            ("Analytics Endpoint", self.test_analytics_endpoint),
            ("Financial Analytics", self.test_financial_analytics),
        ]
        
        successful_tests = 0
        for test_name, test_func in tests:
            print(f"\n📊 Running: {test_name}")
            try:
                success, data = test_func()
                if success:
                    successful_tests += 1
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests run: {len(tests)}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {len(tests) - successful_tests}")
        
        # Field validation summary
        if self.test_results:
            print("\n📊 FIELD VALIDATION RESULTS:")
            for result in self.test_results:
                status = "✅" if result['success'] else "❌"
                print(f"{status} {result['endpoint']}: {result['present']}/{result['total_expected']} fields")
                if result['missing_fields']:
                    print(f"   Missing: {', '.join(result['missing_fields'])}")
        
        return successful_tests == len(tests)

if __name__ == '__main__':
    tester = MainCenterAlignmentTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
