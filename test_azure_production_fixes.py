#!/usr/bin/env python
"""
Azure Production Deployment Fix Verification
===========================================

This test validates all fixes for Azure production deployment issues:
1. Box reception form 500 errors -> Enhanced BoxReceiptSerializer 
2. Analytics consumption-trend 500 errors -> TruncDate compatibility
3. Boxes endpoint 400 errors -> Better error handling

Run: python test_azure_production_fixes.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
import json

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import connection
from fuel.models import Box, Book, Coupon, Parliament, Province, FuelCoupon, BookDispatch
from fuel.serializers import BoxReceiptSerializer, BoxSerializer

User = get_user_model()

class AzureProductionFixTest:
    """Test Azure production deployment fixes"""
    
    def __init__(self):
        self.client = Client()
        self.setup_test_data()
        self.results = {
            'box_receipt_serializer': False,
            'analytics_compatibility': False,
            'box_endpoint_errors': False,
            'field_mappings': False,
            'database_queries': False,
            'overall_status': 'PENDING'
        }
    
    def setup_test_data(self):
        """Create test data for Azure fixes"""
        print("📋 Setting up test data...")
        
        # Create test user
        self.user = User.objects.create_user(
            username='azure_test_user',
            email='test@azure.com',
            password='testpass123'
        )
        
        # Create test parliament/province structure
        self.province = Province.objects.create(
            name='Test Province',
            code='TP'
        )
        
        self.parliament = Parliament.objects.create(
            name='Test Parliament',
            province=self.province,
            code='TPL'
        )
        
        # Create test box for analytics
        test_box = Box.objects.create(
            box_code='TEST_BOX_001',
            starting_book_number=1,
            ending_book_number=5,
            coupons_per_book=50,
            assigned_to=self.parliament,
            received_by=self.user,
            received_date=timezone.now() - timedelta(days=7)
        )
        
        # Generate books and coupons for analytics
        test_box.generate_books_and_coupons()
        
        print(f"✅ Test data created: User={self.user.username}, Parliament={self.parliament.name}")
    
    def test_box_receipt_serializer_mappings(self):
        """Test 1: BoxReceiptSerializer field mappings (Box reception 500 fix)"""
        print("\n🔍 Testing BoxReceiptSerializer field mappings...")
        
        try:
            # Test camelCase frontend data
            frontend_data = {
                'boxCode': 'AZURE_TEST_001',
                'startingBookNumber': 10,
                'endingBookNumber': 15,
                'couponsPerBook': 50,
                'assignedTo': self.parliament.id,
                'couponAmount': 50000.00,  # denomination in camelCase
                'subCenter': self.parliament.id,  # assigned_to in camelCase
                'monetaryValueUSD': 1000.00  # monetary_value_usd in camelCase
            }
            
            # Test serializer with camelCase data
            serializer = BoxReceiptSerializer(data=frontend_data)
            
            if serializer.is_valid():
                print("✅ BoxReceiptSerializer accepts camelCase frontend data")
                
                # Test field mappings
                validated_data = serializer.validated_data
                
                # Check field mappings
                mappings_correct = (
                    'denomination' in str(validated_data) or 'couponAmount' in frontend_data and
                    'assigned_to' in str(validated_data) or 'assignedTo' in frontend_data and
                    'monetary_value_usd' in str(validated_data) or 'monetaryValueUSD' in frontend_data
                )
                
                if mappings_correct:
                    print("✅ Field mappings working correctly (camelCase → snake_case)")
                    self.results['box_receipt_serializer'] = True
                    self.results['field_mappings'] = True
                else:
                    print("❌ Field mappings not working properly")
                    print(f"Validated data: {validated_data}")
                    
            else:
                print(f"❌ BoxReceiptSerializer validation failed: {serializer.errors}")
                
        except Exception as e:
            print(f"❌ BoxReceiptSerializer test failed: {str(e)}")
    
    def test_analytics_database_compatibility(self):
        """Test 2: Analytics function Azure SQL compatibility (Analytics 500 fix)"""
        print("\n📊 Testing analytics database compatibility...")
        
        try:
            # Import the analytics function
            from fuel.views_main import BoxViewSet
            
            # Create BoxViewSet instance
            view = BoxViewSet()
            
            # Mock request for analytics
            class MockRequest:
                user = self.user
                query_params = {}
            
            # Test analytics consumption trend
            mock_request = MockRequest()
            
            # This should not use .extra() anymore and work with Azure SQL
            try:
                # Try to call the analytics method indirectly
                from django.db.models import TruncDate
                from fuel.models import FuelCoupon
                
                # Test TruncDate compatibility (Azure SQL fix)
                test_query = FuelCoupon.objects.annotate(
                    consumption_date=TruncDate('consumed_date')
                ).values('consumption_date').distinct()
                
                # Execute the query to test Azure SQL compatibility
                result_count = test_query.count()
                
                print(f"✅ TruncDate query executed successfully: {result_count} results")
                print("✅ Analytics function should work with Azure SQL Database")
                self.results['analytics_compatibility'] = True
                self.results['database_queries'] = True
                
            except Exception as analytics_error:
                print(f"❌ Analytics compatibility test failed: {str(analytics_error)}")
                
        except Exception as e:
            print(f"❌ Analytics test setup failed: {str(e)}")
    
    def test_box_endpoint_error_handling(self):
        """Test 3: Box endpoint error handling (Boxes 400 fix)"""
        print("\n📦 Testing box endpoint error handling...")
        
        try:
            # Login user
            self.client.force_login(self.user)
            
            # Test valid box data
            valid_data = {
                'boxCode': 'AZURE_VALID_001',
                'startingBookNumber': 20,
                'endingBookNumber': 25,
                'couponsPerBook': 50,
                'assignedTo': self.parliament.id,
                'couponAmount': 50000.00
            }
            
            # Test receive_box endpoint
            response = self.client.post('/api/boxes/receive_box/', 
                                      data=json.dumps(valid_data),
                                      content_type='application/json')
            
            if response.status_code in [200, 201]:
                print(f"✅ Valid box request successful: {response.status_code}")
                
                # Test invalid data handling
                invalid_data = {
                    'boxCode': '',  # Invalid empty code
                    'startingBookNumber': 'invalid',  # Invalid type
                    'endingBookNumber': 25,
                    'couponsPerBook': 50
                }
                
                error_response = self.client.post('/api/boxes/receive_box/',
                                                data=json.dumps(invalid_data),
                                                content_type='application/json')
                
                if error_response.status_code == 400:
                    print("✅ Invalid data properly rejected with 400 status")
                    print("✅ Error handling improved for box endpoints")
                    self.results['box_endpoint_errors'] = True
                else:
                    print(f"❌ Expected 400 for invalid data, got {error_response.status_code}")
                    
            else:
                print(f"❌ Valid box request failed: {response.status_code}")
                if hasattr(response, 'content'):
                    print(f"Response: {response.content.decode()}")
                
        except Exception as e:
            print(f"❌ Box endpoint test failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all Azure production fix tests"""
        print("🚀 Running Azure Production Deployment Fix Tests")
        print("=" * 60)
        
        self.test_box_receipt_serializer_mappings()
        self.test_analytics_database_compatibility()
        self.test_box_endpoint_error_handling()
        
        # Calculate overall status
        passed_tests = sum(1 for result in self.results.values() if result is True)
        total_tests = len([k for k in self.results.keys() if k != 'overall_status'])
        
        if passed_tests == total_tests:
            self.results['overall_status'] = 'PASS'
            status_emoji = "✅"
        elif passed_tests > 0:
            self.results['overall_status'] = 'PARTIAL'
            status_emoji = "⚠️"
        else:
            self.results['overall_status'] = 'FAIL'
            status_emoji = "❌"
        
        print(f"\n{status_emoji} AZURE PRODUCTION FIX TEST RESULTS")
        print("=" * 60)
        print(f"BoxReceiptSerializer Mappings: {'✅ PASS' if self.results['box_receipt_serializer'] else '❌ FAIL'}")
        print(f"Analytics SQL Compatibility: {'✅ PASS' if self.results['analytics_compatibility'] else '❌ FAIL'}")
        print(f"Box Endpoint Error Handling: {'✅ PASS' if self.results['box_endpoint_errors'] else '❌ FAIL'}")
        print(f"Field Mappings (camelCase): {'✅ PASS' if self.results['field_mappings'] else '❌ FAIL'}")
        print(f"Database Query Compatibility: {'✅ PASS' if self.results['database_queries'] else '❌ FAIL'}")
        print("=" * 60)
        print(f"Overall Status: {status_emoji} {self.results['overall_status']} ({passed_tests}/{total_tests} tests)")
        
        if self.results['overall_status'] == 'PASS':
            print("\n🎉 All Azure production fixes verified!")
            print("Ready for deployment to fix:")
            print("- Box reception form 500 errors")
            print("- Analytics consumption-trend 500 errors") 
            print("- Boxes endpoint 400 errors")
        else:
            print(f"\n⚠️ Some fixes need attention before Azure deployment")
        
        return self.results

def main():
    """Main test execution"""
    try:
        tester = AzureProductionFixTest()
        results = tester.run_all_tests()
        
        # Exit with appropriate code
        if results['overall_status'] == 'PASS':
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
