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
    BeneficiaryProfile, AuditLog, BookDispatch, CouponAllocation, CouponHandover, SystemAlert, FuelEntitlement,
    PoolVehicle, Driver, VehicleAssignment, BookPage, SessionAttendance,
    FuelRequirementConfiguration, Program, HarmonizedBeneficiaryProfile,
    # Dynamic Fuel Allocation System Models
    FuelAllocationRule, FuelPrice, DynamicAllocation
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
    """Enhanced serializer for book dispatch with intelligent coupon generation support"""
    from_center = SimpleSubCenterSerializer(read_only=True)
    to_center = SimpleSubCenterSerializer(read_only=True)
    dispatched_by = SimpleUserSerializer(read_only=True)
    received_by = SimpleUserSerializer(read_only=True)
    books = SimpleBookSerializer(many=True, read_only=True)
    total_books = serializers.ReadOnlyField()
    total_value_usd = serializers.ReadOnlyField()
    
    # Enhanced fields for intelligent dispatch
    dispatch_id = serializers.SerializerMethodField()
    subcenter_name = serializers.CharField(source='to_center.name', read_only=True)
    dispatched_date = serializers.DateField(source='dispatch_date', read_only=True)
    dispatched_time = serializers.TimeField(source='dispatch_date', read_only=True)
    
    # Generation mode and configuration
    generation_mode = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Transport and receipt details
    transport_method = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vehicle_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    driver_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    driver_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    courier_service = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tracking_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Receipt confirmation
    receiver_signature = serializers.CharField(required=False, allow_blank=True)
    received_date = serializers.DateField(source='received_date', required=False, allow_null=True)
    received_time = serializers.TimeField(source='received_date', required=False, allow_null=True)
    
    # Documentation
    delivery_note = serializers.CharField(max_length=200, required=False, allow_blank=True)
    dispatch_notes = serializers.CharField(source='notes', required=False, allow_blank=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    
    # Verification
    verification_checks = serializers.JSONField(required=False, default=list)
    verification_notes = serializers.CharField(required=False, allow_blank=True)
    verified_by = serializers.CharField(max_length=100, required=False, allow_blank=True)
    verified_at = serializers.DateTimeField(required=False, allow_null=True)
    
    # Calculated fields
    total_coupons = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta:
        model = BookDispatch
        fields = [
            'id', 'dispatch_id', 'from_center', 'to_center', 'subcenter_name',
            'dispatched_by', 'received_by', 'books', 'total_books',
            'dispatch_date', 'dispatched_date', 'dispatched_time',
            'received_date', 'received_time', 'status', 'notes',
            
            # Enhanced fields
            'generation_mode', 'transport_method', 'vehicle_number',
            'driver_name', 'driver_phone', 'courier_service', 'tracking_number',
            'receiver_signature', 'delivery_note', 'dispatch_notes',
            'special_instructions', 'verification_checks', 'verification_notes',
            'verified_by', 'verified_at',
            
            # Calculated fields
            'total_coupons', 'total_value', 'total_value_usd',
            'first_serial', 'last_serial'
        ]
        read_only_fields = [
            'id', 'dispatch_id', 'dispatched_date', 'dispatched_time',
            'total_books', 'total_coupons', 'total_value', 'total_value_usd'
        ]
    
    def get_dispatch_id(self, obj):
        """Generate dispatch ID"""
        return f"DISP-{obj.id}" if obj.id else f"DISP-NEW"
    
    def get_total_coupons(self, obj):
        """Calculate total coupons in dispatch"""
        return sum(book.initial_coupon_count or 100 for book in obj.books.all())
    
    def get_total_value(self, obj):
        """Calculate total value of dispatch"""
        total = 0
        for book in obj.books.all():
            coupon_count = book.initial_coupon_count or 100
            denomination = book.box.denomination if book.box else 20
            total += coupon_count * denomination
        return total
    
    def create(self, validated_data):
        """Enhanced create method for dispatch with intelligent generation"""
        # Extract books data if provided
        books_data = self.context.get('books_data', [])
        
        # Create the dispatch
        dispatch = BookDispatch.objects.create(**validated_data)
        
        # Add books to dispatch if provided
        if books_data:
            book_ids = [book_data.get('id') for book_data in books_data if book_data.get('id')]
            books = Book.objects.filter(id__in=book_ids)
            dispatch.books.set(books)
            
            # Update serial range based on books
            if books.exists():
                first_serials = [book.first_coupon_number for book in books if book.first_coupon_number]
                last_serials = [book.last_coupon_number for book in books if book.last_coupon_number]
                
                if first_serials:
                    dispatch.first_serial = min(first_serials)
                if last_serials:
                    dispatch.last_serial = max(last_serials)
                
                dispatch.total_coupons = sum(book.initial_coupon_count or 100 for book in books)
                dispatch.save()
        
        return dispatch
    
    def update(self, instance, validated_data):
        """Enhanced update method"""
        # Handle date/time fields
        if 'received_date' in validated_data and 'received_time' in validated_data:
            received_date = validated_data.pop('received_date', None)
            received_time = validated_data.pop('received_time', None)
            
            if received_date and received_time:
                # Combine date and time
                from datetime import datetime, time
                if isinstance(received_time, time):
                    received_datetime = datetime.combine(received_date, received_time)
                    validated_data['received_date'] = received_datetime
        
        return super().update(instance, validated_data)


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


# Simple serializer for coupon data in handovers
class SimpleCouponSerializer(serializers.ModelSerializer):
    book_number = serializers.CharField(source='book.book_number', read_only=True)
    box_code = serializers.CharField(source='book.box.box_code', read_only=True)
    fuel_type = serializers.CharField(source='book.box.fuel_type', read_only=True)
    denomination = serializers.IntegerField(source='book.box.denomination', read_only=True)
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'coupon_number', 'status', 'litres', 'usd_value',
            'book_number', 'box_code', 'fuel_type', 'denomination'
        ]


class CouponHandoverSerializer(serializers.ModelSerializer):
    """Enhanced serializer for coupon handover with intelligent generation support"""
    beneficiary = SimpleUserSerializer(read_only=True)
    sub_center = SimpleSubCenterSerializer(read_only=True)
    handed_over_by = SimpleUserSerializer(read_only=True)
    received_by = SimpleUserSerializer(read_only=True)
    coupons = SimpleCouponSerializer(many=True, read_only=True)
    
    # Enhanced fields for intelligent handover
    handover_id = serializers.CharField(read_only=True)
    handover_mode = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Date/time fields with separation for frontend
    scheduled_date = serializers.DateField(required=False, allow_null=True)
    scheduled_time = serializers.TimeField(required=False, allow_null=True)
    handed_over_date = serializers.DateField(required=False, allow_null=True)
    handed_over_time = serializers.TimeField(required=False, allow_null=True)
    received_date = serializers.DateField(required=False, allow_null=True)
    received_time = serializers.TimeField(required=False, allow_null=True)
    
    # Handover method and logistics
    handover_method = serializers.CharField(max_length=30, required=False, allow_blank=True)
    representative_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    representative_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    representative_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    authorization_letter = serializers.CharField(required=False, allow_blank=True)
    
    # Location and instructions
    handover_location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    
    # Verification and signatures
    verification_checks = serializers.JSONField(required=False, default=list)
    verification_notes = serializers.CharField(required=False, allow_blank=True)
    verified_by = serializers.CharField(max_length=100, required=False, allow_blank=True)
    verified_at = serializers.DateTimeField(required=False, allow_null=True)
    
    # Digital signatures
    beneficiary_signature = serializers.CharField(required=False, allow_blank=True)
    representative_signature = serializers.CharField(required=False, allow_blank=True)
    witness_signature = serializers.CharField(required=False, allow_blank=True)
    witness_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Documentation
    handover_document = serializers.CharField(required=False, allow_blank=True)
    receipt_generated = serializers.BooleanField(required=False, default=False)
    delivery_note = serializers.CharField(max_length=200, required=False, allow_blank=True)
    handover_notes = serializers.CharField(required=False, allow_blank=True)
    
    # Entitlement tracking
    based_on_entitlement = serializers.BooleanField(required=False, default=True)
    entitlement_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    overrides_entitlement = serializers.BooleanField(required=False, default=False)
    emergency_reason = serializers.CharField(required=False, allow_blank=True)
    approved_by = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Calculated fields
    total_coupons = serializers.IntegerField(read_only=True)
    total_litres = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    first_serial = serializers.CharField(read_only=True)
    last_serial = serializers.CharField(read_only=True)
    
    # Status and workflow
    status = serializers.CharField(max_length=20, required=False)
    is_verified = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    can_be_modified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = CouponHandover
        fields = [
            'id', 'handover_id', 'beneficiary', 'sub_center', 'handover_mode',
            'status', 'handed_over_by', 'received_by', 'coupons',
            
            # Date/time fields
            'scheduled_date', 'scheduled_time', 'handed_over_date', 'handed_over_time',
            'received_date', 'received_time',
            
            # Handover details
            'handover_method', 'representative_name', 'representative_id',
            'representative_phone', 'authorization_letter', 'handover_location',
            'special_instructions',
            
            # Verification
            'verification_checks', 'verification_notes', 'verified_by', 'verified_at',
            
            # Signatures
            'beneficiary_signature', 'representative_signature', 'witness_signature',
            'witness_name',
            
            # Documentation
            'handover_document', 'receipt_generated', 'delivery_note', 'handover_notes',
            
            # Entitlement
            'based_on_entitlement', 'entitlement_amount', 'overrides_entitlement',
            'emergency_reason', 'approved_by',
            
            # Calculated fields
            'total_coupons', 'total_litres', 'total_value', 'first_serial', 'last_serial',
            
            # Status
            'is_verified', 'is_completed', 'can_be_modified',
            
            # Timestamps
            'created', 'updated'
        ]
        read_only_fields = [
            'id', 'handover_id', 'total_coupons', 'total_litres', 'total_value',
            'first_serial', 'last_serial', 'is_verified', 'is_completed', 'can_be_modified',
            'created', 'updated'
        ]
    
    def create(self, validated_data):
        """Enhanced create method for handover with coupon association"""
        # Extract coupon data if provided in context
        coupons_data = self.context.get('coupons_data', [])
        
        # Create the handover
        handover = CouponHandover.objects.create(**validated_data)
        
        # Add coupons to handover if provided
        if coupons_data:
            coupon_ids = [coupon_data.get('id') for coupon_data in coupons_data if coupon_data.get('id')]
            coupons = Coupon.objects.filter(id__in=coupon_ids, status='AVAILABLE')
            
            if coupons.exists():
                handover.add_coupons(list(coupons))
        
        return handover
    
    def update(self, instance, validated_data):
        """Enhanced update method with workflow validation"""
        # Prevent modification if handover is completed
        if not instance.can_be_modified and instance.status not in ['VERIFIED', 'HANDED_OVER']:
            raise serializers.ValidationError("Cannot modify completed handover")
        
        # Handle status transitions
        new_status = validated_data.get('status', instance.status)
        if new_status != instance.status:
            self._validate_status_transition(instance.status, new_status)
        
        return super().update(instance, validated_data)
    
    def _validate_status_transition(self, current_status, new_status):
        """Validate status transitions are logical"""
        valid_transitions = {
            'PENDING': ['CONFIGURED', 'CANCELLED'],
            'CONFIGURED': ['VERIFIED', 'CANCELLED'],
            'VERIFIED': ['HANDED_OVER', 'CANCELLED'],
            'HANDED_OVER': ['RECEIVED', 'CANCELLED'],
            'RECEIVED': ['CONFIRMED'],
            'CONFIRMED': [],  # Final state
            'CANCELLED': []   # Final state
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Invalid status transition from {current_status} to {new_status}"
            )



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
    
    # Frontend expects these exact field names
    sub_center = serializers.PrimaryKeyRelatedField(
        queryset=SubCenter.objects.all(), 
        required=False, 
        allow_null=True
    )
    
    # Additional computed fields
    full_name = serializers.SerializerMethodField()
    can_login = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Complete fields from User model for comprehensive user management
        fields = [
            # Basic user info (from AbstractUser)
            'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
            'date_joined', 'last_login', 'is_staff', 'is_superuser',
            
            # Custom user fields
            'role', 'role_display', 'sub_center', 'sub_center_details', 'phone',
            
            # Profile and additional info
            'digital_signature', 'signature_uploaded_at', 'profile_picture',
            'full_address', 'national_id', 'last_activity',
            
            # Approval workflow
            'is_approved', 'approved_by', 'approved_by_details', 'approved_at',
            'registration_justification', 'rejection_reason', 'approval_status',
            
            # Computed fields
            'full_name', 'can_login'
        ]
        # Keep fields managed by the system as read_only
        read_only_fields = [
            'id', 'last_activity', 'role_display', 'date_joined', 'last_login',
            'sub_center_details', 'approved_by_details', 'approval_status',
            'full_name', 'can_login', 'signature_uploaded_at'
        ]
    
    def validate(self, data):
        """Validate user data, especially sub_center requirements"""
        # ✅ Enforce sub_center assignment for roles that require it
        roles_requiring_subcenter = ['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER']
        
        # Get the role (from data if updating, or from instance if not provided)
        role = data.get('role')
        if not role and hasattr(self, 'instance') and self.instance:
            role = self.instance.role
            
        if role in roles_requiring_subcenter:
            sub_center = data.get('sub_center')
            # If sub_center not in data, check instance
            if sub_center is None and hasattr(self, 'instance') and self.instance:
                sub_center = self.instance.sub_center
                
            if not sub_center:
                role_display = dict(User.ROLE_CHOICES).get(role, role)
                raise serializers.ValidationError({
                    "sub_center": f"{role_display} role requires a sub-center assignment. Users with this role must work within a specific sub-center."
                })
        
        return data
    
    def get_full_name(self, obj):
        """Get user's full name"""
        return obj.get_full_name() or obj.username
    
    def get_can_login(self, obj):
        """Check if user can login"""
        return obj.can_login()

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
    
    # Additional profile fields
    full_address = serializers.CharField(required=False, allow_blank=True)
    national_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    # Admin fields (for admin-created users)
    is_active = serializers.BooleanField(default=True, required=False)
    is_approved = serializers.BooleanField(default=False, required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone', 
            'password', 'password2', 'role', 'sub_center', 
            'registration_justification', 'full_address', 'national_id',
            'is_active', 'is_approved'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
            'sub_center': {'required': False, 'allow_null': True},
            'registration_justification': {'required': False, 'allow_blank': True},
            'full_address': {'required': False, 'allow_blank': True},
            'national_id': {'required': False, 'allow_blank': True},
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

        # ✅ Enforce sub_center assignment for roles that require it
        roles_requiring_subcenter = ['SUB_CENTER', 'AUDITOR', 'BENEFICIARY', 'SUB_CENTER_APPROVER']
        if data.get('role') in roles_requiring_subcenter:
            if not data.get('sub_center'):
                role_display = dict(User.ROLE_CHOICES).get(data['role'], data['role'])
                raise serializers.ValidationError({
                    "sub_center": f"{role_display} role requires a sub-center assignment. Users with this role must work within a specific sub-center."
                })

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
    
    # Current user's full name for auto-fill functionality
    current_user_full_name = serializers.SerializerMethodField(read_only=True)
    
    # Handle received_at field to accept both date and datetime
    received_at = serializers.DateTimeField(required=False, allow_null=True)
    
    # FRONTEND FIELD MAPPINGS - All form fields from BoxReceiptManagement.tsx
    
    # Basic Identification
    boxId = serializers.CharField(source='box_code', required=False, allow_blank=True)
    box_id = serializers.CharField(source='box_code', required=False, allow_blank=True)
    barcode = serializers.CharField(required=False, allow_blank=True)
    
    # Supplier and Documentation
    supplier = serializers.CharField(required=False, allow_blank=True)
    invoiceNumber = serializers.CharField(source='invoice_number', required=False, allow_blank=True)
    deliveryNote = serializers.CharField(source='delivery_note', required=False, allow_blank=True)
    
    # Date and Time Fields (frontend sends separate fields)
    receivedDate = serializers.DateField(source='received_date', required=False, allow_null=True)
    receivedTime = serializers.TimeField(source='received_time', required=False, allow_null=True)
    receivedBy = serializers.CharField(source='received_by.get_full_name', read_only=True)
    
    # Fuel and Structure Information
    fuelType = serializers.CharField(source='fuel_type', required=False)
    couponAmount = serializers.IntegerField(source='denomination', required=False)
    
    # Financial Information (USD)
    fuelPricePerLitreUSD = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=6, decimal_places=4, required=False)
    fuelPricePerLitreUsd = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=6, decimal_places=4, required=False)
    fuelPriceUSD = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=6, decimal_places=4, required=False, write_only=True)
    totalValueUsd = serializers.DecimalField(source='total_value_usd', max_digits=10, decimal_places=2, required=False)
    exchangeRate = serializers.DecimalField(source='exchange_rate_zwg_usd', max_digits=8, decimal_places=4, required=False)
    exchangeRateZwgUsd = serializers.DecimalField(source='exchange_rate_zwg_usd', max_digits=8, decimal_places=4, required=False)
    
    # Financial Information (ZWG) - Legacy support
    fuelPricePerLitre = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, write_only=True)
    monetaryValueUSD = serializers.DecimalField(source='total_value_usd', max_digits=10, decimal_places=2, required=False)
    
    # Coupon Serial Numbers
    firstCouponId = serializers.CharField(source='first_coupon_number', required=False, allow_blank=True)
    firstCouponNumber = serializers.CharField(source='first_coupon_number', required=False, allow_blank=True)
    lastCouponId = serializers.CharField(source='last_coupon_number', required=False, allow_blank=True)
    lastCouponNumber = serializers.CharField(source='last_coupon_number', required=False, allow_blank=True)
    first_coupon_id = serializers.CharField(source='first_coupon_number', required=False, allow_blank=True)
    last_coupon_id = serializers.CharField(source='last_coupon_number', required=False, allow_blank=True)
    
    # Structure Information
    numberOfBooks = serializers.IntegerField(source='number_of_books', required=False)
    couponsPerBook = serializers.IntegerField(source='coupons_per_book', required=False)
    totalLitres = serializers.DecimalField(source='total_litres', max_digits=10, decimal_places=2, required=False)
    
    # Verification and Notes
    couponVerificationNotes = serializers.CharField(source='verification_notes', required=False, allow_blank=True)
    verificationNotes = serializers.CharField(source='verification_notes', required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Digital Signature
    signature = serializers.CharField(source='received_by_signature', required=False, allow_blank=True)
    receivedBySignature = serializers.CharField(source='received_by_signature', required=False, allow_blank=True)
    
    # Calculated Fields (read-only, calculated in backend)
    totalCoupons = serializers.IntegerField(source='total_coupons_calculated', read_only=True)
    totalValueUSD = serializers.DecimalField(source='total_value_usd', max_digits=10, decimal_places=2, read_only=True)
    totalValueZWG = serializers.DecimalField(source='total_value_zwg', max_digits=12, decimal_places=2, read_only=True)
    
    # Status harmonization
    status = serializers.ChoiceField(
        choices=[
            ('PENDING', 'Pending Receipt'),
            ('RECEIVED', 'Received'),
            ('VERIFIED', 'Verified'),
            ('DISPATCHED', 'Dispatched'),
            ('DAMAGED', 'Damaged'),
            ('ARCHIVED', 'Archived'),
        ],
        required=False
    )
    
    # Legacy field mappings for backward compatibility
    coupon_amount = serializers.IntegerField(source='denomination', required=False)
    monetary_value_usd = serializers.DecimalField(source='total_value_usd', max_digits=10, decimal_places=2, required=False)
    fuel_price_per_litre_usd = serializers.DecimalField(max_digits=6, decimal_places=4, required=False)
    exchange_rate = serializers.DecimalField(source='exchange_rate_zwg_usd', max_digits=8, decimal_places=4, required=False)
    
    # Complex data structures
    book_details = serializers.ListField(required=False, write_only=True, allow_empty=True)
    calculation_mode = serializers.CharField(required=False, write_only=True)
    total_coupons = serializers.IntegerField(required=False, write_only=True)
    booksGenerated = serializers.ListField(source='book_details_json', required=False, allow_empty=True)
    
    # QR Code and other metadata
    qrCodeData = serializers.CharField(source='qr_code_data', required=False, allow_blank=True)
    damageReport = serializers.CharField(source='damage_report', required=False, allow_blank=True)
    # QR Code and other metadata
    qrCodeData = serializers.CharField(source='qr_code_data', required=False, allow_blank=True)
    damageReport = serializers.CharField(source='damage_report', required=False, allow_blank=True)

    class Meta:
        model = Box
        # Complete field list - all frontend fields mapped
        fields = [
            # Core identification
            'id', 'box_code', 'boxId', 'box_id', 'barcode',
            
            # Supplier and Documentation
            'supplier', 'invoiceNumber', 'deliveryNote', 'invoice_number', 'delivery_note',
            
            # Date and Time
            'received_at', 'received_date', 'received_time', 'receivedDate', 'receivedTime',
            'received_by', 'received_by_details', 'receivedBy', 'current_user_full_name',
            
            # Fuel and Structure Information
            'fuel_type', 'fuelType', 'denomination', 'coupon_amount', 'couponAmount',
            'number_of_books', 'numberOfBooks', 'coupons_per_book', 'couponsPerBook',
            
            # Coupon Serial Numbers
            'first_coupon_number', 'last_coupon_number', 'first_coupon_id', 'last_coupon_id',
            'firstCouponId', 'lastCouponId', 'firstCouponNumber', 'lastCouponNumber',
            
            # Calculated Totals
            'total_coupons_calculated', 'total_coupons', 'totalCoupons',
            'total_litres', 'totalLitres',
            
            # Financial Information (USD)
            'fuel_price_per_litre_usd', 'fuelPricePerLitreUSD', 'fuelPricePerLitreUsd', 'fuelPriceUSD',
            'exchange_rate_zwg_usd', 'exchange_rate', 'exchangeRate', 'exchangeRateZwgUsd',
            'total_value_usd', 'total_value_zwg', 'monetaryValueUSD', 'totalValueUSD', 'totalValueZWG', 'totalValueUsd',
            
            # Financial Information (ZWG) - Legacy
            'fuelPricePerLitre', 'monetary_value_usd',
            
            # Status and Workflow
            'status', 'verification_notes', 'verificationNotes', 'couponVerificationNotes', 'verified_at', 'verified_by',
            
            # Notes and Documentation
            'notes', 'signature', 'received_by_signature', 'receivedBySignature',
            'damage_report', 'damageReport', 'qr_code_data', 'qrCodeData',
            
            # Assignment and Processing
            'assigned_to', 'assigned_to_details',
            
            # Complex Data Structures
            'calculation_mode', 'book_details_json', 'book_details', 'booksGenerated',
            
            # Timestamps
            'created', 'modified',
        ]
        read_only_fields = [
            'id', 'assigned_to_details', 'received_by_details', 'created', 'modified',
            'totalCoupons', 'totalValueUSD', 'totalValueZWG', 'receivedBy', 'current_user_full_name'
        ]
        extra_kwargs = {
            'first_coupon_number': {'required': False},
            'last_coupon_number': {'required': False},
            'box_code': {'required': False},
            'fuel_type': {'required': False},
            'denomination': {'required': False},
            'number_of_books': {'required': False},
            'coupons_per_book': {
                'required': False,
                'min_value': 1,
                'max_value': 100,
                'help_text': 'Number of coupons per book (1-100 range)'
            },
            'total_litres': {'required': False},
            'supplier': {'required': False},
            'barcode': {'required': False},
            'notes': {'required': False},
        }
    
    def get_current_user_full_name(self, obj):
        """
        Return the current user's full name for auto-fill functionality
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return f"{request.user.first_name} {request.user.last_name}".strip()
        return ""
    
    def validate(self, data):
        """
        Custom validation to handle field mapping with all fields optional
        """
        # Debug: print what we received
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"BoxSerializer received data keys: {list(data.keys())}")
        
        # Check box_code - it might come as box_code, boxId, or box_id
        box_code = data.get('box_code') or data.get('boxId') or data.get('box_id')
        logger.info(f"box_code value: '{box_code}'")
        
        # Generate unique box_code if not provided or empty
        if not box_code or (isinstance(box_code, str) and box_code.strip() == ''):
            # Auto-generate unique box_code
            import datetime
            import uuid
            from django.db import models
            
            base_code = f"FCB-{datetime.datetime.now().year}"
            attempt = 0
            max_attempts = 10
            
            # Try to generate a unique box_code
            while attempt < max_attempts:
                if attempt == 0:
                    # First attempt: use timestamp
                    auto_box_code = f"{base_code}-AUTO-{datetime.datetime.now().strftime('%m%d%H%M%S')}"
                else:
                    # Subsequent attempts: add random suffix
                    random_suffix = str(uuid.uuid4())[:8].upper()
                    auto_box_code = f"{base_code}-AUTO-{datetime.datetime.now().strftime('%m%d%H%M')}-{random_suffix}"
                
                # Check if this box_code already exists
                from .models import Box
                if not Box.objects.filter(box_code=auto_box_code).exists():
                    logger.info(f"Generated unique box_code: {auto_box_code}")
                    data['box_code'] = auto_box_code
                    break
                    
                attempt += 1
                logger.warning(f"box_code {auto_box_code} already exists, trying again (attempt {attempt})")
            
            if attempt >= max_attempts:
                # Fallback: use UUID
                unique_suffix = str(uuid.uuid4())[:12].upper()
                auto_box_code = f"{base_code}-{unique_suffix}"
                logger.info(f"Fallback unique box_code: {auto_box_code}")
                data['box_code'] = auto_box_code
                
        else:
            # Validate provided box_code for uniqueness
            from .models import Box
            if Box.objects.filter(box_code=box_code).exists():
                raise serializers.ValidationError({
                    'box_code': f'Coupon Box with box code "{box_code}" already exists. Please use a different code.'
                })
            
            # Ensure box_code is set in the data for model creation
            if not data.get('box_code') and box_code:
                data['box_code'] = box_code
        
        # Validate coupons_per_book range (1-100)
        coupons_per_book = data.get('coupons_per_book') or data.get('couponsPerBook')
        if coupons_per_book is not None:
            try:
                coupons_count = int(coupons_per_book)
                if coupons_count < 1 or coupons_count > 100:
                    raise serializers.ValidationError({
                        'coupons_per_book': 'Number of coupons per book must be between 1 and 100'
                    })
                # Ensure the field is set correctly
                data['coupons_per_book'] = coupons_count
            except (ValueError, TypeError):
                raise serializers.ValidationError({
                    'coupons_per_book': 'Coupons per book must be a valid number between 1 and 100'
                })
        
        # All fields are now optional - no validation required
        return data
    
    def create(self, validated_data):
        """
        Enhanced create method to store all frontend calculations in backend
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Extract and store frontend calculation data
        book_details = validated_data.pop('book_details', [])
        calculation_mode = validated_data.pop('calculation_mode', 'first-and-count')
        total_coupons = validated_data.pop('total_coupons', None)
        
        # Store financial calculation data from frontend
        if 'monetary_value_usd' in validated_data:
            validated_data['total_value_usd'] = validated_data.pop('monetary_value_usd')
        if 'totalValueUsd' in validated_data:
            validated_data['total_value_usd'] = validated_data.pop('totalValueUsd')
        if 'fuelPriceUSD' in validated_data:
            validated_data['fuel_price_per_litre_usd'] = validated_data.pop('fuelPriceUSD')
        if 'fuelPricePerLitreUsd' in validated_data:
            validated_data['fuel_price_per_litre_usd'] = validated_data.pop('fuelPricePerLitreUsd')
        if 'exchange_rate' in validated_data:
            validated_data['exchange_rate_zwg_usd'] = validated_data.pop('exchange_rate')
        if 'exchangeRateZwgUsd' in validated_data:
            validated_data['exchange_rate_zwg_usd'] = validated_data.pop('exchangeRateZwgUsd')
        
        # Set calculation mode and book details
        validated_data['calculation_mode'] = calculation_mode
        if book_details:
            validated_data['book_details_json'] = book_details
            logger.info(f"Storing {len(book_details)} book details from frontend")
        
        # Set status from frontend
        status = validated_data.pop('status', 'RECEIVED')
        validated_data['status'] = status
        
        # Remove any remaining frontend-only fields
        frontend_only_fields = [
            'fuelPriceUSD', 'monetaryValueUSD'
        ]
        for field in frontend_only_fields:
            validated_data.pop(field, None)
        
        # Create the box - the save() method will handle calculations
        box = super().create(validated_data)
        
        # Generate books based on book_details or box parameters
        self._generate_books_for_box(box, book_details)
        
        logger.info(f"Created box {box.box_code} with {box.total_coupons_calculated} calculated coupons")
        return box
    
    def _generate_books_for_box(self, box, book_details=None):
        """
        Generate books for a box based on book_details from frontend or box parameters
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            if book_details and isinstance(book_details, list):
                # Use detailed book information from frontend
                logger.info(f"Generating {len(book_details)} books from frontend details")
                for book_data in book_details:
                    book_number = book_data.get('book_number', book_data.get('book_id', 'Unknown'))
                    first_coupon = book_data.get('first_coupon_id', '')
                    last_coupon = book_data.get('last_coupon_id', '')
                    coupon_count = book_data.get('number_of_coupons', book_data.get('coupons_count', 100))
                    
                    # Create the book
                    book = Book.objects.create(
                        box=box,
                        book_number=str(book_number),
                        first_coupon_number=first_coupon,
                        last_coupon_number=last_coupon,
                        initial_coupon_count=coupon_count,
                        generated_by=getattr(self.context.get('request', None), 'user', None)
                    )
                    
                    logger.info(f"Created book {book.book_code} with range {first_coupon}-{last_coupon}")
                    
            elif box.number_of_books and box.coupons_per_book and box.first_coupon_number and box.last_coupon_number:
                # Fall back to automatic generation based on box parameters
                logger.info(f"Generating {box.number_of_books} books automatically from box parameters")
                box.generate_books_and_coupons()
                
        except Exception as e:
            # Log the error but don't fail the entire creation
            logger.error(f"Error generating books for box {box.box_code}: {e}")
            
            # Try simple book generation as fallback
            try:
                for i in range(1, (box.number_of_books or 1) + 1):
                    Book.objects.create(
                        box=box,
                        book_number=f"Book {i}",
                        first_coupon_number=f"AUTO-{box.box_code}-{i:03d}-001",
                        last_coupon_number=f"AUTO-{box.box_code}-{i:03d}-{box.coupons_per_book or 100:03d}",
                        initial_coupon_count=box.coupons_per_book or 100,
                        generated_by=getattr(self.context.get('request', None), 'user', None)
                    )
                logger.info(f"Fallback: Created {box.number_of_books or 1} books with auto-generated serials")
            except Exception as fallback_error:
                logger.error(f"Fallback book generation also failed: {fallback_error}")
    
    def update(self, instance, validated_data):
        """
        Enhanced update method to preserve all frontend calculations
        """
        # Extract and store frontend calculation data
        book_details = validated_data.pop('book_details', None)
        calculation_mode = validated_data.pop('calculation_mode', None)
        total_coupons = validated_data.pop('total_coupons', None)
        
        # Update financial calculation data from frontend
        if 'monetary_value_usd' in validated_data:
            validated_data['total_value_usd'] = validated_data.pop('monetary_value_usd')
        if 'fuelPriceUSD' in validated_data:
            validated_data['fuel_price_per_litre_usd'] = validated_data.pop('fuelPriceUSD')
        if 'exchange_rate' in validated_data:
            validated_data['exchange_rate_zwg_usd'] = validated_data.pop('exchange_rate')
        
        # Update calculation mode and book details if provided
        if calculation_mode:
            validated_data['calculation_mode'] = calculation_mode
        if book_details:
            validated_data['book_details_json'] = book_details
        
        # Update status from frontend
        if 'status' in validated_data:
            status = validated_data.pop('status')
            validated_data['status'] = status
        
        # Remove any remaining frontend-only fields
        frontend_only_fields = [
            'fuelPriceUSD', 'monetaryValueUSD'
        ]
        for field in frontend_only_fields:
            validated_data.pop(field, None)
        
        return super().update(instance, validated_data)

class BookSerializer(serializers.ModelSerializer):
    # Use SimpleBoxSerializer for the box field
    box_details = SimpleBoxSerializer(source='box', read_only=True, allow_null=True)
    initial_coupon_count = serializers.IntegerField(read_only=True) # Correct field name, readonly
    
    # Enhanced fields to match frontend expectations
    box_code = serializers.CharField(source='box.box_code', read_only=True)
    coupon_count = serializers.IntegerField(read_only=True)
    available_coupons = serializers.IntegerField(read_only=True)
    allocated_coupons = serializers.IntegerField(read_only=True)
    used_coupons = serializers.IntegerField(read_only=True)
    
    # User details
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    # Frontend compatibility fields
    bookId = serializers.CharField(source='book_code', read_only=True)
    bookNumber = serializers.CharField(source='book_number', read_only=True)
    firstCouponId = serializers.CharField(source='first_coupon_number', read_only=True)
    lastCouponId = serializers.CharField(source='last_coupon_number', read_only=True)
    numberOfCoupons = serializers.IntegerField(source='coupon_count', read_only=True)
    isAssigned = serializers.BooleanField(source='is_assigned', read_only=True)
    isVerified = serializers.BooleanField(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'book_number', 'book_code', 'first_coupon_number', 'last_coupon_number',
            'is_assigned', 'assigned_to', 'assigned_to_name', 'assigned_date',
            'initial_coupon_count', 'coupon_count', 'available_coupons', 
            'allocated_coupons', 'used_coupons',
            'is_verified', 'verified_by', 'verified_by_name', 'verified_at', 'verification_notes',
            'generated_by', 'generated_by_name', 'generated_at',
            'box_details', 'box_code', 'created', 'modified',
            # Frontend compatibility fields
            'bookId', 'bookNumber', 'firstCouponId', 'lastCouponId', 
            'numberOfCoupons', 'isAssigned', 'isVerified'
        ]
        read_only_fields = [
            'id', 'book_code', 'coupon_count', 'generated_at', 'created', 'modified',
            'available_coupons', 'allocated_coupons', 'used_coupons'
        ]
    
    def to_representation(self, instance):
        """Enhanced representation to include frontend-compatible format"""
        data = super().to_representation(instance)
        
        # Add the frontend format method result
        if hasattr(instance, 'to_frontend_format'):
            frontend_data = instance.to_frontend_format()
            data.update(frontend_data)
        
        return data
        # Added 'created', 'modified' from TimeStampedModel
        fields = ['id', 'box', 'box_details', 'book_number', 'first_coupon_number', 'last_coupon_number', 'is_assigned', 'initial_coupon_count', 'created', 'modified'] # Corrected total_coupons to initial_coupon_count
        read_only_fields = ['id', 'initial_coupon_count', 'created', 'modified'] # Make initial_coupon_count and timestamps readonly


# Coupon Serializer (Updated)
class CouponSerializer(serializers.ModelSerializer):
    # Use SimpleSerializers for related fields
    book_details = SimpleBookSerializer(source='book', read_only=True, allow_null=True)
    allocated_to_details = SimpleUserSerializer(source='allocated_to', read_only=True, allow_null=True)

    # Map frontend field names to backend field names
    serialNumber = serializers.CharField(source='serial_number', required=False, allow_blank=True)
    fuelType = serializers.CharField(source='fuel_type', read_only=True)
    
    # Handle alternative field names for comprehensive compatibility
    couponNumber = serializers.CharField(source='coupon_number', required=False, allow_blank=True)
    issuedDate = serializers.DateTimeField(source='created', read_only=True)
    expiryDate = serializers.DateField(source='expiry_date', read_only=True)
    usedDate = serializers.DateTimeField(source='used_date', read_only=True)

    # New fields added to the model
    expiry_date = serializers.DateField(read_only=True) # Often readonly if auto-calculated or set on creation, depends on workflow
    transaction_location = serializers.CharField(allow_null=True, required=False) # Can be written when marking used
    status = serializers.CharField(read_only=True) # Status is managed by logic/actions, not direct edit

    class Meta:
        model = Coupon
        # Specify all fields explicitly for clarity
        fields = (
            'id', 'book', 'book_details', 'coupon_number', 'serial_number', 'litres', 'status',
            'allocated_to', 'allocated_to_details', 'allocated_date', 'used_date',
            'expiry_date', 'transaction_location', 'created', 'modified',
            # Frontend compatible field names
            'serialNumber', 'fuelType', 'couponNumber', 'issuedDate', 'expiryDate', 'usedDate'
        )
        # Make coupon_number optional since it's often auto-generated, make status, dates/timestamps readonly
        read_only_fields = ('coupon_number', 'status', 'allocated_date', 'used_date', 'expiry_date', 'created', 'modified', 'book_details', 'allocated_to_details', 'serialNumber', 'fuelType', 'couponNumber', 'issuedDate', 'expiryDate', 'usedDate')


# Program Serializer - now implemented with the Program model
class ProgramSerializer(serializers.ModelSerializer):
    # Use SimpleSerializers for related fields
    organizer_details = SimpleUserSerializer(source='organizer', read_only=True, allow_null=True)
    sub_center_details = SimpleSubCenterSerializer(source='sub_center', read_only=True, allow_null=True)
    
    # Computed display fields
    program_type_display = serializers.CharField(source='get_program_type_display', read_only=True)
    status_display = serializers.CharField(read_only=True)
    
    # Computed status fields
    duration_days = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    
    # Computed metrics
    attendees_count = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    # Attendees list (for detailed views)
    attendees = serializers.SerializerMethodField()
    
    # Formatted names for convenience
    organizer_name = serializers.SerializerMethodField()
    sub_center_name = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            # Core identity
            'id', 'title', 'program_type', 'program_type_display', 
            
            # Scheduling
            'scheduled_date', 'end_date', 'duration_days',
            
            # Details
            'description', 'location', 'notes',
            
            # Relationships
            'organizer', 'organizer_details', 'organizer_name',
            'sub_center', 'sub_center_details', 'sub_center_name',
            
            # Management
            'expected_participants', 'fuel_allocation_approved', 'is_active',
            
            # Status & Progress
            'status_display', 'is_upcoming', 'is_ongoing', 'is_completed',
            'attendees_count', 'completion_percentage',
            
            # Attendees (for detailed views)
            'attendees',
            
            # Timestamps
            'created', 'modified'
        ]
        read_only_fields = [
            'id', 'created', 'modified', 'organizer_details', 'sub_center_details',
            'program_type_display', 'status_display', 'duration_days', 'is_upcoming', 
            'is_ongoing', 'is_completed', 'attendees_count', 'completion_percentage',
            'attendees', 'organizer_name', 'sub_center_name'
        ]
    
    def get_attendees(self, obj):
        """Get list of attendees for detailed program views"""
        attendees = obj.get_attendees()
        return SimpleUserSerializer(attendees, many=True).data
    
    def get_organizer_name(self, obj):
        """Get formatted organizer name"""
        if obj.organizer:
            return f"{obj.organizer.first_name} {obj.organizer.last_name}".strip()
        return None
    
    def get_sub_center_name(self, obj):
        """Get sub-center name"""
        return obj.sub_center.name if obj.sub_center else None


class ProgramListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for program list views"""
    
    program_type_display = serializers.CharField(source='get_program_type_display', read_only=True)
    status_display = serializers.CharField(read_only=True)
    organizer_name = serializers.SerializerMethodField()
    sub_center_name = serializers.SerializerMethodField()
    
    # Essential computed fields for list view
    duration_days = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    attendees_count = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Program
        fields = [
            'id', 'title', 'program_type', 'program_type_display',
            'scheduled_date', 'end_date', 'duration_days',
            'location', 'organizer_name', 'sub_center_name',
            'expected_participants', 'is_active', 'status_display',
            'is_upcoming', 'is_ongoing', 'attendees_count', 
            'completion_percentage', 'fuel_allocation_approved'
        ]
    
    def get_organizer_name(self, obj):
        """Get formatted organizer name"""
        if obj.organizer:
            return f"{obj.organizer.first_name} {obj.organizer.last_name}".strip()
        return None
    
    def get_sub_center_name(self, obj):
        """Get sub-center name"""
        return obj.sub_center.name if obj.sub_center else None


class ProgramWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating programs"""
    
    class Meta:
        model = Program
        fields = [
            'title', 'program_type', 'description', 'location',
            'scheduled_date', 'end_date', 'organizer', 'sub_center',
            'expected_participants', 'fuel_allocation_approved', 
            'is_active', 'notes'
        ]
    
    def validate(self, data):
        """Validate program data"""
        scheduled_date = data.get('scheduled_date')
        end_date = data.get('end_date')
        
        # Validate dates
        if scheduled_date and end_date:
            if end_date <= scheduled_date:
                raise serializers.ValidationError(
                    "End date must be after scheduled date."
                )
        
        # Validate organizer permissions
        organizer = data.get('organizer')
        if organizer and hasattr(organizer, 'role'):
            valid_roles = ['MAIN_CENTER', 'SUB_CENTER', 'ADMIN', 'SUPER_ADMIN']
            if organizer.role not in valid_roles:
                raise serializers.ValidationError(
                    "Organizer must have appropriate role permissions."
                )
        
        return data
    
    def validate_title(self, value):
        """Validate program title"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Program title must be at least 3 characters long."
            )
        return value.strip()
    
    def validate_expected_participants(self, value):
        """Validate expected participants count"""
        if value < 0:
            raise serializers.ValidationError(
                "Expected participants cannot be negative."
            )
        if value > 10000:
            raise serializers.ValidationError(
                "Expected participants seems unusually high. Please verify."
            )
        return value

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


# ======================= HARMONIZED BENEFICIARY SERIALIZER =======================

class HarmonizedBeneficiaryProfileSerializer(serializers.ModelSerializer):
    """
    Complete harmonized serializer with 100% frontend compatibility.
    
    This serializer ensures perfect field alignment with frontend TypeScript interfaces:
    - BeneficiaryManagement.tsx (19 fields)
    - BeneficiaryAccountDashboard.tsx (12 structured fields)
    
    Field Mapping Strategy:
    - SerializerMethodField for computed properties
    - Field aliases for frontend-compatible naming
    - Structured data methods for nested objects
    """
    
    # === FRONTEND-COMPATIBLE FIELD MAPPINGS ===
    
    # Basic identity fields (direct mapping)
    id = serializers.ReadOnlyField()
    parliamentaryId = serializers.CharField(source='parliamentary_id', read_only=True)
    
    # Computed user fields for frontend compatibility
    name = serializers.SerializerMethodField()
    title = serializers.CharField(source='position', read_only=True)
    phoneNumber = serializers.CharField(source='mobile_phone', read_only=True)
    email = serializers.CharField(source='official_email', read_only=True)
    address = serializers.CharField(source='full_address', read_only=True)
    
    # Date fields with proper formatting
    dateOfBirth = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()
    lastActivity = serializers.SerializerMethodField()
    
    # Simple fields with frontend naming
    nationalId = serializers.CharField(source='national_id', read_only=True)
    profilePhoto = serializers.SerializerMethodField()
    party = serializers.CharField(source='party_affiliation', read_only=True)
    status = serializers.CharField(read_only=True)
    
    # Related object fields (nested)
    category = serializers.StringRelatedField(read_only=True)
    constituency = serializers.StringRelatedField(read_only=True)
    vehicleCategory = serializers.StringRelatedField(source='vehicle_category', read_only=True)
    
    # === STRUCTURED DATA FIELDS FOR DASHBOARD ===
    
    contactInfo = serializers.SerializerMethodField()
    vehicleInfo = serializers.SerializerMethodField()
    allocationProfile = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()
    fuelUsage = serializers.SerializerMethodField()
    vehicles = serializers.SerializerMethodField()
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            # BeneficiaryManagement.tsx fields (19 fields)
            'id',
            'parliamentaryId',
            'name',
            'title',
            'phoneNumber',
            'email',
            'address',
            'dateOfBirth',
            'nationalId',
            'profilePhoto',
            'lastActivity',
            'createdAt',
            'category',
            'constituency',
            'vehicleCategory',
            'party',
            'status',
            'position',
            'department',
            
            # BeneficiaryAccountDashboard.tsx structured fields (12 structured fields)
            'contactInfo',
            'vehicleInfo',
            'allocationProfile',
            'entitlements',
            'fuelUsage',
            'vehicles',
            
            # Additional detailed fields for comprehensive API
            'employeeId',
            'officeLocation',
            'officePhone',
            'personalEmail',
            'vehicleMake',
            'vehicleModel',
            'vehicleYear',
            'engineSize',
            'vehicleRegistration',
            'fuelType',
            'baseAllocation',
            'categoryMultiplier',
            'engineMultiplier',
            'monthlyEntitlementLitres',
            'maxPerTransaction',
            'isActiveBeneficiary',
            'currentBalance',
            'usedThisMonth',
            'lastMonthUsage',
            'yearToDateUsage',
            'totalUsageAllTime',
            'lastAllocationDate',
            'joinDate',
            'lastLogin'
        ]
        read_only_fields = ['id', 'created', 'modified']
    
    # === COMPUTED FIELD METHODS ===
    
    def get_name(self, obj):
        """Get full name combining first and last name"""
        return obj.get_full_name()
    
    def get_dateOfBirth(self, obj):
        """Format date of birth for frontend"""
        return obj.date_of_birth.isoformat() if obj.date_of_birth else None
    
    def get_createdAt(self, obj):
        """Format creation date for frontend"""
        return obj.join_date.isoformat() if obj.join_date else None
    
    def get_lastActivity(self, obj):
        """Get last activity from user model"""
        return obj.user.last_activity.isoformat() if obj.user.last_activity else None
    
    def get_profilePhoto(self, obj):
        """Get profile photo from user model"""
        if hasattr(obj.user, 'profile_picture') and obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
        return None
    
    # === STRUCTURED DATA METHODS ===
    
    def get_contactInfo(self, obj):
        """Get contact information as structured object"""
        return obj.get_contact_info()
    
    def get_vehicleInfo(self, obj):
        """Get vehicle information as structured object"""
        return obj.get_vehicle_info()
    
    def get_allocationProfile(self, obj):
        """Get allocation profile as structured object"""
        return obj.get_allocation_profile()
    
    def get_entitlements(self, obj):
        """Get entitlements as structured object"""
        return obj.get_entitlements()
    
    def get_fuelUsage(self, obj):
        """Get fuel usage as structured object"""
        return obj.get_fuel_usage()
    
    def get_vehicles(self, obj):
        """Get vehicles array for frontend compatibility"""
        return obj.get_vehicles()


class HarmonizedBeneficiaryProfileWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating/updating harmonized beneficiary profiles.
    Separate from read serializer to handle different field requirements.
    """
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            'parliamentary_id',
            'employee_id',
            'category',
            'constituency',
            'vehicle_category',
            'position',
            'department',
            'party_affiliation',
            'date_of_birth',
            'national_id',
            'full_address',
            'office_location',
            'office_phone',
            'mobile_phone',
            'official_email',
            'personal_email',
            'vehicle_make',
            'vehicle_model',
            'vehicle_year',
            'engine_size',
            'vehicle_registration',
            'fuel_type',
            'base_allocation',
            'max_per_transaction',
            'status',
            'is_active_beneficiary'
        ]
    
    def validate_parliamentary_id(self, value):
        """Validate parliamentary ID uniqueness"""
        if self.instance:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                parliamentary_id=value
            ).exclude(id=self.instance.id)
        else:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                parliamentary_id=value
            )
        
        if existing.exists():
            raise serializers.ValidationError("Parliamentary ID must be unique.")
        
        return value
    
    def validate_national_id(self, value):
        """Validate national ID uniqueness"""
        if self.instance:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                national_id=value
            ).exclude(id=self.instance.id)
        else:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                national_id=value
            )
        
        if existing.exists():
            raise serializers.ValidationError("National ID must be unique.")
        
        return value
    
    def validate_vehicle_registration(self, value):
        """Validate vehicle registration uniqueness"""
        if self.instance:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                vehicle_registration=value
            ).exclude(id=self.instance.id)
        else:
            existing = HarmonizedBeneficiaryProfile.objects.filter(
                vehicle_registration=value
            )
        
        if existing.exists():
            raise serializers.ValidationError("Vehicle registration must be unique.")
        
        return value


class HarmonizedBeneficiaryProfileListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views with essential fields only.
    Optimized for performance when listing many beneficiaries.
    """
    
    name = serializers.SerializerMethodField()
    category = serializers.StringRelatedField(read_only=True)
    constituency = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = HarmonizedBeneficiaryProfile
        fields = [
            'id',
            'parliamentary_id',
            'name',
            'category',
            'constituency',
            'position',
            'status',
            'monthly_entitlement_litres',
            'current_balance',
            'join_date'
        ]
    
    def get_name(self, obj):
        """Get full name combining first and last name"""
        return obj.get_full_name()


# ===================================================================
# DYNAMIC FUEL ALLOCATION SYSTEM SERIALIZERS
# ===================================================================

class FuelAllocationRuleSerializer(serializers.ModelSerializer):
    """Serializer for Fuel Allocation Rules"""
    
    class Meta:
        model = FuelAllocationRule
        fields = [
            'id', 'rule_name', 'description', 'is_active',
            'engine_capacity_bands', 'distance_calculation_mode',
            'session_top_up_mode', 'created_date', 'last_modified'
        ]
        read_only_fields = ['id', 'created_date', 'last_modified']

    def validate_engine_capacity_bands(self, value):
        """Validate engine capacity bands structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Engine capacity bands must be a dictionary")
        
        required_keys = ['small_engine', 'medium_engine', 'large_engine']
        for key in required_keys:
            if key not in value:
                raise serializers.ValidationError(f"Missing required key: {key}")
            if not isinstance(value[key], dict):
                raise serializers.ValidationError(f"{key} must be a dictionary")
            if 'min_cc' not in value[key] or 'max_cc' not in value[key] or 'constant' not in value[key]:
                raise serializers.ValidationError(f"{key} must have min_cc, max_cc, and constant")
        
        return value


class FuelPriceSerializer(serializers.ModelSerializer):
    """Serializer for Fuel Prices"""
    
    class Meta:
        model = FuelPrice
        fields = [
            'id', 'fuel_type', 'price_usd_per_litre', 'price_zwg_per_litre',
            'exchange_rate_usd_to_zwg', 'effective_from', 'effective_to',
            'is_current', 'created_date', 'last_modified'
        ]
        read_only_fields = ['id', 'created_date', 'last_modified']

    def validate(self, data):
        """Validate fuel price data"""
        if data.get('effective_to') and data.get('effective_from'):
            if data['effective_to'] <= data['effective_from']:
                raise serializers.ValidationError("Effective to date must be after effective from date")
        
        if data.get('price_usd_per_litre', 0) <= 0:
            raise serializers.ValidationError("USD price must be greater than 0")
        
        if data.get('exchange_rate_usd_to_zwg', 0) <= 0:
            raise serializers.ValidationError("Exchange rate must be greater than 0")
        
        return data


class DynamicAllocationSerializer(serializers.ModelSerializer):
    """Serializer for Dynamic Allocations"""
    
    beneficiary_name = serializers.CharField(source='beneficiary.get_full_name', read_only=True)
    constituency_name = serializers.CharField(source='beneficiary.constituency.name', read_only=True)
    session_name = serializers.CharField(source='session.name', read_only=True)
    rule_name = serializers.CharField(source='allocation_rule.rule_name', read_only=True)
    
    class Meta:
        model = DynamicAllocation
        fields = [
            'id', 'beneficiary', 'beneficiary_name', 'constituency_name',
            'session', 'session_name', 'allocation_rule', 'rule_name',
            'calculated_allocation_usd', 'calculated_allocation_litres',
            'final_allocation_litres', 'is_committed', 'committed_by',
            'committed_date', 'calculation_details', 'created_date',
            'last_modified'
        ]
        read_only_fields = [
            'id', 'beneficiary_name', 'constituency_name', 'session_name',
            'rule_name', 'committed_date', 'created_date', 'last_modified'
        ]

    def validate(self, data):
        """Validate dynamic allocation data"""
        if data.get('is_committed') and not data.get('committed_by'):
            raise serializers.ValidationError("Committed by is required when allocation is committed")
        
        if data.get('final_allocation_litres', 0) < 0:
            raise serializers.ValidationError("Final allocation cannot be negative")
        
        return data


class DynamicAllocationPreviewSerializer(serializers.Serializer):
    """Serializer for allocation preview requests"""
    
    beneficiary_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of beneficiary IDs to calculate allocations for"
    )
    session_id = serializers.IntegerField(help_text="Parliament session ID")
    allocation_rule_id = serializers.IntegerField(help_text="Allocation rule ID to use")
    
    def validate_beneficiary_ids(self, value):
        """Validate beneficiary IDs"""
        if not value:
            raise serializers.ValidationError("At least one beneficiary ID is required")
        
        # Check if all beneficiaries exist
        from .models import BeneficiaryProfile
        existing_ids = set(BeneficiaryProfile.objects.filter(id__in=value).values_list('id', flat=True))
        missing_ids = set(value) - existing_ids
        if missing_ids:
            raise serializers.ValidationError(f"Beneficiaries not found: {list(missing_ids)}")
        
        return value
    
    def validate_session_id(self, value):
        """Validate session ID"""
        from .models import ParliamentSession
        if not ParliamentSession.objects.filter(id=value).exists():
            raise serializers.ValidationError("Parliament session not found")
        return value
    
    def validate_allocation_rule_id(self, value):
        """Validate allocation rule ID"""
        from .models import FuelAllocationRule
        if not FuelAllocationRule.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Active allocation rule not found")
        return value


class AllocationPreviewResultSerializer(serializers.Serializer):
    """Serializer for allocation preview results"""
    
    beneficiary_id = serializers.IntegerField()
    beneficiary_name = serializers.CharField()
    constituency_name = serializers.CharField()
    engine_capacity_cc = serializers.IntegerField()
    distance_from_parliament_km = serializers.DecimalField(max_digits=10, decimal_places=2)
    calculated_allocation_usd = serializers.DecimalField(max_digits=10, decimal_places=2)
    calculated_allocation_litres = serializers.DecimalField(max_digits=10, decimal_places=2)
    session_top_up_litres = serializers.DecimalField(max_digits=10, decimal_places=2)
    final_allocation_litres = serializers.DecimalField(max_digits=10, decimal_places=2)
    calculation_breakdown = serializers.DictField()


class DynamicAllocationAnalyticsSerializer(serializers.Serializer):
    """Serializer for allocation analytics data"""
    
    total_allocations = serializers.IntegerField()
    total_litres_allocated = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_usd_allocated = serializers.DecimalField(max_digits=15, decimal_places=2)
    committed_allocations = serializers.IntegerField()
    pending_allocations = serializers.IntegerField()
    average_allocation_per_beneficiary = serializers.DecimalField(max_digits=10, decimal_places=2)
    top_constituencies = serializers.ListField(child=serializers.DictField())
    allocation_trends = serializers.ListField(child=serializers.DictField())
    engine_capacity_distribution = serializers.DictField()


class CalculationRequestSerializer(serializers.Serializer):
    """Serializer for individual allocation calculation requests"""
    
    beneficiary_id = serializers.IntegerField()
    session_id = serializers.IntegerField()
    allocation_rule_id = serializers.IntegerField()
    override_distance = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False,
        help_text="Optional override for distance calculation"
    )
    override_engine_capacity = serializers.IntegerField(
        required=False,
        help_text="Optional override for engine capacity"
    )
    
    def validate_beneficiary_id(self, value):
        """Validate beneficiary ID"""
        from .models import BeneficiaryProfile
        if not BeneficiaryProfile.objects.filter(id=value).exists():
            raise serializers.ValidationError("Beneficiary not found")
        return value
    
    def validate_session_id(self, value):
        """Validate session ID"""
        from .models import ParliamentSession
        if not ParliamentSession.objects.filter(id=value).exists():
            raise serializers.ValidationError("Parliament session not found")
        return value
    
    def validate_allocation_rule_id(self, value):
        """Validate allocation rule ID"""
        from .models import FuelAllocationRule
        if not FuelAllocationRule.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Active allocation rule not found")
        return value