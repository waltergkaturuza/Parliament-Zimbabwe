"""
Harmonized Beneficiary Model - 100% Safe Implementation
This file contains the completely harmonized beneficiary model that ensures
perfect alignment between frontend interfaces, API serializers, and database models.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from model_utils.models import TimeStampedModel
from decimal import Decimal
from django.core.exceptions import ValidationError


class HarmonizedBeneficiaryProfile(TimeStampedModel):
    """
    Completely harmonized beneficiary profile with 100% frontend compatibility.
    
    This model ensures perfect field alignment with frontend TypeScript interfaces:
    - BeneficiaryManagement.tsx (19 fields)
    - BeneficiaryAccountDashboard.tsx (12 structured fields)
    
    Field Mapping Strategy:
    - Direct mapping for simple fields
    - Computed properties for complex frontend requirements
    - Structured data methods for nested objects
    """
    
    # === CORE IDENTITY ===
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='harmonized_beneficiary_profile',
        help_text="Associated user account"
    )
    
    parliamentary_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Official parliamentary ID (maps to frontend 'parliamentaryId')"
    )
    
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Legacy employee ID for backward compatibility"
    )
    
    # === ROLE & CLASSIFICATION ===
    category = models.ForeignKey(
        'BeneficiaryCategory',
        on_delete=models.PROTECT,
        related_name='harmonized_beneficiaries',
        help_text="Beneficiary category (MP, SENATOR, STAFF, etc.)"
    )
    
    constituency = models.ForeignKey(
        'Constituency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='harmonized_constituency_beneficiaries',
        help_text="Associated constituency"
    )
    
    vehicle_category = models.ForeignKey(
        'VehicleCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='harmonized_vehicle_beneficiaries',
        help_text="Vehicle category for allocation calculations"
    )
    
    position = models.CharField(
        max_length=100,
        help_text="Official position title (maps to frontend 'title')"
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text="Department/Ministry"
    )
    
    party_affiliation = models.CharField(
        max_length=100,
        blank=True,
        help_text="Political party affiliation (maps to frontend 'party')"
    )
    
    # === PERSONAL INFORMATION ===
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Date of birth (maps to frontend 'dateOfBirth')"
    )
    
    national_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="National ID number (maps to frontend 'nationalId')"
    )
    
    full_address = models.TextField(
        help_text="Complete residential address (maps to frontend 'address')"
    )
    
    # === CONTACT INFORMATION ===
    office_location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Office location/room number"
    )
    
    office_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Office phone number"
    )
    
    mobile_phone = models.CharField(
        max_length=20,
        help_text="Mobile phone number (maps to frontend 'phoneNumber')"
    )
    
    official_email = models.EmailField(
        help_text="Official email address (maps to frontend 'email')"
    )
    
    personal_email = models.EmailField(
        blank=True,
        help_text="Personal email address"
    )
    
    # === VEHICLE INFORMATION ===
    vehicle_make = models.CharField(
        max_length=50,
        help_text="Vehicle manufacturer (e.g., Toyota, Mercedes)"
    )
    
    vehicle_model = models.CharField(
        max_length=50,
        help_text="Vehicle model (e.g., Prado, C-Class)"
    )
    
    vehicle_year = models.IntegerField(
        validators=[MinValueValidator(1990), MaxValueValidator(2030)],
        help_text="Year of manufacture"
    )
    
    engine_size = models.CharField(
        max_length=20,
        help_text="Engine size (e.g., 2.0L, 3.0L V6)"
    )
    
    vehicle_registration = models.CharField(
        max_length=20,
        unique=True,
        help_text="Vehicle registration number"
    )
    
    fuel_type = models.CharField(
        max_length=10,
        choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')],
        default='DIESEL',
        help_text="Type of fuel the vehicle uses"
    )
    
    # === ALLOCATION PROFILE ===
    base_allocation = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('200'),
        help_text="Base monthly allocation before multipliers"
    )
    
    category_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('1.0'),
        help_text="Role-based multiplier (MP: 1.5, Senator: 1.4, etc.)"
    )
    
    engine_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('1.0'),
        help_text="Engine size-based multiplier"
    )
    
    monthly_entitlement_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Final monthly fuel entitlement in litres"
    )
    
    max_per_transaction = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('50'),
        help_text="Maximum litres per single transaction"
    )
    
    # === STATUS TRACKING ===
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('INACTIVE', 'Inactive'),
            ('SUSPENDED', 'Suspended')
        ],
        default='ACTIVE',
        help_text="Current beneficiary status (maps to frontend 'status')"
    )
    
    is_active_beneficiary = models.BooleanField(
        default=True,
        help_text="Boolean flag for active status"
    )
    
    # === USAGE TRACKING ===
    current_balance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Current fuel balance in litres"
    )
    
    used_this_month = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Fuel used in current month"
    )
    
    last_month_usage = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Fuel used in previous month"
    )
    
    year_to_date_usage = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total fuel used this year"
    )
    
    total_usage_all_time = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total fuel used since registration"
    )
    
    last_allocation_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date of last fuel allocation"
    )
    
    # === METADATA ===
    join_date = models.DateField(
        auto_now_add=True,
        help_text="Date when beneficiary joined (maps to frontend 'createdAt')"
    )
    
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last login timestamp"
    )
    
    class Meta:
        verbose_name = "Harmonized Beneficiary Profile"
        verbose_name_plural = "Harmonized Beneficiary Profiles"
        ordering = ['user__username']
        db_table = 'fuel_harmonized_beneficiary_profile'
    
    def __str__(self):
        return f"{self.get_full_name()} - {self.category.name} ({self.constituency.name if self.constituency else 'No Constituency'})"
    
    # === COMPUTED PROPERTIES FOR FRONTEND COMPATIBILITY ===
    
    def get_full_name(self):
        """Get full name for frontend 'name' field"""
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
    @property
    def name(self):
        """Frontend-compatible name property"""
        return self.get_full_name()
    
    @property
    def title(self):
        """Frontend-compatible title property"""
        return self.position
    
    @property
    def phoneNumber(self):
        """Frontend-compatible phoneNumber property"""
        return self.mobile_phone
    
    @property
    def email(self):
        """Frontend-compatible email property"""
        return self.official_email
    
    @property
    def address(self):
        """Frontend-compatible address property"""
        return self.full_address
    
    @property
    def dateOfBirth(self):
        """Frontend-compatible dateOfBirth property"""
        return self.date_of_birth.isoformat() if self.date_of_birth else None
    
    @property
    def nationalId(self):
        """Frontend-compatible nationalId property"""
        return self.national_id
    
    @property
    def profilePhoto(self):
        """Frontend-compatible profilePhoto property"""
        return self.user.profile_picture
    
    @property
    def lastActivity(self):
        """Frontend-compatible lastActivity property"""
        return self.user.last_activity.isoformat() if self.user.last_activity else None
    
    @property
    def createdAt(self):
        """Frontend-compatible createdAt property"""
        return self.join_date.isoformat()
    
    @property
    def party(self):
        """Frontend-compatible party property"""
        return self.party_affiliation
    
    # === STRUCTURED DATA METHODS FOR FRONTEND ===
    
    def get_contact_info(self):
        """Get contact information as structured object"""
        return {
            'email': self.official_email,
            'phone': self.mobile_phone,
            'office': self.office_location,
            'address': self.full_address
        }
    
    def get_vehicle_info(self):
        """Get vehicle information as structured object"""
        return {
            'make': self.vehicle_make,
            'model': self.vehicle_model,
            'year': self.vehicle_year,
            'engineSize': self.engine_size,
            'registrationNumber': self.vehicle_registration,
            'fuelType': self.fuel_type
        }
    
    def get_allocation_profile(self):
        """Get allocation profile as structured object"""
        return {
            'monthlyAllocation': float(self.monthly_entitlement_litres),
            'currentBalance': float(self.current_balance),
            'usedThisMonth': float(self.used_this_month),
            'lastUpdated': self.last_allocation_date.isoformat() if self.last_allocation_date else None,
            'baseAllocation': float(self.base_allocation),
            'multiplier': float(self.category_multiplier)
        }
    
    def get_entitlements(self):
        """Get entitlements as structured object"""
        return {
            'monthlyAllocation': float(self.monthly_entitlement_litres),
            'maxPerTransaction': float(self.max_per_transaction),
            'vehicleCount': 1  # Single vehicle per beneficiary
        }
    
    def get_fuel_usage(self):
        """Get fuel usage as structured object"""
        return {
            'currentMonth': float(self.used_this_month),
            'lastMonth': float(self.last_month_usage),
            'yearToDate': float(self.year_to_date_usage),
            'totalUsed': float(self.total_usage_all_time)
        }
    
    def get_vehicles(self):
        """Get vehicles array for frontend compatibility"""
        return [{
            'id': str(self.id),
            'registration': self.vehicle_registration,
            'make': self.vehicle_make,
            'model': self.vehicle_model,
            'year': self.vehicle_year,
            'fuelType': self.fuel_type
        }]
    
    # === BUSINESS LOGIC METHODS ===
    
    def calculate_final_allocation(self):
        """Calculate final monthly allocation based on multipliers"""
        return self.base_allocation * self.category_multiplier * self.engine_multiplier
    
    def calculate_engine_multiplier_from_size(self):
        """Calculate engine multiplier based on engine size string"""
        if not self.engine_size:
            return Decimal('1.0')
        
        import re
        match = re.search(r'(\d+\.?\d*)', self.engine_size)
        if match:
            engine_numeric = float(match.group(1))
            if engine_numeric <= 1.5:
                return Decimal('0.8')
            elif engine_numeric <= 2.0:
                return Decimal('1.0')
            elif engine_numeric <= 3.0:
                return Decimal('1.3')
            elif engine_numeric <= 4.0:
                return Decimal('1.6')
            else:
                return Decimal('2.0')
        return Decimal('1.0')
    
    def update_allocation_profile(self):
        """Update allocation profile based on category and engine size"""
        if self.category:
            self.category_multiplier = getattr(self.category, 'category_multiplier', Decimal('1.0'))
        
        self.engine_multiplier = self.calculate_engine_multiplier_from_size()
        self.monthly_entitlement_litres = self.calculate_final_allocation()
    
    def clean(self):
        """Model validation"""
        super().clean()
        
        # Validate parliamentary_id format
        if self.parliamentary_id and not self.parliamentary_id.strip():
            raise ValidationError({'parliamentary_id': 'Parliamentary ID cannot be empty'})
        
        # Validate vehicle year
        current_year = timezone.now().year
        if self.vehicle_year and (self.vehicle_year < 1990 or self.vehicle_year > current_year + 1):
            raise ValidationError({'vehicle_year': f'Vehicle year must be between 1990 and {current_year + 1}'})
        
        # Validate allocation amounts
        if self.base_allocation < 0:
            raise ValidationError({'base_allocation': 'Base allocation cannot be negative'})
        
        if self.monthly_entitlement_litres < 0:
            raise ValidationError({'monthly_entitlement_litres': 'Monthly entitlement cannot be negative'})
    
    def save(self, *args, **kwargs):
        """Override save to auto-update allocation profile"""
        self.update_allocation_profile()
        self.full_clean()
        super().save(*args, **kwargs)
    
    # === MIGRATION HELPER METHODS ===
    
    @classmethod
    def migrate_from_existing_profile(cls, existing_profile):
        """
        Migrate data from existing BeneficiaryProfile to HarmonizedBeneficiaryProfile
        """
        harmonized_data = {
            'user': existing_profile.user,
            'parliamentary_id': existing_profile.employee_id or f"PARL-{existing_profile.id}",
            'employee_id': existing_profile.employee_id,
            'category': existing_profile.category,
            'constituency': existing_profile.constituency,
            'vehicle_category': existing_profile.vehicle_category,
            'position': existing_profile.position,
            'department': existing_profile.department,
            'party_affiliation': '',  # New field, default empty
            'date_of_birth': None,  # New field, needs manual entry
            'national_id': existing_profile.user.national_id or f"NID-{existing_profile.id}",
            'full_address': existing_profile.user.full_address or '',
            'office_location': getattr(existing_profile, 'office_location', ''),
            'office_phone': '',  # New field, default empty
            'mobile_phone': existing_profile.user.phone or '',
            'official_email': existing_profile.user.email or '',
            'personal_email': '',  # New field, default empty
            'vehicle_make': getattr(existing_profile, 'vehicle_make', ''),
            'vehicle_model': getattr(existing_profile, 'vehicle_model', ''),
            'vehicle_year': getattr(existing_profile, 'vehicle_year', None),
            'engine_size': getattr(existing_profile, 'engine_size', ''),
            'vehicle_registration': getattr(existing_profile, 'vehicle_registration', ''),
            'fuel_type': getattr(existing_profile, 'fuel_type', 'DIESEL'),
            'base_allocation': getattr(existing_profile, 'base_allocation', Decimal('200')),
            'category_multiplier': getattr(existing_profile, 'category_multiplier', Decimal('1.0')),
            'engine_multiplier': getattr(existing_profile, 'engine_multiplier', Decimal('1.0')),
            'monthly_entitlement_litres': existing_profile.monthly_entitlement_litres,
            'max_per_transaction': Decimal('50'),  # New field, reasonable default
            'status': 'ACTIVE' if getattr(existing_profile, 'is_active_beneficiary', True) else 'INACTIVE',
            'is_active_beneficiary': getattr(existing_profile, 'is_active_beneficiary', True),
            'current_balance': getattr(existing_profile, 'current_balance', Decimal('0')),
            'used_this_month': getattr(existing_profile, 'used_this_month', Decimal('0')),
            'last_month_usage': Decimal('0'),  # New field, default zero
            'year_to_date_usage': Decimal('0'),  # New field, default zero
            'total_usage_all_time': Decimal('0'),  # New field, default zero
            'last_allocation_date': getattr(existing_profile, 'last_allocation_date', None),
            'last_login': existing_profile.user.last_activity,
        }
        
        return cls.objects.create(**harmonized_data)
