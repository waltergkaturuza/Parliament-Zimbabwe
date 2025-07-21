#!/usr/bin/env python
"""
Test script to validate the POZ Fuel Coupon System functionality
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from fuel.models import *

User = get_user_model()

def test_api_endpoints():
    """Test key API endpoints"""
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("🧪 Testing API Endpoints...")
    
    # Test public endpoints (no auth required for some)
    endpoints_to_test = [
        "/dashboard/",
        "/analytics/",
        "/coupons/",
        "/beneficiary-categories/",
        "/constituencies/", 
        "/vehicle-categories/",
        "/parliament-sessions/",
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            status = "✅ PASS" if response.status_code in [200, 401] else f"❌ FAIL ({response.status_code})"
            print(f"  {endpoint}: {status}")
        except Exception as e:
            print(f"  {endpoint}: ❌ FAIL (Error: {e})")
    
    print()

def test_model_functionality():
    """Test model methods and data integrity"""
    print("🧪 Testing Model Functionality...")
    
    # Test Coupon model with new fields
    coupon_count = Coupon.objects.count()
    coupons_with_serials = Coupon.objects.filter(serial_number__isnull=False).count()
    print(f"  Total coupons: {coupon_count}")
    print(f"  Coupons with serial numbers: {coupons_with_serials}")
    
    # Test new models
    categories_count = BeneficiaryCategory.objects.count()
    constituencies_count = Constituency.objects.count()
    sessions_count = ParliamentSession.objects.count()
    entitlements_count = FuelEntitlement.objects.count()
    
    print(f"  Beneficiary categories: {categories_count}")
    print(f"  Constituencies: {constituencies_count}")
    print(f"  Parliament sessions: {sessions_count}")
    print(f"  Fuel entitlements: {entitlements_count}")
    
    # Test a specific coupon
    if Coupon.objects.exists():
        sample_coupon = Coupon.objects.first()
        print(f"  Sample coupon serial: {sample_coupon.serial_number}")
        print(f"  Sample coupon has QR code: {'Yes' if sample_coupon.qr_code else 'No'}")
        print(f"  Sample coupon has barcode: {'Yes' if sample_coupon.barcode else 'No'}")
    
    print()

def test_user_management():
    """Test user and role management"""
    print("🧪 Testing User Management...")
    
    # Count users by role
    role_counts = {}
    for role_code, role_name in User.ROLE_CHOICES:
        count = User.objects.filter(role=role_code).count()
        role_counts[role_name] = count
    
    for role_name, count in role_counts.items():
        print(f"  {role_name}: {count}")
    
    # Test beneficiary profiles
    profiles_count = BeneficiaryProfile.objects.count()
    print(f"  Beneficiary profiles: {profiles_count}")
    
    print()

def test_analytics_data():
    """Test analytics calculations"""
    print("🧪 Testing Analytics Data...")
    
    try:
        # Calculate some basic analytics
        total_coupons = Coupon.objects.count()
        used_coupons = Coupon.objects.filter(status='USED').count()
        available_coupons = Coupon.objects.filter(status='AVAILABLE').count()
        
        print(f"  Total coupons: {total_coupons}")
        print(f"  Used coupons: {used_coupons}")
        print(f"  Available coupons: {available_coupons}")
        
        # Test if analytics models work
        if FuelEntitlement.objects.exists():
            total_entitlements = FuelEntitlement.objects.count()
            fulfilled_entitlements = FuelEntitlement.objects.filter(is_fulfilled=True).count()
            print(f"  Total entitlements: {total_entitlements}")
            print(f"  Fulfilled entitlements: {fulfilled_entitlements}")
        
    except Exception as e:
        print(f"  ❌ Analytics error: {e}")
    
    print()

def test_management_commands():
    """Test if management commands work"""
    print("🧪 Testing Management Commands...")
    
    # These commands have already been run, so just verify their effects
    commands_effects = [
        ("initialize_poz_data", "System initialization", BeneficiaryCategory.objects.exists()),
        ("populate_coupon_codes", "Coupon code population", Coupon.objects.filter(serial_number__isnull=False).exists()),
        ("generate_monthly_entitlements", "Monthly entitlements", FuelEntitlement.objects.exists()),
        ("generate_coupons", "Coupon generation", Coupon.objects.count() > 200),
    ]
    
    for command, description, test_condition in commands_effects:
        status = "✅ PASS" if test_condition else "❌ FAIL"
        print(f"  {command} ({description}): {status}")
    
    print()

def main():
    """Run all tests"""
    print("🚀 POZ Fuel Coupon System Test Suite")
    print("=" * 50)
    
    test_model_functionality()
    test_user_management()
    test_analytics_data()
    test_management_commands()
    test_api_endpoints()
    
    print("✅ Test suite completed!")
    print("\n📊 System Summary:")
    print(f"  • Total Users: {User.objects.count()}")
    print(f"  • Total Coupons: {Coupon.objects.count()}")
    print(f"  • Total Books: {Book.objects.count()}")
    print(f"  • Total Boxes: {Box.objects.count()}")
    print(f"  • Total Sub-Centers: {SubCenter.objects.count()}")
    print(f"  • Parliament Sessions: {ParliamentSession.objects.count()}")
    print(f"  • Fuel Entitlements: {FuelEntitlement.objects.count()}")
    
    print("\n🌐 Access URLs:")
    print("  • Admin Interface: http://127.0.0.1:8000/admin/")
    print("  • API Documentation: http://127.0.0.1:8000/api/schema/swagger-ui/")
    print("  • API Root: http://127.0.0.1:8000/api/v1/")
    print("  • Dashboard API: http://127.0.0.1:8000/api/v1/dashboard/")
    print("  • Analytics API: http://127.0.0.1:8000/api/v1/analytics/")

if __name__ == "__main__":
    main()
