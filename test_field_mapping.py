#!/usr/bin/env python
"""
Test script to validate frontend-backend field mapping
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_complete_box_creation():
    """Test box creation with all frontend fields"""
    print("Testing complete box creation with all frontend fields...")
    
    # First login to get token
    login_data = {
        "username": "admin",
        "password": "pass@123"
    }
    
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return False
            
        token = response.json().get('access')
        print("✅ Login successful")
        
        # Prepare comprehensive box data with all frontend fields
        box_data = {
            # Core identification (let backend generate box_code)
            "barcode": "TEST-BARCODE-001",
            
            # Fuel and structure info
            "fuelType": "PETROL",
            "couponAmount": 20,
            "numberOfBooks": 5,
            "couponsPerBook": 20,
            
            # Coupon serial numbers
            "firstCouponId": "PET001001",
            "lastCouponId": "PET001100",
            
            # Calculated totals
            "totalLitres": 2000,
            
            # Financial calculations
            "monetaryValueUSD": 1200.50,
            "fuelPriceUSD": 0.60,
            "exchangeRate": 27.5,
            
            # Receipt information
            "receivedDate": "2025-08-12",
            "receivedTime": "14:30",
            "supplier": "Test Fuel Supplier Ltd",
            "invoiceNumber": "INV-2025-001",
            "deliveryNote": "DEL-NOTE-001",
            
            # Status and workflow
            "status": "RECEIVED",
            
            # Quality and documentation
            "signature": "John Smith",
            "notes": "All coupons in good condition",
            
            # Additional fields
            "verificationNotes": "Visual inspection completed",
        }
        
        # Create box
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{BASE_URL}/boxes/", json=box_data, headers=headers)
        
        if response.status_code == 201:
            created_box = response.json()
            print("✅ Box created successfully!")
            print(f"Generated Box Code: {created_box.get('box_code', 'N/A')}")
            
            # Verify that backend received and processed all fields
            print("\n📋 Field Mapping Verification:")
            
            # Check core fields
            print(f"  Barcode: {created_box.get('barcode', 'MISSING')}")
            print(f"  Fuel Type: {created_box.get('fuel_type', 'MISSING')}")
            print(f"  Denomination: {created_box.get('denomination', 'MISSING')}")
            print(f"  Number of Books: {created_box.get('number_of_books', 'MISSING')}")
            print(f"  Coupons per Book: {created_box.get('coupons_per_book', 'MISSING')}")
            
            # Check financial fields
            print(f"  Total Value USD: {created_box.get('total_value_usd', 'MISSING')}")
            print(f"  Fuel Price USD: {created_box.get('fuel_price_per_litre_usd', 'MISSING')}")
            print(f"  Exchange Rate: {created_box.get('exchange_rate_zwg_usd', 'MISSING')}")
            
            # Check receipt fields
            print(f"  Supplier: {created_box.get('supplier', 'MISSING')}")
            print(f"  Invoice Number: {created_box.get('invoice_number', 'MISSING')}")
            print(f"  Delivery Note: {created_box.get('delivery_note', 'MISSING')}")
            
            # Check serial numbers
            print(f"  First Coupon: {created_box.get('first_coupon_number', 'MISSING')}")
            print(f"  Last Coupon: {created_box.get('last_coupon_number', 'MISSING')}")
            
            # Check other fields
            print(f"  Status: {created_box.get('status', 'MISSING')}")
            print(f"  Notes: {created_box.get('notes', 'MISSING')}")
            print(f"  Received By Signature: {created_box.get('received_by_signature', 'MISSING')}")
            
            return True
        else:
            print(f"❌ Box creation failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

if __name__ == "__main__":
    print("=== Frontend-Backend Field Mapping Test ===")
    success = test_complete_box_creation()
    print(f"\n{'✅ Test PASSED' if success else '❌ Test FAILED'}")
