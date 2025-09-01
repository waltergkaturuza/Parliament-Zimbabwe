from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from decimal import Decimal
from .models import (
    User, SubCenter, SubCenterOfficer, PoolVehicle, Driver, VehicleAssignment,
    Box, Book, BookPage, Coupon, FuelData, FuelTransaction,
    BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
    BeneficiaryProfile, BookDispatch, CouponAllocation, FuelEntitlement,
    CouponDistribution, AuditLog, SystemAlert, SessionAttendance,
    Program, FuelRequirementConfiguration
)
from .models_political_parties import PoliticalParty
from django import forms
from django.db import models

class BeneficiaryProfileAdminForm(forms.ModelForm):
    """Custom form for BeneficiaryProfile admin with organized sections and proper widgets"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Customize User field to show only Beneficiary users
        if 'user' in self.fields:
            self.fields['user'].queryset = User.objects.filter(role='BENEFICIARY').order_by('username')
            self.fields['user'].empty_label = "Select a beneficiary user"
        
        # Customize Category field
        if 'category' in self.fields:
            self.fields['category'].queryset = BeneficiaryCategory.objects.filter(is_active=True).order_by('name')
            self.fields['category'].empty_label = "Select a category (optional)"
        
        # Customize Constituency field
        if 'constituency' in self.fields:
            self.fields['constituency'].queryset = Constituency.objects.all().order_by('name')
            self.fields['constituency'].empty_label = "Select a constituency (optional)"
    
    class Meta:
        model = BeneficiaryProfile
        fields = '__all__'
        widgets = {
            'monthly_entitlement_litres': forms.NumberInput(attrs={'step': '0.01'}),
            'base_allocation': forms.NumberInput(attrs={'step': '0.01'}),
            'category_multiplier': forms.NumberInput(attrs={'step': '0.01'}),
            'engine_multiplier': forms.NumberInput(attrs={'step': '0.01'}),
            'current_balance': forms.NumberInput(attrs={'step': '0.01'}),
            'used_this_month': forms.NumberInput(attrs={'step': '0.01'}),
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }

class BoxAdminForm(forms.ModelForm):
    """Custom form for Box admin with automatic calculations"""
    
    class Meta:
        model = Box
        fields = '__all__'
        widgets = {
            'number_of_books': forms.NumberInput(attrs={
                'onchange': 'calculateTotals()',
                'min': '1'
            }),
            'coupons_per_book': forms.NumberInput(attrs={
                'onchange': 'calculateTotals()',
                'min': '1'
            }),
            'denomination': forms.Select(attrs={
                'onchange': 'calculateTotals()'
            }),
        }
    
    class Media:
        js = ('admin/js/box_calculations.js',)

# Custom User Admin
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'sub_center', 'is_approved', 'approved_by', 'approved_at', 'rejection_reason', 'last_login', 'is_active')
    list_filter = ('role', 'sub_center', 'is_active', 'is_staff', 'is_approved')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'role', 'sub_center'),
        }),
        ('Approval', {
            'fields': ('is_approved', 'approved_by', 'approved_at', 'rejection_reason', 'registration_justification'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'sub_center'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sub_center')

# SubCenter Admin Form
class SubCenterAdminForm(forms.ModelForm):
    class Meta:
        model = SubCenter
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filter manager choices to only include eligible users
        self.fields['managed_by'].queryset = User.objects.filter(
            models.Q(is_approved=True, role__in=["MAIN_CENTER", "SUB_CENTER"]) |
            models.Q(is_superuser=True)
        ).order_by('username')
        
        # Make it more user-friendly
        self.fields['managed_by'].empty_label = "Select a manager..."
        
# SubCenter Admin
@admin.register(SubCenter)
class SubCenterAdmin(admin.ModelAdmin):
    form = SubCenterAdminForm
    list_display = ('name', 'code', 'location', 'managed_by', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code', 'location')
    list_editable = ('is_active',)
    list_per_page = 20
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'location', 'is_active')
        }),
        ('Management', {
            'fields': ('managed_by',),
            'description': 'Select a user to manage this sub-center. Only approved users with appropriate roles are shown.'
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('managed_by')

# SubCenter Officer Admin (Added)
@admin.register(SubCenterOfficer)
class SubCenterOfficerAdmin(admin.ModelAdmin):
    list_display = ('user', 'sub_center', 'is_manager')
    list_filter = ('sub_center', 'is_manager')
    search_fields = ('user__username', 'sub_center__name')
    raw_id_fields = ('user', 'sub_center')
    list_editable = ('is_manager',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'sub_center')


# Box Admin with enhanced functionality
@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    list_display = ('box_code', 'fuel_type', 'denomination', 'total_coupons_display', 'total_litres', 'total_value_display', 'status', 'received_at')
    list_filter = ('fuel_type', 'denomination', 'status', 'calculation_mode', 'received_at')
    search_fields = ('box_code', 'first_coupon_number', 'last_coupon_number', 'barcode')
    date_hierarchy = 'received_at'
    readonly_fields = ('total_coupons_display', 'calculated_total_litres', 'total_value_display', 'coupon_range_display', 'books_count', 'created', 'modified')
    
    fieldsets = (
        ('Box Information', {
            'fields': ('box_code', 'fuel_type', 'denomination', 'barcode', 'status')
        }),
        ('Coupon Serial Numbers (Required)', {
            'fields': ('first_coupon_number', 'last_coupon_number', 'coupon_range_display'),
            'description': 'Enter valid Petrotrade serial numbers (e.g., PU06GH355101). These are required for proper tracking.'
        }),
        ('Book Configuration', {
            'fields': ('number_of_books', 'coupons_per_book', 'calculation_mode', 'books_count')
        }),
        ('Calculated Values (Auto-computed)', {
            'fields': ('total_coupons_calculated', 'total_coupons_display', 'total_litres', 'calculated_total_litres', 'total_value_display'),
            'description': 'These values are automatically calculated from the coupon serials and book configuration.',
            'classes': ('collapse',)
        }),
        ('Financial Details', {
            'fields': ('fuel_price_per_litre_usd', 'exchange_rate_zwg_usd', 'total_value_usd', 'total_value_zwg'),
            'classes': ('collapse',)
        }),
        ('Assignment & Receipt', {
            'fields': ('assigned_to', 'received_by', 'received_at')
        }),
        ('Verification', {
            'fields': ('verified_by', 'verified_at', 'verification_notes'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'book_details_json'),
            'classes': ('collapse',)
        }),
        ('Archive Information', {
            'fields': ('is_archived', 'archived_at', 'archived_by', 'archive_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

    def total_coupons_display(self, obj):
        """Display total coupons with calculation method"""
        total = obj.total_coupons_calculated or (obj.number_of_books * obj.coupons_per_book)
        method = obj.get_calculation_mode_display() if hasattr(obj, 'get_calculation_mode_display') else 'Standard'
        return f"{total:,} coupons ({method})"
    total_coupons_display.short_description = 'Total Coupons'
    
    def total_value_display(self, obj):
        """Display total value in both USD and ZWG"""
        if hasattr(obj, 'total_value_usd') and obj.total_value_usd:
            return f"${obj.total_value_usd:,.2f} USD / ZWG {obj.total_value_zwg:,.2f}"
        else:
            # Fallback calculation
            total_litres = obj.total_litres or 0
            usd_value = total_litres * Decimal('1.40')
            zwg_value = usd_value * Decimal('27.50')
            return f"${usd_value:,.2f} USD / ZWG {zwg_value:,.2f}"
    total_value_display.short_description = 'Total Value'
    
    def calculated_total_litres(self, obj):
        """Show calculated litres"""
        calc_litres = obj.total_coupons_calculated * obj.denomination if obj.total_coupons_calculated else 0
        return f"{calc_litres:,} L"
    calculated_total_litres.short_description = 'Calculated Litres'
    
    def coupon_range_display(self, obj):
        """Display coupon serial range"""
        if obj.first_coupon_number and obj.last_coupon_number:
            return f"{obj.first_coupon_number} → {obj.last_coupon_number}"
        return "Not specified"
    coupon_range_display.short_description = 'Coupon Range'
    
    def books_count(self, obj):
        """Display actual book count"""
        actual_books = obj.books.count() if hasattr(obj, 'books') else 0
        configured_books = obj.number_of_books
        if actual_books != configured_books:
            return f"{actual_books} created / {configured_books} configured"
        return f"{actual_books} books"
    books_count.short_description = 'Books Status'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('assigned_to', 'received_by', 'verified_by')

# Enhanced Book Admin
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('book_code', 'book_number', 'box_code_display', 'coupon_range_display', 'coupon_count_display', 'is_assigned', 'is_verified', 'generated_at')
    list_filter = ('is_assigned', 'is_verified', 'box__fuel_type', 'generated_at', 'verified_at')
    search_fields = ('book_code', 'book_number', 'box__box_code', 'first_coupon_number', 'last_coupon_number')
    date_hierarchy = 'generated_at'
    readonly_fields = ('book_code', 'coupon_count_display', 'generated_at', 'created', 'modified')
    
    fieldsets = (
        ('Book Information', {
            'fields': ('book_code', 'book_number', 'box')
        }),
        ('Coupon Range', {
            'fields': ('first_coupon_number', 'last_coupon_number', 'initial_coupon_count', 'coupon_count_display')
        }),
        ('Assignment', {
            'fields': ('is_assigned', 'assigned_to', 'assigned_date')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verified_by', 'verified_at', 'verification_notes')
        }),
        ('Generation Details', {
            'fields': ('generated_by', 'generated_at'),
            'classes': ('collapse',)
        }),
        ('Archive Information', {
            'fields': ('is_archived', 'archived_at', 'archived_by', 'archive_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )
    
    def box_code_display(self, obj):
        """Display the box code this book belongs to"""
        return obj.box.box_code if obj.box else 'N/A'
    box_code_display.short_description = 'Box Code'
    box_code_display.admin_order_field = 'box__box_code'
    
    def coupon_range_display(self, obj):
        """Display the coupon range for this book"""
        return f"{obj.first_coupon_number} → {obj.last_coupon_number}"
    coupon_range_display.short_description = 'Coupon Range'
    
    def coupon_count_display(self, obj):
        """Display coupon counts with breakdown"""
        if hasattr(obj, 'coupon_count'):
            total = obj.coupon_count
            available = obj.available_coupons if hasattr(obj, 'available_coupons') else 0
            allocated = obj.allocated_coupons if hasattr(obj, 'allocated_coupons') else 0
            used = obj.used_coupons if hasattr(obj, 'used_coupons') else 0
            return f"{total} total ({available} avail, {allocated} alloc, {used} used)"
        return f"{obj.initial_coupon_count or 0} (estimated)"
    coupon_count_display.short_description = 'Coupon Count'


# Enhanced Coupon Admin
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('coupon_number', 'book_display', 'box_display', 'litres', 'status', 'allocated_to_display', 'created')
    list_filter = ('status', 'litres', 'book__box__fuel_type', 'allocated_to', 'created')
    search_fields = ('coupon_number', 'serial_number', 'book__book_code', 'book__box__box_code', 'allocated_to__first_name', 'allocated_to__last_name')
    date_hierarchy = 'created'
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('Coupon Information', {
            'fields': ('coupon_number', 'serial_number', 'book', 'page')
        }),
        ('Fuel Details', {
            'fields': ('litres', 'usd_value', 'zwg_value')
        }),
        ('Status & Allocation', {
            'fields': ('status', 'allocated_to', 'allocated_date', 'allocation_reason')
        }),
        ('Usage Tracking', {
            'fields': ('used_at', 'used_by', 'used_for', 'usage_location')
        }),
        ('Codes & Verification', {
            'fields': ('barcode', 'qr_code', 'verification_code')
        }),
        ('Archive Information', {
            'fields': ('is_archived', 'archived_at', 'archived_by', 'archive_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )
    
    def book_display(self, obj):
        """Display book information"""
        return f"{obj.book.book_number} ({obj.book.book_code})" if obj.book else 'N/A'
    book_display.short_description = 'Book'
    book_display.admin_order_field = 'book__book_number'
    
    def box_display(self, obj):
        """Display box information"""
        return obj.book.box.box_code if obj.book and obj.book.box else 'N/A'
    box_display.short_description = 'Box'
    box_display.admin_order_field = 'book__box__box_code'
    
    def allocated_to_display(self, obj):
        """Display allocation information"""
        if obj.allocated_to:
            return f"{obj.allocated_to.get_full_name()} ({obj.allocated_to.role})"
        return 'Unallocated'
    allocated_to_display.short_description = 'Allocated To'
    allocated_to_display.admin_order_field = 'allocated_to__first_name'


# Coupon Allocation Admin (This was the old duplicate, keeping the new enhanced one above)

# Program Admin
@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('title', 'program_type', 'scheduled_date', 'end_date', 'location', 'sub_center', 'organizer', 'is_active') # Added sub_center
    list_filter = ('program_type', 'is_active', 'scheduled_date', 'sub_center') # Added sub_center
    search_fields = ('title', 'location', 'description')
    raw_id_fields = ('organizer',)
    list_editable = ('is_active',)
    date_hierarchy = 'scheduled_date'
#     readonly_fields = ('created', 'modified') # Added created and modified

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('organizer', 'sub_center') # Select related sub_center

# FuelData Admin
@admin.register(FuelData)
class FuelDataAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'total_fuel_allocated', 'total_fuel_used', 'available_fuel', 'last_refuel_date')
    list_filter = ('timestamp',)
    search_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp', 'created', 'modified')


# FuelTransaction Admin (Added)
@admin.register(FuelTransaction)
class FuelTransactionAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'beneficiary', 'coupon_link', 'litres_consumed', 'transaction_location', 'recorded_by')
    list_filter = ('timestamp', 'beneficiary', 'transaction_location')
    search_fields = ('beneficiary__username', 'coupon__coupon_number', 'transaction_location')
    raw_id_fields = ('beneficiary', 'coupon', 'recorded_by')
    date_hierarchy = 'timestamp'
    readonly_fields = ('created', 'modified')


    def coupon_link(self, obj):
        """ Creates a link to the associated coupon in the admin """
        if obj.coupon:
            link = f"/admin/fuel/coupon/{obj.coupon.id}/change/"
            return format_html('<a href="{}">{}</a>', link, obj.coupon.coupon_number)
        return "-"
    coupon_link.short_description = 'Coupon'


    def get_queryset(self, request):
         return super().get_queryset(request).select_related(
             'beneficiary', 'coupon', 'recorded_by'
         )


# Session Attendance Admin (Newly Added)
@admin.register(SessionAttendance)
class SessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ['beneficiary', 'session', 'status', 'date', 'recorded_by']
    list_filter = ['status', 'session__title', 'session__start_date', 'date']
    search_fields = ['beneficiary__user__username', 'beneficiary__user__first_name', 'beneficiary__user__last_name', 'session__title']
    readonly_fields = ['created', 'modified']
    raw_id_fields = ['beneficiary', 'session', 'recorded_by']

# Fuel Requirement Configuration Admin
@admin.register(FuelRequirementConfiguration)
class FuelRequirementConfigurationAdmin(admin.ModelAdmin):
    list_display = ['fuel_type', 'period', 'required_litres', 'required_coupons', 'litres_per_coupon', 'is_active', 'effective_from', 'created_by']
    list_filter = ['fuel_type', 'period', 'is_active', 'effective_from']
    search_fields = ['fuel_type', 'notes']
    readonly_fields = ['created', 'modified', 'required_coupons']
    fieldsets = (
        ('Basic Information', {
            'fields': ('fuel_type', 'period', 'is_active')
        }),
        ('Requirements', {
            'fields': ('required_litres', 'litres_per_coupon', 'required_coupons')
        }),
        ('Dates', {
            'fields': ('effective_from',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only set created_by on creation
            obj.created_by = request.user
        # Auto-calculate required coupons
        obj.required_coupons = obj.calculate_required_coupons()
        super().save_model(request, obj, form, change)

# Constituency Admin
@admin.register(Constituency)
class ConstituencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'district', 'total_beneficiaries']
    list_filter = ['province', 'district']
    search_fields = ['name', 'province', 'district']
    ordering = ['province', 'name']
    
    def total_beneficiaries(self, obj):
        return obj.constituency_beneficiaries.count()
    total_beneficiaries.short_description = 'Total Beneficiaries'

# BeneficiaryProfile Admin
@admin.register(BeneficiaryProfile)
class BeneficiaryProfileAdmin(admin.ModelAdmin):
    form = BeneficiaryProfileAdminForm
    list_display = ['get_full_name', 'employee_id', 'category', 'constituency', 'political_party', 'status', 'monthly_entitlement_litres']
    list_filter = ['status', 'category', 'is_active_beneficiary', 'vehicle_category']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'vehicle_registration']
    # Removed raw_id_fields to show proper dropdowns instead of text inputs
    autocomplete_fields = []  # Use autocomplete for large datasets if needed
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'employee_id', 'status', 'is_active_beneficiary'),
            'description': 'Link to system user and basic identification'
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone_number', 'address', 'date_of_birth', 'national_id'),
            'description': 'Personal details for the beneficiary'
        }),
        ('Categories and Assignments', {
            'fields': ('category', 'constituency', 'vehicle_category'),
            'description': 'Parliamentary roles and assignments'
        }),
        ('Position Details', {
            'fields': ('position', 'department', 'office_location', 'political_party'),
            'description': 'Work-related information'
        }),
        ('Fuel Allocation', {
            'fields': ('monthly_entitlement_litres', 'base_allocation', 'category_multiplier', 'engine_multiplier'),
            'description': 'Fuel entitlement calculations'
        }),
        ('Fuel Usage Tracking', {
            'fields': ('current_balance', 'used_this_month', 'last_allocation_date'),
            'description': 'Current fuel usage and balances'
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_make', 'vehicle_model', 'vehicle_year', 'engine_size', 'vehicle_registration', 'fuel_type'),
            'description': 'Vehicle details for fuel allocation'
        }),
        ('Advanced Settings', {
            'fields': ('engine_capacity_cc', 'distance_from_parliament_km'),
            'classes': ('collapse',),
            'description': 'Advanced configuration options'
        })
    )
    
    def get_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return f"{obj.first_name} {obj.last_name}".strip()
    get_full_name.short_description = 'Beneficiary Name'
    
    def save_model(self, request, obj, form, change):
        """Auto-populate fields from linked user if available"""
        if obj.user and not change:  # Only on creation
            if not obj.first_name and obj.user.first_name:
                obj.first_name = obj.user.first_name
            if not obj.last_name and obj.user.last_name:
                obj.last_name = obj.user.last_name
            if not obj.email and obj.user.email:
                obj.email = obj.user.email
        super().save_model(request, obj, form, change)


# Political Party Admin
@admin.register(PoliticalParty)
class PoliticalPartyAdmin(admin.ModelAdmin):
    list_display = [
        'short_name', 'name', 'status', 'party_type', 'is_parliamentary_party', 
        'is_government_party', 'member_count', 'founded_year', 'display_order'
    ]
    list_filter = ['status', 'party_type', 'is_parliamentary_party', 'is_government_party']
    search_fields = ['name', 'short_name', 'abbreviation', 'leader_name']
    ordering = ['display_order', 'short_name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'short_name', 'abbreviation', 'description')
        }),
        ('Party Details', {
            'fields': ('party_type', 'status', 'founded_year', 'headquarters_address')
        }),
        ('Leadership', {
            'fields': ('leader_name', 'leader_title', 'contact_email', 'contact_phone', 'website')
        }),
        ('Parliamentary Status', {
            'fields': ('is_parliamentary_party', 'is_government_party', 'parliamentary_seats', 'senate_seats')
        }),
        ('Visual Settings', {
            'fields': ('primary_color', 'secondary_color', 'logo_url', 'display_order')
        }),
        ('Membership', {
            'fields': ('total_members', 'active_members'),
            'description': 'Member counts are calculated automatically from beneficiary profiles.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at', 'total_members', 'active_members']
    
    def member_count(self, obj):
        """Display total member count"""
        return f"{obj.total_members} total, {obj.active_members} active"
    member_count.short_description = "Members"
    
    def get_readonly_fields(self, request, obj=None):
        readonly = ['created_at', 'updated_at', 'total_members', 'active_members']
        # Prevent changing short_name after creation to maintain data integrity
        if obj:
            readonly.append('short_name')
        return readonly

    actions = ['make_active', 'make_inactive', 'mark_as_government_party']
    
    def make_active(self, request, queryset):
        queryset.update(status='ACTIVE')
        self.message_user(request, f"{queryset.count()} parties marked as active.")
    make_active.short_description = "Mark selected parties as active"
    
    def make_inactive(self, request, queryset):
        queryset.update(status='INACTIVE')
        self.message_user(request, f"{queryset.count()} parties marked as inactive.")
    make_inactive.short_description = "Mark selected parties as inactive"
    
    def mark_as_government_party(self, request, queryset):
        # First remove government status from all parties
        PoliticalParty.objects.update(is_government_party=False)
        # Then set it for selected parties (should be only one)
        updated = queryset.update(is_government_party=True)
        if updated > 1:
            self.message_user(request, "Warning: Multiple parties marked as government party!", level='WARNING')
        else:
            self.message_user(request, f"{updated} party marked as government party.")
    mark_as_government_party.short_description = "Set as government party"


# Enhanced Beneficiary Category Admin
@admin.register(BeneficiaryCategory)
class BeneficiaryCategoryAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'monthly_entitlement_litres', 'category_multiplier', 
        'is_active', 'beneficiary_count'
    ]
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
        ('Fuel Allocation', {
            'fields': ('monthly_entitlement_litres', 'category_multiplier'),
            'description': 'Set default fuel entitlements and multipliers for this category.'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Statistics', {
            'fields': ('beneficiary_count',),
            'classes': ('collapse',),
            'description': 'Automatically calculated statistics.'
        })
    )
    
    readonly_fields = ['beneficiary_count']
    
    def beneficiary_count(self, obj):
        """Count of beneficiaries in this category"""
        return BeneficiaryProfile.objects.filter(category=obj).count()
    beneficiary_count.short_description = "Beneficiaries"
    
    actions = ['activate_categories', 'deactivate_categories']
    
    def activate_categories(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} categories activated.")
    activate_categories.short_description = "Activate selected categories"
    
    def deactivate_categories(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} categories deactivated.")
    deactivate_categories.short_description = "Deactivate selected categories"


# Admin Site Customization
admin.site.site_header = "Fuel Coupon Management System"
admin.site.site_title = "FCMS Administration"
admin.site.index_title = "System Administration"