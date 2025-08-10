from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    User, SubCenter, SubCenterOfficer, PoolVehicle, Driver, VehicleAssignment,
    Box, Book, BookPage, Coupon, FuelData, FuelTransaction,
    BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
    Program, BeneficiaryProfile, BookDispatch, CouponAllocation, FuelEntitlement,
    CouponDistribution, AuditLog, SystemAlert, SessionAttendance,
    FuelRequirementConfiguration
)
from django import forms
from django.db import models

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


# Box Admin
@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    list_display = ('box_code', 'total_litres', 'assigned_to', 'received_at', 'received_by')
    list_filter = ('assigned_to', 'received_at')
    search_fields = ('box_code', 'first_coupon_number', 'last_coupon_number')
    raw_id_fields = ('assigned_to', 'received_by')
    date_hierarchy = 'received_at'
    readonly_fields = ('total_litres', 'created', 'modified') # Added created and modified

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('assigned_to', 'received_by')

# Book Admin
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('book_number', 'book_link', 'first_coupon_number', 'last_coupon_number', 'is_assigned', 'initial_coupon_count') # Added initial_coupon_count
    list_filter = ('box__assigned_to', 'is_assigned')
    search_fields = ('book_number', 'first_coupon_number', 'last_coupon_number')
    raw_id_fields = ('box',)
    list_editable = ('is_assigned',)
    readonly_fields = ('created', 'modified') # Added created and modified

    def book_link(self, obj):
        link = f"/admin/fuel/box/{obj.box.id}/change/"
        return format_html('<a href="{}">{}</a>', link, obj.box.box_code)
    book_link.short_description = 'Box'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('box', 'box__assigned_to')

# Coupon Admin
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('coupon_number', 'book_link', 'litres', 'status', 'allocated_to', 'allocated_date', 'expiry_date') # Added expiry_date
    list_filter = ('status', 'book__box__assigned_to', 'allocated_date', 'expiry_date') # Added expiry_date
    search_fields = ('coupon_number',)
    raw_id_fields = ('allocated_to', 'book')
    # Corrected readonly_fields to use 'created' and 'modified'
    readonly_fields = ('created', 'modified', 'used_date', 'allocated_date', 'transaction_location') # Added used_date, allocated_date, transaction_location as readonly
    actions = ['mark_as_available', 'mark_as_used']

    def book_link(self, obj):
        link = f"/admin/fuel/book/{obj.book.id}/change/"
        return format_html('<a href="{}">{}</a>', link, obj.book.book_number)
    book_link.short_description = 'Book'

    @admin.action(description='Mark selected coupons as available')
    def mark_as_available(self, request, queryset):
        updated_count = queryset.update(status='AVAILABLE', allocated_to=None, allocated_date=None, used_date=None, transaction_location=None) # Reset used fields
        self.message_user(request, f"{updated_count} coupons marked as Available.")


    @admin.action(description='Mark selected coupons as used')
    def mark_as_used(self, request, queryset):
        # Filter to only update coupons that can be marked as used (e.g., ALLOCATED or AVAILABLE if your workflow allows)
        # Using .update() here bypasses the model's save method, including the automatic FuelTransaction creation.
        # If you want the FuelTransaction created, you'll need to iterate and call .mark_used() on each object.
        coupons_to_update = queryset.exclude(status__in=['USED', 'EXPIRED', 'DAMAGED'])
        count = 0
        for coupon in coupons_to_update:
             try:
                 # Call the model method to ensure logic like FuelTransaction creation runs
                 coupon.mark_used(transaction_location="Admin Action") # Provide a default location or prompt user
                 count += 1
             except ValueError as e:
                 self.message_user(request, f"Could not mark coupon {coupon.coupon_number} as used: {e}", level='WARNING')

        self.message_user(request, f"{count} coupons marked as Used.")


    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'book', 'book__box', 'allocated_to'
        )

# Parliament-Related Model Admins

# Beneficiary Category Admin
@admin.register(BeneficiaryCategory)
class BeneficiaryCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'monthly_entitlement_litres', 'category_multiplier', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('is_active',)
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Entitlement Settings', {
            'fields': ('monthly_entitlement_litres', 'category_multiplier')
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

# Constituency Admin
@admin.register(Constituency)
class ConstituencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'province', 'district', 'distance_from_parliament_km', 'population', 'is_active')
    list_filter = ('province', 'district', 'is_active')
    search_fields = ('name', 'province', 'district')
    list_editable = ('is_active',)
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'province', 'district', 'is_active')
        }),
        ('Details', {
            'fields': ('distance_from_parliament_km', 'population')
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

# Parliament Session Admin
@admin.register(ParliamentSession)
class ParliamentSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'session_type', 'start_date', 'end_date', 'organizer', 'managing_subcenter', 'is_active')
    list_filter = ('session_type', 'is_active', 'start_date', 'managing_subcenter')
    search_fields = ('title', 'description')
    raw_id_fields = ('organizer', 'managing_subcenter')
    list_editable = ('is_active',)
    date_hierarchy = 'start_date'
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'session_type', 'description', 'is_active')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Management', {
            'fields': ('organizer', 'managing_subcenter')
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('organizer', 'managing_subcenter')

# Program Admin
@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'program_type', 'session', 'start_time', 'end_time', 'venue', 'is_active')
    list_filter = ('program_type', 'is_active', 'session__start_date', 'session')
    search_fields = ('name', 'description', 'venue')
    raw_id_fields = ('session',)
    list_editable = ('is_active',)
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'program_type', 'is_active')
        }),
        ('Schedule', {
            'fields': ('session', 'start_time', 'end_time', 'venue')
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session')

# Beneficiary Profile Admin
@admin.register(BeneficiaryProfile)
class BeneficiaryProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'constituency', 'position', 'monthly_entitlement_litres', 'is_active_beneficiary')
    list_filter = ('category', 'constituency', 'vehicle_category', 'is_active_beneficiary', 'fuel_type')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'employee_id', 'position', 'department')
    raw_id_fields = ('user', 'category', 'constituency', 'vehicle_category')
    list_editable = ('is_active_beneficiary',)
    readonly_fields = ('created', 'modified')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'employee_id', 'position', 'department', 'office_location')
        }),
        ('Classification', {
            'fields': ('category', 'constituency', 'vehicle_category', 'is_active_beneficiary')
        }),
        ('Fuel Entitlement', {
            'fields': ('monthly_entitlement_litres', 'base_allocation', 'category_multiplier', 'fuel_type')
        }),
        ('Vehicle Information', {
            'fields': ('vehicle_make', 'vehicle_model', 'vehicle_year', 'engine_size', 'vehicle_registration'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created', 'modified'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'category', 'constituency', 'vehicle_category'
        )

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