"""
Dynamic Fuel Allocation System - Serializers

DRF serializers for the Dynamic Fuel Allocation System models.
Provides comprehensive data serialization for TypeScript frontend integration.
"""

from rest_framework import serializers
from decimal import Decimal
try:
    from ..models import (
        FuelAllocationRule, FuelPrice, DynamicAllocation,
        BeneficiaryProfile, HarmonizedBeneficiaryProfile,
        ParliamentSession, User, BeneficiaryCategory, Constituency
    )
except Exception:
    from ..models import (
        FuelAllocationRule, FuelPrice, DynamicAllocation,
        BeneficiaryProfile,
        ParliamentSession, User, BeneficiaryCategory, Constituency
    )
    HarmonizedBeneficiaryProfile = None  # type: ignore


class FuelAllocationRuleSerializer(serializers.ModelSerializer):
    """
    Serializer for FuelAllocationRule model.
    Includes calculated fields and validation.
    """
    rule_type_display = serializers.CharField(source='get_rule_type_display', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    engine_band_display = serializers.CharField(source='get_applies_to_engine_band_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    last_modified_by_name = serializers.CharField(source='last_modified_by.get_full_name', read_only=True)
    category_name = serializers.CharField(source='applies_to_category.name', read_only=True)
    is_effective_today = serializers.SerializerMethodField()
    
    class Meta:
        model = FuelAllocationRule
        fields = [
            'id', 'rule_name', 'rule_type', 'rule_type_display', 'rule_code',
            'description', 'applies_to_engine_band', 'engine_band_display',
            'applies_to_category', 'category_name', 'applies_to_distance_min',
            'applies_to_distance_max', 'period_type', 'period_type_display',
            'engine_constant_under_2800', 'engine_constant_2800_3199',
            'engine_constant_3200_plus', 'distance_factor_base',
            'distance_factor_per_km', 'max_distance_factor',
            'minimum_allocation_litres', 'maximum_allocation_litres',
            'session_top_up_litres', 'session_top_up_percentage',
            'is_active', 'effective_from', 'effective_until', 'priority',
            'custom_formula', 'created_by', 'created_by_name',
            'last_modified_by', 'last_modified_by_name', 'created',
            'modified', 'is_effective_today'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_is_effective_today(self, obj):
        """Check if rule is effective today"""
        from django.utils import timezone
        return obj.is_effective_on_date(timezone.now().date())
    
    def validate(self, data):
        """Custom validation for allocation rules"""
        # Validate effective date range
        if data.get('effective_until') and data.get('effective_from'):
            if data['effective_until'] <= data['effective_from']:
                raise serializers.ValidationError(
                    "Effective until date must be after effective from date"
                )
        
        # Validate allocation limits
        if data.get('minimum_allocation_litres') and data.get('maximum_allocation_litres'):
            if data['minimum_allocation_litres'] >= data['maximum_allocation_litres']:
                raise serializers.ValidationError(
                    "Minimum allocation must be less than maximum allocation"
                )
        
        # Validate distance range
        if data.get('applies_to_distance_min') and data.get('applies_to_distance_max'):
            if data['applies_to_distance_min'] >= data['applies_to_distance_max']:
                raise serializers.ValidationError(
                    "Minimum distance must be less than maximum distance"
                )
        
        return data


class FuelPriceSerializer(serializers.ModelSerializer):
    """
    Serializer for FuelPrice model.
    Includes validation and calculated fields.
    """
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    price_source_display = serializers.CharField(source='get_price_source_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    is_effective_today = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = FuelPrice
        fields = [
            'id', 'fuel_type', 'fuel_type_display', 'price_per_litre_usd',
            'price_per_litre_zwg', 'exchange_rate_usd_zwg', 'effective_date',
            'expiry_date', 'price_source', 'price_source_display',
            'source_reference', 'is_active', 'is_default', 'notes',
            'created_by', 'created_by_name', 'approved_by', 'approved_by_name',
            'approved_at', 'created', 'modified', 'is_effective_today',
            'days_until_expiry'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_is_effective_today(self, obj):
        """Check if price is effective today"""
        from django.utils import timezone
        return obj.is_effective_on_date(timezone.now().date())
    
    def get_days_until_expiry(self, obj):
        """Calculate days until price expires"""
        if not obj.expiry_date:
            return None
        
        from django.utils import timezone
        today = timezone.now().date()
        
        if obj.expiry_date <= today:
            return 0
        
        return (obj.expiry_date - today).days
    
    def validate(self, data):
        """Custom validation for fuel prices"""
        # Validate price is positive
        if data.get('price_per_litre_usd') and data['price_per_litre_usd'] <= 0:
            raise serializers.ValidationError(
                "Price per litre must be positive"
            )
        
        # Validate date logic
        if data.get('expiry_date') and data.get('effective_date'):
            if data['expiry_date'] <= data['effective_date']:
                raise serializers.ValidationError(
                    "Expiry date must be after effective date"
                )
        
        return data


class DynamicAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for DynamicAllocation model.
    Includes comprehensive calculation details and relationships.
    """
    allocation_type_display = serializers.CharField(source='get_allocation_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    beneficiary_name = serializers.CharField(source='beneficiary.get_full_name', read_only=True)
    rule_name = serializers.CharField(source='rule_applied.rule_name', read_only=True)
    fuel_price_display = serializers.CharField(source='fuel_price.__str__', read_only=True)
    parliament_session_title = serializers.CharField(source='parliament_session.title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    committed_by_name = serializers.CharField(source='committed_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    # Calculated fields
    fulfillment_percentage = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    can_be_fulfilled = serializers.SerializerMethodField()
    
    # Beneficiary details
    beneficiary_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DynamicAllocation
        fields = [
            'id', 'allocation_id', 'allocation_type', 'allocation_type_display',
            'status', 'status_display', 'beneficiary', 'beneficiary_name',
            'beneficiary_details', 'rule_applied', 'rule_name',
            'parliament_session', 'parliament_session_title', 'fuel_price',
            'fuel_price_display', 'allocation_period_start', 'allocation_period_end',
            'period_type', 'period_type_display', 'base_allocation_litres',
            'session_supplement_litres', 'total_allocation_litres',
            'allocated_value_usd', 'calculation_details', 'engine_capacity_cc',
            'distance_from_parliament_km', 'engine_constant_applied',
            'distance_factor_applied', 'fuel_price_used', 'coupons_allocated',
            'litres_fulfilled', 'remaining_litres', 'created_by', 'created_by_name',
            'committed_by', 'committed_by_name', 'committed_at', 'approved_by',
            'approved_by_name', 'approved_at', 'notes', 'preview_generated_at',
            'created', 'modified', 'fulfillment_percentage', 'is_expired',
            'days_until_expiry', 'can_be_fulfilled'
        ]
        read_only_fields = [
            'id', 'allocation_id', 'created', 'modified', 'preview_generated_at'
        ]
    
    def get_fulfillment_percentage(self, obj):
        """Calculate fulfillment percentage"""
        return obj.fulfillment_percentage
    
    def get_is_expired(self, obj):
        """Check if allocation has expired"""
        return obj.is_expired
    
    def get_days_until_expiry(self, obj):
        """Calculate days until allocation expires"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if obj.allocation_period_end <= today:
            return 0
        
        return (obj.allocation_period_end - today).days
    
    def get_can_be_fulfilled(self, obj):
        """Check if allocation can be fulfilled with coupons"""
        return obj.status in ['COMMITTED', 'PARTIALLY_FULFILLED'] and obj.remaining_litres > 0
    
    def get_beneficiary_details(self, obj):
        """Get detailed beneficiary information"""
        beneficiary = obj.beneficiary
        
        # Get profile (try both types)
        profile = None
        if hasattr(beneficiary, 'harmonized_beneficiary_profile'):
            profile = beneficiary.harmonized_beneficiary_profile
        elif hasattr(beneficiary, 'beneficiary_profile'):
            profile = beneficiary.beneficiary_profile
        
        if not profile:
            return {
                'name': beneficiary.get_full_name(),
                'email': beneficiary.email,
                'category': None,
                'constituency': None,
                'vehicle_info': None
            }
        
        return {
            'name': beneficiary.get_full_name(),
            'email': beneficiary.email,
            'category': {
                'name': profile.category.name if hasattr(profile, 'category') and profile.category else None,
                'id': profile.category.id if hasattr(profile, 'category') and profile.category else None,
            },
            'constituency': {
                'name': profile.constituency.name if hasattr(profile, 'constituency') and profile.constituency else None,
                'id': profile.constituency.id if hasattr(profile, 'constituency') and profile.constituency else None,
                'distance_km': profile.constituency.distance_from_parliament_km if hasattr(profile, 'constituency') and profile.constituency else None,
            },
            'vehicle_info': {
                'make': getattr(profile, 'vehicle_make', ''),
                'model': getattr(profile, 'vehicle_model', ''),
                'year': getattr(profile, 'vehicle_year', None),
                'engine_size': getattr(profile, 'engine_size', ''),
                'registration': getattr(profile, 'vehicle_registration', ''),
                'fuel_type': getattr(profile, 'fuel_type', 'DIESEL'),
            }
        }


class BeneficiaryProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for BeneficiaryProfile model.
    Supports both BeneficiaryProfile and HarmonizedBeneficiaryProfile.
    """
    user_details = serializers.SerializerMethodField()
    category_details = serializers.SerializerMethodField()
    constituency_details = serializers.SerializerMethodField()
    vehicle_category_details = serializers.SerializerMethodField()
    calculated_allocation = serializers.SerializerMethodField()
    allocation_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = BeneficiaryProfile
        fields = [
            'id', 'user', 'user_details', 'category', 'category_details',
            'constituency', 'constituency_details', 'vehicle_category',
            'vehicle_category_details', 'employee_id', 'position', 'department',
            'monthly_entitlement_litres', 'is_active_beneficiary',
            'vehicle_make', 'vehicle_model', 'vehicle_year', 'engine_size',
            'vehicle_registration', 'fuel_type', 'office_location',
            'base_allocation', 'category_multiplier', 'engine_multiplier',
            'engine_capacity_cc', 'distance_from_parliament_km',
            'last_allocation_date', 'current_balance', 'used_this_month',
            'created', 'modified', 'calculated_allocation', 'allocation_profile'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_user_details(self, obj):
        """Get user account details"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'phone': obj.user.phone,
            'role': obj.user.role,
            'is_active': obj.user.is_active,
            'last_activity': obj.user.last_activity,
        }
    
    def get_category_details(self, obj):
        """Get category details"""
        if not obj.category:
            return None
        
        return {
            'id': obj.category.id,
            'name': obj.category.name,
            'description': obj.category.description,
            'monthly_entitlement_litres': float(obj.category.monthly_entitlement_litres),
            'category_multiplier': float(obj.category.category_multiplier),
        }
    
    def get_constituency_details(self, obj):
        """Get constituency details"""
        if not obj.constituency:
            return None
        
        return {
            'id': obj.constituency.id,
            'name': obj.constituency.name,
            'province': obj.constituency.province,
            'district': obj.constituency.district,
            'distance_from_parliament_km': obj.constituency.distance_from_parliament_km,
            'population': obj.constituency.population,
        }
    
    def get_vehicle_category_details(self, obj):
        """Get vehicle category details"""
        if not obj.vehicle_category:
            return None
        
        return {
            'id': obj.vehicle_category.id,
            'name': obj.vehicle_category.name,
            'description': obj.vehicle_category.description,
            'fuel_multiplier': float(obj.vehicle_category.fuel_multiplier),
        }
    
    def get_calculated_allocation(self, obj):
        """Get calculated final allocation"""
        return float(obj.calculate_final_allocation())
    
    def get_allocation_profile(self, obj):
        """Get comprehensive allocation profile"""
        return obj.get_allocation_profile()


class HarmonizedBeneficiaryProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for HarmonizedBeneficiaryProfile model.
    Provides complete frontend compatibility.
    """
    user_details = serializers.SerializerMethodField()
    category_details = serializers.SerializerMethodField()
    constituency_details = serializers.SerializerMethodField()
    vehicle_category_details = serializers.SerializerMethodField()
    
    # Frontend-compatible computed properties
    name = serializers.CharField(source='get_full_name', read_only=True)
    contact_info = serializers.SerializerMethodField()
    vehicle_info = serializers.SerializerMethodField()
    allocation_profile = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()
    fuel_usage = serializers.SerializerMethodField()
    vehicles = serializers.SerializerMethodField()
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            'id', 'user', 'user_details', 'parliamentary_id', 'employee_id',
            'category', 'category_details', 'constituency', 'constituency_details',
            'vehicle_category', 'vehicle_category_details', 'position',
            'department', 'party_affiliation', 'date_of_birth', 'national_id',
            'full_address', 'office_location', 'office_phone', 'mobile_phone',
            'official_email', 'personal_email', 'vehicle_make', 'vehicle_model',
            'vehicle_year', 'engine_size', 'vehicle_registration', 'fuel_type',
            'base_allocation', 'category_multiplier', 'engine_multiplier',
            'monthly_entitlement_litres', 'max_per_transaction', 'status',
            'is_active_beneficiary', 'current_balance', 'used_this_month',
            'last_month_usage', 'year_to_date_usage', 'total_usage_all_time',
            'last_allocation_date', 'join_date', 'last_login', 'created',
            'modified', 'name', 'contact_info', 'vehicle_info',
            'allocation_profile', 'entitlements', 'fuel_usage', 'vehicles'
        ]
        read_only_fields = ['id', 'join_date', 'created', 'modified']
    
    def get_user_details(self, obj):
        """Get user account details"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'phone': obj.user.phone,
            'role': obj.user.role,
            'is_active': obj.user.is_active,
            'last_activity': obj.user.last_activity,
        }
    
    def get_category_details(self, obj):
        """Get category details"""
        if not obj.category:
            return None
        
        return {
            'id': obj.category.id,
            'name': obj.category.name,
            'description': obj.category.description,
            'monthly_entitlement_litres': float(obj.category.monthly_entitlement_litres),
            'category_multiplier': float(obj.category.category_multiplier),
        }
    
    def get_constituency_details(self, obj):
        """Get constituency details"""
        if not obj.constituency:
            return None
        
        return {
            'id': obj.constituency.id,
            'name': obj.constituency.name,
            'province': obj.constituency.province,
            'district': obj.constituency.district,
            'distance_from_parliament_km': obj.constituency.distance_from_parliament_km,
            'population': obj.constituency.population,
        }
    
    def get_vehicle_category_details(self, obj):
        """Get vehicle category details"""
        if not obj.vehicle_category:
            return None
        
        return {
            'id': obj.vehicle_category.id,
            'name': obj.vehicle_category.name,
            'description': obj.vehicle_category.description,
            'fuel_multiplier': float(obj.vehicle_category.fuel_multiplier),
        }
    
    def get_contact_info(self, obj):
        """Get contact information"""
        return obj.get_contact_info()
    
    def get_vehicle_info(self, obj):
        """Get vehicle information"""
        return obj.get_vehicle_info()
    
    def get_allocation_profile(self, obj):
        """Get allocation profile"""
        return obj.get_allocation_profile()
    
    def get_entitlements(self, obj):
        """Get entitlements"""
        return obj.get_entitlements()
    
    def get_fuel_usage(self, obj):
        """Get fuel usage"""
        return obj.get_fuel_usage()
    
    def get_vehicles(self, obj):
        """Get vehicles array"""
        return obj.get_vehicles()


class ParliamentSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for ParliamentSession model with enhanced fields.
    """
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)
    managing_subcenter_name = serializers.CharField(source='managing_subcenter.name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    is_active_session = serializers.SerializerMethodField()
    attendees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ParliamentSession
        fields = [
            'id', 'title', 'session_type', 'session_type_display',
            'start_date', 'end_date', 'description', 'is_active',
            'organizer', 'organizer_name', 'managing_subcenter',
            'managing_subcenter_name', 'fuel_top_up_litres',
            'fuel_top_up_percentage', 'expected_attendance',
            'attendance_tracked', 'created', 'modified',
            'duration_days', 'is_active_session', 'attendees_count'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_duration_days(self, obj):
        """Calculate session duration in days"""
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days + 1
        return 1
    
    def get_is_active_session(self, obj):
        """Check if session is currently active"""
        from django.utils import timezone
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date if obj.start_date and obj.end_date else False
    
    def get_attendees_count(self, obj):
        """Get actual attendees count if tracked"""
        if obj.attendance_tracked:
            return obj.attendances.filter(status='PRESENT').count()
        return obj.expected_attendance
