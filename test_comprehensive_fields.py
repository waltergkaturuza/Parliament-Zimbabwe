#!/usr/bin/env python
"""
Test script to verify comprehensive field mapping between frontend and backend
"""
import os
import sys
import django
import json
import requests
from datetime import datetime, time

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')

# Change to project directory to ensure Django can find modules
os.chdir(project_root)
django.setup()

from fuel.serializers import BoxSerializer
from fuel.models import Box
from django.contrib.auth import get_user_model

User = get_user_model()

def test_comprehensive_field_mapping():
    """Test that all frontend fields are properly handled by the backend"""
    
    # Sample frontend data that matches what the form sends
    frontend_data = {
        # Box identification
        'boxId': 'AUTO-TEST-001',  # Will be converted to box_code
        'barcode': 'BAR123456789',
        
        # Supplier information
        'supplier': 'Test Supplier Ltd',
        
        # Receipt information
        'receivedBy': 'John Doe',
        'receivedDate': '2024-01-15',
        'receivedTime': '14:30:00',
        'invoiceNumber': 'INV-2024-001',
        'deliveryNote': 'DEL-NOTE-001',
        
        # Fuel specifications
        'fuelType': 'Petrol',
        'couponAmount': '20',  # Denomination
        'fuelPricePerLitreUSD': '1.25',
        'exchangeRate': '25000',
        'fuelPricePerLitre': '31250',  # Local currency
        
        # Coupon details
        'firstCouponId': 'C001001',
        'lastCouponId': 'C001500',
        'numberOfBooks': '5',
        'couponsPerBook': '100',
        
        # Notes and verification
        'couponVerificationNotes': 'All coupons verified and in good condition',
        'notes': 'Special delivery - handle with care',
        'signature': 'John Doe - Warehouse Manager',
        
        # Status
        'status': 'RECEIVED'
    }
    
    print("Testing comprehensive field mapping...")
    print("=" * 50)
    
    # Test serializer field mapping
    serializer = BoxSerializer(data=frontend_data)
    
    if serializer.is_valid():
        print("✅ Serializer validation PASSED")
        print("\nValidated data mapping:")
        validated_data = serializer.validated_data
        
        for frontend_field, backend_value in validated_data.items():
            print(f"  {frontend_field}: {backend_value}")
            
        # Test creation (without actually saving to avoid duplicates)
        print("\n" + "=" * 50)
        print("Field mapping verification:")
        
        # Check critical field mappings
        field_mappings = {
            'boxId': 'box_code',
            'fuelType': 'fuel_type', 
            'couponAmount': 'denomination',
            'fuelPricePerLitreUSD': 'fuel_price_per_litre_usd',
            'exchangeRate': 'exchange_rate_zwg_usd',
            'firstCouponId': 'first_coupon_number',
            'lastCouponId': 'last_coupon_number',
            'numberOfBooks': 'number_of_books',
            'couponsPerBook': 'coupons_per_book',
            'receivedBy': 'received_by',
            'receivedDate': 'received_date',
            'receivedTime': 'received_time',
            'invoiceNumber': 'invoice_number',
            'deliveryNote': 'delivery_note_number',
            'couponVerificationNotes': 'verification_notes',
        }
        
        all_mapped = True
        for frontend_field, expected_backend_field in field_mappings.items():
            if frontend_field in frontend_data:
                if expected_backend_field in validated_data:
                    print(f"✅ {frontend_field} → {expected_backend_field}: {validated_data[expected_backend_field]}")
                else:
                    print(f"❌ {frontend_field} → {expected_backend_field}: NOT MAPPED")
                    all_mapped = False
        
        if all_mapped:
            print("\n🎉 ALL CRITICAL FIELDS PROPERLY MAPPED!")
        else:
            print("\n⚠️  Some fields are not properly mapped")
            
    else:
        print("❌ Serializer validation FAILED")
        print("Errors:")
        for field, errors in serializer.errors.items():
            print(f"  {field}: {errors}")
    
    print("\n" + "=" * 50)
    return serializer.is_valid()

def test_api_endpoint():
    """Test the actual API endpoint with comprehensive data"""
    
    # First get a JWT token
    auth_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        # Get JWT token
        auth_response = requests.post('http://localhost:8000/api/auth/token/', json=auth_data)
        if auth_response.status_code == 200:
            token = auth_response.json()['access']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            
            # Prepare comprehensive test data
            api_test_data = {
                'barcode': f'TEST-{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'supplier': 'Test API Supplier',
                'receivedBy': 'API Test User',
                'receivedDate': '2024-01-15',
                'receivedTime': '15:30:00',
                'invoiceNumber': f'API-INV-{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'deliveryNote': 'API-DEL-NOTE-001',
                'fuelType': 'Diesel',
                'couponAmount': '50',
                'fuelPricePerLitreUSD': '1.45',
                'exchangeRate': '26000',
                'fuelPricePerLitre': '37700',
                'firstCouponId': 'API001001',
                'lastCouponId': 'API001200',
                'numberOfBooks': '2',
                'couponsPerBook': '100',
                'couponVerificationNotes': 'API test verification complete',
                'notes': 'API test box - comprehensive field test',
                'signature': 'API Test - Automated',
                'status': 'RECEIVED'
            }
            
            print("Testing API endpoint with comprehensive data...")
            print("POST data:", json.dumps(api_test_data, indent=2))
            
            response = requests.post('http://localhost:8000/api/v1/boxes/', 
                                   json=api_test_data, headers=headers)
            
            print(f"\nAPI Response Status: {response.status_code}")
            if response.status_code == 201:
                print("✅ API TEST PASSED - Box created successfully!")
                response_data = response.json()
                print("Response data:", json.dumps(response_data, indent=2))
                
                # Verify that our frontend fields were properly processed
                print("\nField verification in response:")
                test_fields = {
                    'supplier': 'supplier',
                    'received_by': 'receivedBy',
                    'fuel_type': 'fuelType',
                    'denomination': 'couponAmount',
                    'invoice_number': 'invoiceNumber',
                    'verification_notes': 'couponVerificationNotes'
                }
                
                for backend_field, frontend_field in test_fields.items():
                    if backend_field in response_data:
                        expected_value = api_test_data[frontend_field]
                        actual_value = response_data[backend_field]
                        if str(actual_value) == str(expected_value):
                            print(f"✅ {backend_field}: {actual_value}")
                        else:
                            print(f"⚠️  {backend_field}: expected '{expected_value}', got '{actual_value}'")
                    else:
                        print(f"❌ {backend_field}: NOT IN RESPONSE")
                        
            else:
                print("❌ API TEST FAILED")
                print("Response:", response.text)
                
        else:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            print("Response:", auth_response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ API test error: {e}")

if __name__ == '__main__':
    print("Comprehensive Field Mapping Test")
    print("=" * 60)
    
    # Test 1: Serializer field mapping
    serializer_test_passed = test_comprehensive_field_mapping()
    
    print("\n" + "=" * 60)
    
    # Test 2: API endpoint test
    if serializer_test_passed:
        test_api_endpoint()
    else:
        print("Skipping API test due to serializer validation failure")
    
    print("\n" + "=" * 60)
    print("Test completed!")
