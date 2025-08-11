# Enhanced BeneficiaryProfileSerializer with computed fields
# Add these enhancements to the existing BeneficiaryProfileSerializer

from rest_framework import serializers
from decimal import Decimal

class EnhancedBeneficiaryProfileSerializer(serializers.ModelSerializer):
    """Enhanced serializer for beneficiary profiles with computed fields for better frontend integration"""
    
    # Nested serializers for relationships
    user_details = SimpleUserSerializer(source='user', read_only=True)
    category_details = BeneficiaryCategorySerializer(source='category', read_only=True)
    constituency_details = ConstituencySerializer(source='constituency', read_only=True)
    vehicle_category_details = VehicleCategorySerializer(source='vehicle_category', read_only=True)
    
    # Computed fields for frontend compatibility
    full_name = serializers.SerializerMethodField()
    parliamentary_id = serializers.CharField(source='employee_id', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    contact_info = serializers.SerializerMethodField()
    allocation_summary = serializers.SerializerMethodField()
    usage_statistics = serializers.SerializerMethodField()
    
    # Frontend-compatible field names
    name = serializers.SerializerMethodField()
    title = serializers.CharField(source='position', read_only=True)
    phone_number = serializers.CharField(source='user.phone', read_only=True)
    profile_photo = serializers.CharField(source='user.profile_picture', read_only=True)
    
    # Status mappings
    is_active = serializers.BooleanField(source='is_active_beneficiary', read_only=True)
    status = serializers.SerializerMethodField()
    
    # Existing computed fields
    total_allocated_this_month = serializers.SerializerMethodField()
    pending_entitlements = serializers.SerializerMethodField()
    
    class Meta:
        model = BeneficiaryProfile
        fields = [
            # Basic identification
            'id', 'parliamentary_id', 'full_name', 'name', 'title',
            
            # Relationships (detailed)
            'user_details', 'category_details', 'constituency_details', 'vehicle_category_details',
            
            # User information
            'employee_id', 'position', 'department', 'phone_number', 'profile_photo',
            
            # Computed field groups
            'vehicle_info', 'contact_info', 'allocation_summary', 'usage_statistics',
            
            # Status and activity
            'is_active', 'status', 'is_active_beneficiary',
            
            # Raw model fields (for backward compatibility)
            'monthly_entitlement_litres', 'vehicle_make', 'vehicle_model', 'vehicle_year',
            'engine_size', 'vehicle_registration', 'fuel_type', 'office_location',
            'base_allocation', 'category_multiplier', 'engine_multiplier',
            'current_balance', 'used_this_month', 'last_allocation_date',
            
            # Computed analytics
            'total_allocated_this_month', 'pending_entitlements',
            
            # Timestamps
            'created', 'modified'
        ]
        read_only_fields = [
            'id', 'created', 'modified', 'parliamentary_id', 'full_name', 'name',
            'vehicle_info', 'contact_info', 'allocation_summary', 'usage_statistics',
            'status', 'total_allocated_this_month', 'pending_entitlements'
        ]
    
    def get_full_name(self, obj):
        """Combine first and last name for frontend display"""
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_name(self, obj):
        """Alias for full_name for frontend compatibility"""
        return self.get_full_name(obj)
    
    def get_vehicle_info(self, obj):
        """Structured vehicle information object"""
        return {
            'make': obj.vehicle_make or '',
            'model': obj.vehicle_model or '',
            'year': obj.vehicle_year,
            'engine_size': obj.engine_size or '',
            'registration_number': obj.vehicle_registration or '',
            'fuel_type': obj.fuel_type,
            'category': obj.vehicle_category.name if obj.vehicle_category else '',
        }
    
    def get_contact_info(self, obj):
        """Structured contact information object"""
        return {
            'email': obj.user.email or '',
            'phone': obj.user.phone or '',
            'office': obj.office_location or '',
            'address': obj.user.full_address or '',
            'national_id': obj.user.national_id or '',
        }
    
    def get_allocation_summary(self, obj):
        """Structured allocation information"""
        final_allocation = obj.calculate_final_allocation()
        return {
            'monthly_allocation': float(obj.monthly_entitlement_litres),
            'base_allocation': float(obj.base_allocation),
            'category_multiplier': float(obj.category_multiplier),
            'engine_multiplier': float(obj.engine_multiplier),
            'final_allocation': float(final_allocation),
            'current_balance': float(obj.current_balance),
            'used_this_month': float(obj.used_this_month),
            'remaining_this_month': float(final_allocation - obj.used_this_month),
            'utilization_percentage': float((obj.used_this_month / final_allocation) * 100) if final_allocation > 0 else 0,
        }
    
    def get_usage_statistics(self, obj):
        """Usage statistics for dashboard display"""
        from datetime import datetime, timedelta
        from django.db.models import Sum
        
        # Calculate usage for different periods
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get usage data from allocations
        current_month_usage = obj.user.allocated_coupons.filter(
            allocated_date__gte=current_month_start,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=Sum('litres'))['total'] or 0
        
        last_month_usage = obj.user.allocated_coupons.filter(
            allocated_date__gte=last_month_start,
            allocated_date__lt=current_month_start,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=Sum('litres'))['total'] or 0
        
        year_to_date_usage = obj.user.allocated_coupons.filter(
            allocated_date__gte=year_start,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=Sum('litres'))['total'] or 0
        
        return {
            'current_month': float(current_month_usage),
            'last_month': float(last_month_usage),
            'year_to_date': float(year_to_date_usage),
            'average_monthly': float(year_to_date_usage / max(now.month, 1)),
            'last_allocation_date': obj.last_allocation_date.isoformat() if obj.last_allocation_date else None,
        }
    
    def get_status(self, obj):
        """Map boolean status to frontend enum"""
        if not obj.is_active_beneficiary:
            return 'INACTIVE'
        elif not obj.user.is_approved:
            return 'SUSPENDED'
        else:
            return 'ACTIVE'
    
    def get_total_allocated_this_month(self, obj):
        """Total allocated this month"""
        from datetime import datetime
        current_month = datetime.now().replace(day=1)
        return obj.user.allocated_coupons.filter(
            allocated_date__gte=current_month,
            status__in=['ALLOCATED', 'USED']
        ).aggregate(total=models.Sum('litres'))['total'] or 0
    
    def get_pending_entitlements(self, obj):
        """Count of pending entitlements"""
        return obj.user.fuel_entitlements.filter(
            status__in=['PENDING', 'APPROVED'],
            period_end__gte=timezone.now().date()
        ).count()


# Alternative simplified serializer for listing views
class SimpleBeneficiarySerializer(serializers.ModelSerializer):
    """Simplified beneficiary serializer for list views and dropdowns"""
    
    full_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    constituency_name = serializers.CharField(source='constituency.name', read_only=True)
    current_allocation = serializers.DecimalField(source='monthly_entitlement_litres', max_digits=8, decimal_places=2, read_only=True)
    
    class Meta:
        model = BeneficiaryProfile
        fields = [
            'id', 'full_name', 'employee_id', 'position',
            'category_name', 'constituency_name', 'current_allocation',
            'is_active_beneficiary', 'vehicle_registration'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


# Enhanced User serializer for beneficiary context
class BeneficiaryUserSerializer(serializers.ModelSerializer):
    """Enhanced user serializer with beneficiary profile information"""
    
    beneficiary_profile = EnhancedBeneficiaryProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name', 'email',
            'phone', 'role', 'is_approved', 'last_activity', 'beneficiary_profile'
        ]
        read_only_fields = ['id', 'full_name', 'last_activity']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
