# fuel/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.db import models
from django.utils import timezone
from decimal import Decimal
# from rest_framework.exceptions import AuthenticationFailed # Not used in provided code
# from typing import List, Dict, Optional, Union # Not used in provided code
from .models import (
    User, SubCenter, Box, Book, Coupon,
    FuelData, FuelTransaction, CouponDistribution, SubCenterOfficer,
    BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
    BeneficiaryProfile, AuditLog, BookDispatch, CouponAllocation, SystemAlert, FuelEntitlement,
    PoolVehicle, Driver, VehicleAssignment, BookPage, SessionAttendance,
    FuelRequirementConfiguration
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# import re # Not used in provided code
# from drf_spectacular.utils import extend_schema_field, extend_schema, OpenApiTypes, OpenApiResponse # Not used in provided code

User = get_user_model()
# Simple Program Serializer for nesting in CouponDistribution
# class SimpleProgramSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Program
#         fields = ('id', 'title', 'program_type', 'scheduled_date')
# --- Simple Serializers for Nesting ---
# These are used to avoid serializing full objects when nesting related data

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role') # Include basic user info


class SimpleSubCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCenter
        fields = ('id', 'code', 'name') # Include basic subcenter info

class SimpleBoxSerializer(serializers.ModelSerializer):
     class Meta:
         model = Box
         fields = ('id', 'box_code', 'total_litres') # Include basic box info

class SimpleBookSerializer(serializers.ModelSerializer):
     # Include box_code from the related box for clarity
     box_code = serializers.ReadOnlyField(source='box.box_code')
     class Meta:
        model = Book
        fields = ('id', 'book_number', 'box', 'box_code') # Link to box and show code


class BookDispatchSerializer(serializers.ModelSerializer):
    from_center = SimpleSubCenterSerializer(read_only=True)
    to_center = SimpleSubCenterSerializer(read_only=True)
    dispatched_by = SimpleUserSerializer(read_only=True)
    received_by = SimpleUserSerializer(read_only=True)
    books = SimpleBookSerializer(many=True, read_only=True)
    total_books = serializers.ReadOnlyField()
    total_value_usd = serializers.ReadOnlyField()
    
    class Meta:
        model = BookDispatch
        fields = '__all__'


class CouponAllocationSerializer(serializers.ModelSerializer):
    sub_center = SimpleSubCenterSerializer(read_only=True)
    beneficiary = SimpleUserSerializer(read_only=True)
    allocated_by = SimpleUserSerializer(read_only=True)
    total_coupons = serializers.ReadOnlyField()
    total_litres = serializers.ReadOnlyField()
    total_value_usd = serializers.ReadOnlyField()
    
    class Meta:
        model = CouponAllocation
        fields = '__all__'



# --- Core Model Serializers (Updated) ---

class SubCenterSerializer(serializers.ModelSerializer):
    # Use SimpleUserSerializer for the managed_by field
    managed_by_details = SimpleUserSerializer(source='managed_by', read_only=True)
    # Allow setting managed_by by user id
    managed_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            models.Q(is_approved=True, role__in=["MAIN_CENTER", "SUB_CENTER"]) |
            models.Q(is_superuser=True)
        ),
        required=False,
        allow_null=True
    )
    # total_coupons is a property on the model, accessed directly from the object instance if needed, no need to define here unless custom logic required.

    class Meta:
        model = SubCenter
        # Added 'created', 'modified' from TimeStampedModel
        fields = ['id', 'code', 'name', 'location', 'managed_by', 'managed_by_details', 'is_active', 'created', 'modified']
        read_only_fields = ['id', 'created', 'modified'] # Set created/modified as readonly


class UserSerializer(serializers.ModelSerializer):
    # Use SimpleSubCenterSerializer for the sub_center field
    sub_center_details = SimpleSubCenterSerializer(source='sub_center', read_only=True, allow_null=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    approved_by_details = SimpleUserSerializer(source='approved_by', read_only=True, allow_null=True)
    approval_status = serializers.CharField(read_only=True)

    class Meta:
        model = User
        # Added approval fields and existing fields
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 
            'sub_center', 'sub_center_details', 'phone', 'last_activity', 'date_joined', 
            'is_approved', 'approved_by', 'approved_by_details', 
            'approved_at', 'registration_justification', 'rejection_reason', 'approval_status'
        ]
        # Keep fields managed by the system or other serializers as read_only
        read_only_fields = [
            'id', 'last_activity', 'role_display', 'date_joined', 
            'sub_center_details', 'approved_by_details', 'approval_status', 'is_approved', 
            'approved_by', 'approved_at'
        ]

# Added SubCenterOfficer Serializer
class SubCenterOfficerSerializer(serializers.ModelSerializer):
    user_details = SimpleUserSerializer(source='user', read_only=True)
    sub_center_details = SimpleSubCenterSerializer(source='sub_center', read_only=True)

    class Meta:
        model = SubCenterOfficer
        fields = ('id', 'user', 'user_details', 'sub_center', 'sub_center_details', 'is_manager', 'created', 'modified')
        read_only_fields = ('created', 'modified')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.CharField(max_length=20, required=True)
    sub_center = serializers.PrimaryKeyRelatedField(queryset=SubCenter.objects.all(), required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    registration_justification = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'password', 'password2', 'role', 'sub_center', 'registration_justification']
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
            'sub_center': {'required': False, 'allow_null': True},
            'registration_justification': {'required': False, 'allow_blank': True},
        }

    def validate(self, data):
        # ✅ Match password
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # ✅ Email uniqueness (only if email is provided and not blank)
        if data.get('email'): # Check if email key exists and value is not empty/blank
             if User.objects.filter(email=data['email']).exists():
                 raise serializers.ValidationError({"email": "Email is already in use."})


        # ✅ Valid role check
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if data['role'] not in valid_roles:
             raise serializers.ValidationError({
                 "role": f"Invalid role '{data['role']}'. Must be one of: {', '.join(valid_roles)}",
             })

        # Optional: Add validation for sub_center based on role if needed
        if data.get('role') == 'SUB_CENTER' and data.get('sub_center') is None:
             # Example: Require sub_center for SUB_CENTER role on registration
             # raise serializers.ValidationError({"sub_center": "Sub Center role requires a sub-center assignment."})
             pass # Or handle this logic in the view or admin

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['user_id'] = user.id # Added user_id
        if user.sub_center: # Added sub_center_id if user has one
             token['sub_center_id'] = user.sub_center.id

        return token

class BoxSerializer(serializers.ModelSerializer):
    # Use SimpleSerializers for related fields
    assigned_to_details = SimpleSubCenterSerializer(source='assigned_to', read_only=True, allow_null=True)
    received_by_details = SimpleUserSerializer(source='received_by', read_only=True, allow_null=True)

    class Meta:
        model = Box
        # Added 'created', 'modified' from TimeStampedModel
        fields = ['id', 'box_code', 'first_coupon_number', 'last_coupon_number', 'total_litres', 'received_at', 'assigned_to', 'assigned_to_details', 'received_by', 'received_by_details', 'created', 'modified']
        read_only_fields = ['id', 'received_at', 'box_code', 'total_litres', 'assigned_to_details', 'received_by_details', 'created', 'modified'] # Make total_litres readonly if calculated, added timestamps

class BookSerializer(serializers.ModelSerializer):
    # Use SimpleBoxSerializer for the box field
    box_details = SimpleBoxSerializer(source='box', read_only=True, allow_null=True)
    initial_coupon_count = serializers.IntegerField(read_only=True) # Correct field name, readonly

    class Meta:
        model = Book
        # Added 'created', 'modified' from TimeStampedModel
        fields = ['id', 'box', 'box_details', 'book_number', 'first_coupon_number', 'last_coupon_number', 'is_assigned', 'initial_coupon_count', 'created', 'modified'] # Corrected total_coupons to initial_coupon_count
        read_only_fields = ['id', 'initial_coupon_count', 'created', 'modified'] # Make initial_coupon_count and timestamps readonly


# Coupon Serializer (Updated)
class CouponSerializer(serializers.ModelSerializer):
    # Use SimpleSerializers for related fields
    book_details = SimpleBookSerializer(source='book', read_only=True, allow_null=True)
    allocated_to_details = SimpleUserSerializer(source='allocated_to', read_only=True, allow_null=True)

    # New fields added to the model
    expiry_date = serializers.DateField(read_only=True) # Often readonly if auto-calculated or set on creation, depends on workflow
    transaction_location = serializers.CharField(allow_null=True, required=False) # Can be written when marking used
    status = serializers.CharField(read_only=True) # Status is managed by logic/actions, not direct edit

    class Meta:
        model = Coupon
        # Specify all fields explicitly for clarity
        fields = (
            'id', 'book', 'book_details', 'coupon_number', 'litres', 'status',
            'allocated_to', 'allocated_to_details', 'allocated_date', 'used_date',
            'expiry_date', 'transaction_location', 'created', 'modified'
        )
        # Make status, dates/timestamps readonly, allow transaction_location to be written
        read_only_fields = ('status', 'allocated_date', 'used_date', 'expiry_date', 'created', 'modified', 'book_details', 'allocated_to_details')


# TODO: Implement Program model and uncomment ProgramSerializer
# class ProgramSerializer(serializers.ModelSerializer):
#     # Use SimpleSerializers for related fields
#     organizer_details = SimpleUserSerializer(source='organizer', read_only=True, allow_null=True)
#     sub_center_details = SimpleSubCenterSerializer(source='sub_center', read_only=True, allow_null=True)

#     class Meta:
#         model = Program
#         # Added 'created', 'modified' from TimeStampedModel
#         fields = ['id', 'title', 'program_type', 'scheduled_date', 'end_date', 'description', 'location', 'organizer', 'organizer_details', 'sub_center', 'sub_center_details', 'is_active', 'created', 'modified']
#         read_only_fields = ['id', 'created', 'modified', 'organizer_details', 'sub_center_details'] # Make related details readonly

# class AttendanceSerializer(serializers.ModelSerializer):
#     # Use SimpleSerializers for related fields
#     user_details = SimpleUserSerializer(source='user', read_only=True, allow_null=True)
#     # program_details = ProgramSerializer(source='program', read_only=True, allow_null=True) # TODO: Uncomment when Program model exists

#     class Meta:
#         model = Attendance
#         # Added 'created', 'modified' from TimeStampedModel
#         fields = ['id', 'user', 'user_details', 'program', 'attended', 'signed_at', 'notes', 'created', 'modified']
#         read_only_fields = ['id', 'signed_at', 'created', 'modified', 'user_details']

class SimpleCouponSerializer(serializers.ModelSerializer):
     class Meta:
        model = Coupon
        fields = ('id', 'coupon_number', 'litres', 'status', 'expiry_date') # Added expiry_date
# Coupon Distribution Serializer (Added)
class CouponDistributionSerializer(serializers.ModelSerializer):
    coupon_details = SimpleCouponSerializer(source='coupon', read_only=True) # Coupon is OneToOneField (PK), no need for PrimaryKeyRelatedField
    beneficiary_details = SimpleUserSerializer(source='beneficiary', read_only=True)
    # program_details = SimpleProgramSerializer(source='program', read_only=True, allow_null=True) # Simple Program for nesting - TODO: Uncomment when Program model exists
    distributed_by_details = SimpleUserSerializer(source='distributed_by', read_only=True, allow_null=True)

    class Meta:
        model = CouponDistribution
        # coupon is a OneToOneField and PK, so it's automatically included.
        fields = ('coupon', 'coupon_details', 'beneficiary', 'beneficiary_details', 'program', 'distributed_by', 'distributed_by_details', 'distribution_date', 'notes', 'created', 'modified')
        read_only_fields = ('distribution_date', 'created', 'modified', 'coupon_details', 'beneficiary_details', 'distributed_by_details')


# Fuel Transaction Serializer (Added)
class FuelTransactionSerializer(serializers.ModelSerializer):
    # Use SimpleSerializers for related fields
    beneficiary_details = SimpleUserSerializer(source='beneficiary', read_only=True, allow_null=True)
    coupon_details = SimpleCouponSerializer(source='coupon', read_only=True, allow_null=True)
    recorded_by_details = SimpleUserSerializer(source='recorded_by', read_only=True, allow_null=True)

    class Meta:
        model = FuelTransaction
        # Added 'created', 'modified' from TimeStampedModel
        fields = (
            'id', 'timestamp', 'beneficiary', 'beneficiary_details', 'coupon',
            'coupon_details', 'litres_consumed', 'transaction_location', 'recorded_by',
            'recorded_by_details', 'notes', 'created', 'modified'
        )
        read_only_fields = ('created', 'modified', 'timestamp', 'beneficiary_details', 'coupon_details', 'recorded_by_details') # Timestamp is default=timezone.now



class BulkCouponAllocationSerializer(serializers.Serializer):
    coupon_numbers = serializers.ListField(child=serializers.CharField())
    beneficiary_id = serializers.IntegerField()
    program_id = serializers.IntegerField(required=False, allow_null=True) # Added program_id
    # distribution_location = serializers.CharField(required=False, allow_null=True) # Optional field

# Removed the old StatisticsSerializer as the new StatisticsView returns a different structure.

class FuelStatsSerializer(serializers.ModelSerializer):
    # Added 'created', 'modified' from TimeStampedModel
    class Meta:
        model = FuelData
        fields = ['id', 'timestamp', 'petrol_price', 'diesel_price', 'previous_petrol_price', 'previous_diesel_price', 'total_fuel_allocated', 'total_fuel_used', 'available_fuel', 'last_refuel_date', 'daily_usage_trend', 'daily_usage_change', 'created', 'modified']
        read_only_fields = ['id', 'timestamp', 'created', 'modified']

# New Parliament-specific serializers
class BeneficiaryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BeneficiaryCategory
        fields = '__all__'
        read_only_fields = ('created', 'modified')


class ConstituencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Constituency
        fields = '__all__'
        read_only_fields = ('created', 'modified')


class VehicleCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleCategory
        fields = '__all__'
        read_only_fields = ('created', 'modified')


class ParliamentSessionSerializer(serializers.ModelSerializer):
    attendance_count = serializers.SerializerMethodField()
    total_fuel_allocated = serializers.SerializerMethodField()
    organizer_details = SimpleUserSerializer(source='organizer', read_only=True)
    managing_subcenter_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ParliamentSession
        fields = [
            'id', 'title', 'session_type', 'start_date', 'end_date', 'description',
            'is_active', 'organizer', 'organizer_details', 
            'managing_subcenter', 'managing_subcenter_details',
            'attendance_count', 'total_fuel_allocated',
            'created', 'modified'
        ]
        read_only_fields = ('created', 'modified', 'attendance_count', 'total_fuel_allocated')
    
    def get_attendance_count(self, obj):
        # Get attendance count from programs related to this session
        # Since there's no direct relationship, we'll check fuel entitlements for this session
        return obj.fuel_entitlements.filter(status__in=['ALLOCATED', 'PARTIALLY_ALLOCATED']).count()
    
    def get_total_fuel_allocated(self, obj):
        # Get total fuel allocated from entitlements for this session
        return obj.fuel_entitlements.filter(
            status__in=['ALLOCATED', 'PARTIALLY_ALLOCATED']
        ).aggregate(
            total=models.Sum('litres_allocated')
        )['total'] or 0
    
    def get_managing_subcenter_details(self, obj):
        if obj.managing_subcenter:
            return {
                'id': obj.managing_subcenter.id,
                'name': obj.managing_subcenter.name,
                'code': obj.managing_subcenter.code
            }
        return None


class BeneficiaryProfileSerializer(serializers.ModelSerializer):
    user_details = SimpleUserSerializer(source='user', read_only=True)
    category_details = BeneficiaryCategorySerializer(source='category', read_only=True)
    constituency_details = ConstituencySerializer(source='constituency', read_only=True)
    vehicle_category_details = VehicleCategorySerializer(source='vehicle_category', read_only=True)
    total_allocated_this_month = serializers.SerializerMethodField()
    pending_entitlements = serializers.SerializerMethodField()
    
    class Meta:
        model = BeneficiaryProfile
        fields = '__all__'
        read_only_fields = ('created', 'modified')
    
    def get_total_allocated_this_month(self, obj):
        from datetime import datetime
        current_month = datetime.now().replace(day=1)
        return obj.user.allocated_coupons.filter(
            allocated_date__gte=current_month,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=models.Sum('litres'))['total'] or 0
    
    def get_pending_entitlements(self, obj):
        return obj.user.fuel_entitlements.filter(
            status__in=['PENDING', 'APPROVED'],
            period_end__gte=timezone.now().date()
        ).count()


class SessionAttendanceSerializer(serializers.ModelSerializer):
    beneficiary_details = SimpleUserSerializer(source='beneficiary', read_only=True)
    session_details = serializers.SerializerMethodField()
    recorded_by_details = SimpleUserSerializer(source='recorded_by', read_only=True)
    
    class Meta:
        model = SessionAttendance
        fields = [
            'id', 'session', 'session_details', 'beneficiary', 'beneficiary_details',
            'attended', 'check_in_time', 'check_out_time', 'fuel_allocated',
            'allocation_date', 'recorded_by', 'recorded_by_details', 'notes',
            'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'recorded_by']
    
    def get_session_details(self, obj):
        if obj.session:
            return {
                'id': obj.session.id,
                'title': obj.session.title,
                'start_date': obj.session.start_date,
                'end_date': obj.session.end_date,
                'status': obj.session.status
            }
        return None


# ========================= MISSING SERIALIZERS =========================

class FuelEntitlementSerializer(serializers.ModelSerializer):
    """Serializer for FuelEntitlement model"""
    beneficiary_details = SimpleUserSerializer(source='beneficiary', read_only=True)
    session_details = serializers.SerializerMethodField()
    created_by_details = SimpleUserSerializer(source='created_by', read_only=True)
    approved_by_details = SimpleUserSerializer(source='approved_by', read_only=True)
    
    class Meta:
        model = FuelEntitlement
        fields = [
            'id', 'beneficiary', 'beneficiary_details', 'entitlement_type',
            'session', 'session_details', 'litres_entitled', 'litres_allocated',
            'status', 'period_start', 'period_end', 'created_by', 'created_by_details',
            'approved_by', 'approved_by_details', 'approved_at', 'notes',
            'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'created_by', 'approved_by', 'approved_at']
    
    def get_session_details(self, obj):
        if obj.session:
            return {
                'id': obj.session.id,
                'title': obj.session.title,
                'start_date': obj.session.start_date,
                'end_date': obj.session.end_date
            }
        return None


class SystemAlertSerializer(serializers.ModelSerializer):
    """Serializer for SystemAlert model"""
    created_by_details = SimpleUserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = SystemAlert
        fields = [
            'id', 'title', 'message', 'alert_type', 'priority', 'status',
            'target_roles', 'expires_at', 'created_by', 'created_by_details',
            'is_dismissible', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'created_by']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model"""
    user_details = SimpleUserSerializer(source='user', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_details', 'action', 'model_name', 'object_id',
            'object_repr', 'changes', 'ip_address', 'user_agent',
            'session_key', 'created'
        ]
        read_only_fields = ['id', 'created']


class PoolVehicleSerializer(serializers.ModelSerializer):
    """Serializer for PoolVehicle model"""
    sub_center_details = SimpleSubCenterSerializer(source='sub_center', read_only=True)
    current_driver_details = serializers.SerializerMethodField()
    
    class Meta:
        model = PoolVehicle
        fields = [
            'id', 'vehicle_number', 'make', 'model', 'year', 'engine_capacity',
            'fuel_type', 'vehicle_category', 'sub_center', 'sub_center_details',
            'status', 'mileage', 'last_service_date', 'next_service_date',
            'insurance_expiry', 'license_expiry', 'current_driver_details',
            'notes', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_current_driver_details(self, obj):
        current_assignment = obj.assignments.filter(
            status='ACTIVE',
            end_date__isnull=True
        ).first()
        if current_assignment and current_assignment.driver:
            return {
                'id': current_assignment.driver.id,
                'name': current_assignment.driver.full_name,
                'license_number': current_assignment.driver.license_number
            }
        return None


class DriverSerializer(serializers.ModelSerializer):
    """Serializer for Driver model"""
    current_vehicle_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = [
            'id', 'full_name', 'license_number', 'license_class', 'license_expiry',
            'phone_number', 'email', 'status', 'employment_status',
            'hire_date', 'current_vehicle_details', 'notes',
            'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    def get_current_vehicle_details(self, obj):
        current_assignment = obj.assignments.filter(
            status='ACTIVE',
            end_date__isnull=True
        ).first()
        if current_assignment and current_assignment.vehicle:
            return {
                'id': current_assignment.vehicle.id,
                'vehicle_number': current_assignment.vehicle.vehicle_number,
                'make': current_assignment.vehicle.make,
                'model': current_assignment.vehicle.model
            }
        return None


class VehicleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for VehicleAssignment model"""
    vehicle_details = serializers.SerializerMethodField()
    driver_details = serializers.SerializerMethodField()
    assigned_by_details = SimpleUserSerializer(source='assigned_by', read_only=True)
    
    class Meta:
        model = VehicleAssignment
        fields = [
            'id', 'vehicle', 'vehicle_details', 'driver', 'driver_details',
            'start_date', 'end_date', 'status', 'assigned_by', 'assigned_by_details',
            'assignment_reason', 'notes', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'assigned_by']
    
    def get_vehicle_details(self, obj):
        if obj.vehicle:
            return {
                'id': obj.vehicle.id,
                'vehicle_number': obj.vehicle.vehicle_number,
                'make': obj.vehicle.make,
                'model': obj.vehicle.model,
                'fuel_type': obj.vehicle.fuel_type
            }
        return None
    
    def get_driver_details(self, obj):
        if obj.driver:
            return {
                'id': obj.driver.id,
                'full_name': obj.driver.full_name,
                'license_number': obj.driver.license_number,
                'license_class': obj.driver.license_class
            }
        return None


class BulkSessionAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk session attendance operations"""
    session_id = serializers.IntegerField()
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_session_id(self, value):
        try:
            session = ParliamentSession.objects.get(id=value)
            return value
        except ParliamentSession.DoesNotExist:
            raise serializers.ValidationError("Session not found.")
    
    def validate_attendances(self, value):
        if not value:
            raise serializers.ValidationError("At least one attendance record is required.")
        
        for attendance_data in value:
            if 'beneficiary_id' not in attendance_data:
                raise serializers.ValidationError("Each attendance record must have a beneficiary_id.")
            
            try:
                User.objects.get(id=attendance_data['beneficiary_id'], role='BENEFICIARY')
            except User.DoesNotExist:
                raise serializers.ValidationError(f"Beneficiary with ID {attendance_data['beneficiary_id']} not found.")
        
        return value
    
    def save(self):
        session = ParliamentSession.objects.get(id=self.validated_data['session_id'])
        attendances_data = self.validated_data['attendances']
        created_attendances = []
        
        for attendance_data in attendances_data:
            beneficiary = User.objects.get(id=attendance_data['beneficiary_id'])
            attended = attendance_data.get('attended', True)
            
            attendance, created = SessionAttendance.objects.get_or_create(
                beneficiary=beneficiary,
                session=session,
                defaults={
                    'attended': attended,
                    'check_in_time': timezone.now() if attended else None,
                    'recorded_by': self.context['request'].user
                }
            )
            
            if not created:
                attendance.attended = attended
                attendance.check_in_time = timezone.now() if attended else None
                attendance.save()
            
            created_attendances.append(attendance)
        
        return created_attendances


# Box Receipt Serializer for enhanced box reception
class BoxReceiptSerializer(serializers.ModelSerializer):
    """Serializer for receiving boxes with validation"""
    
    class Meta:
        model = Box
        fields = [
            'box_code', 'first_coupon_number', 'last_coupon_number',
            'number_of_books', 'coupons_per_book', 'litres_per_coupon',
            'assigned_to', 'received_by', 'received_date', 'notes'
        ]
        read_only_fields = ['received_by', 'received_date']
    
    def validate(self, data):
        # Validate coupon sequence
        first_coupon = data.get('first_coupon_number')
        last_coupon = data.get('last_coupon_number')
        num_books = data.get('number_of_books')
        coupons_per_book = data.get('coupons_per_book')
        
        if first_coupon and last_coupon:
            expected_total = (last_coupon - first_coupon + 1)
            calculated_total = num_books * coupons_per_book
            
            if expected_total != calculated_total:
                raise serializers.ValidationError(
                    f"Coupon range ({first_coupon}-{last_coupon}) doesn't match "
                    f"calculated total ({num_books} books × {coupons_per_book} coupons = {calculated_total})"
                )
        
        return data


class FuelRequirementConfigurationSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    required_coupons = serializers.ReadOnlyField()  # Auto-calculated field
    
    class Meta:
        model = FuelRequirementConfiguration
        fields = [
            'id', 'fuel_type', 'period', 'required_litres', 'required_coupons',
            'litres_per_coupon', 'is_active', 'effective_from', 'notes',
            'created_by', 'created_by_username', 'created', 'modified'
        ]
        read_only_fields = ['created_by', 'created', 'modified']
    
    def validate(self, data):
        # Ensure only one active configuration per fuel type and period
        fuel_type = data.get('fuel_type')
        period = data.get('period')
        is_active = data.get('is_active', True)
        
        if is_active:
            existing = FuelRequirementConfiguration.objects.filter(
                fuel_type=fuel_type,
                period=period,
                is_active=True
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError(
                    f"An active {period.lower()} configuration for {fuel_type} already exists."
                )
        
        return data