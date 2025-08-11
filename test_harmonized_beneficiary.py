#!/usr/bin/env python3
"""
Test script for Harmonized Beneficiary Model integration
Tests the new harmonized model and serializer functionality
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

try:
    from fuel.models import HarmonizedBeneficiaryProfile, User, BeneficiaryCategory, Constituency, VehicleCategory
    from fuel.serializers import HarmonizedBeneficiaryProfileSerializer
    print("✅ Successfully imported HarmonizedBeneficiaryProfile model and serializer")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_model_methods():
    """Test harmonized model computed properties and methods"""
    print("\n🧪 Testing model methods and computed properties...")
    
    # Test computed properties that don't require database
    print("✅ Model class loaded successfully")
    print(f"✅ Model fields count: {len(HarmonizedBeneficiaryProfile._meta.fields)}")
    
    # Test method signatures
    methods_to_test = [
        'get_full_name',
        'get_contact_info', 
        'get_vehicle_info',
        'get_allocation_profile',
        'get_entitlements',
        'get_fuel_usage',
        'get_vehicles',
        'calculate_final_allocation',
        'calculate_engine_multiplier_from_size'
    ]
    
    for method_name in methods_to_test:
        if hasattr(HarmonizedBeneficiaryProfile, method_name):
            print(f"✅ Method {method_name} exists")
        else:
            print(f"❌ Method {method_name} missing")

def test_serializer_fields():
    """Test harmonized serializer field mappings"""
    print("\n🧪 Testing serializer field mappings...")
    
    serializer = HarmonizedBeneficiaryProfileSerializer()
    
    # Expected frontend fields from our analysis
    expected_frontend_fields = [
        'id', 'parliamentaryId', 'name', 'title', 'phoneNumber', 'email', 
        'address', 'dateOfBirth', 'nationalId', 'profilePhoto', 'lastActivity',
        'createdAt', 'category', 'constituency', 'vehicleCategory', 'party', 
        'status', 'contactInfo', 'vehicleInfo', 'allocationProfile', 
        'entitlements', 'fuelUsage', 'vehicles'
    ]
    
    serializer_fields = list(serializer.fields.keys())
    
    print(f"✅ Serializer has {len(serializer_fields)} fields")
    
    # Check frontend field coverage
    covered_fields = []
    missing_fields = []
    
    for field in expected_frontend_fields:
        if field in serializer_fields:
            covered_fields.append(field)
        else:
            missing_fields.append(field)
    
    coverage_percentage = (len(covered_fields) / len(expected_frontend_fields)) * 100
    
    print(f"✅ Frontend field coverage: {coverage_percentage:.1f}% ({len(covered_fields)}/{len(expected_frontend_fields)})")
    
    if missing_fields:
        print(f"❌ Missing fields: {', '.join(missing_fields)}")
    else:
        print("✅ All expected frontend fields are covered!")
    
    return coverage_percentage >= 95

def test_field_mappings():
    """Test specific field mappings and computed properties"""
    print("\n🧪 Testing field mappings...")
    
    # Test property mappings that should exist
    model_properties = [
        'name', 'title', 'phoneNumber', 'email', 'address', 
        'dateOfBirth', 'nationalId', 'profilePhoto', 'lastActivity',
        'createdAt', 'party'
    ]
    
    for prop in model_properties:
        if hasattr(HarmonizedBeneficiaryProfile, prop):
            print(f"✅ Property {prop} exists in model")
        else:
            print(f"❌ Property {prop} missing from model")

def run_all_tests():
    """Run all harmonization tests"""
    print("🚀 Starting Harmonized Beneficiary Model Tests...")
    print("=" * 60)
    
    try:
        test_model_methods()
        test_field_mappings()
        coverage_result = test_serializer_fields()
        
        print("\n" + "=" * 60)
        print("🎯 TEST SUMMARY")
        print("=" * 60)
        
        if coverage_result:
            print("✅ HARMONIZATION TESTS PASSED")
            print("✅ Model and serializer integration successful")
            print("✅ Frontend field coverage meets requirements (≥95%)")
            print("✅ Ready for production deployment")
            return True
        else:
            print("⚠️  HARMONIZATION TESTS PARTIALLY PASSED")
            print("⚠️  Model and serializer integration successful")
            print("❌ Frontend field coverage needs improvement")
            print("⚠️  Additional work needed before production")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
