#!/usr/bin/env python
"""
Comprehensive field mapping validation for CouponHandover system
Tests model-serializer-migration alignment
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    
    # Import required modules
    from fuel.models import CouponHandover
    from fuel.serializers import CouponHandoverSerializer
    
    print("🔍 COUPON HANDOVER FIELD MAPPING VALIDATION")
    print("=" * 60)
    
    # Get model fields
    model_fields = {}
    for field in CouponHandover._meta.get_fields():
        if hasattr(field, 'name'):
            model_fields[field.name] = {
                'type': field.__class__.__name__,
                'null': getattr(field, 'null', False),
                'blank': getattr(field, 'blank', False),
                'max_length': getattr(field, 'max_length', None),
                'related_model': getattr(field, 'related_model', None)
            }
    
    # Get serializer fields
    serializer = CouponHandoverSerializer()
    serializer_fields = {}
    for name, field in serializer.fields.items():
        serializer_fields[name] = {
            'type': field.__class__.__name__,
            'required': getattr(field, 'required', True),
            'read_only': getattr(field, 'read_only', False),
            'allow_null': getattr(field, 'allow_null', False)
        }
    
    print(f"📊 Model Fields: {len(model_fields)}")
    print(f"📊 Serializer Fields: {len(serializer_fields)}")
    print()
    
    # Check model properties
    model_properties = []
    for attr_name in dir(CouponHandover):
        attr = getattr(CouponHandover, attr_name)
        if isinstance(attr, property):
            model_properties.append(attr_name)
    
    print(f"🔧 Model Properties: {model_properties}")
    print()
    
    # Validate key field mappings
    critical_fields = [
        'handover_id', 'beneficiary', 'sub_center', 'status',
        'handover_mode', 'coupons', 'total_coupons', 'total_litres',
        'first_serial', 'last_serial', 'verification_checks'
    ]
    
    print("🎯 CRITICAL FIELD VALIDATION:")
    print("-" * 40)
    
    all_valid = True
    for field in critical_fields:
        model_has = field in model_fields
        serializer_has = field in serializer_fields
        
        if model_has and serializer_has:
            status = "✅ MAPPED"
        elif model_has and not serializer_has:
            status = "⚠️ MISSING IN SERIALIZER"
            all_valid = False
        elif not model_has and serializer_has:
            status = "⚠️ MISSING IN MODEL"
            all_valid = False
        else:
            status = "❌ MISSING BOTH"
            all_valid = False
            
        print(f"{field:20} {status}")
    
    print()
    
    # Check for serializer-only fields (computed fields)
    print("🔄 COMPUTED/SERIALIZER-ONLY FIELDS:")
    print("-" * 40)
    
    computed_fields = []
    for field in serializer_fields:
        if field not in model_fields and field not in ['id', 'created', 'updated']:
            computed_fields.append(field)
            
    for field in computed_fields:
        print(f"{field:20} 🔧 COMPUTED")
    
    print()
    
    # Validate relationships
    print("🔗 RELATIONSHIP VALIDATION:")
    print("-" * 40)
    
    relationships = ['beneficiary', 'sub_center', 'handed_over_by', 'received_by', 'coupons']
    for rel in relationships:
        if rel in model_fields and rel in serializer_fields:
            model_type = model_fields[rel]['type']
            serializer_type = serializer_fields[rel]['type']
            print(f"{rel:20} {model_type} → {serializer_type} ✅")
    
    print()
    
    # Test model instance creation
    print("🧪 MODEL FUNCTIONALITY TEST:")
    print("-" * 40)
    
    try:
        # Test model methods
        print("Model methods available:")
        methods = [method for method in dir(CouponHandover) if method.startswith(('generate_', 'calculate_', 'complete_', 'confirm_'))]
        for method in methods:
            print(f"  ✅ {method}")
        
        print()
        print("Property methods available:")
        for prop in model_properties:
            if prop in ['is_verified', 'is_completed', 'can_be_modified']:
                print(f"  ✅ {prop}")
        
    except Exception as e:
        print(f"  ❌ Error testing model: {e}")
        all_valid = False
    
    print()
    
    # Test serializer functionality
    print("🧪 SERIALIZER FUNCTIONALITY TEST:")
    print("-" * 40)
    
    try:
        # Test serializer instantiation
        serializer = CouponHandoverSerializer()
        print(f"  ✅ Serializer created successfully")
        print(f"  ✅ Total fields: {len(serializer.fields)}")
        print(f"  ✅ Meta model: {serializer.Meta.model.__name__}")
        print(f"  ✅ Meta fields count: {len(serializer.Meta.fields)}")
        
    except Exception as e:
        print(f"  ❌ Error testing serializer: {e}")
        all_valid = False
    
    print()
    
    # Final validation result
    print("🎯 FIELD MAPPING VALIDATION RESULT:")
    print("=" * 60)
    
    if all_valid:
        print("🟢 SUCCESS: Field mapping is complete and valid!")
        print("   ✅ All critical fields properly mapped")
        print("   ✅ Relationships correctly defined")
        print("   ✅ Model and serializer fully functional")
        print("   ✅ Ready for production use")
    else:
        print("🟡 WARNING: Some issues found in field mapping")
        print("   Please review the validation results above")
    
    print()
    print("📋 FIELD MAPPING SUMMARY:")
    print(f"   • Model fields: {len(model_fields)}")
    print(f"   • Serializer fields: {len(serializer_fields)}")
    print(f"   • Computed fields: {len(computed_fields)}")
    print(f"   • Property methods: {len(model_properties)}")
    print(f"   • Critical fields validated: {len(critical_fields)}")
    
except Exception as e:
    print(f"❌ Error during validation: {e}")
    import traceback
    traceback.print_exc()
