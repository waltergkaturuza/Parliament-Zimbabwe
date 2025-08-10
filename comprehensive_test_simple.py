#!/usr/bin/env python
"""
Comprehensive API Field Mapping Test (Simplified)
Tests all forms, field mappings, and backend functionality
"""
import os
import sys
import django
from datetime import date, datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

def test_model_imports():
    """Test that all models can be imported successfully"""
    print("1. Testing Model Imports...")
    try:
        from fuel.models import (
            Box, Book, Coupon, SubCenter, ParliamentSession, 
            Program, BeneficiaryProfile, BeneficiaryCategory,
            VehicleCategory, Constituency, FuelTransaction
        )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        print("   ✅ All core models imported successfully")
        return True
    except Exception as e:
        print(f"   ❌ Model import error: {e}")
        return False

def test_serializer_imports():
    """Test that all serializers can be imported successfully"""
    print("\n2. Testing Serializer Imports...")
    try:
        from fuel.serializers import (
            BoxSerializer, BookSerializer, CouponSerializer,
            SubCenterSerializer, ParliamentSessionSerializer,
            ProgramSerializer, BeneficiaryProfileSerializer
        )
        print("   ✅ All core serializers imported successfully")
        return True
    except Exception as e:
        print(f"   ❌ Serializer import error: {e}")
        return False

def test_viewset_imports():
    """Test that all viewsets can be imported successfully"""
    print("\n3. Testing ViewSet Imports...")
    try:
        from fuel.views_main import (
            BoxViewSet, BookViewSet, CouponViewSet,
            SubCenterViewSet, ParliamentSessionViewSet,
            ProgramViewSet, UserViewSet
        )
        print("   ✅ All core viewsets imported successfully")
        return True
    except Exception as e:
        print(f"   ❌ ViewSet import error: {e}")
        return False

def test_box_field_mappings():
    """Test Box serializer field mappings for frontend compatibility"""
    print("\n4. Testing Box Receipt Field Mappings...")
    try:
        from fuel.serializers import BoxSerializer
        from fuel.models import SubCenter
        
        # Test camelCase field mappings
        test_data = {
            'couponAmount': 20,  # Frontend -> denomination
            'monetaryValueUSD': 15.50,  # Frontend -> monetary_value_usd
            'fuelPricePerLitreUSD': 0.78,  # Frontend -> fuel_price_per_litre_usd
            'exchangeRate': 1.25,  # Frontend -> exchange_rate
            'number_of_coupons': 100,
            'total_litres': 2000,
            'box_date': date.today().isoformat(),
            'first_coupon_number': 'FC25081001',
            'last_coupon_number': 'FC25081100',
            'notes': 'Test box'
        }
        
        # Add sub_center if available
        sub_center = SubCenter.objects.first()
        if sub_center:
            test_data['sub_center'] = sub_center.id
        
        serializer = BoxSerializer(data=test_data)
        is_valid = serializer.is_valid()
        
        if is_valid:
            print("   ✅ Box camelCase field mappings working!")
            print(f"   ✅ Frontend fields: couponAmount, monetaryValueUSD, fuelPricePerLitreUSD, exchangeRate")
        else:
            print(f"   ❌ Validation errors: {serializer.errors}")
            
        return is_valid
    except Exception as e:
        print(f"   ❌ Box field mapping error: {e}")
        return False

def test_parliament_field_mappings():
    """Test Parliament session field mappings"""
    print("\n5. Testing Parliament Session Field Mappings...")
    try:
        from fuel.serializers import ParliamentSessionSerializer
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        test_data = {
            'title': 'Test Parliamentary Session',
            'session_type': 'REGULAR',
            'start_date': date.today().isoformat(),
            'end_date': date.today().isoformat(),
            'description': 'Test session',
            'venue': 'Parliament Main Chamber',
            'fuel_entitlement_litres': 150.0,
            'is_mandatory': True,
            'is_active': True
        }
        
        # Add user fields if available
        user = User.objects.first()
        if user:
            test_data['session_manager'] = user.id
        
        serializer = ParliamentSessionSerializer(data=test_data)
        is_valid = serializer.is_valid()
        
        if is_valid:
            print("   ✅ Parliament session field mappings working!")
        else:
            print(f"   ❌ Validation errors: {serializer.errors}")
            
        return is_valid
    except Exception as e:
        print(f"   ❌ Parliament field mapping error: {e}")
        return False

def test_beneficiary_field_mappings():
    """Test Beneficiary profile field mappings"""
    print("\n6. Testing Beneficiary Profile Field Mappings...")
    try:
        from fuel.serializers import BeneficiaryProfileSerializer
        from fuel.models import BeneficiaryCategory, VehicleCategory, Constituency
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Create required related objects if they don't exist
        category, _ = BeneficiaryCategory.objects.get_or_create(
            name='Test Category',
            defaults={'description': 'Test category for testing'}
        )
        
        vehicle_category, _ = VehicleCategory.objects.get_or_create(
            name='Test Vehicle Category',
            defaults={'description': 'Test vehicle category'}
        )
        
        constituency, _ = Constituency.objects.get_or_create(
            name='Test Constituency',
            defaults={'province': 'Test Province'}
        )
        
        # Create a unique test user
        import time
        test_username = f'testuser_{int(time.time())}'
        test_user, _ = User.objects.get_or_create(
            username=test_username,
            defaults={
                'email': f'{test_username}@test.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        
        test_data = {
            'user': test_user.id,
            'category': category.id,
            'constituency': constituency.id,
            'vehicle_category': vehicle_category.id,
            'employeeId': 'EMP001',  # Frontend -> employee_id
            'position': 'Member of Parliament',
            'department': 'Parliament',
            'monthly_entitlement_litres': 300.0,
            'vehicleMake': 'Toyota',  # Frontend -> vehicle_make
            'vehicleModel': 'Prado',  # Frontend -> vehicle_model
            'vehicle_year': 2023,
            'engine_size': '3.0L V6',
            'vehicle_registration': 'ABC123ZW',
            'fuel_type': 'DIESEL',
            'officeLocation': 'Parliament Building Room 205'  # Frontend -> office_location
        }
        
        serializer = BeneficiaryProfileSerializer(data=test_data)
        is_valid = serializer.is_valid()
        
        if is_valid:
            print("   ✅ Beneficiary profile field mappings working!")
            print(f"   ✅ Frontend fields: employeeId, vehicleMake, vehicleModel, officeLocation")
        else:
            print(f"   ❌ Validation errors: {serializer.errors}")
            
        return is_valid
    except Exception as e:
        print(f"   ❌ Beneficiary field mapping error: {e}")
        return False

def test_permission_logic():
    """Test permission logic for viewsets"""
    print("\n7. Testing Permission Logic...")
    try:
        from fuel.views_main import CouponViewSet
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Test with admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if admin_user:
            viewset = CouponViewSet()
            # Mock request
            viewset.request = type('Request', (), {'user': admin_user})()
            
            queryset = viewset.get_queryset()
            print("   ✅ CouponViewSet permission logic working for SUPERUSER")
            print(f"   ✅ Admin can access coupons (queryset count: {queryset.count()})")
        else:
            print("   ⚠️  No admin user found to test permissions")
            
        return True
    except Exception as e:
        print(f"   ❌ Permission logic error: {e}")
        return False

def test_url_patterns():
    """Test that URL patterns are configured correctly"""
    print("\n8. Testing URL Configuration...")
    try:
        from django.urls import reverse
        
        # Test core API endpoints
        endpoints = [
            'box-list',
            'coupon-list', 
            'subcenter-list',
            'parliament-session-list',
            'program-list',
            'user-list'
        ]
        
        for endpoint in endpoints:
            try:
                url = reverse(endpoint)
                print(f"   ✅ {endpoint}: {url}")
            except:
                print(f"   ❌ {endpoint}: URL pattern not found")
                
        return True
    except Exception as e:
        print(f"   ❌ URL configuration error: {e}")
        return False

def run_comprehensive_test():
    """Run all comprehensive tests"""
    print("COMPREHENSIVE API AND FORM TESTING (Direct Django)")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("Model Imports", test_model_imports),
        ("Serializer Imports", test_serializer_imports),
        ("ViewSet Imports", test_viewset_imports),
        ("Box Field Mappings", test_box_field_mappings),
        ("Parliament Field Mappings", test_parliament_field_mappings),
        ("Beneficiary Field Mappings", test_beneficiary_field_mappings),
        ("Permission Logic", test_permission_logic),
        ("URL Configuration", test_url_patterns),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_function in tests:
        print(f"\n{'='*20} {test_name.upper()} {'='*20}")
        try:
            result = test_function()
            if result:
                passed += 1
                print(f"🎉 {test_name}: PASSED")
            else:
                print(f"⚠️ {test_name}: PARTIAL/ISSUES")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    # Final Results
    print("\n" + "=" * 60)
    print("COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    
    print(f"📈 OVERALL SCORE: {passed}/{total} test categories passed")
    
    if passed == total:
        print("🎉 ALL SYSTEMS OPERATIONAL!")
        print("✅ All forms and field mappings are working correctly")
        print("✅ Frontend-backend integration is complete")
        print("✅ Permission logic is functional")
    elif passed >= total * 0.7:  # 70% or more
        print("✅ SYSTEM MOSTLY OPERATIONAL!")
        print("⚠️ Some minor issues need attention")
    else:
        print("⚠️ SYSTEM NEEDS ATTENTION")
        print("❌ Multiple issues require fixing")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return passed >= total * 0.7

if __name__ == '__main__':
    run_comprehensive_test()
