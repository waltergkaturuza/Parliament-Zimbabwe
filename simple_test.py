"""
Simple test script to verify BoxSerializer field mappings
Run with: python manage.py shell < simple_test.py
"""

from fuel.serializers import BoxSerializer
import json

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

print("Testing BoxSerializer field mappings...")
print("=" * 50)

# Test serializer field mapping
serializer = BoxSerializer(data=frontend_data)

if serializer.is_valid():
    print("✅ Serializer validation PASSED")
    print("\nValidated data mapping:")
    validated_data = serializer.validated_data
    
    for frontend_field, backend_value in validated_data.items():
        print(f"  {frontend_field}: {backend_value}")
        
    print("\n" + "=" * 50)
    print("Field mapping verification:")
    
    # Check critical field mappings
    field_mappings = {
        'barcode': 'barcode',
        'supplier': 'supplier',
        'receivedBy': 'received_by',
        'receivedDate': 'received_date',
        'receivedTime': 'received_time',
        'invoiceNumber': 'invoice_number',
        'deliveryNote': 'delivery_note_number',
        'fuelType': 'fuel_type', 
        'couponAmount': 'denomination',
        'fuelPricePerLitreUSD': 'fuel_price_per_litre_usd',
        'exchangeRate': 'exchange_rate_zwg_usd',
        'firstCouponId': 'first_coupon_number',
        'lastCouponId': 'last_coupon_number',
        'numberOfBooks': 'number_of_books',
        'couponsPerBook': 'coupons_per_book',
        'couponVerificationNotes': 'verification_notes',
        'notes': 'notes',
        'signature': 'signature',
        'status': 'status'
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
        print("\nThe backend serializer is now fully compatible with the frontend form!")
        
        # Show calculated fields
        print("\nCalculated/computed fields:")
        if 'total_coupons' in validated_data:
            print(f"  total_coupons: {validated_data['total_coupons']}")
        if 'total_value_usd' in validated_data:
            print(f"  total_value_usd: {validated_data['total_value_usd']}")
            
    else:
        print("\n⚠️  Some fields are not properly mapped")
        
else:
    print("❌ Serializer validation FAILED")
    print("Errors:")
    for field, errors in serializer.errors.items():
        print(f"  {field}: {errors}")
        
print("\n" + "=" * 50)
print("Test completed!")
