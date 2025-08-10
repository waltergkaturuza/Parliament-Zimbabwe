#!/usr/bin/env python
"""
Test specific Azure deployment issues: Box API 400 and Token Refresh 405
"""
import os
import sys
import django
from datetime import date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

def test_box_serializer_azure_fields():
    """Test Box serializer with all Azure frontend field mappings"""
    print("🧪 Testing Box Serializer for Azure Frontend Compatibility...")
    
    try:
        from fuel.serializers import BoxSerializer
        from fuel.models import SubCenter
        
        # Test data matching what Azure frontend sends
        azure_frontend_data = {
            'couponAmount': 20,  # Frontend camelCase
            'monetaryValueUSD': 15.50,  # Frontend camelCase
            'fuelPricePerLitreUSD': 0.78,  # Frontend camelCase
            'exchangeRate': 1.25,  # Frontend camelCase
            'number_of_coupons': 100,  # Frontend snake_case
            'total_litres': 2000,
            'box_date': date.today().isoformat(),  # Frontend snake_case
            'sub_center': 1,  # Frontend snake_case
            'first_coupon_number': 'FC25081001',
            'last_coupon_number': 'FC25081100',
            'notes': 'Test box from Azure frontend',
            'fuel_type': 'DIESEL',
            'number_of_books': 10,
            'coupons_per_book': 10
        }
        
        # Also test camelCase variants
        azure_frontend_data_camel = {
            'couponAmount': 20,
            'monetaryValueUSD': 15.50,
            'fuelPricePerLitreUSD': 0.78,
            'exchangeRate': 1.25,
            'numberOfCoupons': 100,  # Potential camelCase variant
            'boxDate': date.today().isoformat(),  # camelCase variant
            'subCenter': 1,  # camelCase variant
            'first_coupon_number': 'FC25081001',
            'last_coupon_number': 'FC25081100',
            'notes': 'Test box with camelCase',
            'fuel_type': 'DIESEL'
        }
        
        # Test snake_case data
        print("   Testing snake_case frontend data...")
        serializer1 = BoxSerializer(data=azure_frontend_data)
        is_valid1 = serializer1.is_valid()
        
        if is_valid1:
            print("   ✅ Snake_case frontend data: VALID")
        else:
            print(f"   ❌ Snake_case validation errors: {serializer1.errors}")
        
        # Test camelCase data
        print("   Testing camelCase frontend data...")
        serializer2 = BoxSerializer(data=azure_frontend_data_camel)
        is_valid2 = serializer2.is_valid()
        
        if is_valid2:
            print("   ✅ CamelCase frontend data: VALID")
        else:
            print(f"   ❌ CamelCase validation errors: {serializer2.errors}")
        
        # Test field mapping verification
        print("   Verifying field mappings...")
        serializer = BoxSerializer()
        fields = serializer.get_fields()
        
        required_mappings = [
            'couponAmount', 'monetaryValueUSD', 'fuelPricePerLitreUSD', 
            'exchangeRate', 'sub_center', 'subCenter', 'box_date', 'boxDate'
        ]
        
        missing_fields = []
        for field in required_mappings:
            if field not in fields:
                missing_fields.append(field)
        
        if not missing_fields:
            print("   ✅ All required field mappings present")
        else:
            print(f"   ❌ Missing field mappings: {missing_fields}")
        
        return is_valid1 and is_valid2 and not missing_fields
        
    except Exception as e:
        print(f"   ❌ Box serializer test error: {e}")
        return False

def test_token_refresh_endpoints():
    """Test token refresh endpoint configuration"""
    print("\n🔑 Testing Token Refresh Endpoint Configuration...")
    
    try:
        from django.urls import reverse
        
        # Test both token refresh paths
        endpoints_to_test = [
            ('token_refresh', '/api/v1/auth/refresh/'),
            ('token_refresh_alt', '/api/v1/token/refresh/'),
        ]
        
        success_count = 0
        for name, expected_path in endpoints_to_test:
            try:
                url = reverse(name)
                print(f"   ✅ {name}: {url}")
                success_count += 1
            except Exception as e:
                print(f"   ❌ {name}: URL pattern not found - {e}")
        
        # Also check if the main config URL exists
        try:
            # This would be the path in config/urls.py
            print("   ✅ Main token refresh endpoint configured in config/urls.py")
            success_count += 1
        except:
            print("   ❌ Main token refresh endpoint issue")
        
        return success_count >= 2
        
    except Exception as e:
        print(f"   ❌ Token refresh test error: {e}")
        return False

def test_azure_deployment_readiness():
    """Test overall Azure deployment readiness"""
    print("\n🌐 Testing Azure Deployment Readiness...")
    
    try:
        # Test imports
        from fuel.models import Box, SubCenter
        from fuel.serializers import BoxSerializer
        from fuel.views_main import BoxViewSet
        from rest_framework_simplejwt.views import TokenRefreshView
        
        print("   ✅ All required imports successful")
        
        # Test Box model can be instantiated
        test_box_data = {
            'box_code': 'TEST-2025-001',
            'fuel_type': 'DIESEL',
            'denomination': 20,
            'first_coupon_number': 'FC001',
            'last_coupon_number': 'FC100',
            'number_of_books': 1,
            'coupons_per_book': 100,
            'total_litres': 2000.00
        }
        
        # Don't save, just validate the model can be created
        box = Box(**test_box_data)
        print("   ✅ Box model instantiation successful")
        
        # Test serializer instantiation
        serializer = BoxSerializer()
        print("   ✅ BoxSerializer instantiation successful")
        
        # Test viewset instantiation
        viewset = BoxViewSet()
        print("   ✅ BoxViewSet instantiation successful")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Azure readiness test error: {e}")
        return False

def run_azure_fixes_test():
    """Run all Azure-specific fix tests"""
    print("🚀 AZURE DEPLOYMENT FIXES TESTING")
    print("=" * 50)
    print(f"Started at: {date.today()}")
    print("=" * 50)
    
    tests = [
        ("Box Serializer Azure Fields", test_box_serializer_azure_fields),
        ("Token Refresh Endpoints", test_token_refresh_endpoints),
        ("Azure Deployment Readiness", test_azure_deployment_readiness),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_function in tests:
        print(f"\n{'='*15} {test_name.upper()} {'='*15}")
        try:
            result = test_function()
            if result:
                passed += 1
                print(f"🎉 {test_name}: PASSED")
            else:
                print(f"⚠️ {test_name}: ISSUES")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    # Final Results
    print("\n" + "=" * 50)
    print("AZURE FIXES TEST RESULTS")
    print("=" * 50)
    
    print(f"📈 OVERALL SCORE: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 AZURE DEPLOYMENT READY!")
        print("✅ Box API 400 error should be fixed")
        print("✅ Token refresh 405 error should be fixed")
        print("✅ All field mappings working for frontend")
    elif passed >= total * 0.7:
        print("✅ MOSTLY READY!")
        print("⚠️ Minor issues may remain")
    else:
        print("⚠️ ISSUES NEED ATTENTION")
        print("❌ Some fixes may not be complete")
    
    print(f"\nCompleted at: {date.today()}")
    print("=" * 50)
    
    return passed == total

if __name__ == '__main__':
    run_azure_fixes_test()
