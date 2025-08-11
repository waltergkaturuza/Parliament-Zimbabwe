"""
Harmonized Beneficiary Serializer - 100% Safe Implementation
This serializer ensures perfect alignment between database models and frontend interfaces.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import (
    BeneficiaryCategory, Constituency, VehicleCategory
)
from .harmonized_beneficiary_model import HarmonizedBeneficiaryProfile

User = get_user_model()


class SimpleUserSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested relationships"""
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role')


class BeneficiaryCategorySerializer(serializers.ModelSerializer):
    """Serializer for beneficiary categories"""
    class Meta:
        model = BeneficiaryCategory
        fields = '__all__'


class ConstituencySerializer(serializers.ModelSerializer):
    """Serializer for constituencies"""
    class Meta:
        model = Constituency
        fields = '__all__'


class VehicleCategorySerializer(serializers.ModelSerializer):
    """Serializer for vehicle categories"""
    class Meta:
        model = VehicleCategory
        fields = '__all__'


class HarmonizedBeneficiaryProfileSerializer(serializers.ModelSerializer):
    """
    Completely harmonized beneficiary serializer with 100% frontend compatibility.
    
    This serializer provides:
    1. Direct field mapping for simple frontend fields
    2. Computed fields for complex frontend requirements
    3. Structured data objects for nested frontend interfaces
    4. Backward compatibility with existing API consumers
    
    Frontend Interface Mapping:
    - BeneficiaryManagement.tsx: 19 fields mapped
    - BeneficiaryAccountDashboard.tsx: 12 structured fields mapped
    """
    
    # === FRONTEND-COMPATIBLE FIELD NAMES ===
    # Direct mapping to frontend interface field names
    parliamentaryId = serializers.CharField(source='parliamentary_id', read_only=True)
    name = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    phoneNumber = serializers.CharField(source='mobile_phone', read_only=True)
    email = serializers.CharField(source='official_email', read_only=True)
    address = serializers.CharField(source='full_address', read_only=True)
    dateOfBirth = serializers.SerializerMethodField()
    nationalId = serializers.CharField(source='national_id', read_only=True)
    profilePhoto = serializers.SerializerMethodField()
    party = serializers.CharField(source='party_affiliation', read_only=True)
    lastActivity = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()
    
    # === STRUCTURED DATA OBJECTS FOR FRONTEND ===
    contactInfo = serializers.SerializerMethodField()
    vehicleInfo = serializers.SerializerMethodField()
    allocationProfile = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()
    fuelUsage = serializers.SerializerMethodField()
    vehicles = serializers.SerializerMethodField()
    
    # === NESTED RELATIONSHIP DETAILS ===
    user_details = SimpleUserSerializer(source='user', read_only=True)
    category_details = BeneficiaryCategorySerializer(source='category', read_only=True)
    constituency_details = ConstituencySerializer(source='constituency', read_only=True)
    vehicle_category_details = VehicleCategorySerializer(source='vehicle_category', read_only=True)
    
    # === COMPUTED FIELDS FOR ENHANCED DATA ===
    fullName = serializers.SerializerMethodField()
    displayTitle = serializers.SerializerMethodField()
    allocationSummary = serializers.SerializerMethodField()
    usageStatistics = serializers.SerializerMethodField()
    statusInfo = serializers.SerializerMethodField()
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            # === FRONTEND INTERFACE FIELDS ===
            # BeneficiaryManagement.tsx interface (19 fields)
            'id', 'parliamentaryId', 'name', 'title', 'category', 'constituency',
            'party', 'phoneNumber', 'email', 'address', 'dateOfBirth', 'nationalId',
            'profilePhoto', 'status', 'entitlements', 'fuelUsage', 'vehicles',
            'lastActivity', 'createdAt',
            
            # === STRUCTURED DATA OBJECTS ===
            # BeneficiaryAccountDashboard.tsx interface (12 structured fields)
            'contactInfo', 'vehicleInfo', 'allocationProfile',
            
            # === NESTED RELATIONSHIP DATA ===
            'user_details', 'category_details', 'constituency_details', 'vehicle_category_details',
            
            # === COMPUTED ENHANCEMENT FIELDS ===
            'fullName', 'displayTitle', 'allocationSummary', 'usageStatistics', 'statusInfo',
            
            # === ALL MODEL FIELDS FOR ADMIN/BACKEND ===
            'user', 'parliamentary_id', 'employee_id', 'position', 'department',
            'party_affiliation', 'date_of_birth', 'office_location', 'office_phone',
            'mobile_phone', 'official_email', 'personal_email', 'vehicle_make',
            'vehicle_model', 'vehicle_year', 'engine_size', 'vehicle_registration',
            'fuel_type', 'base_allocation', 'category_multiplier', 'engine_multiplier',
            'monthly_entitlement_litres', 'max_per_transaction', 'current_balance',
            'used_this_month', 'last_month_usage', 'year_to_date_usage',
            'total_usage_all_time', 'last_allocation_date', 'join_date', 'last_login',
            'is_active_beneficiary', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'join_date']
    
    # === COMPUTED FIELD METHODS ===
    
    def get_name(self, obj):
        """Get full name for frontend 'name' field"""
        return obj.get_full_name()
    
    def get_title(self, obj):
        """Get position title for frontend 'title' field"""
        return obj.position
    
    def get_dateOfBirth(self, obj):
        """Get formatted date of birth"""
        return obj.date_of_birth.isoformat() if obj.date_of_birth else None
    
    def get_profilePhoto(self, obj):
        """Get profile photo from user account"""
        return obj.user.profile_picture if obj.user.profile_picture else None
    
    def get_lastActivity(self, obj):
        """Get last activity timestamp"""
        return obj.user.last_activity.isoformat() if obj.user.last_activity else None
    
    def get_createdAt(self, obj):
        """Get creation timestamp"""
        return obj.join_date.isoformat()
    
    def get_fullName(self, obj):
        """Enhanced full name with title"""
        return f"{obj.position} {obj.get_full_name()}".strip()
    
    def get_displayTitle(self, obj):
        """Enhanced display title with category"""
        category_name = obj.category.name if obj.category else 'Unknown'
        return f"{obj.position} ({category_name})"
    
    # === STRUCTURED DATA OBJECT METHODS ===
    
    def get_contactInfo(self, obj):
        """Get contact information as structured object for frontend"""
        return obj.get_contact_info()
    
    def get_vehicleInfo(self, obj):
        """Get vehicle information as structured object for frontend"""
        return obj.get_vehicle_info()
    
    def get_allocationProfile(self, obj):
        """Get allocation profile as structured object for frontend"""
        return obj.get_allocation_profile()
    
    def get_entitlements(self, obj):
        """Get entitlements as structured object for frontend"""
        return obj.get_entitlements()
    
    def get_fuelUsage(self, obj):
        """Get fuel usage as structured object for frontend"""
        return obj.get_fuel_usage()
    
    def get_vehicles(self, obj):
        """Get vehicles array for frontend"""
        return obj.get_vehicles()
    
    def get_allocationSummary(self, obj):
        """Get comprehensive allocation summary"""
        final_allocation = obj.calculate_final_allocation()
        return {
            'baseAllocation': float(obj.base_allocation),
            'categoryMultiplier': float(obj.category_multiplier),
            'engineMultiplier': float(obj.engine_multiplier),
            'finalAllocation': float(final_allocation),
            'currentBalance': float(obj.current_balance),
            'utilizationRate': float(obj.used_this_month / final_allocation * 100) if final_allocation > 0 else 0,
            'remainingAllocation': float(final_allocation - obj.used_this_month),
            'lastUpdated': obj.last_allocation_date.isoformat() if obj.last_allocation_date else None
        }
    
    def get_usageStatistics(self, obj):
        """Get comprehensive usage statistics"""
        return {
            'currentMonth': {
                'used': float(obj.used_this_month),
                'allocation': float(obj.monthly_entitlement_litres),
                'remaining': float(obj.monthly_entitlement_litres - obj.used_this_month),
                'percentage': float(obj.used_this_month / obj.monthly_entitlement_litres * 100) if obj.monthly_entitlement_litres > 0 else 0
            },
            'lastMonth': {
                'used': float(obj.last_month_usage)
            },
            'yearToDate': {
                'used': float(obj.year_to_date_usage)
            },
            'allTime': {
                'totalUsed': float(obj.total_usage_all_time)
            },
            'averageMonthlyUsage': float(obj.year_to_date_usage / 12) if obj.year_to_date_usage > 0 else 0
        }
    
    def get_statusInfo(self, obj):
        """Get comprehensive status information"""
        return {
            'status': obj.status,
            'isActive': obj.is_active_beneficiary,
            'statusDisplay': obj.get_status_display(),
            'canAllocate': obj.status == 'ACTIVE' and obj.is_active_beneficiary,
            'lastLogin': obj.last_login.isoformat() if obj.last_login else None,
            'accountAge': (obj.created.date() - obj.join_date).days if obj.created else 0,
            'profileCompleteness': self._calculate_profile_completeness(obj)
        }
    
    def _calculate_profile_completeness(self, obj):
        """Calculate profile completeness percentage"""
        total_fields = 15  # Key fields for completeness
        completed_fields = 0
        
        # Check required fields
        if obj.parliamentary_id: completed_fields += 1
        if obj.position: completed_fields += 1
        if obj.national_id: completed_fields += 1
        if obj.mobile_phone: completed_fields += 1
        if obj.official_email: completed_fields += 1
        if obj.full_address: completed_fields += 1
        if obj.vehicle_make: completed_fields += 1
        if obj.vehicle_model: completed_fields += 1
        if obj.vehicle_year: completed_fields += 1
        if obj.vehicle_registration: completed_fields += 1
        if obj.date_of_birth: completed_fields += 1
        if obj.department: completed_fields += 1
        if obj.office_location: completed_fields += 1
        if obj.user.profile_picture: completed_fields += 1
        if obj.category: completed_fields += 1
        
        return round((completed_fields / total_fields) * 100, 1)


class SimpleBeneficiarySerializer(serializers.ModelSerializer):
    """
    Simplified beneficiary serializer for lists and dropdowns
    """
    name = serializers.SerializerMethodField()
    title = serializers.CharField(source='position', read_only=True)
    categoryName = serializers.CharField(source='category.name', read_only=True)
    constituencyName = serializers.CharField(source='constituency.name', read_only=True)
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            'id', 'parliamentary_id', 'name', 'title', 'categoryName', 
            'constituencyName', 'status', 'is_active_beneficiary'
        ]
    
    def get_name(self, obj):
        return obj.get_full_name()


class BeneficiaryCreationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new beneficiary profiles with validation
    """
    # User fields for creation
    username = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    user_email = serializers.EmailField(write_only=True)
    user_phone = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            # User creation fields
            'username', 'first_name', 'last_name', 'user_email', 'user_phone',
            
            # Beneficiary profile fields
            'parliamentary_id', 'category', 'constituency', 'vehicle_category',
            'position', 'department', 'party_affiliation', 'date_of_birth',
            'national_id', 'full_address', 'office_location', 'office_phone',
            'mobile_phone', 'official_email', 'personal_email',
            
            # Vehicle information
            'vehicle_make', 'vehicle_model', 'vehicle_year', 'engine_size',
            'vehicle_registration', 'fuel_type',
            
            # Allocation settings
            'base_allocation', 'max_per_transaction', 'status'
        ]
    
    def validate_parliamentary_id(self, value):
        """Validate parliamentary ID uniqueness"""
        if HarmonizedBeneficiaryProfile.objects.filter(parliamentary_id=value).exists():
            raise serializers.ValidationError("Parliamentary ID already exists")
        return value
    
    def validate_national_id(self, value):
        """Validate national ID uniqueness"""
        if HarmonizedBeneficiaryProfile.objects.filter(national_id=value).exists():
            raise serializers.ValidationError("National ID already exists")
        return value
    
    def validate_vehicle_registration(self, value):
        """Validate vehicle registration uniqueness"""
        if HarmonizedBeneficiaryProfile.objects.filter(vehicle_registration=value).exists():
            raise serializers.ValidationError("Vehicle registration already exists")
        return value
    
    def create(self, validated_data):
        """Create user and beneficiary profile together"""
        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('user_email'),
            'phone': validated_data.pop('user_phone', ''),
            'role': 'BENEFICIARY'
        }
        
        # Create user
        user = User.objects.create_user(**user_data)
        
        # Create beneficiary profile
        validated_data['user'] = user
        beneficiary_profile = HarmonizedBeneficiaryProfile.objects.create(**validated_data)
        
        return beneficiary_profile


class BeneficiaryUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating beneficiary profiles
    """
    # Allow updating some user fields
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    user_phone = serializers.CharField(source='user.phone', required=False)
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            # User update fields
            'first_name', 'last_name', 'user_phone',
            
            # Beneficiary profile update fields
            'category', 'constituency', 'vehicle_category', 'position', 'department',
            'party_affiliation', 'date_of_birth', 'full_address', 'office_location',
            'office_phone', 'mobile_phone', 'official_email', 'personal_email',
            
            # Vehicle information
            'vehicle_make', 'vehicle_model', 'vehicle_year', 'engine_size',
            'vehicle_registration', 'fuel_type',
            
            # Allocation settings
            'base_allocation', 'max_per_transaction', 'status', 'is_active_beneficiary'
        ]
    
    def update(self, instance, validated_data):
        """Update both user and beneficiary profile"""
        # Handle user fields
        user_data = {}
        if 'user' in validated_data:
            user_data = validated_data.pop('user')
        
        # Update user if user data provided
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        
        # Update beneficiary profile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
