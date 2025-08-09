# Backend Model Enhancements for Frontend Features
# File: fuel/models_enhancements.py

"""
CRITICAL GAPS IDENTIFIED IN CURRENT BACKEND MODELS:

1. BeneficiaryProfile Model - MISSING VEHICLE DETAILS:
   - Missing: vehicle_make, vehicle_model, vehicle_year, engine_size, registration_number, fuel_type
   - Current: Only has vehicle_category foreign key

2. MISSING ATTENDANCE TRACKING:
   - Need: SessionAttendance model with individual session tracking
   - Current: Appears to exist but needs verification of fields

3. MISSING DETAILED ALLOCATION TRACKING:
   - Need: Enhanced CouponAllocation with session_name, program_name, event_name
   - Current: Basic allocation tracking exists

4. MISSING CONTACT INFORMATION:
   - Need: phone, email, office_location in BeneficiaryProfile
   - Current: Only basic profile fields

5. MISSING CATEGORY MULTIPLIERS:
   - Need: Role-based multipliers (MP: 1.5x, Senator: 1.4x, etc.)
   - Current: Only basic monthly_entitlement_litres

6. MISSING ENGINE-BASED CALCULATIONS:
   - Need: Engine size multipliers for allocation calculations
   - Current: No engine-specific logic
"""

# REQUIRED MODEL ENHANCEMENTS:
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal

class BeneficiaryProfileEnhancements(models.Model):
    """
    Additional fields needed for BeneficiaryProfile model
    These should be added to the existing BeneficiaryProfile model
    """
    
    # Vehicle Information (MISSING)
    vehicle_make = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="Vehicle manufacturer (e.g., Toyota, Mercedes)"
    )
    vehicle_model = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="Vehicle model (e.g., Prado, C-Class)"
    )
    vehicle_year = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Year of manufacture"
    )
    engine_size = models.CharField(
        max_length=20, 
        blank=True, 
        help_text="Engine size (e.g., 2.0L, 3.0L V6)"
    )
    vehicle_registration = models.CharField(
        max_length=20, 
        blank=True, 
        help_text="Vehicle registration number"
    )
    fuel_type = models.CharField(
        max_length=10,
        choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')],
        default='DIESEL',
        help_text="Type of fuel the vehicle uses"
    )
    
    # Contact Information (MISSING)
    office_location = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Office location/room number"
    )
    
    # Enhanced Allocation Profile (MISSING)
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
    
    # Status tracking (ENHANCEMENT)
    last_allocation_date = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Date of last fuel allocation"
    )
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
    
    class Meta:
        abstract = True


class EnhancedCouponAllocation(models.Model):
    """
    Enhanced allocation tracking for frontend features
    These fields should be added to existing CouponAllocation model
    """
    
    # Session/Event Information (MISSING)
    session_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Name of parliamentary session"
    )
    program_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Name of program/committee"
    )
    event_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Specific event name (optional)"
    )
    allocation_type = models.CharField(
        max_length=20,
        choices=[
            ('SESSION', 'Parliamentary Session'),
            ('COMMITTEE', 'Committee Meeting'),
            ('EVENT', 'Special Event'),
            ('EMERGENCY', 'Emergency Allocation'),
        ],
        default='SESSION',
        help_text="Type of allocation"
    )
    
    # Enhanced tracking (MISSING)
    total_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Total monetary value of allocation"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expiry date for allocated coupons"
    )
    coupons_used = models.IntegerField(
        default=0,
        help_text="Number of coupons already used"
    )
    coupons_remaining = models.IntegerField(
        default=0,
        help_text="Number of coupons remaining"
    )
    
    class Meta:
        abstract = True


class SessionAttendanceEnhancements(models.Model):
    """
    Enhanced attendance tracking
    Check if SessionAttendance model has these fields
    """
    
    # Session details (MAY BE MISSING)
    session_type = models.CharField(
        max_length=20,
        choices=[
            ('PLENARY', 'Plenary Session'),
            ('COMMITTEE', 'Committee Meeting'),
            ('SPECIAL', 'Special Session'),
            ('WORKSHOP', 'Workshop'),
        ],
        default='PLENARY'
    )
    start_time = models.TimeField(help_text="Session start time")
    end_time = models.TimeField(help_text="Session end time")
    duration_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        help_text="Duration in hours"
    )
    location = models.CharField(
        max_length=200,
        help_text="Session location"
    )
    
    class Meta:
        abstract = True


class BeneficiaryVehicle(models.Model):
    """
    NEW MODEL: Dedicated vehicle tracking for beneficiaries
    This should be created as a separate model if vehicle details are complex
    """
    
    beneficiary = models.OneToOneField(
        'BeneficiaryProfile',
        on_delete=models.CASCADE,
        related_name='vehicle'
    )
    make = models.CharField(max_length=50, help_text="Vehicle manufacturer")
    model = models.CharField(max_length=50, help_text="Vehicle model")
    year = models.IntegerField(help_text="Year of manufacture")
    engine_size = models.CharField(
        max_length=20, 
        help_text="Engine size (e.g., 2.0L, 3.0L V6)"
    )
    engine_cc = models.IntegerField(
        null=True,
        blank=True,
        help_text="Engine capacity in cubic centimeters"
    )
    registration_number = models.CharField(
        max_length=20,
        unique=True,
        help_text="Vehicle registration number"
    )
    fuel_type = models.CharField(
        max_length=10,
        choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')],
        default='DIESEL'
    )
    
    # Calculated fields
    @property
    def engine_multiplier(self):
        """Calculate engine-based fuel multiplier"""
        if self.engine_cc:
            if self.engine_cc <= 1500:
                return Decimal('0.8')
            elif self.engine_cc <= 2000:
                return Decimal('1.0')
            elif self.engine_cc <= 3000:
                return Decimal('1.3')
            elif self.engine_cc <= 4000:
                return Decimal('1.6')
            else:
                return Decimal('2.0')
        return Decimal('1.0')
    
    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.registration_number})"
    
    class Meta:
        verbose_name = "Beneficiary Vehicle"
        verbose_name_plural = "Beneficiary Vehicles"


# MIGRATION COMMANDS NEEDED:
"""
1. Add fields to BeneficiaryProfile:
   - vehicle_make, vehicle_model, vehicle_year, engine_size
   - vehicle_registration, fuel_type, office_location
   - base_allocation, category_multiplier, engine_multiplier
   - last_allocation_date, current_balance, used_this_month

2. Add fields to CouponAllocation:
   - session_name, program_name, event_name, allocation_type
   - total_value, expiry_date, coupons_used, coupons_remaining

3. Update BeneficiaryCategory with multipliers:
   - category_multiplier field

4. Create/Update SessionAttendance model with:
   - session_type, start_time, end_time, duration_hours, location

5. Consider creating BeneficiaryVehicle as separate model for complex vehicle tracking
"""
