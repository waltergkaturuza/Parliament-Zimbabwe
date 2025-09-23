#!/usr/bin/env python3
"""
Model Inspector - Check Django model fields for fuel app
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Coupon, DispatchedCoupon, CouponHandover, HandedOverCoupon

def inspect_models():
    """Check Django model fields"""
    print("🔍 DJANGO MODEL FIELD INSPECTION")
    print("=" * 50)
    
    models_to_check = [
        ('Coupon', Coupon),
        ('DispatchedCoupon', DispatchedCoupon), 
        ('CouponHandover', CouponHandover),
        ('HandedOverCoupon', HandedOverCoupon)
    ]
    
    for model_name, model_class in models_to_check:
        print(f"\n📋 Model: {model_name}")
        print("-" * 30)
        
        for field in model_class._meta.get_fields():
            field_type = field.__class__.__name__
            field_name = field.name
            
            # Get additional field info
            field_info = f"{field_name}: {field_type}"
            
            if hasattr(field, 'null') and field.null:
                field_info += " (nullable)"
            if hasattr(field, 'blank') and field.blank:
                field_info += " (blank)"
            if hasattr(field, 'max_length') and field.max_length:
                field_info += f" (max_length={field.max_length})"
            if hasattr(field, 'related_model') and field.related_model:
                field_info += f" -> {field.related_model.__name__}"
                
            print(f"  • {field_info}")

if __name__ == "__main__":
    inspect_models()