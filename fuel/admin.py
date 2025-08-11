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
    FuelRequirementConfiguration, Program
)
from django import forms
from django.db import models

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
    search_fields = ('daily_usage_trend',)
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp', 'created', 'modified') # Added created and modified


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

# Admin Site Customization
admin.site.site_header = "Fuel Coupon Management System"
admin.site.site_title = "FCMS Administration"
admin.site.index_title = "System Administration"