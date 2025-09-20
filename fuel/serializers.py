# fuel/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.db import models
from django.utils import timezone
from decimal import Decimal

class CategoryField(serializers.Field):
    """Custom field that accepts category name for writes and returns structured data for reads"""
    
    def to_representation(self, value):
        """Convert database object to structured data for API response"""
        if value:
            return {
                'name': value.name,
                'description': value.description,
                'id': value.id
            }
        return None
    
    def to_internal_value(self, data):
        """Convert string from API request to database value"""
        if not data:
            return None
        # Return the string value - will be handled in serializer's update method
        return data

class ConstituencyField(serializers.Field):
    """Custom field that accepts constituency name for writes and returns object for reads"""
    
    def to_representation(self, value):
        """Convert database object to structured data for API response"""
        if value:
            return {
                'name': value.name,
                'province': value.province,
                'district': value.district,
                'id': value.id
            }
        return None
    
    def to_internal_value(self, data):
        """Convert string from API request to database value"""
        if not data:
            return None
        # Return the string value - will be handled in serializer's update method
        return data
# from rest_framework.exceptions import AuthenticationFailed # Not used in provided code
# from typing import List, Dict, Optional, Union # Not used in provided code
try:
    from .models import (
        User, SubCenter, Box, Book, Coupon,
        FuelData, FuelTransaction, CouponDistribution, SubCenterOfficer,
        BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
        BeneficiaryProfile, AuditLog, BookDispatch, CouponAllocation, CouponHandover, SystemAlert, FuelEntitlement,
        PoolVehicle, Driver, VehicleAssignment, BookPage, SessionAttendance,
        FuelRequirementConfiguration, Program, HarmonizedBeneficiaryProfile,
        # Dynamic Fuel Allocation System Models
        FuelAllocationRule, FuelPrice, DynamicAllocation,
        # Attendance Management Models
        SessionAttendanceRegistry, AttendanceRegistryMember, AttendanceCorrection
    )
except Exception:
    # Fallback when HarmonizedBeneficiaryProfile (or other optional models) is not present
    from .models import (
        User, SubCenter, Box, Book, Coupon,
        FuelData, FuelTransaction, CouponDistribution, SubCenterOfficer,
        BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
        BeneficiaryProfile, AuditLog, BookDispatch, CouponAllocation, CouponHandover, SystemAlert, FuelEntitlement,
        PoolVehicle, Driver, VehicleAssignment, BookPage, SessionAttendance,
        FuelRequirementConfiguration, Program,
        # Dynamic Fuel Allocation System Models
        FuelAllocationRule, FuelPrice, DynamicAllocation,
        # Attendance Management Models
        SessionAttendanceRegistry, AttendanceRegistryMember, AttendanceCorrection
    )
    HarmonizedBeneficiaryProfile = None  # type: ignore
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
    sub_center_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'sub_center_id') # Include sub_center_id
    
    def get_sub_center_id(self, obj):
        return obj.sub_center.id if obj.sub_center else None


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

# --- Graceful handling when HarmonizedBeneficiaryProfile model is absent ---
if HarmonizedBeneficiaryProfile is None:
    # Provide no-op serializer stubs to keep imports working; endpoints using these will be disabled elsewhere.
    class HarmonizedBeneficiaryProfileSerializer(serializers.Serializer):
        pass

    class HarmonizedBeneficiaryProfileWriteSerializer(serializers.Serializer):
        pass

    class HarmonizedBeneficiaryProfileListSerializer(serializers.Serializer):
        pass


class BookDispatchSerializer(serializers.ModelSerializer):
    """Enhanced serializer for book dispatch with intelligent coupon generation support"""
    from_center = SimpleSubCenterSerializer(read_only=True)
    to_center = SimpleSubCenterSerializer(read_only=True)
    dispatched_by = SimpleUserSerializer(read_only=True)
    received_by = SimpleUserSerializer(read_only=True)
    books = SimpleBookSerializer(many=True, read_only=True)
    total_books = serializers.ReadOnlyField()
    total_value_usd = serializers.ReadOnlyField()
    
    # Optional linkages for analytics
    program = serializers.PrimaryKeyRelatedField(queryset=Program.objects.all(), required=False, allow_null=True)
    session = serializers.PrimaryKeyRelatedField(queryset=ParliamentSession.objects.all(), required=False, allow_null=True)
    
    # Enhanced fields for intelligent dispatch
    dispatch_id = serializers.SerializerMethodField()
    subcenter_name = serializers.CharField(source='to_center.name', read_only=True)
    dispatched_date = serializers.DateField(source='dispatch_date', read_only=True)
    dispatched_time = serializers.TimeField(source='dispatch_date', read_only=True)
    
    # Calculated fields
    total_coupons = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta:
        model = BookDispatch
        fields = [
            'id', 'dispatch_id', 'to_center', 'subcenter_name',
            'dispatched_by', 'received_by', 'books', 'total_books',
            'dispatch_date', 'dispatched_date', 'dispatched_time', 'status',
            # Linkages
            'program', 'session',
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
    
    # Frontend-expected computed fields
    users_count = serializers.SerializerMethodField()
    active_programs = serializers.SerializerMethodField()
    distributed_coupons = serializers.SerializerMethodField()
    capacity = serializers.IntegerField(required=False, allow_null=True)
    
    # Additional frontend expected fields
    contact_person = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    contact_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    # Frontend aliases
    phone = serializers.CharField(source='contact_number', required=False, allow_blank=True, allow_null=True)
    status = serializers.SerializerMethodField()  # 'active' | 'inactive' | 'maintenance'
    created_at = serializers.DateTimeField(source='created', read_only=True)
    updated_at = serializers.DateTimeField(source='modified', read_only=True)

    class Meta:
        model = SubCenter
        # Added 'created', 'modified' from TimeStampedModel + frontend fields
        fields = [
            'id', 'code', 'name', 'location', 'managed_by', 'managed_by_details', 
            'is_active', 'capacity', 'users_count', 'active_programs', 
            'distributed_coupons', 'created', 'modified',
            'contact_person', 'contact_number', 'email', 'phone', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created', 'modified', 'created_at', 'updated_at', 'users_count', 
            'active_programs', 'distributed_coupons', 'status', 'phone'
        ] # Set computed and timestamp fields as readonly
    
    def get_status(self, obj):
        """Get status in frontend-expected format"""
        if not obj.is_active:
            return 'inactive'
        # You can add more logic here for 'maintenance' status if needed
        return 'active'
    
    def get_users_count(self, obj):
        """Get count of users assigned to this subcenter"""
        return User.objects.filter(sub_center=obj, is_active=True).count()
    
    def get_active_programs(self, obj):
        """Get count of active programs for this subcenter"""
        from django.utils import timezone
        try:
            return Program.objects.filter(
                sub_center=obj,
                is_active=True,
                end_date__gte=timezone.now().date()
            ).count()
        except:
            return 0
    
    def get_distributed_coupons(self, obj):
        """Get count of distributed coupons from this subcenter"""
        return Coupon.objects.filter(
            book__box__assigned_to=obj,
            status='USED'
        ).count()


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
    # Use method field to safely handle null received_by in prod
    receivedBy = serializers.SerializerMethodField(read_only=True)
    
    # Fuel and Structure Information
    fuelType = serializers.CharField(source='fuel_type', required=False)
    couponAmount = serializers.IntegerField(source='denomination', required=False)
    
    # Financial Information (USD)
    # Align serializer precision with model fields to avoid serialization errors in prod
    fuelPricePerLitreUSD = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=8, decimal_places=4, required=False)
    fuelPricePerLitreUsd = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=8, decimal_places=4, required=False)
    fuelPriceUSD = serializers.DecimalField(source='fuel_price_per_litre_usd', max_digits=8, decimal_places=4, required=False, write_only=True)
    totalValueUsd = serializers.DecimalField(source='total_value_usd', max_digits=12, decimal_places=2, required=False)
    exchangeRate = serializers.DecimalField(source='exchange_rate_zwg_usd', max_digits=8, decimal_places=4, required=False)
    exchangeRateZwgUsd = serializers.DecimalField(source='exchange_rate_zwg_usd', max_digits=8, decimal_places=4, required=False)
    
    # Financial Information (ZWG) - Legacy support
    fuelPricePerLitre = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, write_only=True)
    monetaryValueUSD = serializers.DecimalField(source='total_value_usd', max_digits=12, decimal_places=2, required=False)
    
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
    
    # Inventory tracking fields
    booksDispatched = serializers.IntegerField(source='books_dispatched', required=False)
    couponsUsed = serializers.IntegerField(source='coupons_used', required=False)
    litresUsed = serializers.DecimalField(source='litres_used', max_digits=10, decimal_places=2, required=False)
    
    # Calculated property fields (read-only)
    booksRemaining = serializers.SerializerMethodField(read_only=True)
    couponsRemaining = serializers.SerializerMethodField(read_only=True)
    litresRemaining = serializers.SerializerMethodField(read_only=True)
    monetaryValue = serializers.SerializerMethodField(read_only=True)

    coupon_range = serializers.SerializerMethodField()

    def get_coupon_range(self, obj):
        return f"{obj.first_coupon_number} {obj.last_coupon_number}"
    
    def get_booksRemaining(self, obj):
        """Calculate books remaining"""
        return max(0, obj.number_of_books - (obj.books_dispatched or 0))
    
    def get_couponsRemaining(self, obj):
        """Calculate coupons remaining"""
        return max(0, obj.total_coupons_calculated - (obj.coupons_used or 0))
    
    def get_litresRemaining(self, obj):
        """Calculate litres remaining"""
        return max(0, float(obj.total_litres or 0) - float(obj.litres_used or 0))
    
    def get_monetaryValue(self, obj):
        """Return monetary value (alias for total_value_zwg)"""
        return obj.total_value_zwg or 0

    def get_receivedBy(self, obj):
        """Safely return the full name of the receiver or empty string."""
        try:
            return obj.received_by.get_full_name() if getattr(obj, 'received_by', None) else ""
        except Exception:
            return ""

    def validate(self, data):
        # If coupon_range is present, use it to set first and last coupon numbers
        coupon_range = self.initial_data.get('coupon_range')
        if coupon_range and 'undefined' not in coupon_range and coupon_range.strip() != '':
            parts = coupon_range.split()
            if len(parts) == 2 and all(parts):
                data['first_coupon_number'] = parts[0]
                data['last_coupon_number'] = parts[1]
        # Allow saving with just first_coupon_number, number_of_books, and coupons_per_book
        # Only require last_coupon_number if books are being generated
        # Validate calculated fields if present
        total_coupons = data.get('total_coupons_calculated')
        total_litres = data.get('total_litres')
        total_value_usd = data.get('total_value_usd')
        if (total_coupons is not None and total_coupons <= 0) or (total_litres is not None and total_litres <= 0) or (total_value_usd is not None and total_value_usd <= 0):
            raise serializers.ValidationError({'calculated_fields': 'Calculated totals (coupons, litres, or value) must be greater than zero.'})
        # Accept booksGenerated as book_details if book_details is missing
        book_details = self.initial_data.get('book_details')
        books_generated = self.initial_data.get('booksGenerated')
        if not book_details and books_generated:
            data['book_details'] = books_generated
        # Only require book_details if books are being generated
        return data

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
            'coupon_range',
            
            # Calculated Totals
            'total_coupons_calculated', 'total_coupons', 'totalCoupons',
            'total_litres', 'totalLitres',
            
            # Financial Information (USD)
            'fuel_price_per_litre_usd', 'fuelPricePerLitreUSD', 'fuelPricePerLitreUsd', 'fuelPriceUSD',
            'exchange_rate_zwg_usd', 'exchange_rate', 'exchangeRate', 'exchangeRateZwgUsd',
            'total_value_usd', 'total_value_zwg', 'monetaryValueUSD', 'totalValueUSD', 'totalValueZWG', 'totalValueUsd',
            
            # Financial Information (ZWG) - Legacy
            'fuelPricePerLitre', 'monetary_value_usd',
            
            # Inventory Tracking Fields
            'books_dispatched', 'coupons_used', 'litres_used', 'location',
            'booksDispatched', 'couponsUsed', 'litresUsed',
            'booksRemaining', 'couponsRemaining', 'litresRemaining', 'monetaryValue',
            
            # Status and Workflow
            'status', 'verification_notes', 'verificationNotes', 'couponVerificationNotes', 'verified_at', 'verified_by',
            'verification_checks', 'signed_off_by', 'sign_off_date', 'sign_off_notes',
            
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
            'totalCoupons', 'totalValueUSD', 'totalValueZWG', 'receivedBy', 'current_user_full_name',
            'booksRemaining', 'couponsRemaining', 'litresRemaining', 'monetaryValue'
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
                logger.info(f"Generating {len(book_details)} books from frontend details")
                seen_book_numbers = set()
                for book_data in book_details:
                    # Always use book_number, fallback to book_id
                    book_number = str(book_data.get('book_number') or book_data.get('book_id') or 'Unknown')
                    if book_number in seen_book_numbers:
                        logger.warning(f"Duplicate book_number '{book_number}' in incoming list, skipping.")
                        continue
                    seen_book_numbers.add(book_number)
                    first_coupon = book_data.get('first_coupon_number') or book_data.get('first_coupon_id', '')
                    last_coupon = book_data.get('last_coupon_number') or book_data.get('last_coupon_id', '')
                    coupon_count = book_data.get('number_of_coupons', book_data.get('coupons_count', 100))
                    # Create the book
                    Book.objects.create(
                        box=box,
                        book_number=book_number,
                        first_coupon_number=first_coupon,
                        last_coupon_number=last_coupon,
                        initial_coupon_count=coupon_count,
                        generated_by=getattr(self.context.get('request', None), 'user', None)
                    )
                    logger.info(f"Created book {book_number} with range {first_coupon}-{last_coupon}")
            elif box.number_of_books and box.coupons_per_book and box.first_coupon_number and box.last_coupon_number:
                logger.info(f"Generating {box.number_of_books} books automatically from box parameters")
                box.generate_books_and_coupons()
        except Exception as e:
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
            # Remove existing books for this box before recreating
            instance.books.all().delete()
            self._generate_books_for_box(instance, book_details)
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
            'verification_checks',
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
    serialNumber = serializers.CharField
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
        try:
            scheduled_date = data.get('scheduled_date')
            end_date = data.get('end_date')
            if scheduled_date and end_date:
                if end_date <= scheduled_date:
                    raise serializers.ValidationError("End date must be after scheduled date.")
            organizer = data.get('organizer')
            if organizer:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if isinstance(organizer, int) or isinstance(organizer, str):
                    try:
                        organizer_obj = User.objects.get(pk=organizer)
                        data['organizer'] = organizer_obj
                        organizer = organizer_obj
                    except User.DoesNotExist:
                        raise serializers.ValidationError("Organizer user does not exist.")
                if hasattr(organizer, 'role'):
                    valid_roles = ['MAIN_CENTER', 'SUB_CENTER', 'ADMIN', 'SUPER_ADMIN', 'SUPERUSER']
                    if organizer.role not in valid_roles:
                        raise serializers.ValidationError("Organizer must have appropriate role permissions.")
            return data
        except serializers.ValidationError as e:
            print("Program validation error:", e, "Data:", data)
            raise
    
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
    """Enhanced Parliament Session serializer with comprehensive field mapping"""
    attendance_count = serializers.SerializerMethodField()
    total_fuel_allocated = serializers.SerializerMethodField()
    organizer_details = SimpleUserSerializer(source='organizer', read_only=True)
    managing_subcenter_details = SubCenterSerializer(source='managing_subcenter', read_only=True)
    program_details = serializers.SerializerMethodField()
    def validate(self, data):
        """Normalize and validate incoming data for parliament sessions.

        - Coerce assigned_attendees elements to integers when possible so the
          API accepts either string or numeric IDs from various frontends.
        - Log a compact debug message for easier troubleshooting in dev.
        """
        # Compact debug print to avoid excessive logs in production
        try:
            assigned = data.get('assigned_attendees', None)
            if assigned is not None:
                coerced: list[int] = []
                for a in assigned:
                    if a is None:
                        continue
                    if isinstance(a, int):
                        coerced.append(a)
                        continue
                    # Attempt to coerce strings like '123' to int
                    if isinstance(a, str) and a.isdigit():
                        coerced.append(int(a))
                        continue
                    # Try a fallback parse for more complex numeric strings
                    try:
                        coerced.append(int(float(a)))
                    except Exception:
                        # If coercion fails, raise a validation error with details
                        raise serializers.ValidationError({'assigned_attendees': 'Invalid attendee id: %r' % (a,)})

                data['assigned_attendees'] = coerced

            # Minimal debug logging (prints only in dev where stdout is observed)
            print('ParliamentSessionSerializer.validate received keys:', list(data.keys()))
        except serializers.ValidationError:
            # Re-raise validation errors so DRF returns proper 400 responses
            raise
        except Exception as exc:
            # Convert unexpected exceptions into validation errors
            raise serializers.ValidationError({'non_field_errors': str(exc)})

        return data
    
    # Enhanced fields for frontend compatibility
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    organizer_name = serializers.SerializerMethodField()
    managing_subcenter_name = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    assigned_attendees_details = serializers.SerializerMethodField()
    # Keep output as PKRelatedField (read-only) but accept flexible input via `assigned_attendees_input`
    assigned_attendees = serializers.PrimaryKeyRelatedField(
    many=True,
    queryset=BeneficiaryProfile.objects.all()
    )
    assigned_attendees_input = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text='List of beneficiary profile IDs (strings or numbers)'
    )
    
    class Meta:
        model = ParliamentSession
        fields = [
            'id', 'title', 'session_type', 'session_type_display',
            'start_date', 'end_date', 'start_time', 'end_time',
            'description', 'venue', 'is_active', 'is_mandatory',
            'organizer', 'organizer_details', 'organizer_name',
            'managing_subcenter', 'managing_subcenter_details', 'managing_subcenter_name',
            'program', 'program_details',
            'fuel_top_up_litres', 'fuel_top_up_percentage', 'expected_attendance',
            'attendance_tracked', 'attendance_count','assigned_attendees_input',
            'assigned_attendees', 'assigned_attendees_details',
            'total_fuel_allocated', 'duration_days', 'status',
            'created', 'modified'
        ]
        read_only_fields = [
            'created', 'modified', 'attendance_count', 'total_fuel_allocated',
            'organizer_details', 'managing_subcenter_details', 'program_details',
            'session_type_display', 'organizer_name', 'managing_subcenter_name',
            'duration_days', 'status'
        ]
    
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
    
    def get_program_details(self, obj):
        """Get program details if associated with the session"""
        if not obj.program:
            return None
        # Derive a friendly status for the program (frontend expects a status field)
        program = obj.program
        try:
            from django.utils import timezone
            today = timezone.now().date()
            # Program uses scheduled_date and end_date (DateTimeFields)
            scheduled = program.scheduled_date.date() if program.scheduled_date else None
            end_dt = program.end_date.date() if program.end_date else None
            if not program.is_active:
                prog_status = 'inactive'
            elif scheduled and scheduled > today:
                prog_status = 'upcoming'
            elif scheduled and end_dt and scheduled <= today <= end_dt:
                prog_status = 'active'
            else:
                prog_status = 'completed' if end_dt and end_dt < today else 'active'
        except Exception:
            prog_status = 'unknown'

        return {
            'id': program.id,
            'name': getattr(program, 'title', None),
            'description': getattr(program, 'description', None),
            'start_date': program.scheduled_date.isoformat() if getattr(program, 'scheduled_date', None) else None,
            'end_date': program.end_date.isoformat() if getattr(program, 'end_date', None) else None,
            'status': prog_status
        }
    
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
    
    def get_status(self, obj):
        """Get session status based on dates"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if not obj.is_active:
            return 'inactive'
        elif obj.start_date > today:
            return 'upcoming'
        elif obj.start_date <= today <= obj.end_date:
            return 'active'
        else:
            return 'completed'
    
    def get_assigned_attendees_details(self, obj):
        """Get detailed information about assigned attendees"""
        attendees = obj.assigned_attendees.all()
        return [{
            'id': attendee.id,
            'name': attendee.name if hasattr(attendee, 'name') else f"{attendee.user.first_name} {attendee.user.last_name}" if attendee.user else attendee.employee_id,
            'employee_id': attendee.employee_id,
            'category': attendee.category.name if attendee.category else None,
            'constituency': attendee.constituency.name if attendee.constituency else None,
        } for attendee in attendees[:50]]  # Limit to 50 to avoid huge responses

    def create(self, validated_data):
        # Pop the write-only input and handle M2M assignment
        attendees_input = validated_data.pop('assigned_attendees_input', [])
        session = super().create(validated_data)
        if attendees_input:
            ids = []
            for a in attendees_input:
                try:
                    ids.append(int(a))
                except Exception:
                    continue
            if ids:
                session.assigned_attendees.set(BeneficiaryProfile.objects.filter(id__in=ids))
        return session

    def update(self, instance, validated_data):
        attendees_input = validated_data.pop('assigned_attendees_input', None)
        session = super().update(instance, validated_data)
        if attendees_input is not None:
            ids = []
            for a in attendees_input:
                try:
                    ids.append(int(a))
                except Exception:
                    continue
            session.assigned_attendees.set(BeneficiaryProfile.objects.filter(id__in=ids))
        return session
    def get_organizer_name(self, obj):
        if hasattr(obj, 'organizer') and obj.organizer:
            # Adjust as needed for your model fields
            if hasattr(obj.organizer, 'get_full_name'):
                return obj.organizer.get_full_name()
            elif hasattr(obj.organizer, 'first_name') and hasattr(obj.organizer, 'last_name'):
                return f"{obj.organizer.first_name} {obj.organizer.last_name}".strip()
            elif hasattr(obj.organizer, 'username'):
                return obj.organizer.username
            else:
                return str(obj.organizer)
        return None

    def get_managing_subcenter_name(self, obj):
        if hasattr(obj, 'managing_subcenter') and obj.managing_subcenter:
            if hasattr(obj.managing_subcenter, 'name'):
                return obj.managing_subcenter.name
            else:
                return str(obj.managing_subcenter)
        return None

class BeneficiaryProfileSerializer(serializers.ModelSerializer):
    """
    Enhanced BeneficiaryProfile serializer aligned with frontend interfaces
    """
    # Frontend-compatible field mappings
    id = serializers.ReadOnlyField()
    parliamentaryId = serializers.CharField(source='employee_id', read_only=True)
    memberId = serializers.CharField(source='employee_id', read_only=True)
    name = serializers.SerializerMethodField()
    title = serializers.CharField(source='position', read_only=True)
    phoneNumber = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    dateOfBirth = serializers.SerializerMethodField()
    nationalId = serializers.SerializerMethodField()
    profilePhoto = serializers.SerializerMethodField()
    # status field is handled by the model field directly
    
    # Related objects - custom fields that handle both read and write
    category = CategoryField(required=False, allow_null=True)
    constituency = ConstituencyField(required=False) 
    party = serializers.CharField(required=False, allow_blank=True, source='party_affiliation')
    
    # Structured data for frontend
    contactInfo = serializers.SerializerMethodField()
    vehicleInfo = serializers.SerializerMethodField()
    allocationProfile = serializers.SerializerMethodField()
    entitlements = serializers.SerializerMethodField()
    fuelUsage = serializers.SerializerMethodField()
    vehicles = serializers.SerializerMethodField()
    
    # Timestamps
    lastActivity = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created', read_only=True)
    joinDate = serializers.DateTimeField(source='created', read_only=True)
    lastLogin = serializers.SerializerMethodField()
    
    # Nested user data for creation (write-only)
    user = serializers.JSONField(write_only=True, required=False)
    
    # Legacy fields for backward compatibility
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
        extra_kwargs = {
            # Allow writing to category and constituency via string names
            'category': {'required': False},
            'constituency': {'required': False},
        }
    
    def get_name(self, obj):
        """Get full name from user object"""
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return ""
    
    def get_phoneNumber(self, obj):
        """Get phone number from user object"""
        return obj.user.phone if obj.user else ""
    
    def get_email(self, obj):
        """Get email from user object"""
        return obj.user.email if obj.user else ""
    
    def get_address(self, obj):
        """Get address from user object"""
        return obj.user.full_address if obj.user else ""
    

    
    def get_dateOfBirth(self, obj):
        """Get date of birth (placeholder for now)"""
        return None  # Add actual field when available
    
    def get_nationalId(self, obj):
        """Get national ID from user object"""
        return obj.user.national_id if obj.user else ""
    
    def get_profilePhoto(self, obj):
        """Get profile photo from user object"""
        return obj.user.profile_picture if obj.user else ""
    
    def get_status(self, obj):
        """Get beneficiary status"""
        # Use the new status field if it exists, otherwise fall back to computed status
        if hasattr(obj, 'status') and obj.status:
            return obj.status
        # Fallback for backward compatibility
        if not obj.is_active_beneficiary:
            return 'INACTIVE'
        if obj.user and obj.user.is_approved:
            return 'ACTIVE'
        return 'SUSPENDED'
    

    
    def get_contactInfo(self, obj):
        """Get structured contact info for frontend"""
        return {
            'email': obj.user.email if obj.user else "",
            'phone': obj.user.phone if obj.user else "",
            'office': obj.office_location,
            'address': obj.user.full_address if obj.user else ""
        }
    
    def get_vehicleInfo(self, obj):
        """Get structured vehicle info for frontend"""
        return {
            'make': obj.vehicle_make,
            'model': obj.vehicle_model,
            'year': obj.vehicle_year,
            'engineSize': obj.engine_size,
            'registrationNumber': obj.vehicle_registration,
            'fuelType': obj.fuel_type
        }
    
    def get_allocationProfile(self, obj):
        """Get allocation profile for frontend"""
        return {
            'monthlyAllocation': float(obj.monthly_entitlement_litres),
            'currentBalance': float(obj.current_balance) if hasattr(obj, 'current_balance') else 0,
            'usedThisMonth': float(obj.used_this_month) if hasattr(obj, 'used_this_month') else 0,
            'lastUpdated': obj.last_allocation_date.isoformat() if hasattr(obj, 'last_allocation_date') and obj.last_allocation_date else None,
            'baseAllocation': float(obj.base_allocation),
            'multiplier': float(obj.category_multiplier)
        }
    
    def get_entitlements(self, obj):
        """Get entitlements for frontend"""
        return {
            'monthlyAllocation': float(obj.monthly_entitlement_litres),
            'maxPerTransaction': 100,  # Default value, customize as needed
            'vehicleCount': 1  # For now, single vehicle per beneficiary
        }
    
    def get_fuelUsage(self, obj):
        """Get fuel usage statistics"""
        # Calculate usage from allocations
        current_month_usage = 0
        last_month_usage = 0
        year_to_date_usage = 0
        total_usage = 0
        
        # These would be calculated from actual allocation records
        # For now, return placeholder values
        return {
            'currentMonth': current_month_usage,
            'lastMonth': last_month_usage,
            'yearToDate': year_to_date_usage,
            'totalUsed': total_usage
        }
    
    def get_vehicles(self, obj):
        """Get vehicles array for frontend"""
        if obj.vehicle_make or obj.vehicle_model or obj.vehicle_registration:
            return [{
                'id': str(obj.id),
                'registration': obj.vehicle_registration,
                'make': obj.vehicle_make,
                'model': obj.vehicle_model,
                'year': obj.vehicle_year,
                'fuelType': obj.fuel_type
            }]
        return []
    
    def get_lastActivity(self, obj):
        """Get last activity timestamp"""
        if obj.user and obj.user.last_activity:
            return obj.user.last_activity.isoformat()
        return ""
    
    def get_lastLogin(self, obj):
        """Get last login timestamp"""
        if obj.user and obj.user.last_activity:
            return obj.user.last_activity.isoformat()
        return ""

    def get_total_allocated_this_month(self, obj):
        from datetime import datetime
        current_month = datetime.now().replace(day=1)
        return obj.user.allocated_coupons.filter(
            allocated_date__gte=current_month,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=models.Sum('litres'))['total'] or 0
    
    def get_pending_entitlements(self, obj):
        try:
            user = getattr(obj, 'user', None)
            if not user:
                return 0
            ent_qs = getattr(user, 'fuel_entitlements', None)
            # If the reverse relation doesn't exist (older schema), return 0 gracefully
            if ent_qs is None:
                return 0
            # Some older schemas may not have status/period_end; guard filters
            from django.db.models import F
            try:
                return ent_qs.filter(
                    status__in=['PENDING', 'APPROVED'],
                    period_end__gte=timezone.now().date()
                ).count()
            except Exception:
                # Fallback: just count all related entitlements if fields are missing
                return ent_qs.count()
        except Exception:
            return 0
    
    def validate_employee_id(self, value):
        """Validate employee_id to ensure uniqueness"""
        if value:
            # For updates, exclude the current instance
            queryset = BeneficiaryProfile.objects.filter(employee_id=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError("A beneficiary with this employee ID already exists.")
        
        return value or None  # Convert empty string to None
    
    def create(self, validated_data):
        """Create a new beneficiary with associated user - Enhanced with auto-population"""
        from django.contrib.auth import get_user_model
        from .models import BeneficiaryCategory, Constituency, VehicleCategory
        from decimal import Decimal
        import time
        
        # Debug: Print incoming data
        print("=== BENEFICIARY SERIALIZER CREATE ===")
        print("Validated data:", validated_data)
        
        User = get_user_model()
        
        # Extract user data if provided
        user_data = validated_data.pop('user', {})
        print("User data:", user_data)
        
        # Extract foreign key IDs
        category_id = validated_data.pop('category', None)
        constituency_id = validated_data.pop('constituency', None)
        vehicle_category_id = validated_data.pop('vehicle_category', None)
        
        print("Category ID:", category_id)
        print("Constituency ID:", constituency_id)
        print("Vehicle Category ID:", vehicle_category_id)
        
        # NEW: Check if user_data contains an existing user_id/username to link to
        existing_user = None
        if user_data.get('id'):
            try:
                existing_user = User.objects.get(id=user_data['id'], role='BENEFICIARY')
                print(f"Found existing BENEFICIARY user: {existing_user.username}")
            except User.DoesNotExist:
                print(f"User with ID {user_data['id']} not found or not a BENEFICIARY")
        elif user_data.get('username'):
            try:
                existing_user = User.objects.get(username=user_data['username'], role='BENEFICIARY')
                print(f"Found existing BENEFICIARY user: {existing_user.username}")
            except User.DoesNotExist:
                print(f"User with username {user_data['username']} not found or not a BENEFICIARY")
        elif user_data.get('email'):
            try:
                existing_user = User.objects.get(email=user_data['email'], role='BENEFICIARY')
                print(f"Found existing BENEFICIARY user: {existing_user.username}")
            except User.DoesNotExist:
                print(f"User with email {user_data['email']} not found or not a BENEFICIARY")
        
        # Use existing user or create new one
        if existing_user:
            user = existing_user
            print(f"Using existing user: {user.username} ({user.email})")
            # Auto-populate data from existing user
            if not validated_data.get('employee_id'):
                validated_data['employee_id'] = user.username
            # Extract name info for position if not provided
            if not validated_data.get('position') and user.first_name and user.last_name:
                validated_data['position'] = f"{user.first_name} {user.last_name}"
        elif user_data:
            # Create new user with provided data
            # Generate unique username
            base_username = user_data.get('email', '').split('@')[0] or validated_data.get('employee_id', 'user')
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            
            user_data['username'] = username
            user_data.setdefault('role', 'BENEFICIARY')
            
            # Handle password - set a default if not provided
            if 'password' not in user_data:
                user_data['password'] = 'TempPass123!'  # Should be changed on first login
            
            user = User.objects.create_user(**user_data)
        else:
            # Create a minimal user with required fields
            employee_id = validated_data.get('employee_id', f"user_{int(time.time())}")
            username = employee_id
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{employee_id}_{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                role='BENEFICIARY',
                password='TempPass123!'  # Should be changed on first login
            )
        
        # Set user in validated_data
        validated_data['user'] = user
        
        # Set foreign key relationships - Category is now OPTIONAL
        if category_id:
            try:
                if isinstance(category_id, str):
                    # If it's a string like 'MP', find by name
                    category = BeneficiaryCategory.objects.get(name=category_id)
                else:
                    # If it's an ID, find by ID
                    category = BeneficiaryCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except BeneficiaryCategory.DoesNotExist:
                # Create the category if it doesn't exist
                category_name = category_id if isinstance(category_id, str) else str(category_id)
                category = BeneficiaryCategory.objects.create(
                    name=category_name,
                    description=f"Parliamentary position: {category_name}"
                )
                validated_data['category'] = category
        # No else clause - category can be None now
        
        if constituency_id:
            try:
                if isinstance(constituency_id, str):
                    constituency = Constituency.objects.get(name=constituency_id)
                else:
                    constituency = Constituency.objects.get(id=constituency_id)
                validated_data['constituency'] = constituency
            except Constituency.DoesNotExist:
                # Create the constituency if it doesn't exist
                if isinstance(constituency_id, str):
                    constituency = Constituency.objects.create(
                        name=constituency_id,
                        region="Auto-created"
                    )
                    validated_data['constituency'] = constituency
        
        if vehicle_category_id:
            try:
                vehicle_category = VehicleCategory.objects.get(id=vehicle_category_id)
                validated_data['vehicle_category'] = vehicle_category
            except VehicleCategory.DoesNotExist:
                pass
        
        # Set default values for fields not in frontend
        validated_data.setdefault('engine_multiplier', Decimal('1.0'))
        
        # Party field is now handled automatically via source='party_affiliation'
        
        # Handle employee_id - convert empty string to None for unique constraint
        if 'employee_id' in validated_data and not validated_data['employee_id']:
            validated_data['employee_id'] = None
        
        # Ensure status defaults to ACTIVE
        if 'status' not in validated_data:
            validated_data['status'] = 'ACTIVE'
        
        # Create the beneficiary profile
        print("Final validated_data before creation:", validated_data)
        beneficiary = BeneficiaryProfile.objects.create(**validated_data)
        
        print("Beneficiary created successfully:", beneficiary)
        return beneficiary
    
    def update(self, instance, validated_data):
        """Update beneficiary with proper handling of related fields"""
        print(f"Updating beneficiary {instance.id} with data:", validated_data)
        print(f"Keys in validated_data:", list(validated_data.keys()))
        print(f"Looking for these fields:")
        print(f"  - category: {validated_data.get('category', 'NOT FOUND')}")
        print(f"  - constituency: {validated_data.get('constituency', 'NOT FOUND')}")
        print(f"  - party: {validated_data.get('party', 'NOT FOUND')}")
        print(f"  - position: {validated_data.get('position', 'NOT FOUND')}")
        print(f"  - department: {validated_data.get('department', 'NOT FOUND')}")
        print(f"  - office_location: {validated_data.get('office_location', 'NOT FOUND')}")
        print(f"  - engine_size: {validated_data.get('engine_size', 'NOT FOUND')}")
        print(f"  - current_balance: {validated_data.get('current_balance', 'NOT FOUND')}")
        
        # Handle category field - find or create category by name
        category_id = validated_data.pop('category', None)
        if category_id:
            try:
                if isinstance(category_id, str):
                    # If it's a string, find by name
                    category = BeneficiaryCategory.objects.get(name=category_id)
                else:
                    # If it's an ID, find by ID
                    category = BeneficiaryCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except BeneficiaryCategory.DoesNotExist:
                # Create the category if it doesn't exist
                category_name = category_id if isinstance(category_id, str) else str(category_id)
                category = BeneficiaryCategory.objects.create(
                    name=category_name,
                    description=f"Parliamentary position: {category_name}"
                )
                validated_data['category'] = category
        
        # Handle constituency field - find by name
        constituency_id = validated_data.pop('constituency', None)
        if constituency_id:
            try:
                if isinstance(constituency_id, str):
                    constituency = Constituency.objects.get(name=constituency_id)
                    validated_data['constituency'] = constituency
                # If it's already an ID, let Django handle it
            except Constituency.DoesNotExist:
                print(f"Warning: Constituency '{constituency_id}' not found, skipping update")
        
        # Party field is now handled automatically via source='party_affiliation'
        
        # Update the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Auto-calculate current balance (allocated - used)
        if hasattr(instance, 'monthly_entitlement_litres') and hasattr(instance, 'used_this_month'):
            allocated = instance.monthly_entitlement_litres or Decimal('0')
            used = instance.used_this_month or Decimal('0')
            instance.current_balance = allocated - used
            print(f"Auto-calculated balance: {allocated} - {used} = {instance.current_balance}")
        
        instance.save()
        return instance


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
    """Serializer for FuelEntitlement model with backwards-compatibility.
    Uses runtime model fields and drops optional detail fields if base columns are absent.
    """
    beneficiary_details = SimpleUserSerializer(source='beneficiary', read_only=True)
    session_details = serializers.SerializerMethodField()
    created_by_details = SimpleUserSerializer(source='created_by', read_only=True)
    approved_by_details = SimpleUserSerializer(source='approved_by', read_only=True)

    class Meta:
        model = FuelEntitlement
        fields = '__all__'
        read_only_fields = ['id', 'created', 'modified']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        model_field_names = {f.name for f in FuelEntitlement._meta.get_fields()}
        # Remove companion detail fields if base field doesn't exist
        if 'session' not in model_field_names:
            self.fields.pop('session_details', None)
        if 'created_by' not in model_field_names:
            self.fields.pop('created_by_details', None)
        if 'approved_by' not in model_field_names:
            self.fields.pop('approved_by_details', None)
        if 'beneficiary' not in model_field_names:
            self.fields.pop('beneficiary_details', None)

    def get_session_details(self, obj):
        if hasattr(obj, 'session') and obj.session:
            return {
                'id': getattr(obj.session, 'id', None),
                'title': getattr(obj.session, 'title', None),
                'start_date': getattr(obj.session, 'start_date', None),
                'end_date': getattr(obj.session, 'end_date', None)
            }
        return None


class SystemAlertSerializer(serializers.ModelSerializer):
    """Serializer for SystemAlert model with backwards compatibility"""
    created_by_details = SimpleUserSerializer(source='created_by', read_only=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Check if database has new fields
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT priority FROM fuel_systemalert LIMIT 1;")
            has_new_fields = True
        except Exception:
            has_new_fields = False
        
        # Remove fields that don't exist in old schema
        if not has_new_fields:
            if 'priority' in self.fields:
                del self.fields['priority']
            if 'target_roles' in self.fields:
                del self.fields['target_roles']
            if 'expires_at' in self.fields:
                del self.fields['expires_at']
            if 'is_dismissible' in self.fields:
                del self.fields['is_dismissible']
    
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
    """Enhanced PoolVehicle serializer with frontend compatibility"""
    sub_center_details = SimpleSubCenterSerializer(source='assigned_subcenter', read_only=True)
    current_driver_details = serializers.SerializerMethodField()
    
    # Frontend field mappings (aliases for compatibility)
    vehicle_number = serializers.CharField(source='registration_number', required=False)
    vehicle_category = serializers.CharField(source='vehicle_type', required=False)
    engine_capacity = serializers.IntegerField(source='engine_cc', required=False, allow_null=True)
    sub_center = serializers.PrimaryKeyRelatedField(
        source='assigned_subcenter', 
        queryset=SubCenter.objects.all(), 
        required=False, 
        allow_null=True
    )
    mileage = serializers.IntegerField(source='current_mileage', required=False)
    next_service_date = serializers.DateField(source='next_service_due', required=False, allow_null=True)
    
    # Frontend expected field names (for compatibility)
    assigned_subcenter = serializers.PrimaryKeyRelatedField(
        queryset=SubCenter.objects.all(), 
        required=False, 
        allow_null=True
    )
    current_driver = serializers.SerializerMethodField()
    
    class Meta:
        model = PoolVehicle
        fields = [
            'id', 'registration_number', 'vehicle_number', 'make', 'model', 'year', 
            'engine_cc', 'engine_capacity', 'fuel_type', 'vehicle_type', 'vehicle_category',
            'assigned_subcenter', 'sub_center', 'sub_center_details',
            'status', 'current_mileage', 'mileage', 'last_service_date', 'next_service_due', 'next_service_date',
            'insurance_expiry', 'current_driver_details', 'current_driver',
            'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'current_driver_details', 'current_driver', 'sub_center_details']
    
    def get_current_driver_details(self, obj):
        """Get current driver details from active assignment"""
        current_assignment = obj.assignments.filter(
            status='ACTIVE',
            end_date__isnull=True
        ).first()
        if current_assignment and current_assignment.driver:
            return {
                'id': current_assignment.driver.id,
                'full_name': current_assignment.driver.full_name,
                'employee_id': getattr(current_assignment.driver, 'employee_id', ''),
                'license_number': current_assignment.driver.license_number
            }
        return None
    
    def get_current_driver(self, obj):
        """Get current driver data (alias for frontend compatibility)"""
        return self.get_current_driver_details(obj)


class DriverSerializer(serializers.ModelSerializer):
    """Enhanced Driver serializer with frontend compatibility"""
    current_vehicle_details = serializers.SerializerMethodField()
    
    # All fields are optional for frontend compatibility (backend will handle required validation)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    license_class = serializers.CharField(required=False, allow_blank=True)
    license_expiry = serializers.DateField(required=False, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    assigned_subcenter = serializers.PrimaryKeyRelatedField(
        queryset=SubCenter.objects.all(), 
        required=False, 
        allow_null=True
    )
    hire_date = serializers.DateField(required=False, allow_null=True)
    current_vehicle = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name', 
            'id_number', 'license_number', 'license_class', 'license_expiry',
            'phone_number', 'email', 'address', 'status',
            'assigned_subcenter', 'hire_date', 'current_vehicle_details', 'current_vehicle',
            'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'current_vehicle_details', 'current_vehicle', 'full_name']
    
    def get_current_vehicle_details(self, obj):
        """Get current vehicle details from active assignment"""
        current_assignment = obj.assignments.filter(
            status='ACTIVE',
            end_date__isnull=True
        ).first()
        if current_assignment and current_assignment.vehicle:
            return {
                'id': current_assignment.vehicle.id,
                'registration_number': current_assignment.vehicle.vehicle_number,
                'make': current_assignment.vehicle.make,
                'model': current_assignment.vehicle.model
            }
        return None
    
    def get_current_vehicle(self, obj):
        """Get current vehicle data (alias for frontend compatibility)"""
        return self.get_current_vehicle_details(obj)


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
    parliamentaryId = serializers.CharField(source='employee_id', read_only=True)
    
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
            'id', 'fuel_type', 'price_per_litre_usd', 'price_per_litre_zwg',
            'exchange_rate_usd_zwg', 'effective_date', 'expiry_date',
            'is_active', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified']

    def validate(self, data):
        """Validate fuel price data"""
        if data.get('expiry_date') and data.get('effective_date'):
            if data['expiry_date'] <= data['effective_date']:
                raise serializers.ValidationError("Expiry date must be after effective date")
        
        if data.get('price_per_litre_usd', 0) <= 0:
            raise serializers.ValidationError("USD price must be greater than 0")
        
        if data.get('exchange_rate_usd_zwg', 0) <= 0:
            raise serializers.ValidationError("Exchange rate must be greater than 0")
        
        return data


class DynamicAllocationSerializer(serializers.ModelSerializer):
    """Serializer for Dynamic Allocations"""
    
    beneficiary_name = serializers.CharField(source='beneficiary.get_full_name', read_only=True)
    constituency_name = serializers.CharField(source='beneficiary.constituency.name', read_only=True)
    session_name = serializers.CharField(source='session.title', read_only=True)
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

    def validate(self, data):
        # Validate received_by (must be a valid user ID)
        received_by = data.get('received_by') or self.initial_data.get('received_by')
        if not received_by or str(received_by).strip() in ('', 'null', 'None'):
            raise serializers.ValidationError({'received_by': 'Received By (user) is a required field and cannot be blank.'})

        # Validate supplier (required by business logic)
        supplier = data.get('supplier') or self.initial_data.get('supplier')
        if not supplier or str(supplier).strip() == '':
            raise serializers.ValidationError({'supplier': 'Supplier is a required field and cannot be blank.'})

        # Set defaults for optional fields if blank
        data['delivery_note'] = data.get('delivery_note') or self.initial_data.get('delivery_note') or ''
        data['invoice_number'] = data.get('invoice_number') or self.initial_data.get('invoice_number') or ''
        data['verification_notes'] = data.get('verification_notes') or self.initial_data.get('verification_notes') or ''
        data['received_by_signature'] = data.get('received_by_signature') or self.initial_data.get('received_by_signature') or ''
        # Ensure monetary_value_usd is a number (default to 0 if blank)
        monetary_value_usd = data.get('monetary_value_usd') or self.initial_data.get('monetary_value_usd')
        try:
            data['monetary_value_usd'] = float(monetary_value_usd) if monetary_value_usd not in (None, '', 'null', 'None') else 0
        except Exception:
            data['monetary_value_usd'] = 0

        return data


# ===== MAINCENTER-SPECIFIC SERIALIZERS =====
# These serializers provide enhanced field mappings for MainCenter dashboard components

class MainCenterDashboardSerializer(serializers.Serializer):
    """
    Serializer for MainCenter dashboard statistics
    Provides fields expected by MainCenterDashboard.tsx component
    """
    # Primary Statistics (matching frontend expectations exactly)
    totalBoxesReceived = serializers.IntegerField(help_text="Total boxes received in system")
    totalBooksDispatched = serializers.IntegerField(help_text="Total books dispatched to subcenters")
    totalCouponsActive = serializers.IntegerField(help_text="Total active coupons (available + allocated)")
    totalMonetaryValue = serializers.IntegerField(help_text="Total monetary value in ZWG")
    activeSubCenters = serializers.IntegerField(help_text="Number of active sub-centers")
    pendingHandovers = serializers.IntegerField(help_text="Number of pending handovers")
    
    # Secondary Statistics
    pendingReceipts = serializers.IntegerField(help_text="Number of pending box receipts")
    lowInventoryAlerts = serializers.IntegerField(help_text="Number of low inventory alerts")
    todayReceipts = serializers.IntegerField(help_text="Number of receipts today")
    completedDispatchesToday = serializers.IntegerField(help_text="Number of dispatches completed today")
    
    # Fuel Pricing
    currentPetrolPrice = serializers.IntegerField(help_text="Current petrol price in ZWG per litre")
    currentDieselPrice = serializers.IntegerField(help_text="Current diesel price in ZWG per litre")
    
    # Detailed Breakdown (optional nested data)
    coupons = serializers.DictField(required=False, help_text="Detailed coupon breakdown")
    subcenters = serializers.DictField(required=False, help_text="Detailed subcenter statistics")
    users = serializers.DictField(required=False, help_text="User statistics")
    financial = serializers.DictField(required=False, help_text="Financial breakdown")
    recent_activity = serializers.DictField(required=False, help_text="Recent activity metrics")
    
    # Metadata
    last_updated = serializers.DateTimeField(help_text="When the data was last updated")
    data_source = serializers.CharField(default='real_time', help_text="Source of the data")
    user_role = serializers.CharField(help_text="Role of the requesting user")
    generated_by = serializers.CharField(help_text="User who generated the data")


class SubCenterMonitoringSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for SubCenter data used in MainCenter SubCenterMonitoring component
    Provides all fields expected by the frontend table and cards with both snake_case and camelCase aliases
    """
    # Basic SubCenter fields (from model)
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField()
    code = serializers.CharField()
    location = serializers.CharField()
    status = serializers.SerializerMethodField()
    
    # Manager and contact information
    manager_name = serializers.SerializerMethodField()
    manager_email = serializers.SerializerMethodField()
    contact_number = serializers.CharField(default='Not provided')
    email = serializers.CharField(default='Not provided')
    
    # Frontend camelCase aliases for compatibility
    manager = serializers.SerializerMethodField()  # alias for manager_name
    contact = serializers.SerializerMethodField()  # alias for contact_number
    
    # Inventory statistics (calculated fields)
    total_boxes = serializers.SerializerMethodField()
    total_books = serializers.SerializerMethodField()
    books_used = serializers.SerializerMethodField()
    books_remaining = serializers.SerializerMethodField()
    total_coupons = serializers.SerializerMethodField()
    available_coupons = serializers.SerializerMethodField()
    used_coupons = serializers.SerializerMethodField()
    
    # Frontend camelCase aliases for inventory
    totalBooks = serializers.SerializerMethodField()  # alias for total_books
    booksUsed = serializers.SerializerMethodField()   # alias for books_used
    booksRemaining = serializers.SerializerMethodField()  # alias for books_remaining
    
    # Financial information
    total_value_usd = serializers.SerializerMethodField()
    total_value_zwg = serializers.SerializerMethodField()
    monthly_consumption_usd = serializers.SerializerMethodField()
    
    # Frontend camelCase aliases for financial
    totalValueUSD = serializers.SerializerMethodField()  # alias for total_value_usd
    totalValueZWG = serializers.SerializerMethodField()  # alias for total_value_zwg
    monthlyConsumptionUSD = serializers.SerializerMethodField()  # alias for monthly_consumption_usd
    
    # Performance metrics
    performance_score = serializers.SerializerMethodField()
    alerts_count = serializers.SerializerMethodField()
    
    # Frontend camelCase aliases for performance
    performanceScore = serializers.SerializerMethodField()  # alias for performance_score
    alerts = serializers.SerializerMethodField()  # alias for alerts_count
    
    # Metadata
    last_activity = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    coordinates = serializers.SerializerMethodField()
    
    # Frontend camelCase aliases for metadata
    lastActivity = serializers.SerializerMethodField()  # alias for last_activity
    
    class Meta:
        model = SubCenter
        fields = [
            'id', 'name', 'code', 'location', 'status',
            'manager_name', 'manager_email', 'contact_number', 'email',
            'manager', 'contact',  # camelCase aliases
            'total_boxes', 'total_books', 'books_used', 'books_remaining',
            'totalBooks', 'booksUsed', 'booksRemaining',  # camelCase aliases
            'total_coupons', 'available_coupons', 'used_coupons',
            'total_value_usd', 'total_value_zwg', 'monthly_consumption_usd',
            'totalValueUSD', 'totalValueZWG', 'monthlyConsumptionUSD',  # camelCase aliases
            'performance_score', 'alerts_count',
            'performanceScore', 'alerts',  # camelCase aliases
            'last_activity', 'created', 'coordinates',
            'lastActivity'  # camelCase alias
        ]
    
    def get_status(self, obj):
        return 'ACTIVE' if obj.is_active else 'INACTIVE'
    
    def get_manager_name(self, obj):
        if hasattr(obj, 'managed_by') and obj.managed_by:
            return obj.managed_by.get_full_name()
        return 'Not assigned'
    
    def get_manager_email(self, obj):
        if hasattr(obj, 'managed_by') and obj.managed_by:
            return obj.managed_by.email
        return ''
    
    def get_total_boxes(self, obj):
        return Box.objects.filter(assigned_to=obj).count()
    
    def get_total_books(self, obj):
        return Book.objects.filter(box__assigned_to=obj).count()
    
    def get_books_used(self, obj):
        return Book.objects.filter(box__assigned_to=obj, is_assigned=True).count()
    
    def get_books_remaining(self, obj):
        total = self.get_total_books(obj)
        used = self.get_books_used(obj)
        return total - used
    
    def get_total_coupons(self, obj):
        return Coupon.objects.filter(book__box__assigned_to=obj).count()
    
    def get_available_coupons(self, obj):
        return Coupon.objects.filter(
            book__box__assigned_to=obj,
            status='AVAILABLE'
        ).count()
    
    def get_used_coupons(self, obj):
        return Coupon.objects.filter(
            book__box__assigned_to=obj,
            status='USED'
        ).count()
    
    def get_total_value_usd(self, obj):
        total_coupons = self.get_total_coupons(obj)
        # Assuming 20L per coupon at $1.30 average
        return round(total_coupons * 20 * 1.30, 2)
    
    def get_total_value_zwg(self, obj):
        return round(self.get_total_value_usd(obj) * 27.5, 2)
    
    def get_monthly_consumption_usd(self, obj):
        used_coupons = self.get_used_coupons(obj)
        # Estimate monthly consumption
        return round(used_coupons * 20 * 1.30 * 0.1, 2)
    
    def get_performance_score(self, obj):
        total_coupons = self.get_total_coupons(obj)
        used_coupons = self.get_used_coupons(obj)
        available_coupons = self.get_available_coupons(obj)
        
        if total_coupons == 0:
            return 0
        
        usage_rate = (used_coupons / total_coupons) * 100
        performance_score = min(100, max(0, usage_rate + 
            (30 if available_coupons > 10 else 15)
        ))
        return round(performance_score, 1)
    
    def get_alerts_count(self, obj):
        alerts = 0
        available_coupons = self.get_available_coupons(obj)
        books_remaining = self.get_books_remaining(obj)
        performance_score = self.get_performance_score(obj)
        
        if available_coupons < 50:
            alerts += 1
        if books_remaining < 5:
            alerts += 1
        if performance_score < 70:
            alerts += 1
        
        return alerts
    
    def get_last_activity(self, obj):
        if hasattr(obj, 'updated'):
            return obj.updated.isoformat()
        return timezone.now().isoformat()
    
    def get_created(self, obj):
        if hasattr(obj, 'created'):
            return obj.created.isoformat()
        return timezone.now().isoformat()
    
    def get_coordinates(self, obj):
        if hasattr(obj, 'latitude') and obj.latitude:
            return {
                'lat': obj.latitude,
                'lng': obj.longitude
            }
        return None

    # Frontend camelCase alias methods
    def get_manager(self, obj):
        """Alias for manager_name"""
        return self.get_manager_name(obj)
    
    def get_contact(self, obj):
        """Alias for contact_number"""
        return getattr(obj, 'contact_number', 'Not provided')
    
    def get_totalBooks(self, obj):
        """Alias for total_books"""
        return self.get_total_books(obj)
    
    def get_booksUsed(self, obj):
        """Alias for books_used"""
        return self.get_books_used(obj)
    
    def get_booksRemaining(self, obj):
        """Alias for books_remaining"""
        return self.get_books_remaining(obj)
    
    def get_totalValueUSD(self, obj):
        """Alias for total_value_usd"""
        return self.get_total_value_usd(obj)
    
    def get_totalValueZWG(self, obj):
        """Alias for total_value_zwg"""
        return self.get_total_value_zwg(obj)
    
    def get_monthlyConsumptionUSD(self, obj):
        """Alias for monthly_consumption_usd"""
        return self.get_monthly_consumption_usd(obj)
    
    def get_performanceScore(self, obj):
        """Alias for performance_score"""
        return self.get_performance_score(obj)
    
    def get_alerts(self, obj):
        """Alias for alerts_count"""
        return self.get_alerts_count(obj)
    
    def get_lastActivity(self, obj):
        """Alias for last_activity"""
        return self.get_last_activity(obj)


class FuelStatisticsSerializer(serializers.Serializer):
    """
    Serializer for comprehensive fuel statistics used in analytics
    """
    summary = serializers.DictField(help_text="Summary statistics")
    recent_activity = serializers.DictField(help_text="Recent activity metrics")
    consumption_trend = serializers.ListField(help_text="Daily consumption trend data")
    financial = serializers.DictField(help_text="Financial information")
    usage_by_subcenter = serializers.ListField(help_text="Usage breakdown by subcenter")
    fuel_breakdown = serializers.DictField(help_text="Petrol vs Diesel breakdown")
    metadata = serializers.DictField(help_text="Generation metadata")


class BoxReceiptEnhancedSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for box receipts with MainCenter-specific fields
    """
    received_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    total_estimated_value = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()
    days_since_receipt = serializers.SerializerMethodField()
    
    class Meta:
        model = Box
        fields = '__all__'
        extra_fields = [
            'received_by_name', 'assigned_to_name', 'total_estimated_value',
            'verification_status', 'days_since_receipt'
        ]
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name()
        return 'Unknown'
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.name
        return 'Not assigned'
    
    def get_total_estimated_value(self, obj):
        if obj.total_coupons and obj.denomination:
            # Estimate based on denomination and current fuel prices
            return obj.total_coupons * obj.denomination * 1.30  # $1.30 average
        return 0
    
    def get_verification_status(self, obj):
        # Simple verification status based on available data
        if obj.is_received and obj.box_code:
            return 'VERIFIED'
        return 'PENDING'
    
    def get_days_since_receipt(self, obj):
        if obj.received_date:
            delta = timezone.now().date() - obj.received_date
            return delta.days
        return 0


class BookDispatchEnhancedSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for book dispatches with MainCenter dashboard fields
    """
    dispatched_to_name = serializers.SerializerMethodField()
    dispatched_by_name = serializers.SerializerMethodField()
    total_books_count = serializers.SerializerMethodField()
    total_coupons_count = serializers.SerializerMethodField()
    estimated_value = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = BookDispatch
        fields = '__all__'
        extra_fields = [
            'dispatched_to_name', 'dispatched_by_name', 'total_books_count',
            'total_coupons_count', 'estimated_value', 'status_display'
        ]
    
    def get_dispatched_to_name(self, obj):
        if obj.to_center:
            return obj.to_center.name
        return 'Unknown destination'
    
    def get_dispatched_by_name(self, obj):
        if obj.dispatched_by:
            return obj.dispatched_by.get_full_name()
        return 'Unknown dispatcher'
    
    def get_total_books_count(self, obj):
        # Count related books if this dispatch has books
        return obj.books.count() if hasattr(obj, 'books') else 0
    
    def get_total_coupons_count(self, obj):
        # Estimate coupons based on books
        books_count = self.get_total_books_count(obj)
        return books_count * 100  # Assume 100 coupons per book average
    
    def get_estimated_value(self, obj):
        coupons_count = self.get_total_coupons_count(obj)
        return coupons_count * 20 * 1.30  # 20L per coupon * $1.30
    
    def get_status_display(self, obj):
        return obj.get_status_display() if hasattr(obj, 'get_status_display') else obj.status


# ========================= ATTENDANCE MANAGEMENT SERIALIZERS =========================

class AttendanceRegistryMemberSerializer(serializers.ModelSerializer):
    """Serializer for attendance registry members"""
    beneficiary_details = serializers.SerializerMethodField()
    marked_by_details = SimpleUserSerializer(source='marked_by', read_only=True)
    
    class Meta:
        model = AttendanceRegistryMember
        fields = [
            'id', 'registry', 'beneficiary', 'beneficiary_details',
            'expected_to_attend', 'attendance_status', 'arrival_time',
            'departure_time', 'notes', 'marked_by', 'marked_by_details',
            'marked_date', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'marked_by', 'marked_date']
    
    def get_beneficiary_details(self, obj):
        if obj.beneficiary and obj.beneficiary.user:
            return {
                'id': obj.beneficiary.id,
                'user_id': obj.beneficiary.user.id,
                'full_name': obj.beneficiary.user.get_full_name(),
                'employee_id': obj.beneficiary.employee_id,
                'category': obj.beneficiary.category.name if obj.beneficiary.category else None,
                'constituency': obj.beneficiary.constituency.name if obj.beneficiary.constituency else None
            }
        return None


class SessionAttendanceRegistrySerializer(serializers.ModelSerializer):
    """Serializer for attendance registries"""
    members = AttendanceRegistryMemberSerializer(many=True, read_only=True)
    expected_attendees_details = serializers.SerializerMethodField()
    published_by_details = SimpleUserSerializer(source='published_by', read_only=True)
    marked_by_details = SimpleUserSerializer(source='marked_by', read_only=True)
    reviewed_by_details = SimpleUserSerializer(source='reviewed_by', read_only=True)
    session_details = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    managing_subcenter_details = serializers.SerializerMethodField()
    
    # Stats
    total_expected = serializers.SerializerMethodField()
    total_present = serializers.SerializerMethodField()
    total_absent = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = SessionAttendanceRegistry
        fields = [
            'id', 'session', 'session_details', 'program', 'program_details',
            'title', 'expected_attendees_details', 'published_by', 'published_by_details',
            'published_date', 'managing_subcenter', 'managing_subcenter_details',
            'marked_by', 'marked_by_details', 'submitted_date', 'status',
            'reviewed_by', 'reviewed_by_details', 'reviewed_date', 'review_notes',
            'attendance_date', 'notes', 'is_editable', 'members',
            'total_expected', 'total_present', 'total_absent', 'attendance_percentage',
            'created', 'modified'
        ]
        read_only_fields = [
            'id', 'created', 'modified', 'published_by', 'published_date',
            'marked_by', 'submitted_date', 'reviewed_by', 'reviewed_date'
        ]
    
    def get_expected_attendees_details(self, obj):
        return AttendanceRegistryMemberSerializer(obj.members.all(), many=True).data
    
    def get_session_details(self, obj):
        if obj.session:
            return {
                'id': obj.session.id,
                'title': obj.session.title,
                'session_type': obj.session.session_type,
                'start_date': obj.session.start_date,
                'end_date': obj.session.end_date,
                'start_time': obj.session.start_time,
                'end_time': obj.session.end_time,
                'venue': obj.session.venue
            }
        return None
    
    def get_program_details(self, obj):
        if obj.program:
            return {
                'id': obj.program.id,
                'title': obj.program.title,
                'program_type': obj.program.program_type,
                'scheduled_date': obj.program.scheduled_date
            }
        return None
    
    def get_managing_subcenter_details(self, obj):
        if obj.managing_subcenter:
            return {
                'id': obj.managing_subcenter.id,
                'name': obj.managing_subcenter.name,
                'location': obj.managing_subcenter.location
            }
        return None
    
    def get_total_expected(self, obj):
        return obj.members.filter(expected_to_attend=True).count()
    
    def get_total_present(self, obj):
        return obj.members.filter(attendance_status='PRESENT').count()
    
    def get_total_absent(self, obj):
        return obj.members.filter(attendance_status='ABSENT').count()
    
    def get_attendance_percentage(self, obj):
        total_expected = self.get_total_expected(obj)
        if total_expected > 0:
            total_present = self.get_total_present(obj)
            return round((total_present / total_expected) * 100, 2)
        return 0


class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    """Serializer for attendance corrections"""
    registry_details = serializers.SerializerMethodField()
    requested_by_details = SimpleUserSerializer(source='requested_by', read_only=True)
    reviewed_by_details = SimpleUserSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = AttendanceCorrection
        fields = [
            'id', 'registry', 'registry_details', 'requested_by', 'requested_by_details',
            'reason', 'correction_details', 'status', 'reviewed_by', 'reviewed_by_details',
            'reviewed_date', 'response', 'created', 'modified'
        ]
        read_only_fields = ['id', 'created', 'modified', 'requested_by', 'reviewed_by', 'reviewed_date']
    
    def get_registry_details(self, obj):
        if obj.registry:
            return {
                'id': obj.registry.id,
                'title': obj.registry.title,
                'attendance_date': obj.registry.attendance_date,
                'status': obj.registry.status
            }
        return None


class SergeantOfArmsRegistryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Sergeant of Arms registry list view"""
    session_details = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    managing_subcenter_name = serializers.CharField(source='managing_subcenter.name', read_only=True)
    total_expected = serializers.SerializerMethodField()
    total_marked = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = SessionAttendanceRegistry
        fields = [
            'id', 'title', 'attendance_date', 'status', 'is_editable',
            'session_details', 'program_details', 'managing_subcenter_name',
            'total_expected', 'total_marked', 'completion_percentage',
            'published_date', 'notes'
        ]
    
    def get_session_details(self, obj):
        if obj.session:
            return {
                'title': obj.session.title,
                'session_type': obj.session.get_session_type_display(),
                'venue': obj.session.venue,
                'start_time': obj.session.start_time,
                'end_time': obj.session.end_time
            }
        return None
    
    def get_program_details(self, obj):
        if obj.program:
            return {
                'title': obj.program.title,
                'program_type': obj.program.get_program_type_display()
            }
        return None
    
    def get_total_expected(self, obj):
        return obj.members.filter(expected_to_attend=True).count()
    
    def get_total_marked(self, obj):
        return obj.members.exclude(attendance_status='PENDING').count()
    
    def get_completion_percentage(self, obj):
        total_expected = self.get_total_expected(obj)
        if total_expected > 0:
            total_marked = self.get_total_marked(obj)
            return round((total_marked / total_expected) * 100, 2)
        return 0