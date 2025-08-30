from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import re
from model_utils.models import TimeStampedModel, SoftDeletableModel
from decimal import Decimal
import uuid
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from .validators import validate_petrotrade_serial


# --- Archive and Audit Managers ---

class ArchiveManager(models.Manager):
    """Manager for archived records"""
    def get_queryset(self):
        return super().get_queryset().filter(is_archived=True)

class ActiveManager(models.Manager):
    """Manager for active (non-archived) records"""
    def get_queryset(self):
        return super().get_queryset().filter(is_archived=False)


# --- Abstract Base Models ---

class ArchivableModel(TimeStampedModel):
    """
    Abstract base model that adds archiving capabilities to any model
    """
    is_archived = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this record has been archived"
    )
    archived_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this record was archived"
    )
    archived_by = models.ForeignKey(
        'User',  # Use string reference to avoid circular import
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='archived_%(class)s_records',
        help_text="User who archived this record"
    )
    archive_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for archiving this record"
    )
    
    # Managers
    objects = ActiveManager()  # Default manager returns only active records
    all_objects = models.Manager()  # Returns all records (active + archived)
    archived_objects = ArchiveManager()  # Returns only archived records
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['is_archived']),
            models.Index(fields=['archived_at']),
        ]
    
    def archive(self, user=None, reason=None):
        """Archive this record"""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.archived_by = user
        self.archive_reason = reason
        self.save()
        
        # Create audit log entry - import here to avoid circular import
        from .models import AuditLog
        AuditLog.objects.create(
            content_type=ContentType.objects.get_for_model(self),
            object_id=str(self.pk),
            action='ARCHIVED',
            user=user,
            changes={'archived': True, 'reason': reason}
        )
    
    def unarchive(self, user=None, reason=None):
        """Restore this record from archive"""
        self.is_archived = False
        self.archived_at = None
        self.archived_by = None
        self.archive_reason = None
        self.save()
        
        # Create audit log entry - import here to avoid circular import
        from .models import AuditLog
        AuditLog.objects.create(
            content_type=ContentType.objects.get_for_model(self),
            object_id=str(self.pk),
            action='UNARCHIVED',
            user=user,
            changes={'unarchived': True, 'reason': reason}
        )


class User(AbstractUser):
    """
    Custom user model with role-based access control.
    Inherits from Django's AbstractUser and adds role field.
    """
    ROLE_CHOICES = [
        ('SUPERUSER', 'Super User (Developer)'),
        ('ADMIN', 'System Administrator'),
        ('MAIN_CENTER', 'Main Center Officer'),
        ('SUB_CENTER', 'Sub Center Officer'),
        ('BENEFICIARY', 'Beneficiary'),
        ('AUDITOR', 'Auditor'),
        ('MAIN_CENTER_APPROVER', 'Main Center Approver'),
        ('SUB_CENTER_APPROVER', 'Sub Center Approver'),
        ('SERGEANT_OF_ARMS', 'Sergeant of Arms'),
    ]

    # Override inherited fields to fix conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='fuel_users',  # Fix conflict
        related_query_name='fuel_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='fuel_users',  # Fix conflict
        related_query_name='fuel_user',
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='BENEFICIARY'
    )
    sub_center = models.ForeignKey(
        'SubCenter',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='users'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Phone number for SMS notifications"
    )
    email = models.EmailField(unique=True, blank=True, null=True) # Make email optional
    
    # Digital signature and profile data
    digital_signature = models.TextField(
        blank=True,
        null=True,
        help_text="Base64 encoded digital signature image"
    )
    signature_uploaded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the digital signature was uploaded"
    )
    profile_picture = models.TextField(
        blank=True,
        null=True,
        help_text="Base64 encoded profile picture"
    )
    full_address = models.TextField(
        blank=True,
        null=True,
        help_text="Complete address for official documents"
    )
    national_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="National ID number"
    )
    
    last_activity = models.DateTimeField(auto_now=True)
    
    # User approval fields
    is_approved = models.BooleanField(
        default=False,
        help_text="Whether the user registration has been approved by an administrator"
    )
    approved_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_users',
        help_text="Administrator who approved this user"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the user was approved"
    )
    registration_justification = models.TextField(
        blank=True,
        null=True,
        help_text="User's justification for registration"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejecting the user registration"
    )

    class Meta:
        verbose_name = "System User"
        verbose_name_plural = "System Users"
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['sub_center']),
            models.Index(fields=['is_approved']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    def is_main_center_officer(self):
        return self.role == 'MAIN_CENTER'

    def is_approver(self):
        return self.role == 'APPROVER'
    
    def approve(self, approved_by_user):
        """Approve this user's registration"""
        self.is_approved = True
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.rejection_reason = None  # Clear any previous rejection reason
        self.save()
    
    def reject(self, rejected_by_user, reason=""):
        """Reject this user's registration"""
        self.is_approved = False
        self.approved_by = None
        self.approved_at = None
        self.rejection_reason = reason
        self.save()
    
    @property
    def approval_status(self):
        """Get the current approval status"""
        if self.is_approved:
            return 'approved'
        elif self.rejection_reason:
            return 'rejected'
        else:
            return 'pending'
    
    def can_login(self):
        """Check if user can log in (must be approved)"""
        return self.is_approved and self.is_active

    def save(self, *args, **kwargs):
        # Automatically approve superusers
        if self.is_superuser and not self.is_approved:
            self.is_approved = True
            self.approved_at = timezone.now()
        super().save(*args, **kwargs)


class SubCenter(TimeStampedModel):
    """
    Represents a distribution sub-center that manages fuel coupons
    """
    code = models.CharField(
        max_length=10,
        unique=True,
        help_text="Unique code for the sub-center"
    )
    name = models.CharField(max_length=100)
    location = models.TextField()
    managed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_centers',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER']}
    )
    is_active = models.BooleanField(default=True)
    capacity = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum capacity for beneficiaries/operations"
    )
    contact_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Primary contact phone number for the sub-center"
    )
    contact_person = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Name of the primary contact person at the sub-center"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Primary email address for the sub-center"
    )

    class Meta:
        ordering = ['name']
        verbose_name = "Sub Center"
        verbose_name_plural = "Sub Centers"

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def total_coupons(self):
        # This property might need refinement depending on coupon tracking logic (e.g., active coupons)
        # For now, it's a simple count of coupons associated with books assigned to this center's boxes
        from .models import Coupon # Import locally to avoid circular dependency
        coupon_count = Coupon.objects.filter(book__box__assigned_to=self).count()
        return coupon_count


class SubCenterOfficer(TimeStampedModel):
    """
    Explicitly links a user with a SubCenter role to a specific SubCenter.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='officer_of',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER']}
    )
    sub_center = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='officers'
    )
    is_manager = models.BooleanField(default=False, help_text="Designates if this officer is the manager of the sub-center")

    class Meta:
        unique_together = ('user', 'sub_center')
        verbose_name = "Sub Center Officer"
        verbose_name_plural = "Sub Center Officers"
        ordering = ['sub_center', '-is_manager', 'user__username']

    def __str__(self):
        role = "Manager" if self.is_manager else "Officer"
        return f"{self.user.username} ({role}) at {self.sub_center.name}"


class PoolVehicle(TimeStampedModel):
    """
    Pool vehicles used by subcenters for dispatching coupons and operations
    """
    VEHICLE_TYPES = [
        ('CAR', 'Car'),
        ('VAN', 'Van'),
        ('TRUCK', 'Truck'),
        ('MOTORCYCLE', 'Motorcycle'),
        ('PICKUP', 'Pickup Truck'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('RETIRED', 'Retired'),
        ('DAMAGED', 'Damaged'),
    ]
    
    registration_number = models.CharField(
        max_length=20,
        unique=True,
        help_text="Vehicle registration/license plate number"
    )
    make = models.CharField(max_length=50, help_text="Vehicle manufacturer")
    model = models.CharField(max_length=50, help_text="Vehicle model")
    year = models.IntegerField(help_text="Year of manufacture")
    vehicle_type = models.CharField(
        max_length=20,
        choices=VEHICLE_TYPES,
        default='CAR'
    )
    fuel_type = models.CharField(
        max_length=10,
        choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')],
        default='DIESEL'
    )
    engine_cc = models.IntegerField(
        help_text="Engine capacity in cubic centimeters",
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    assigned_subcenter = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='pool_vehicles',
        help_text="SubCenter this vehicle is assigned to"
    )
    current_mileage = models.IntegerField(
        default=0,
        help_text="Current odometer reading in kilometers"
    )
    last_service_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of last service/maintenance"
    )
    next_service_due = models.DateField(
        null=True,
        blank=True,
        help_text="Date when next service is due"
    )
    insurance_expiry = models.DateField(
        null=True,
        blank=True,
        help_text="Insurance policy expiry date"
    )
    
    class Meta:
        ordering = ['assigned_subcenter', 'registration_number']
        verbose_name = "Pool Vehicle"
        verbose_name_plural = "Pool Vehicles"
    
    def __str__(self):
        return f"{self.registration_number} - {self.make} {self.model} ({self.assigned_subcenter.code})"
    
    @property
    def is_active(self):
        return self.status == 'ACTIVE'
    
    @property
    def needs_service(self):
        from django.utils import timezone
        if self.next_service_due:
            return self.next_service_due <= timezone.now().date()
        return False


class Driver(TimeStampedModel):
    """
    Drivers assigned to pool vehicles for subcenter operations
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
        ('ON_LEAVE', 'On Leave'),
    ]
    
    LICENSE_CLASSES = [
        ('CLASS_1', 'Class 1 (Motorcycle)'),
        ('CLASS_2', 'Class 2 (Light Vehicle)'),
        ('CLASS_3', 'Class 3 (Heavy Vehicle)'),
        ('CLASS_4', 'Class 4 (Public Service Vehicle)'),
    ]
    
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique employee identification number"
    )
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    id_number = models.CharField(
        max_length=20,
        unique=True,
        help_text="National ID number"
    )
    license_number = models.CharField(
        max_length=20,
        unique=True,
        help_text="Driver's license number"
    )
    license_class = models.CharField(
        max_length=10,
        choices=LICENSE_CLASSES,
        default='CLASS_2'
    )
    license_expiry = models.DateField(help_text="Driver's license expiry date")
    phone_number = models.CharField(
        max_length=15,
        help_text="Contact phone number"
    )
    email = models.EmailField(
        blank=True,
        help_text="Email address (optional)"
    )
    address = models.TextField(help_text="Physical address")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    assigned_subcenter = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='drivers',
        help_text="SubCenter this driver is assigned to"
    )
    hire_date = models.DateField(help_text="Date when driver was hired")
    
    class Meta:
        ordering = ['assigned_subcenter', 'last_name', 'first_name']
        verbose_name = "Driver"
        verbose_name_plural = "Drivers"
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id}) - {self.assigned_subcenter.code}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_active(self):
        return self.status == 'ACTIVE'
    
    @property
    def license_expired(self):
        from django.utils import timezone
        return self.license_expiry < timezone.now().date()


class VehicleAssignment(TimeStampedModel):
    """
    Tracks assignment of drivers to specific vehicles
    """
    vehicle = models.ForeignKey(
        PoolVehicle,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name='vehicle_assignments'
    )
    assigned_date = models.DateField(help_text="Date when assignment started")
    unassigned_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when assignment ended"
    )
    is_primary_driver = models.BooleanField(
        default=False,
        help_text="Primary driver for this vehicle"
    )
    notes = models.TextField(
        blank=True,
        help_text="Any notes about this assignment"
    )
    
    class Meta:
        ordering = ['-assigned_date']
        verbose_name = "Vehicle Assignment"
        verbose_name_plural = "Vehicle Assignments"
        constraints = [
            models.UniqueConstraint(
                fields=['vehicle', 'driver'],
                condition=models.Q(unassigned_date__isnull=True),
                name='unique_active_assignment'
            )
        ]
    
    def __str__(self):
        status = "Active" if not self.unassigned_date else f"Ended {self.unassigned_date}"
        return f"{self.driver.full_name} -> {self.vehicle.registration_number} ({status})"
    
    @property
    def is_active(self):
        return self.unassigned_date is None


class Box(ArchivableModel):
    """
    Physical box containing coupon books
    Each box contains multiple books with sequential coupon numbering
    Enhanced to store all frontend calculations and validations
    """
    FUEL_TYPE_CHOICES = [
        ('PETROL', 'Petrol'),
        ('DIESEL', 'Diesel'),
    ]
    
    DENOMINATION_CHOICES = [
        (5, '5 Litres'),
        (10, '10 Litres'),
        (20, '20 Litres'),
        (50, '50 Litres'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Receipt'),
        ('RECEIVED', 'Received'),
        ('VERIFIED', 'Verified'),
        ('DISPATCHED', 'Dispatched'),
        ('DAMAGED', 'Damaged'),
        ('ARCHIVED', 'Archived'),
    ]
    
    CALCULATION_MODE_CHOICES = [
        ('first-and-count', 'First Coupon and Count'),
        ('first-and-last', 'First and Last Coupon'),
        ('manual', 'Manual Entry'),
    ]
    
    # Basic Box Information
    box_code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique identifier for the box (e.g., FCB-2025-0001)"
    )
    fuel_type = models.CharField(
        max_length=10,
        choices=FUEL_TYPE_CHOICES,
        default='DIESEL',
        help_text="Type of fuel this box contains coupons for"
    )
    denomination = models.IntegerField(
        choices=DENOMINATION_CHOICES,
        default=20,
        help_text="Litres per coupon (5L, 10L, 20L, or 50L)"
    )
    
    # Coupon Serial Number Validation (REQUIRED)
    first_coupon_number = models.CharField(
        max_length=50,
        help_text="First coupon number in the box (e.g., PU006GH355101)"
    )
    last_coupon_number = models.CharField(
        max_length=50,
        help_text="Last coupon number in the box (e.g., PU006GH355200)"
    )
    
    # Box Structure Information
    number_of_books = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        help_text="Number of books in this box"
    )
    coupons_per_book = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Number of coupons per book (1-100 range, usually 100 pages/coupons)"
    )
    
    # Calculated Fields (Auto-computed from frontend data)
    total_coupons_calculated = models.IntegerField(
        default=0,
        help_text="Total number of coupons calculated from frontend logic"
    )
    total_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Total litres calculated from coupons * denomination"
    )
    
    # Financial Calculations (from frontend)
    fuel_price_per_litre_usd = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        default=Decimal('1.40'),
        help_text="Price per litre in USD"
    )
    exchange_rate_zwg_usd = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        default=Decimal('27.50'),
        help_text="Exchange rate ZWG to USD"
    )
    total_value_usd = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total value in USD (calculated from frontend)"
    )
    total_value_zwg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total value in ZWG (calculated from frontend)"
    )
    
    # Frontend Calculation Metadata
    calculation_mode = models.CharField(
        max_length=20,
        choices=CALCULATION_MODE_CHOICES,
        default='first-and-count',
        help_text="Method used to calculate coupon numbers"
    )
    book_details_json = models.JSONField(
        default=list,
        blank=True,
        help_text="Detailed book breakdown from frontend (JSON format)"
    )
    
    # Status and Workflow
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='RECEIVED',
        help_text="Current status of the box"
    )
    
    # Timestamps and Assignment
    received_at = models.DateTimeField(default=timezone.now)
    assigned_to = models.ForeignKey(
        SubCenter,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='boxes'
    )
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_boxes',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER']}
    )
    
    # Additional Information
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this box"
    )
    barcode = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Barcode identifier for the box"
    )
    
    # Verification Fields
    verification_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from verification process"
    )
    verification_checks = models.JSONField(
        default=list,
        blank=True,
        help_text="Verification checklist items completed"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this box was verified"
    )
    verified_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_boxes',
        help_text="User who verified this box"
    )
    
    # Sign-off Fields for Final Approval
    signed_off_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='signed_off_boxes',
        help_text="User who signed off on this box"
    )
    sign_off_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this box was signed off"
    )
    sign_off_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from sign-off process"
    )
    
    # Missing Frontend Fields - Added for Complete Harmonization
    is_received = models.BooleanField(
        default=True,
        help_text="Whether this box has been received (calculated from status or explicit)"
    )
    supplier = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Supplier or vendor name"
    )
    received_by_signature = models.TextField(
        blank=True,
        null=True,
        help_text="Digital signature data of person who received the box"
    )
    damage_report = models.TextField(
        blank=True,
        null=True,
        help_text="Report of any damage found during receipt or verification"
    )
    delivery_note = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Delivery note reference number"
    )
    invoice_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Invoice reference number for this box"
    )
    qr_code_data = models.TextField(
        blank=True,
        null=True,
        help_text="QR code data for quick identification"
    )
    
    # Frontend Date/Time Handling
    received_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when box was received (extracted from received_at)"
    )
    received_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Time when box was received (extracted from received_at)"
    )
    
    # Inventory Tracking Fields (for frontend compatibility)
    books_dispatched = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of books that have been dispatched from this box"
    )
    coupons_used = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of coupons that have been used from this box"
    )
    litres_used = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Total litres worth of coupons that have been used"
    )
    location = models.CharField(
        max_length=200,
        default='Main Warehouse',
        help_text="Current physical location of this box"
    )
    
    # Calculated properties (for API compatibility)
    @property
    def monetary_value(self):
        """Alias for total_value_zwg for frontend compatibility"""
        return self.total_value_zwg
    
    @property
    def total_coupons(self):
        """Alias for total_coupons_calculated for frontend compatibility"""
        return self.total_coupons_calculated
    
    @property
    def books_remaining(self):
        """Calculate books remaining"""
        return max(0, self.number_of_books - self.books_dispatched)
    
    @property
    def coupons_remaining(self):
        """Calculate coupons remaining"""
        return max(0, self.total_coupons_calculated - self.coupons_used)
    
    @property
    def litres_remaining(self):
        """Calculate litres remaining"""
        return max(0, float(self.total_litres) - float(self.litres_used))

    class Meta:
        verbose_name = "Coupon Box"
        verbose_name_plural = "Coupon Boxes"
        ordering = ['-received_at']

    def __str__(self):
        return f"Box {self.box_code} ({self.get_fuel_type_display()} {self.denomination}L - {self.total_coupons_calculated:,} coupons, {self.total_litres}L total)"

    def clean(self):
        """Validate coupon serial numbers and data consistency"""
        from django.core.exceptions import ValidationError
        
        # Validate coupon serial format (should be Petrotrade format)
        if self.first_coupon_number:
            if not re.match(r'^.+\d{6,}$', self.first_coupon_number):
                raise ValidationError({
                    'first_coupon_number': 'Invalid format. Should end with at least 6 digits.'
                })
        
        if self.last_coupon_number:
            if not re.match(r'^.+\d{6,}$', self.last_coupon_number):
                raise ValidationError({
                    'last_coupon_number': 'Invalid format. Should end with at least 6 digits.'
                })
        
        # Validate coupon number sequence
        if self.first_coupon_number and self.last_coupon_number:
            first_num = self._extract_coupon_number(self.first_coupon_number)
            last_num = self._extract_coupon_number(self.last_coupon_number)
            
            if first_num and last_num and first_num >= last_num:
                raise ValidationError({
                    'last_coupon_number': 'Last coupon number must be greater than first coupon number'
                })

    def _extract_coupon_number(self, coupon_str):
        """Extract the numeric part from coupon string"""
        try:
            match = re.search(r'(\d+)$', coupon_str)
            return int(match.group(1)) if match else None
        except (ValueError, AttributeError):
            return None

    def calculate_totals(self):
        """Calculate all derived fields based on current data"""
        # Calculate total coupons from coupon serial numbers
        if self.first_coupon_number and self.last_coupon_number:
            first_num = self._extract_coupon_number(self.first_coupon_number)
            last_num = self._extract_coupon_number(self.last_coupon_number)
            
            if first_num and last_num:
                self.total_coupons_calculated = last_num - first_num + 1
            else:
                # Fallback to book calculation
                self.total_coupons_calculated = self.number_of_books * self.coupons_per_book
        else:
            self.total_coupons_calculated = self.number_of_books * self.coupons_per_book
        
        # Calculate total litres
        self.total_litres = Decimal(str(self.total_coupons_calculated * self.denomination))
        
        # Calculate financial values
        self.total_value_usd = self.total_litres * self.fuel_price_per_litre_usd
        self.total_value_zwg = self.total_value_usd * self.exchange_rate_zwg_usd

    def save(self, *args, **kwargs):
        # Sync received_at with received_date and received_time
        if self.received_date and self.received_time:
            from datetime import datetime, time
            self.received_at = datetime.combine(self.received_date, self.received_time)
        elif self.received_at:
            # Extract date and time from received_at if set
            self.received_date = self.received_at.date()
            self.received_time = self.received_at.time()
        
        # Auto-generate box_code if not set
        if not self.box_code:
            now = timezone.now()
            year = now.strftime("%Y")
            last_box = Box.objects.filter(box_code__startswith=f"FCB-{year}-").order_by('-id').first()
            if last_box:
                last_code_part = last_box.box_code.split('-')[-1]
                try:
                    next_number = int(last_code_part) + 1
                except ValueError:
                    next_number = 1 # Fallback if parsing fails
            else:
                next_number = 1
            self.box_code = f"FCB-{year}-{next_number:04d}"
        
        # Always recalculate all derived fields
        self.calculate_totals()
            
        super().save(*args, **kwargs)
        
        # Create individual book records if they don't exist
        self.create_book_records()

    def create_book_records(self):
        """Create individual Book records based on book_details_json or calculated data"""
        # Only create if we don't have books yet
        if not self.books.exists() and self.number_of_books > 0:
            
            if self.book_details_json and isinstance(self.book_details_json, list):
                # Use detailed book information from frontend
                for book_detail in self.book_details_json:
                    book_number = book_detail.get('book_number', book_detail.get('bookId', book_detail.get('book_id', '')))
                    
                    # Generate unique book_code to avoid conflicts
                    book_code = f"{self.box_code}-BOOK-{book_number}"
                    
                    # Check if book already exists with this code
                    existing_book = Book.objects.filter(book_code=book_code).first()
                    if existing_book:
                        # Update existing book instead of creating new one
                        existing_book.first_coupon_number = book_detail.get('firstCouponId', book_detail.get('first_coupon_id', ''))
                        existing_book.last_coupon_number = book_detail.get('lastCouponId', book_detail.get('last_coupon_id', ''))
                        existing_book.initial_coupon_count = book_detail.get('numberOfCoupons', book_detail.get('number_of_coupons', self.coupons_per_book))
                        existing_book.save()
                    else:
                        # Create new book
                        Book.objects.create(
                            box=self,
                            book_number=book_number,
                            book_code=book_code,
                            first_coupon_number=book_detail.get('firstCouponId', book_detail.get('first_coupon_id', '')),
                            last_coupon_number=book_detail.get('lastCouponId', book_detail.get('last_coupon_id', '')),
                            initial_coupon_count=book_detail.get('numberOfCoupons', book_detail.get('number_of_coupons', self.coupons_per_book))
                        )
            else:
                # Generate books automatically based on sequential numbering
                self._generate_sequential_books()

    def _generate_sequential_books(self):
        """Generate book records with sequential coupon numbering"""
        if not self.first_coupon_number or not self.last_coupon_number:
            return
            
        first_num = self._extract_coupon_number(self.first_coupon_number)
        if not first_num:
            return
            
        # Extract prefix from coupon number (e.g., "PU06GH")
        prefix_match = re.match(r'^(PU\d{2}[A-Z]{2})', self.first_coupon_number)
        if not prefix_match:
            return
            
        prefix = prefix_match.group(1)
        coupons_per_book = self.coupons_per_book
        
        for book_num in range(1, self.number_of_books + 1):
            start_coupon = first_num + (book_num - 1) * coupons_per_book
            end_coupon = start_coupon + coupons_per_book - 1
            
            book_number = f"Book {book_num}"
            book_code = f"{self.box_code}-BOOK-{book_number}"
            
            # Check if book already exists with this code
            existing_book = Book.objects.filter(book_code=book_code).first()
            if existing_book:
                # Update existing book instead of creating new one
                existing_book.first_coupon_number = f"{prefix}{start_coupon:06d}"
                existing_book.last_coupon_number = f"{prefix}{end_coupon:06d}"
                existing_book.initial_coupon_count = coupons_per_book
                existing_book.save()
            else:
                # Create new book
                Book.objects.create(
                    box=self,
                    book_number=book_number,
                    book_code=book_code,
                    first_coupon_number=f"{prefix}{start_coupon:06d}",
                    last_coupon_number=f"{prefix}{end_coupon:06d}",
                    initial_coupon_count=coupons_per_book
                )

    @property
    def total_coupons(self):
        """Backward compatibility property"""
        return self.total_coupons_calculated
    
    @property 
    def calculated_total_litres(self):
        """Calculate total litres in this box"""
        return Decimal(str(self.total_coupons_calculated * self.denomination))
    
    @property
    def coupon_serial_range(self):
        """Return human-readable coupon range"""
        if self.first_coupon_number and self.last_coupon_number:
            return f"{self.first_coupon_number} - {self.last_coupon_number}"
        return "Not specified"
    
    @property
    def is_verified(self):
        """Check if this box has been verified"""
        return self.status == 'VERIFIED' and self.verified_at is not None
    
    @property
    def verification_status_display(self):
        """Human-readable verification status"""
        if self.is_verified:
            return f"Verified on {self.verified_at.strftime('%Y-%m-%d %H:%M')}"
        return "Not verified"
    
    def verify_box(self, user, notes=""):
        """Mark this box as verified"""
        self.status = 'VERIFIED'
        self.verified_at = timezone.now()
        self.verified_by = user
        if notes:
            self.verification_notes = notes
        self.save()
    
    def get_book_breakdown(self):
        """Get detailed breakdown of books in this box"""
        books = []
        for book in self.books.all():
            books.append({
                'book_number': book.book_number,
                'first_coupon': book.first_coupon_number,
                'last_coupon': book.last_coupon_number,
                'total_coupons': book.total_coupons,
                'is_assigned': book.is_assigned,
                'assigned_to': str(book.assigned_to) if book.assigned_to else None
            })
        return books
    
    @property
    def coupon_number_range(self):
        """Return formatted coupon number range"""
        if self.first_coupon_number and self.last_coupon_number:
            return f"{self.first_coupon_number} - {self.last_coupon_number}"
        return "Not set"
    
    @property
    def books_summary(self):
        """Return summary of books in this box"""
        return f"{self.number_of_books} books × {self.coupons_per_book} coupons = {self.total_coupons} total"
    
    def generate_book_ranges(self):
        """
        Generate the coupon number ranges for each book in this box
        Returns a list of tuples: [(book_number, first_coupon, last_coupon), ...]
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            return []
        
        try:
            # Extract numeric part from coupon numbers
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                return []
            
            prefix = first_match.group(1)
            first_num = int(first_match.group(2))
            last_num = int(last_match.group(2))
            
            total_coupons = last_num - first_num + 1
            
            if total_coupons != self.total_coupons:
                # Adjust if mismatch
                self.coupons_per_book = total_coupons // self.number_of_books
            
            book_ranges = []
            current_num = first_num
            
            for book_idx in range(self.number_of_books):
                book_first = current_num
                book_last = current_num + self.coupons_per_book - 1
                
                # Ensure we don't exceed the last coupon number
                if book_last > last_num:
                    book_last = last_num
                
                book_ranges.append((
                    book_idx + 1,
                    f"{prefix}{book_first:0{len(first_match.group(2))}}",
                    f"{prefix}{book_last:0{len(first_match.group(2))}}"
                ))
                
                current_num = book_last + 1
                
                if current_num > last_num:
                    break
            
            return book_ranges
            
        except (ValueError, AttributeError):
            return []

    def generate_books_and_coupons(self):
        """
        Generate all books and their sequential coupons based on the box's first and last coupon numbers.
        This implements the Box and Book Coupon Generation Logic with proper page support.
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            raise ValueError("Box must have first and last coupon numbers defined")
        
        # Delete existing books, pages, and coupons to regenerate
        self.books.all().delete()
        
        try:
            # Extract prefix and numeric parts
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                raise ValueError("Invalid coupon number format")
            
            prefix = first_match.group(1)
            first_num = int(first_match.group(2))
            last_num = int(last_match.group(2))
            number_length = len(first_match.group(2))
            
            total_coupons = last_num - first_num + 1
            expected_coupons = self.number_of_books * self.coupons_per_book
            
            if total_coupons != expected_coupons:
                raise ValueError(f"Coupon count mismatch: Range has {total_coupons} coupons but box expects {expected_coupons}")
            
            # Generate books with their pages and coupons
            current_num = first_num
            books_created = []
            
            for book_idx in range(self.number_of_books):
                book_number = book_idx + 1
                book_first = current_num
                book_last = current_num + self.coupons_per_book - 1
                
                # Create the book
                book = Book.objects.create(
                    box=self,
                    book_number=f"Book {book_number:02d}",
                    first_coupon_number=f"{prefix}{book_first:0{number_length}d}",
                    last_coupon_number=f"{prefix}{book_last:0{number_length}d}",
                    initial_coupon_count=self.coupons_per_book
                )
                
                # Generate pages and coupons for this book
                pages_to_create = []
                coupons_to_create = []
                
                for page_idx in range(self.coupons_per_book):
                    page_number = page_idx + 1
                    coupon_num = book_first + page_idx
                    coupon_number = f"{prefix}{coupon_num:0{number_length}d}"
                    
                    # Create page
                    page = BookPage(
                        book=book,
                        page_number=page_number,
                        first_coupon_number=coupon_number,
                        last_coupon_number=coupon_number,
                        coupons_per_page=1
                    )
                    pages_to_create.append(page)
                
                # Bulk create pages first
                BookPage.objects.bulk_create(pages_to_create)
                
                # Now create coupons with page references
                pages = book.pages.all().order_by('page_number')
                for idx, page in enumerate(pages):
                    coupon_num = book_first + idx
                    coupon_number = f"{prefix}{coupon_num:0{number_length}d}"
                    
                    coupon = Coupon(
                        book=book,
                        page=page,
                        coupon_number=coupon_number,
                        litres=self.denomination,
                        status='AVAILABLE'
                    )
                    coupons_to_create.append(coupon)
                
                # Bulk create coupons for efficiency
                Coupon.objects.bulk_create(coupons_to_create)
                books_created.append(book)
                
                current_num = book_last + 1
            
            return books_created
            
        except (ValueError, AttributeError) as e:
            raise ValueError(f"Error generating books and coupons: {str(e)}")
    
    def validate_coupon_sequence(self):
        """
        Validate that the box's coupon sequence is correct and matches the logic
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            return False, "First and last coupon numbers are required"
        
        try:
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                return False, "Invalid coupon number format"
            
            if first_match.group(1) != last_match.group(1):
                return False, "First and last coupon numbers must have the same prefix"
            
            first_num = int(first_match.group(2))
            last_num = int(last_match.group(2))
            
            if first_num >= last_num:
                return False, "First coupon number must be less than last coupon number"
            
            total_coupons = last_num - first_num + 1
            expected_coupons = self.number_of_books * self.coupons_per_book
            
            if total_coupons != expected_coupons:
                return False, f"Coupon range ({total_coupons}) doesn't match expected count ({expected_coupons})"
            
            return True, "Coupon sequence is valid"
            
        except (ValueError, AttributeError) as e:
            return False, f"Validation error: {str(e)}"
    
    def get_book_ranges_summary(self):
        """
        Get a summary of book ranges without generating the actual books/coupons.
        Useful for preview and validation.
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            return []
        
        try:
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                return []
            
            prefix = first_match.group(1)
            first_num = int(first_match.group(2))
            number_length = len(first_match.group(2))
            
            book_ranges = []
            current_num = first_num
            
            for book_idx in range(self.number_of_books):
                book_number = book_idx + 1
                book_first = current_num
                book_last = current_num + self.coupons_per_book - 1
                
                book_ranges.append({
                    'book_number': book_number,
                    'book_name': f"Book {book_number:02d}",
                    'first_coupon': f"{prefix}{book_first:0{number_length}d}",
                    'last_coupon': f"{prefix}{book_last:0{number_length}d}",
                    'coupon_count': self.coupons_per_book,
                    'litres_total': self.coupons_per_book * self.denomination
                })
                
                current_num = book_last + 1
            
            return book_ranges
            
        except (ValueError, AttributeError):
            return []
    
    @property
    def is_fully_generated(self):
        """Check if all books and coupons have been generated for this box"""
        return (
            self.books.count() == self.number_of_books and
            self.books.aggregate(total=models.Sum('coupons__id'))['total'] is not None and
            self.coupons.count() == self.total_coupons
        )
    
    @property 
    def coupons(self):
        """Get all coupons in this box through all books"""
        return Coupon.objects.filter(book__box=self)

    @property
    def coupon_range(self):
        return f"{self.first_coupon_number} {self.last_coupon_number}"


class Book(ArchivableModel):
    """
    Individual book within a box containing coupons
    Each book has a sequential range of coupon numbers
    """
    box = models.ForeignKey(
        Box,
        on_delete=models.CASCADE,
        related_name='books'
    )
    book_number = models.CharField(
        max_length=50,
        help_text="Book number within the box (e.g., Book 1, Book 2, etc.)"
    )
    first_coupon_number = models.CharField(
        max_length=50,
        help_text="First coupon number in this book (e.g., PU00GH355101)"
    )
    last_coupon_number = models.CharField(
        max_length=50,
        help_text="Last coupon number in this book (e.g., PU00GH355110)"
    )
    is_assigned = models.BooleanField(
        default=False,
        help_text="Whether this book has been assigned to a beneficiary"
    )
    assigned_to = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_books',
        limit_choices_to={'role': 'BENEFICIARY'},
        help_text="Parliament member this book is assigned to"
    )
    assigned_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this book was assigned"
    )
    initial_coupon_count = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Initial number of coupons in the book"
    )
    
    # Enhanced book tracking to match frontend
    generated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this book was generated/created"
    )
    generated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='generated_books',
        help_text="User who generated this book"
    )
    book_code = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        help_text="Unique book identifier (auto-generated)"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this book has been verified for accuracy"
    )
    verified_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_books',
        help_text="User who verified this book"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this book was verified"
    )
    verification_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from the verification process"
    )
    verification_checks = models.JSONField(
        default=list,
        blank=True,
        help_text="Verification checklist items completed for this book"
    )

    class Meta:
        unique_together = ('box', 'book_number')
        verbose_name = "Coupon Book"
        verbose_name_plural = "Coupon Books"
        ordering = ['box', 'book_number']

    def __str__(self):
        return f"Book {self.book_number} (Box {self.box.box_code})"
    
    def save(self, *args, **kwargs):
        # Auto-generate book code if not provided
        if not self.book_code:
            self.book_code = f"{self.box.box_code}-BOOK-{self.book_number}"
        
        # Calculate initial coupon count if not provided
        if not self.initial_coupon_count and self.first_coupon_number and self.last_coupon_number:
            try:
                # Extract numeric parts for calculation
                first_num = int(''.join(filter(str.isdigit, self.first_coupon_number)))
                last_num = int(''.join(filter(str.isdigit, self.last_coupon_number)))
                self.initial_coupon_count = last_num - first_num + 1
            except (ValueError, TypeError):
                self.initial_coupon_count = 100  # Default assumption
        
        super().save(*args, **kwargs)
        
        # Auto-generate individual coupons after book is saved
        if self.pk and not self.coupons.exists():
            self.generate_coupons()
    
    def generate_coupons(self):
        """Generate individual coupon records for this book"""
        if not self.first_coupon_number or not self.last_coupon_number:
            return
        
        try:
            # Extract the pattern from first coupon number
            # Example: PU00GH355101 -> prefix: PU00GH, base: 355101
            first_num_str = self.first_coupon_number
            last_num_str = self.last_coupon_number
            
            # Find the numeric part
            import re
            match = re.match(r'([A-Z]+)(\d+)', first_num_str)
            if not match:
                return
            
            prefix = match.group(1)
            start_num = int(match.group(2))
            
            match_last = re.match(r'([A-Z]+)(\d+)', last_num_str)
            if not match_last:
                return
            
            end_num = int(match_last.group(2))
            
            # Generate individual coupons
            for i in range(start_num, end_num + 1):
                coupon_number = f"{prefix}{i:08d}"  # Pad with zeros to match format
                
                # Create coupon if it doesn't exist
                Coupon.objects.get_or_create(
                    book=self,
                    coupon_number=coupon_number,
                    defaults={
                        'litres': self.box.denomination if hasattr(self.box, 'denomination') else 20,
                        'status': 'AVAILABLE',
                        'usd_value': self.box.denomination * 1.40 if hasattr(self.box, 'denomination') else 28.00,  # 20L * $1.40/L
                    }
                )
        except Exception as e:
            # Log error but don't fail the save
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error generating coupons for book {self.book_code}: {e}")
    
    @property
    def coupon_count(self):
        """Get current number of coupons in this book"""
        return self.coupons.count()
    
    @property
    def available_coupons(self):
        """Get count of available coupons"""
        return self.coupons.filter(status='AVAILABLE').count()
    
    @property
    def allocated_coupons(self):
        """Get count of allocated coupons"""
        return self.coupons.filter(status='ALLOCATED').count()
    
    @property
    def used_coupons(self):
        """Get count of used coupons"""
        return self.coupons.filter(status='USED').count()
    
    def get_coupon_range_display(self):
        """Get formatted display of coupon range"""
        return f"{self.first_coupon_number} to {self.last_coupon_number}"
    
    def to_frontend_format(self):
        """Convert to frontend BookInfo format"""
        return {
            'bookId': self.book_code or f"Book {self.book_number}",
            'bookNumber': self.book_number,
            'firstCouponId': self.first_coupon_number,
            'lastCouponId': self.last_coupon_number,
            'numberOfCoupons': self.coupon_count,
            'isAssigned': self.is_assigned,
            'assignedTo': self.assigned_to.get_full_name() if self.assigned_to else None,
            'isVerified': self.is_verified,
            'verifiedBy': self.verified_by.get_full_name() if self.verified_by else None,
            'verificationNotes': self.verification_notes,
        }

    @property
    def total_coupons(self):
        """Calculate the count based on first and last coupon numbers"""
        try:
            first_match = re.search(r'(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\d+)$', self.last_coupon_number)
            if first_match and last_match:
                first_num = int(first_match.group(1))
                last_num = int(last_match.group(1))
                return last_num - first_num + 1
            return 0
        except (ValueError, AttributeError):
            return 0

    @property
    def available_coupons_count(self):
        """Count of available (unused) coupons in this book"""
        return self.coupons.filter(status='AVAILABLE').count()
    
    @property
    def used_coupons_count(self):
        """Count of used coupons in this book"""
        return self.coupons.filter(status='USED').count()
    
    @property
    def allocated_coupons_count(self):
        """Count of allocated (but not yet used) coupons in this book"""
        return self.coupons.filter(status='ALLOCATED').count()

    def save(self, *args, **kwargs):
        # Automatically calculate initial_coupon_count if not set
        if self.initial_coupon_count is None and self.first_coupon_number and self.last_coupon_number:
            self.initial_coupon_count = self.total_coupons
            
        super().save(*args, **kwargs)

    def generate_pages_and_coupons(self):
        """
        Generate pages and coupons for this book.
        Each page typically contains 1 coupon, supporting up to 100 pages.
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            return []
        
        try:
            # Extract prefix and numeric parts
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                return []
            
            prefix = first_match.group(1)
            first_num = int(first_match.group(2))
            last_num = int(last_match.group(2))
            num_length = len(first_match.group(2))
            
            total_coupons = last_num - first_num + 1
            pages_created = []
            coupons_created = []
            
            # Generate pages with their coupons
            current_num = first_num
            for page_idx in range(total_coupons):  # One coupon per page
                page_number = page_idx + 1
                coupon_number = f"{prefix}{current_num:0{num_length}d}"
                
                # Create the page
                page = BookPage.objects.create(
                    book=self,
                    page_number=page_number,
                    first_coupon_number=coupon_number,
                    last_coupon_number=coupon_number,
                    coupons_per_page=1
                )
                pages_created.append(page)
                
                # Create the coupon for this page
                coupon = Coupon.objects.create(
                    book=self,
                    page=page,
                    coupon_number=coupon_number,
                    litres=self.box.denomination,
                    status='AVAILABLE'
                )
                coupons_created.append(coupon)
                
                current_num += 1
                
                if current_num > last_num:
                    break
            
            return {'pages': pages_created, 'coupons': coupons_created}
            
        except (ValueError, AttributeError) as e:
            print(f"Error generating pages and coupons for book {self.book_number}: {e}")
            return []

    def get_pages_summary(self):
        """
        Get a summary of all pages in this book with their coupon ranges.
        Useful for frontend verification stage.
        """
        pages = self.pages.order_by('page_number')
        summary = []
        
        for page in pages:
            summary.append({
                'page_number': page.page_number,
                'first_coupon': page.first_coupon_number,
                'last_coupon': page.last_coupon_number,
                'coupon_count': page.coupons_per_page,
                'is_used': page.is_used,
                'used_date': page.used_date,
                'available_coupons': page.available_coupons_count
            })
        
        return summary

    def generate_coupons(self):
        """
        Generate individual coupon records for this book
        Creates coupons with sequential numbers between first and last coupon numbers
        """
        if not self.first_coupon_number or not self.last_coupon_number:
            return []
        
        try:
            # Extract prefix and numeric parts
            first_match = re.search(r'(\D*)(\d+)$', self.first_coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', self.last_coupon_number)
            
            if not first_match or not last_match:
                return []
            
            prefix = first_match.group(1)
            first_num = int(first_match.group(2))
            last_num = int(last_match.group(2))
            num_length = len(first_match.group(2))
            
            coupons_created = []
            
            for coupon_num in range(first_num, last_num + 1):
                coupon_number = f"{prefix}{coupon_num:0{num_length}}"
                
                # Check if coupon already exists
                if not Coupon.objects.filter(coupon_number=coupon_number).exists():
                    coupon = Coupon.objects.create(
                        book=self,
                        coupon_number=coupon_number,
                        litres=self.box.denomination,
                        status='AVAILABLE'
                    )
                    coupons_created.append(coupon)
            
            return coupons_created
            
        except (ValueError, AttributeError) as e:
            print(f"Error generating coupons for book {self.book_number}: {e}")
            return []
    
    @classmethod
    def create_from_petrotrade_serials(cls, box, book_number, first_serial, last_serial):
        """
        Create a book with PetroTrade serial numbers (e.g., PU006H355101 to PU006H355200)
        """
        from .utils.petrotrade_serials import PetroTradeSerial
        
        # Validate and parse serials
        first_info = PetroTradeSerial.parse_serial(first_serial)
        last_info = PetroTradeSerial.parse_serial(last_serial)
        
        if not first_info['is_valid'] or not last_info['is_valid']:
            raise ValueError("Invalid PetroTrade serial format")
        
        if first_info['prefix'] != last_info['prefix']:
            raise ValueError("First and last serials must have the same prefix")
        
        if first_info['number'] >= last_info['number']:
            raise ValueError("Last serial number must be greater than first serial number")
        
        # Create the book
        book = cls.objects.create(
            box=box,
            book_number=book_number,
            first_coupon_number=first_serial,
            last_coupon_number=last_serial
        )
        
        # Generate coupons for this book
        book.generate_petrotrade_coupons()
        
        return book
    
    def generate_petrotrade_coupons(self):
        """
        Generate coupons using PetroTrade serial format
        """
        from .utils.petrotrade_serials import PetroTradeSerial
        
        if not self.first_coupon_number or not self.last_coupon_number:
            return []
        
        # Generate all serial numbers in the range
        serials = PetroTradeSerial.generate_range(
            self.first_coupon_number, 
            self.last_coupon_number
        )
        
        coupons_created = []
        
        for serial in serials:
            # Check if coupon already exists
            if not Coupon.objects.filter(coupon_number=serial).exists():
                coupon = Coupon.objects.create(
                    book=self,
                    coupon_number=serial,
                    litres=self.box.denomination,
                    status='AVAILABLE'
                )
                coupons_created.append(coupon)
        
        return coupons_created
    
    def validate_petrotrade_range(self):
        """
        Validate that this book's serial range is valid PetroTrade format
        """
        from .utils.petrotrade_serials import PetroTradeSerial
        
        try:
            first_info = PetroTradeSerial.parse_serial(self.first_coupon_number)
            last_info = PetroTradeSerial.parse_serial(self.last_coupon_number)
            
            if not first_info['is_valid'] or not last_info['is_valid']:
                return False, "Invalid PetroTrade serial format"
            
            if first_info['prefix'] != last_info['prefix']:
                return False, "First and last serials must have the same prefix"
            
            if first_info['number'] >= last_info['number']:
                return False, "Last serial number must be greater than first serial number"
            
            return True, "Valid PetroTrade serial range"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def assign_to_beneficiary(self, beneficiary_user):
        """Assign this book to a parliament member"""
        if self.is_assigned:
            raise ValueError("Book is already assigned")
        
        self.assigned_to = beneficiary_user
        self.assigned_date = timezone.now()
        self.is_assigned = True
        self.save()
        
        # Mark all coupons in this book as allocated to the beneficiary
        self.coupons.filter(status='AVAILABLE').update(
            status='ALLOCATED',
            allocated_to=beneficiary_user,
            allocated_date=timezone.now()
        )
    
    def allocate_sequential_coupons(self, beneficiary, count, start_from_coupon=None):
        """
        Allocate a sequential block of coupons to a beneficiary.
        This implements efficient sequential allocation where we only need 
        the first and last coupon numbers in the allocated range.
        
        Args:
            beneficiary: User to allocate coupons to
            count: Number of sequential coupons to allocate
            start_from_coupon: Optional coupon number to start from
            
        Returns:
            dict with allocation details including first and last coupon numbers
        """
        if not self.is_assigned:
            raise ValueError("Book must be assigned to a beneficiary before allocating individual coupons")
        
        if beneficiary != self.assigned_to:
            raise ValueError("Can only allocate coupons to the beneficiary this book is assigned to")
        
        # Get available coupons in sequential order
        available_coupons = self.coupons.filter(status='AVAILABLE').order_by('coupon_number')
        
        if start_from_coupon:
            # Start from specific coupon
            available_coupons = available_coupons.filter(coupon_number__gte=start_from_coupon)
        
        if available_coupons.count() < count:
            raise ValueError(f"Not enough available coupons. Requested: {count}, Available: {available_coupons.count()}")
        
        # Get the sequential block
        coupons_to_allocate = list(available_coupons[:count])
        
        # Verify they are truly sequential
        first_coupon = coupons_to_allocate[0]
        last_coupon = coupons_to_allocate[-1]
        
        # Extract numeric parts to verify sequentiality
        try:
            first_match = re.search(r'(\D*)(\d+)$', first_coupon.coupon_number)
            last_match = re.search(r'(\D*)(\d+)$', last_coupon.coupon_number)
            
            if first_match and last_match:
                first_num = int(first_match.group(2))
                last_num = int(last_match.group(2))
                expected_last = first_num + count - 1
                
                if last_num != expected_last:
                    raise ValueError(f"Coupons are not sequential. Gap detected between {first_coupon.coupon_number} and {last_coupon.coupon_number}")
        except (ValueError, AttributeError):
            raise ValueError("Error validating coupon sequence")
        
        # Allocate the coupons
        allocated_count = 0
        for coupon in coupons_to_allocate:
            coupon.status = 'ALLOCATED'
            coupon.allocated_to = beneficiary
            coupon.allocated_date = timezone.now()
            coupon.save()
            allocated_count += 1
        
        # Create allocation record
        allocation = CouponAllocation.objects.create(
            beneficiary=beneficiary,
            book=self,
            first_coupon_number=first_coupon.coupon_number,
            last_coupon_number=last_coupon.coupon_number,
            quantity=allocated_count,
            allocated_by=beneficiary,  # Could be changed to track who performed the allocation
            allocation_date=timezone.now(),
            notes=f"Sequential allocation of {allocated_count} coupons"
        )
        
        return {
            'allocation_id': allocation.id,
            'first_coupon': first_coupon.coupon_number,
            'last_coupon': last_coupon.coupon_number,
            'quantity': allocated_count,
            'total_litres': allocated_count * first_coupon.litres,
            'allocated_at': allocation.allocation_date,
            'beneficiary': beneficiary.get_full_name()
        }
    
    def get_allocation_summary(self):
        """
        Get a summary of all allocations for this book.
        Returns ranges instead of individual coupons for efficiency.
        """
        allocations = CouponAllocation.objects.filter(book=self).order_by('allocation_date')
        
        summary = []
        for allocation in allocations:
            summary.append({
                'allocation_id': allocation.id,
                'beneficiary': allocation.beneficiary.get_full_name(),
                'first_coupon': allocation.first_coupon_number,
                'last_coupon': allocation.last_coupon_number,
                'quantity': allocation.quantity,
                'total_litres': allocation.quantity * self.box.denomination,
                'allocated_date': allocation.allocation_date,
                'status': allocation.status if hasattr(allocation, 'status') else 'ACTIVE'
            })
        
        return summary
    
    def get_available_ranges(self):
        """
        Get available coupon ranges in this book.
        Returns sequential ranges rather than individual coupons for efficiency.
        """
        available_coupons = self.coupons.filter(status='AVAILABLE').order_by('coupon_number')
        
        if not available_coupons.exists():
            return []
        
        ranges = []
        current_range_start = None
        current_range_end = None
        prev_num = None
        
        for coupon in available_coupons:
            try:
                match = re.search(r'(\D*)(\d+)$', coupon.coupon_number)
                if not match:
                    continue
                    
                current_num = int(match.group(2))
                
                if prev_num is None:
                    # First coupon in range
                    current_range_start = coupon.coupon_number
                    current_range_end = coupon.coupon_number
                elif current_num == prev_num + 1:
                    # Continuing sequence
                    current_range_end = coupon.coupon_number
                else:
                    # Gap found, save previous range and start new one
                    ranges.append({
                        'first_coupon': current_range_start,
                        'last_coupon': current_range_end,
                        'count': self._calculate_range_count(current_range_start, current_range_end)
                    })
                    current_range_start = coupon.coupon_number
                    current_range_end = coupon.coupon_number
                
                prev_num = current_num
                
            except (ValueError, AttributeError):
                continue
        
        # Add the last range
        if current_range_start:
            ranges.append({
                'first_coupon': current_range_start,
                'last_coupon': current_range_end,
                'count': self._calculate_range_count(current_range_start, current_range_end)
            })
        
        return ranges
    
    def _calculate_range_count(self, first_coupon, last_coupon):
        """Helper method to calculate count in a coupon range"""
        try:
            first_match = re.search(r'(\d+)$', first_coupon)
            last_match = re.search(r'(\d+)$', last_coupon)
            if first_match and last_match:
                return int(last_match.group(1)) - int(first_match.group(1)) + 1
        except (ValueError, AttributeError):
            pass
        return 0
    
    def validate_book_integrity(self):
        """
        Validate that the book's coupon sequence is intact and matches expected ranges
        """
        errors = []
        
        if not self.first_coupon_number or not self.last_coupon_number:
            errors.append("First and last coupon numbers are required")
            return errors
        
        try:
            expected_count = self.total_coupons
            actual_count = self.coupons.count()
            
            if expected_count != actual_count:
                errors.append(f"Coupon count mismatch: expected {expected_count}, found {actual_count}")
            
            # Check for gaps in sequence
            all_coupons = self.coupons.order_by('coupon_number')
            
            if all_coupons.exists():
                first_actual = all_coupons.first().coupon_number
                last_actual = all_coupons.last().coupon_number
                
                if first_actual != self.first_coupon_number:
                    errors.append(f"First coupon mismatch: expected {self.first_coupon_number}, found {first_actual}")
                
                if last_actual != self.last_coupon_number:
                    errors.append(f"Last coupon mismatch: expected {self.last_coupon_number}, found {last_actual}")
                
                # Check for sequence gaps
                prev_num = None
                for coupon in all_coupons:
                    try:
                        match = re.search(r'(\d+)$', coupon.coupon_number)
                        if match:
                            current_num = int(match.group(1))
                            if prev_num is not None and current_num != prev_num + 1:
                                errors.append(f"Sequence gap detected: {prev_num} to {current_num}")
                            prev_num = current_num
                    except (ValueError, AttributeError):
                        errors.append(f"Invalid coupon number format: {coupon.coupon_number}")
        
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
        
        return errors

# Archive and Audit Models for Record Tracking

class AuditLog(TimeStampedModel):
    """
    Comprehensive audit logging for all system activities
    """
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('ARCHIVED', 'Archived'),
        ('UNARCHIVED', 'Unarchived'),
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('VIEW', 'Viewed'),
        ('EXPORT', 'Exported'),
        ('IMPORT', 'Imported'),
        ('APPROVE', 'Approved'),
        ('REJECT', 'Rejected'),
        ('ALLOCATE', 'Allocated'),
        ('USE', 'Used'),
        ('DISPATCH', 'Dispatched'),
        ('RECEIVE', 'Received'),
        ('VERIFY', 'Verified'),
        ('DAMAGE', 'Marked as Damaged'),
        ('SYSTEM', 'System Action'),
    ]
    
    # What was affected
    content_type = models.ForeignKey(
        'contenttypes.ContentType',
        on_delete=models.CASCADE,
        help_text="Type of object that was affected"
    )
    object_id = models.CharField(
        max_length=255,
        help_text="ID of the object that was affected"
    )
    object_repr = models.CharField(
        max_length=500,
        blank=True,
        help_text="String representation of the affected object"
    )
    
    # What happened
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text="Action that was performed"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the action"
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON representation of changes made"
    )
    
    # Who did it
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    user_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string of the browser/client"
    )
    
    # When and where
    session_key = models.CharField(
        max_length=40,
        blank=True,
        help_text="Session key for tracking user sessions"
    )
    url = models.URLField(
        blank=True,
        help_text="URL where the action was performed"
    )
    
    # Additional context
    is_system_action = models.BooleanField(
        default=False,
        help_text="Whether this was an automated system action"
    )
    severity = models.CharField(
        max_length=10,
        choices=[
            ('LOW', 'Low'),
            ('MEDIUM', 'Medium'),
            ('HIGH', 'High'),
            ('CRITICAL', 'Critical'),
        ],
        default='LOW',
        db_index=True,
        help_text="Severity level of the action"
    )
    
    class Meta:
        ordering = ['-created']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action']),
            models.Index(fields=['user']),
            models.Index(fields=['created']),
            models.Index(fields=['severity']),
            models.Index(fields=['is_system_action']),
        ]
    
    def __str__(self):
        return f"{self.action} on {self.content_type} by {self.user or 'System'} at {self.created}"
    
    @classmethod
    def log(cls, action, user=None, content_object=None, description='', changes=None, 
            severity='LOW', request=None, is_system_action=False):
        """
        Convenience method to create audit log entries
        """
        audit_data = {
            'action': action,
            'user': user,
            'description': description,
            'changes': changes or {},
            'severity': severity,
            'is_system_action': is_system_action,
        }
        
        if content_object:
            audit_data.update({
                'content_type': ContentType.objects.get_for_model(content_object),
                'object_id': str(content_object.pk),
                'object_repr': str(content_object)[:500],
            })
        
        if request:
            audit_data.update({
                'user_ip': cls._get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:1000],
                'session_key': request.session.session_key,
                'url': request.build_absolute_uri(),
            })
        
        return cls.objects.create(**audit_data)
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SystemAlert(TimeStampedModel):
    """
    System alerts for important events and notifications
    """
    ALERT_TYPES = [
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
        ('SECURITY', 'Security'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
        ('DISMISSED', 'Dismissed'),
    ]
    
    PRIORITY_CHOICES = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
        (4, 'Critical'),
    ]
    
    title = models.CharField(
        max_length=200,
        help_text="Alert title"
    )
    message = models.TextField(
        help_text="Detailed alert message"
    )
    alert_type = models.CharField(
        max_length=10,
        choices=ALERT_TYPES,
        default='INFO',
        db_index=True
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        db_index=True
    )
    priority = models.IntegerField(
        choices=PRIORITY_CHOICES,
        default=2,
        help_text="Alert priority level"
    )
    target_roles = models.JSONField(
        null=True,
        blank=True,
        help_text="Specific roles this alert targets (null means all roles)"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this alert expires (null means never expires)"
    )
    is_dismissible = models.BooleanField(
        default=True,
        help_text="Whether users can dismiss this alert"
    )
    
    # Related objects - temporarily commented out due to ContentType issues
    # content_type = models.ForeignKey(
    #     'contenttypes.ContentType',
    #     null=True,
    #     blank=True,
    #     on_delete=models.CASCADE,
    #     help_text="Related object type"
    # )
    object_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Related object ID"
    )
    
    # Users
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_alerts',
        help_text="User who created the alert"
    )
    acknowledged_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='acknowledged_alerts',
        help_text="User who acknowledged the alert"
    )
    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the alert was acknowledged"
    )
    
    class Meta:
        ordering = ['-priority', '-created']
        verbose_name = "System Alert"
        verbose_name_plural = "System Alerts"
        indexes = [
            models.Index(fields=['alert_type']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['created']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"
    
    @property
    def is_expired(self):
        """Check if alert has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def is_active(self):
        """Check if alert is active and not expired"""
        return self.status == 'ACTIVE' and not self.is_expired
    
    def acknowledge(self, user):
        """Acknowledge this alert"""
        self.status = 'ACKNOWLEDGED'
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save()
    
    def resolve(self):
        """Mark this alert as resolved"""
        self.status = 'RESOLVED'
        self.save()
    
    def dismiss(self):
        """Dismiss this alert"""
        self.status = 'DISMISSED'
        self.save()
    
    @classmethod
    def create_alert(cls, title, message, alert_type='INFO', priority=2, 
                    target_roles=None, expires_at=None, created_by=None, 
                    is_dismissible=True, related_object=None):
        """Convenience method to create system alerts"""
        alert_data = {
            'title': title,
            'message': message,
            'alert_type': alert_type,
            'priority': priority,
            'target_roles': target_roles,
            'expires_at': expires_at,
            'created_by': created_by,
            'is_dismissible': is_dismissible,
        }
        
        if related_object:
            alert_data.update({
                'content_type': ContentType.objects.get_for_model(related_object),
                'object_id': str(related_object.pk),
            })
        
        return cls.objects.create(**alert_data)


# Book Page Model for tracking individual pages within books
class BookPage(TimeStampedModel):
    """
    Individual page within a book containing coupons
    Each page typically contains 1 coupon, supporting up to 100 pages per book
    """
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='pages'
    )
    page_number = models.IntegerField(
        help_text="Page number within the book (1-100)"
    )
    first_coupon_number = models.CharField(
        max_length=50,
        help_text="First coupon number on this page"
    )
    last_coupon_number = models.CharField(
        max_length=50,
        help_text="Last coupon number on this page"
    )
    coupons_per_page = models.IntegerField(
        default=1,
        help_text="Number of coupons on this page (usually 1)"
    )
    is_used = models.BooleanField(
        default=False,
        help_text="Whether this page has been used"
    )
    used_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this page was used"
    )
    used_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='used_pages',
        help_text="User who used this page"
    )
    
    class Meta:
        unique_together = ('book', 'page_number')
        verbose_name = "Book Page"
        verbose_name_plural = "Book Pages"
        ordering = ['book', 'page_number']
        indexes = [
            models.Index(fields=['book', 'page_number']),
            models.Index(fields=['is_used']),
        ]

    def __str__(self):
        return f"Page {self.page_number} of {self.book.book_number} ({self.first_coupon_number} - {self.last_coupon_number})"

    @property
    def total_coupons(self):
        """Calculate total coupons on this page"""
        return self.coupons_per_page

    @property
    def available_coupons_count(self):
        """Count of available coupons on this page"""
        if self.is_used:
            return 0
        return self.coupons.filter(status='AVAILABLE').count()

    def use_page(self, user=None):
        """Mark this page as used"""
        self.is_used = True
        self.used_date = timezone.now()
        self.used_by = user
        self.save()
        
        # Mark all coupons on this page as used
        self.coupons.filter(status__in=['AVAILABLE', 'ALLOCATED']).update(
            status='USED',
            used_date=timezone.now()
        )


class Coupon(ArchivableModel):
    """
    Individual fuel coupon with allocation and usage tracking
    Follows the format shown in physical coupons (e.g., PU00GH355101)
    """
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ALLOCATED', 'Allocated'),
        ('USED', 'Used'),
        ('EXPIRED', 'Expired'),
        ('DAMAGED', 'Damaged'),
    ]

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    page = models.ForeignKey(
        BookPage,
        on_delete=models.CASCADE,
        related_name='coupons',
        null=True,
        blank=True,
        help_text="The page this coupon belongs to"
    )
    coupon_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        validators=[validate_petrotrade_serial],
        help_text="Unique coupon number (e.g., PU006H355101 - PetroTrade format)"
    )
    serial_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Additional serial number if different from coupon_number"
    )
    barcode = models.TextField(
        blank=True,
        null=True,
        help_text="Barcode data for the coupon (base64 encoded image or text)"
    )
    qr_code = models.TextField(
        blank=True,
        help_text="QR code data for the coupon (base64 encoded image or text)"
    )
    litres = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=20.0,
        help_text="Fuel amount in litres (5L, 20L, or 50L)"
    )
    usd_value = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Value of this coupon in USD (calculated from current fuel price)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='AVAILABLE',
        db_index=True
    )
    allocated_to = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='allocated_coupons',
        limit_choices_to={'role': 'BENEFICIARY'}
    )
    allocated_date = models.DateTimeField(null=True, blank=True)
    used_date = models.DateTimeField(null=True, blank=True)
    # Renamed used_at_location to transaction_location for consistency with FuelTransaction
    transaction_location = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        help_text="Service station or location where the coupon was used"
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Date when the coupon expires", 
        db_index=True
    )
    entitlement = models.ForeignKey(
        'FuelEntitlement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocated_coupons',
        help_text="The entitlement this coupon fulfills"
    )

    class Meta:
        ordering = ['coupon_number']
        verbose_name = "Fuel Coupon"
        verbose_name_plural = "Fuel Coupons"
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['allocated_to']),
            models.Index(fields=['book', 'coupon_number']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['page']),
        ]

    def __str__(self):
        return f"Coupon {self.coupon_number} ({self.get_status_display()}) - {self.litres}L"

    def save(self, *args, **kwargs):
        # Generate serial number if not set
        if not self.serial_number:
            self.serial_number = f"FC{timezone.now().strftime('%Y%m%d')}{self.coupon_number[-6:]}"
        
        # Generate barcode if not set
        if not self.barcode:
            self.barcode = f"POZ{self.serial_number}"
        
        # Generate QR code data if not set
        if not self.qr_code:
            qr_data = {
                'coupon_number': self.coupon_number,
                'serial_number': self.serial_number,
                'litres': str(self.litres),
                'book': self.book.book_number if self.book else '',
                'page': self.page.page_number if self.page else '',
                'issued_date': timezone.now().isoformat()
            }
            import json
            self.qr_code = json.dumps(qr_data)
        
        # Auto-calculate USD value based on current fuel prices
        if not self.usd_value:
            try:
                # Import locally to avoid circular import
                from .models import FuelData
                latest_fuel_data = FuelData.objects.latest('timestamp')
                fuel_type = self.book.box.fuel_type.lower()
                
                if fuel_type == 'petrol' and latest_fuel_data.petrol_price_usd:
                    self.usd_value = self.litres * latest_fuel_data.petrol_price_usd
                elif fuel_type == 'diesel' and latest_fuel_data.diesel_price_usd:
                    self.usd_value = self.litres * latest_fuel_data.diesel_price_usd
            except:
                # If FuelData doesn't exist or any other error, skip pricing
                pass
        
        # Automatically update status to EXPIRED if expiry_date is in the past
        if self.expiry_date and self.status not in ['USED', 'EXPIRED', 'DAMAGED']:
            if self.expiry_date < timezone.now().date():
                self.status = 'EXPIRED'
                
        super().save(*args, **kwargs)

    def allocate(self, user):
        """Marks the coupon as allocated to a user."""
        if self.status != 'AVAILABLE':
            raise ValueError("Only available coupons can be allocated")
        self.status = 'ALLOCATED'
        self.allocated_to = user
        self.allocated_date = timezone.now()
        self.save()

    def use(self, location=None):
        """Marks the coupon as used."""
        if self.status != 'ALLOCATED':
            raise ValueError("Only allocated coupons can be used")
        self.status = 'USED'
        self.used_date = timezone.now()
        if location:
            self.transaction_location = location
        self.save()

    def mark_damaged(self, reason=None):
        """Marks the coupon as damaged."""
        self.status = 'DAMAGED'
        if reason:
            # Could add a damage_reason field if needed
            pass
        self.save()

    @property
    def fuel_type(self):
        """Get the fuel type from the parent box"""
        return self.book.box.fuel_type
    
    @property
    def denomination(self):
        """Get the denomination from the parent box"""
        return self.book.box.denomination
    
    @property
    def is_expired(self):
        """Check if the coupon has expired"""
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False

    def mark_used(self, transaction_location=None):
        """ Marks the coupon as used. Optionally record the location. """
        if self.status not in ['ALLOCATED', 'AVAILABLE']:
            raise ValueError("Only allocated coupons can be marked as used")
        self.status = 'USED'
        self.used_date = timezone.now()
        self.transaction_location = transaction_location
        self.save()

        # Create a FuelTransaction record when a coupon is marked as used
        if self.allocated_to:
             FuelTransaction.objects.create(
                timestamp=self.used_date,
                beneficiary=self.allocated_to,
                coupon=self,
                litres_consumed=self.litres,
                transaction_location=self.transaction_location,
                recorded_by=None
            )


class FuelTransaction(TimeStampedModel):
    """
    Tracks individual fuel consumption events.
    Can be linked to a coupon or record consumption directly.
    """
    timestamp = models.DateTimeField(default=timezone.now)
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='fuel_transactions',
        limit_choices_to={'role': 'BENEFICIARY'}
    )
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fuel_transactions',
        help_text="Optional: The coupon used for this transaction"
    )
    litres_consumed = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    transaction_location = models.CharField(max_length=200, blank=True, null=True)
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_fuel_transactions',
        help_text="User who recorded this transaction (e.g., a fuel station attendant or officer)"
    )
    notes = models.TextField(blank=True)
    
    # Business Central Integration Fields
    bc_transaction_no = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Business Central transaction number"
    )
    employee_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Employee number from Business Central"
    )
    fuel_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Fuel amount in currency"
    )
    transaction_date = models.DateField(
        auto_now_add=True,
        help_text="Date of the transaction"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING',
        help_text="Transaction approval status"
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_transactions',
        help_text="User who approved the transaction"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the transaction was approved"
    )
    created_by_bc = models.BooleanField(
        default=False,
        help_text="Whether this transaction was created by Business Central"
    )

    class Meta:
        verbose_name = "Fuel Transaction"
        verbose_name_plural = "Fuel Transactions"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['beneficiary']),
            models.Index(fields=['coupon']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['bc_transaction_no']),
            models.Index(fields=['status']),
            models.Index(fields=['employee_no']),
            models.Index(fields=['transaction_date']),
        ]

    def __str__(self):
        if self.beneficiary:
            return f"{self.beneficiary.username} consumed {self.litres_consumed}L at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
        return f"Fuel consumption of {self.litres_consumed}L at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


# Parliament and Program Models
class BeneficiaryCategory(TimeStampedModel):
    """
    Categories for beneficiaries (e.g., MP, Senator, Staff)
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    monthly_entitlement_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Default monthly fuel entitlement in litres"
    )
    category_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('1.0'),
        help_text="Multiplier for this category (MP: 1.5, Senator: 1.4, etc.)"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Beneficiary Category"
        verbose_name_plural = "Beneficiary Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Constituency(TimeStampedModel):
    """
    Parliamentary constituencies
    """
    name = models.CharField(max_length=100, unique=True)
    province = models.CharField(max_length=50)
    district = models.CharField(max_length=50, null=True, blank=True)
    distance_from_parliament_km = models.IntegerField(
        default=0,
        help_text="Distance from Parliament in kilometers"
    )
    population = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Constituency"
        verbose_name_plural = "Constituencies"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.province})"


class VehicleCategory(TimeStampedModel):
    """
    Vehicle categories for fuel entitlements
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    fuel_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1.0,
        help_text="Multiplier for fuel entitlement based on vehicle category"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Vehicle Category"
        verbose_name_plural = "Vehicle Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Program(TimeStampedModel):
    """
    Parliamentary programs and events that require fuel allocations
    """
    PROGRAM_TYPES = [
        ('SESSION', 'Parliament Session'),
        ('COMMITTEE', 'Committee Meeting'),
        ('WORKSHOP', 'Workshop/Training'),
        ('OUTREACH', 'Outreach Program'),
        ('CONFERENCE', 'Conference'),
        ('CEREMONY', 'Official Ceremony'),
        ('INSPECTION', 'Site Inspection'),
        ('CAMPAIGN', 'Political Campaign'),
        ('NATIONAL_EVENT', 'National Event'),
        ('CONSTITUENCY', 'Constituency Visit'),
        ('DEBATE', 'Parliamentary Debate'),
        ('BUDGET_SESSION', 'Budget Session'),
        ('POLICY_MEETING', 'Policy Meeting'),
        ('PUBLIC_HEARING', 'Public Hearing'),
        ('DIPLOMATIC', 'Diplomatic Event'),
        ('OTHER', 'Other Event'),
    ]
    
    title = models.CharField(
        max_length=200,
        default='Untitled Program',
        help_text="Program title or name"
    )
    program_type = models.CharField(
        max_length=20,
        choices=PROGRAM_TYPES,
        default='SESSION'
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the program"
    )
    scheduled_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the program is scheduled to start"
    )
    end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the program is scheduled to end"
    )
    location = models.CharField(
        max_length=200,
        help_text="Program venue or location"
    )
    sub_center = models.ForeignKey(
        'SubCenter',
        on_delete=models.CASCADE,
        related_name='programs',
        null=True,
        blank=True,
        help_text="Sub-center responsible for this program"
    )
    organizer = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='organized_programs',
        null=True,
        blank=True,
        help_text="User responsible for organizing this program"
    )
    expected_participants = models.PositiveIntegerField(
        default=0,
        help_text="Expected number of participants"
    )
    fuel_allocation_approved = models.BooleanField(
        default=False,
        help_text="Whether fuel allocation has been approved for this program"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this program is active/upcoming"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about the program"
    )
    
    class Meta:
        db_table = 'fuel_program'
        verbose_name = "Program"
        verbose_name_plural = "Programs"
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['program_type']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['sub_center']),
            models.Index(fields=['organizer']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_program_type_display()}) - {self.scheduled_date.date() if self.scheduled_date else 'No Date'}"
    
    def save(self, *args, **kwargs):
        # Auto-set is_active based on dates
        from django.utils import timezone
        now = timezone.now()
        
        if self.end_date and self.end_date < now:
            self.is_active = False
        elif self.scheduled_date and self.scheduled_date > now:
            self.is_active = True
        
        super().save(*args, **kwargs)
    
    # === COMPUTED PROPERTIES FOR FRONTEND COMPATIBILITY ===
    
    @property
    def duration_days(self):
        """Calculate program duration in days"""
        if self.scheduled_date and self.end_date:
            duration = self.end_date - self.scheduled_date
            return max(1, duration.days + 1)  # Include start day, minimum 1 day
        return 1  # Default single day program
    
    @property
    def is_upcoming(self):
        """Check if program is scheduled in the future"""
        from django.utils import timezone
        if not self.scheduled_date:
            return False
        return self.scheduled_date > timezone.now()
    
    @property
    def is_ongoing(self):
        """Check if program is currently happening"""
        from django.utils import timezone
        now = timezone.now()
        
        if not self.scheduled_date:
            return False
        
        # If no end date, consider ongoing only on scheduled date
        if not self.end_date:
            start_of_day = self.scheduled_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = self.scheduled_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            return start_of_day <= now <= end_of_day
        
        # Program is ongoing if current time is between start and end
        return self.scheduled_date <= now <= self.end_date
    
    @property
    def is_completed(self):
        """Check if program is completed"""
        from django.utils import timezone
        now = timezone.now()
        
        if self.end_date:
            return self.end_date < now
        elif self.scheduled_date:
            # If no end date, consider completed if scheduled date has passed
            end_of_day = self.scheduled_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            return end_of_day < now
        
        return False
    
    @property
    def status_display(self):
        """Get human-readable status"""
        if self.is_ongoing:
            return "Ongoing"
        elif self.is_upcoming:
            return "Upcoming"
        elif self.is_completed:
            return "Completed"
        elif not self.is_active:
            return "Cancelled"
        else:
            return "Scheduled"
    
    @property
    def attendees_count(self):
        """Get count of attendees (from SessionAttendance if program is linked to sessions)"""
        try:
            from .models import SessionAttendance
            # Count attendees from related session attendance
            return SessionAttendance.objects.filter(
                program=self,
                attended=True
            ).count()
        except:
            # If no attendance tracking, return expected participants or 0
            return self.expected_participants or 0
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage based on program status and attendance"""
        if self.is_completed:
            return 100
        elif self.is_ongoing:
            # For ongoing programs, base on current time vs duration
            from django.utils import timezone
            now = timezone.now()
            
            if self.end_date and self.scheduled_date:
                total_duration = (self.end_date - self.scheduled_date).total_seconds()
                elapsed_duration = (now - self.scheduled_date).total_seconds()
                
                if total_duration > 0:
                    percentage = min(100, max(0, (elapsed_duration / total_duration) * 100))
                    return round(percentage)
            
            return 50  # Default for ongoing without clear timeline
        elif self.is_upcoming:
            return 0
        else:
            return 0
    
    def get_attendees(self):
        """Get list of program attendees"""
        try:
            from .models import SessionAttendance
            attendances = SessionAttendance.objects.filter(
                program=self,
                attended=True
            ).select_related('user')
            return [attendance.user for attendance in attendances]
        except:
            return []
    
    def get_program_summary(self):
        """Get comprehensive program summary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'program_type': self.program_type,
            'program_type_display': self.get_program_type_display(),
            'status': self.status_display,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'duration_days': self.duration_days,
            'location': self.location,
            'is_upcoming': self.is_upcoming,
            'is_ongoing': self.is_ongoing,
            'is_completed': self.is_completed,
            'attendees_count': self.attendees_count,
            'completion_percentage': self.completion_percentage,
            'expected_participants': self.expected_participants,
            'fuel_allocation_approved': self.fuel_allocation_approved,
            'organizer_name': f"{self.organizer.get_full_name()}" if self.organizer else None,
            'sub_center_name': self.sub_center.name if self.sub_center else None,
        }
    
    @property
    def duration_days(self):
        """Calculate program duration in days"""
        if self.end_date:
            return (self.end_date.date() - self.scheduled_date.date()).days + 1
        return 1
    
    @property
    def is_upcoming(self):
        """Check if program is upcoming"""
        from django.utils import timezone
        return self.scheduled_date > timezone.now()
    
    @property
    def is_ongoing(self):
        """Check if program is currently ongoing"""
        from django.utils import timezone
        now = timezone.now()
        return self.scheduled_date <= now <= (self.end_date or self.scheduled_date)


class ParliamentSession(TimeStampedModel):
    """
    Parliament sessions for which fuel entitlements are allocated
    """
    SESSION_TYPES = [
        ('REGULAR', 'Regular Session'),
        ('SPECIAL', 'Special Session'),
        ('COMMITTEE', 'Committee Session'),
        ('BUDGET', 'Budget Session'),
        ('EMERGENCY', 'Emergency Session'),
    ]
    
    title = models.CharField(max_length=200)
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPES,
        default='REGULAR'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(default='09:00:00', help_text="Session start time")
    end_time = models.TimeField(default='17:00:00', help_text="Session end time")
    description = models.TextField(blank=True)
    venue = models.CharField(max_length=200, default='Parliament Building', help_text="Location where the session will be held")
    
    # Organizer and management fields
    organizer = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_sessions'
    )
    managing_subcenter = models.ForeignKey(
        'SubCenter',
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_sessions'
    )
    program = models.ForeignKey(
        'Program',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sessions',
        help_text="Program this session is part of"
    )
    assigned_attendees = models.ManyToManyField(
        'BeneficiaryProfile',
        related_name='assigned_sessions',
        blank=True
    )
    
    # Session configuration
    is_active = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False)
    expected_attendance = models.PositiveIntegerField(default=0)
    attendance_tracked = models.BooleanField(default=True)
    
    # Fuel allocation settings
    fuel_top_up_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Additional fuel allocation in litres"
    )
    fuel_top_up_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Additional fuel allocation as percentage of base entitlement"
    )
    is_active = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False, help_text="Whether attendance at this session is mandatory")
    organizer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_sessions',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER']},
        help_text="Officer responsible for managing this parliament session"
    )
    
    # Add subcenter association for regional parliament operations
    managing_subcenter = models.ForeignKey(
        'SubCenter',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_parliament_sessions',
        help_text="SubCenter responsible for managing this session (optional)"
    )
    
    # Program association
    program = models.ForeignKey(
        'Program',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='parliament_sessions',
        help_text="Program this session belongs to (optional)"
    )
    
    # === ENHANCED FIELDS FOR DYNAMIC ALLOCATION SYSTEM ===
    fuel_top_up_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Additional fuel litres for session attendees"
    )
    fuel_top_up_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Percentage-based fuel top-up for session attendees"
    )
    expected_attendance = models.IntegerField(
        default=0,
        help_text="Expected number of attendees"
    )
    attendance_tracked = models.BooleanField(
        default=False,
        help_text="Whether attendance is being tracked for this session"
    )
    
    # Attendee assignments
    assigned_attendees = models.ManyToManyField(
        'BeneficiaryProfile',
        blank=True,
        related_name='assigned_sessions',
        help_text="Beneficiaries assigned to attend this session"
    )
    
    class Meta:
        verbose_name = "Parliament Session"
        verbose_name_plural = "Parliament Sessions"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.title} ({self.start_date} to {self.end_date})"


class SessionAttendance(TimeStampedModel):
    """
    Tracks attendance of beneficiaries for specific parliament sessions.
    """
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('EXCUSED', 'Excused'),
        ('LATE', 'Late'),
    ]

    session = models.ForeignKey(
        'ParliamentSession',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    beneficiary = models.ForeignKey(
        'BeneficiaryProfile',
        on_delete=models.CASCADE,
        related_name='session_attendances'
    )
    date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ABSENT'
    )
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='recorded_attendances'
    )

    class Meta:
        unique_together = ('session', 'beneficiary', 'date')
        ordering = ['-date', 'session', 'beneficiary']
        verbose_name = "Session Attendance"
        verbose_name_plural = "Session Attendances"

    def __str__(self):
        return f"{self.beneficiary} - {self.session} on {self.date}: {self.get_status_display()}"


class SessionAttendanceRegistry(TimeStampedModel):
    """
    Published attendance registry for sessions/programs that Sergeant of Arms can mark
    """
    REGISTRY_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('IN_PROGRESS', 'Marking in Progress'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    session = models.ForeignKey(
        'ParliamentSession',
        on_delete=models.CASCADE,
        related_name='attendance_registries'
    )
    program = models.ForeignKey(
        'Program',
        on_delete=models.CASCADE,
        related_name='attendance_registries',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, help_text="Registry title/name")
    expected_attendees = models.ManyToManyField(
        'BeneficiaryProfile',
        through='AttendanceRegistryMember',
        related_name='expected_registries'
    )
    
    # Publishing and management
    published_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='published_registries'
    )
    published_date = models.DateTimeField(null=True, blank=True)
    managing_subcenter = models.ForeignKey(
        'SubCenter',
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_registries'
    )
    
    # Marking and submission
    marked_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_registries',
        limit_choices_to={'role': 'SERGEANT_OF_ARMS'}
    )
    submitted_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=15,
        choices=REGISTRY_STATUS_CHOICES,
        default='DRAFT'
    )
    
    # Approval workflow
    reviewed_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_registries'
    )
    reviewed_date = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)
    
    # Registry details
    attendance_date = models.DateField(help_text="Date when attendance was/will be marked")
    notes = models.TextField(blank=True, null=True)
    is_editable = models.BooleanField(default=True, help_text="Can Sergeant of Arms still edit?")
    
    class Meta:
        ordering = ['-attendance_date', '-created']
        verbose_name = "Attendance Registry"
        verbose_name_plural = "Attendance Registries"
    
    def __str__(self):
        return f"{self.title} - {self.attendance_date} ({self.get_status_display()})"
    
    def can_be_edited(self, user):
        """Check if registry can be edited by user"""
        if user.role in ['SUPERUSER', 'ADMIN']:
            return True
        if user.role == 'SERGEANT_OF_ARMS' and self.status in ['PUBLISHED', 'IN_PROGRESS']:
            return self.is_editable
        if user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER'] and self.managing_subcenter:
            return user.sub_center == self.managing_subcenter
        return False
    
    def publish(self, user):
        """Publish registry for Sergeant of Arms to mark"""
        if user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER']:
            self.status = 'PUBLISHED'
            self.published_by = user
            self.published_date = timezone.now()
            self.save()
            return True
        return False
    
    def submit_attendance(self, user):
        """Submit marked attendance for approval"""
        if user.role == 'SERGEANT_OF_ARMS' and self.status == 'IN_PROGRESS':
            self.status = 'SUBMITTED'
            self.submitted_date = timezone.now()
            self.marked_by = user
            self.is_editable = False
            self.save()
            return True
        return False


class AttendanceRegistryMember(TimeStampedModel):
    """
    Members expected to attend a specific registry with their attendance status
    """
    ATTENDANCE_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('EXCUSED', 'Excused'),
        ('LATE', 'Late'),
    ]
    
    registry = models.ForeignKey(
        'SessionAttendanceRegistry',
        on_delete=models.CASCADE,
        related_name='members'
    )
    beneficiary = models.ForeignKey(
        'BeneficiaryProfile',
        on_delete=models.CASCADE,
        related_name='registry_memberships'
    )
    expected_to_attend = models.BooleanField(default=True)
    attendance_status = models.CharField(
        max_length=10,
        choices=ATTENDANCE_STATUS_CHOICES,
        default='PENDING'
    )
    arrival_time = models.TimeField(null=True, blank=True)
    departure_time = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    marked_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_attendances'
    )
    marked_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('registry', 'beneficiary')
        ordering = ['beneficiary__user__last_name', 'beneficiary__user__first_name']
        verbose_name = "Registry Member"
        verbose_name_plural = "Registry Members"
    
    def __str__(self):
        return f"{self.beneficiary} - {self.registry.title}: {self.get_attendance_status_display()}"
    
    def mark_attendance(self, status, user, arrival_time=None, notes=None):
        """Mark attendance for this member"""
        self.attendance_status = status
        self.marked_by = user
        self.marked_date = timezone.now()
        if arrival_time:
            self.arrival_time = arrival_time
        if notes:
            self.notes = notes
        self.save()


class AttendanceCorrection(TimeStampedModel):
    """
    Corrections requested by Sergeant of Arms for submitted attendance
    """
    CORRECTION_STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    registry = models.ForeignKey(
        'SessionAttendanceRegistry',
        on_delete=models.CASCADE,
        related_name='corrections'
    )
    requested_by = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='requested_corrections',
        limit_choices_to={'role': 'SERGEANT_OF_ARMS'}
    )
    reason = models.TextField(help_text="Reason for correction request")
    correction_details = models.JSONField(
        help_text="Details of what needs to be corrected",
        default=dict
    )
    status = models.CharField(
        max_length=10,
        choices=CORRECTION_STATUS_CHOICES,
        default='PENDING'
    )
    
    # Approval
    reviewed_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_corrections'
    )
    reviewed_date = models.DateTimeField(null=True, blank=True)
    response = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created']
        verbose_name = "Attendance Correction"
        verbose_name_plural = "Attendance Corrections"
    
    def __str__(self):
        return f"Correction for {self.registry.title} - {self.get_status_display()}"
    
    def approve(self, user, response=None):
        """Approve correction request"""
        if user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER']:
            self.status = 'APPROVED'
            self.reviewed_by = user
            self.reviewed_date = timezone.now()
            self.response = response or "Correction approved"
            
            # Make registry editable again
            self.registry.is_editable = True
            self.registry.status = 'IN_PROGRESS'
            self.registry.save()
            
            self.save()
            return True
        return False


class BeneficiaryProfile(TimeStampedModel):
    """
    Extended profile for beneficiaries with Parliament-specific details
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='beneficiary_profile'
    )
    category = models.ForeignKey(
        BeneficiaryCategory,
        on_delete=models.PROTECT,
        related_name='beneficiaries'
    )
    constituency = models.ForeignKey(
        Constituency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='constituency_beneficiaries'
    )
    vehicle_category = models.ForeignKey(
        VehicleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicle_beneficiaries'
    )
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    position = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    monthly_entitlement_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Monthly fuel entitlement in litres"
    )
    is_active_beneficiary = models.BooleanField(default=True)
    
    # Vehicle Information (Added for frontend enhancements)
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
    
    # Contact Information (Added for frontend enhancements)
    office_location = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Office location/room number"
    )
    
    # Enhanced Allocation Profile (Added for frontend enhancements)
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
    
    # === ENHANCED FIELDS FOR DYNAMIC ALLOCATION SYSTEM ===
    engine_capacity_cc = models.IntegerField(
        null=True,
        blank=True,
        help_text="Engine capacity in cubic centimeters for allocation calculations"
    )
    distance_from_parliament_km = models.IntegerField(
        null=True,
        blank=True,
        help_text="Distance from Parliament in kilometers (auto-populated from constituency)"
    )
    
    # Status tracking (Added for frontend enhancements)
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
    
    # Political Information (Added for parliament operations)
    party_affiliation = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Political party affiliation"
    )
    
    # Status field for beneficiary management
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('INACTIVE', 'Inactive'),
            ('SUSPENDED', 'Suspended'),
            ('PENDING_APPROVAL', 'Pending Approval'),
        ],
        default='ACTIVE',
        help_text="Current beneficiary status"
    )
    
    class Meta:
        verbose_name = "Beneficiary Profile"
        verbose_name_plural = "Beneficiary Profiles"
        ordering = ['user__username']
    
    def __str__(self):
        return f"{self.user.username} - {self.category.name} ({self.constituency.name if self.constituency else 'No Constituency'})"
    
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
        allocation = self.base_allocation * self.category_multiplier * self.engine_multiplier
        return allocation.quantize(Decimal('0.01'))  # Round to 2 decimal places
    
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


# ======================= DYNAMIC FUEL ALLOCATION SYSTEM =======================

class FuelAllocationRule(TimeStampedModel):
    """
    Dynamic fuel allocation rules based on comprehensive calculation engine.
    Supports engine capacity bands, distance factors, session top-ups, and period-based allocations.
    """
    ENGINE_CAPACITY_BANDS = [
        ('UNDER_2800', 'Under 2800cc'),
        ('2800_TO_3199', '2800cc - 3199cc'),
        ('3200_AND_ABOVE', '3200cc and above'),
    ]
    
    PERIOD_TYPES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]
    
    RULE_TYPES = [
        ('BASE_ALLOCATION', 'Base Allocation Rule'),
        ('ENGINE_MULTIPLIER', 'Engine Capacity Multiplier'),
        ('DISTANCE_FACTOR', 'Distance-Based Factor'),
        ('SESSION_SUPPLEMENT', 'Parliament Session Supplement'),
        ('CATEGORY_BONUS', 'Category-Based Bonus'),
        ('EMERGENCY_ALLOCATION', 'Emergency Allocation'),
    ]
    
    # Rule Identification
    rule_name = models.CharField(
        max_length=200,
        unique=True,
        help_text="Unique name for this allocation rule"
    )
    rule_type = models.CharField(
        max_length=30,
        choices=RULE_TYPES,
        help_text="Type of allocation rule"
    )
    rule_code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique code for API/system reference"
    )
    description = models.TextField(
        help_text="Detailed description of the rule and its purpose"
    )
    
    # Rule Application Criteria
    applies_to_engine_band = models.CharField(
        max_length=20,
        choices=ENGINE_CAPACITY_BANDS,
        null=True,
        blank=True,
        help_text="Engine capacity band this rule applies to"
    )
    applies_to_category = models.ForeignKey(
        BeneficiaryCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocation_rules',
        help_text="Beneficiary category this rule applies to"
    )
    applies_to_distance_min = models.IntegerField(
        null=True,
        blank=True,
        help_text="Minimum distance from parliament (km) for this rule"
    )
    applies_to_distance_max = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum distance from parliament (km) for this rule"
    )
    
    # Allocation Calculation Parameters
    period_type = models.CharField(
        max_length=20,
        choices=PERIOD_TYPES,
        default='MONTHLY',
        help_text="Period for which this allocation applies"
    )
    
    # Engine-based constants (from POZ CSV analysis)
    engine_constant_under_2800 = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('0.39'),
        help_text="Rate constant for engines under 2800cc"
    )
    engine_constant_2800_3199 = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('0.43'),
        help_text="Rate constant for engines 2800-3199cc"
    )
    engine_constant_3200_plus = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('0.56'),
        help_text="Rate constant for engines 3200cc and above"
    )
    
    # Distance-based factors
    distance_factor_base = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('1.0'),
        help_text="Base distance factor (no distance adjustment)"
    )
    distance_factor_per_km = models.DecimalField(
        max_digits=8,
        decimal_places=6,
        default=Decimal('0.001'),
        help_text="Additional factor per kilometer from parliament"
    )
    max_distance_factor = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('2.0'),
        help_text="Maximum distance factor cap"
    )
    
    # Allocation Limits and Caps
    minimum_allocation_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('20'),
        help_text="Minimum allocation regardless of calculation"
    )
    maximum_allocation_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('500'),
        help_text="Maximum allocation cap"
    )
    
    # Session-based top-ups
    session_top_up_litres = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Additional litres for parliament session attendance"
    )
    session_top_up_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Percentage-based session top-up"
    )
    
    # Rule Status and Validity
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this rule is currently active"
    )
    effective_from = models.DateField(
        help_text="Date from which this rule is effective"
    )
    effective_until = models.DateField(
        null=True,
        blank=True,
        help_text="Date until which this rule is effective"
    )
    priority = models.IntegerField(
        default=100,
        help_text="Rule priority (lower numbers = higher priority)"
    )
    
    # Formula Override
    custom_formula = models.TextField(
        blank=True,
        help_text="Custom allocation formula (Python expression)"
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_allocation_rules',
        help_text="User who created this rule"
    )
    last_modified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='modified_allocation_rules',
        help_text="User who last modified this rule"
    )
    
    class Meta:
        verbose_name = "Fuel Allocation Rule"
        verbose_name_plural = "Fuel Allocation Rules"
        ordering = ['priority', 'rule_name']
        indexes = [
            models.Index(fields=['rule_type', 'is_active']),
            models.Index(fields=['applies_to_engine_band']),
            models.Index(fields=['applies_to_category']),
            models.Index(fields=['effective_from', 'effective_until']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"{self.rule_name} ({self.get_rule_type_display()})"
    
    def get_engine_constant(self, engine_capacity_cc):
        """Get appropriate engine constant based on engine capacity"""
        if engine_capacity_cc < 2800:
            return self.engine_constant_under_2800
        elif 2800 <= engine_capacity_cc <= 3199:
            return self.engine_constant_2800_3199
        else:
            return self.engine_constant_3200_plus
    
    def get_distance_factor(self, distance_km):
        """Calculate distance factor based on distance from parliament"""
        factor = self.distance_factor_base + (distance_km * self.distance_factor_per_km)
        return min(factor, self.max_distance_factor)
    
    def calculate_allocation(self, beneficiary_profile, parliament_session=None, fuel_price_usd=None):
        """
        Calculate fuel allocation using the master formula:
        AA_USD = Mileage × EngineConstant × DistanceFactor
        Litres = AA_USD / FuelPriceUSD + SessionTopUp
        Apply caps and floors
        """
        try:
            # Get beneficiary data
            if hasattr(beneficiary_profile, 'constituency') and beneficiary_profile.constituency:
                distance_km = beneficiary_profile.constituency.distance_from_parliament_km
            else:
                distance_km = 0
            
            # Extract engine capacity from engine_size or use default
            engine_capacity_cc = self._extract_engine_capacity(beneficiary_profile)
            
            # Get calculation components
            engine_constant = self.get_engine_constant(engine_capacity_cc)
            distance_factor = self.get_distance_factor(distance_km)
            
            # Calculate AA_USD (Allocation Amount in USD)
            aa_usd = distance_km * engine_constant * distance_factor
            
            # Get current fuel price
            if not fuel_price_usd:
                fuel_price_usd = self._get_current_fuel_price()
            
            # Calculate base litres
            base_litres = aa_usd / fuel_price_usd if fuel_price_usd > 0 else 0
            
            # Add session top-up if applicable
            session_litres = 0
            if parliament_session and hasattr(parliament_session, 'fuel_top_up_litres'):
                session_litres = parliament_session.fuel_top_up_litres
            elif self.session_top_up_litres > 0:
                session_litres = self.session_top_up_litres
            elif self.session_top_up_percentage > 0:
                session_litres = base_litres * (self.session_top_up_percentage / 100)
            
            total_litres = base_litres + session_litres
            
            # Apply caps and floors
            final_litres = max(
                self.minimum_allocation_litres,
                min(total_litres, self.maximum_allocation_litres)
            )
            
            return {
                'base_litres': float(base_litres),
                'session_litres': float(session_litres),
                'total_litres': float(final_litres),
                'aa_usd': float(aa_usd),
                'engine_constant': float(engine_constant),
                'distance_factor': float(distance_factor),
                'distance_km': distance_km,
                'engine_capacity_cc': engine_capacity_cc,
                'fuel_price_usd': float(fuel_price_usd),
                'rule_applied': self.rule_name
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'base_litres': 0,
                'session_litres': 0,
                'total_litres': 0,
                'rule_applied': self.rule_name
            }
    
    def _extract_engine_capacity(self, beneficiary_profile):
        """Extract engine capacity in CC from beneficiary profile"""
        # Check if profile has engine_capacity_cc field
        if hasattr(beneficiary_profile, 'engine_capacity_cc') and beneficiary_profile.engine_capacity_cc:
            return beneficiary_profile.engine_capacity_cc
        
        # Try to extract from engine_size string
        if hasattr(beneficiary_profile, 'engine_size') and beneficiary_profile.engine_size:
            import re
            # Look for patterns like "2.2L", "3000cc", "3.0L V6"
            pattern = r'(\d+\.?\d*)\s*(?:L|cc|litre|liter)'
            match = re.search(pattern, beneficiary_profile.engine_size, re.IGNORECASE)
            if match:
                size = float(match.group(1))
                # Convert to CC if in litres
                if 'L' in beneficiary_profile.engine_size or 'litre' in beneficiary_profile.engine_size.lower():
                    return int(size * 1000)  # Convert litres to CC
                else:
                    return int(size)  # Already in CC
        
        # Default assumption for calculation
        return 2500  # Conservative mid-range estimate
    
    def _get_current_fuel_price(self):
        """Get current fuel price from FuelPrice model or FuelData"""
        try:
            # Try FuelPrice model first
            latest_price = FuelPrice.objects.filter(is_active=True).latest('effective_date')
            return latest_price.price_per_litre_usd
        except:
            # Fallback to FuelData
            try:
                latest_data = FuelData.objects.latest('timestamp')
                return latest_data.diesel_price_usd or Decimal('1.40')  # Default price
            except:
                return Decimal('1.40')  # Fallback default price
    
    def applies_to_beneficiary(self, beneficiary_profile):
        """Check if this rule applies to a specific beneficiary"""
        # Check category
        if self.applies_to_category and beneficiary_profile.category != self.applies_to_category:
            return False
        
        # Check engine capacity
        if self.applies_to_engine_band:
            engine_cc = self._extract_engine_capacity(beneficiary_profile)
            if self.applies_to_engine_band == 'UNDER_2800' and engine_cc >= 2800:
                return False
            elif self.applies_to_engine_band == '2800_TO_3199' and not (2800 <= engine_cc <= 3199):
                return False
            elif self.applies_to_engine_band == '3200_AND_ABOVE' and engine_cc < 3200:
                return False
        
        # Check distance
        if (self.applies_to_distance_min is not None or self.applies_to_distance_max is not None):
            if hasattr(beneficiary_profile, 'constituency') and beneficiary_profile.constituency:
                distance = beneficiary_profile.constituency.distance_from_parliament_km
                if self.applies_to_distance_min and distance < self.applies_to_distance_min:
                    return False
                if self.applies_to_distance_max and distance > self.applies_to_distance_max:
                    return False
            else:
                return False  # No constituency data, can't apply distance rules
        
        return True
    
    def is_effective_on_date(self, date=None):
        """Check if rule is effective on a given date"""
        if date is None:
            date = timezone.now().date()
        
        if not self.is_active:
            return False
        
        if date < self.effective_from:
            return False
        
        if self.effective_until and date > self.effective_until:
            return False
        
        return True


class FuelPrice(TimeStampedModel):
    """
    Auditable fuel price tracking for allocation calculations.
    Maintains price history and supports different fuel types.
    """
    FUEL_TYPE_CHOICES = [
        ('PETROL', 'Petrol'),
        ('DIESEL', 'Diesel'),
        ('BOTH', 'Both (same price)'),
    ]
    
    PRICE_SOURCE_CHOICES = [
        ('MANUAL', 'Manual Entry'),
        ('GOVERNMENT_GAZETTE', 'Government Gazette'),
        ('ENERGY_MINISTRY', 'Ministry of Energy'),
        ('MARKET_RATE', 'Market Rate'),
        ('API_FEED', 'API Data Feed'),
    ]
    
    # Price Information
    fuel_type = models.CharField(
        max_length=10,
        choices=FUEL_TYPE_CHOICES,
        help_text="Type of fuel this price applies to"
    )
    price_per_litre_usd = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        help_text="Price per litre in USD"
    )
    price_per_litre_zwg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price per litre in ZWG (optional, for reference)"
    )
    exchange_rate_usd_zwg = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="USD to ZWG exchange rate used"
    )
    
    # Validity and Source
    effective_date = models.DateField(
        help_text="Date from which this price is effective"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date until which this price is valid"
    )
    price_source = models.CharField(
        max_length=30,
        choices=PRICE_SOURCE_CHOICES,
        default='MANUAL',
        help_text="Source of this price information"
    )
    source_reference = models.CharField(
        max_length=200,
        blank=True,
        help_text="Reference number or document from source"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this price is currently active"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default price when no specific price found"
    )
    
    # Metadata
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this price"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_fuel_prices',
        help_text="User who created this price record"
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_fuel_prices',
        help_text="User who approved this price"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this price was approved"
    )
    
    class Meta:
        verbose_name = "Fuel Price"
        verbose_name_plural = "Fuel Prices"
        ordering = ['-effective_date', '-created']
        indexes = [
            models.Index(fields=['fuel_type', 'effective_date']),
            models.Index(fields=['is_active', 'is_default']),
            models.Index(fields=['effective_date', 'expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.get_fuel_type_display()} - ${self.price_per_litre_usd}/L (from {self.effective_date})"
    
    def is_effective_on_date(self, date=None):
        """Check if this price is effective on a given date"""
        if date is None:
            date = timezone.now().date()
        
        if not self.is_active:
            return False
        
        if date < self.effective_date:
            return False
        
        if self.expiry_date and date > self.expiry_date:
            return False
        
        return True
    
    @classmethod
    def get_current_price(cls, fuel_type='DIESEL', date=None):
        """Get current effective price for fuel type"""
        if date is None:
            date = timezone.now().date()
        
        # Try exact fuel type first
        price = cls.objects.filter(
            fuel_type__in=[fuel_type, 'BOTH'],
            is_active=True,
            effective_date__lte=date
        ).filter(
            models.Q(expiry_date__isnull=True) | models.Q(expiry_date__gte=date)
        ).order_by('-effective_date').first()
        
        if price:
            return price
        
        # Fallback to default price
        default_price = cls.objects.filter(
            is_default=True,
            is_active=True
        ).first()
        
        return default_price
    
    def clean(self):
        """Model validation"""
        super().clean()
        
        # Validate price is positive
        if self.price_per_litre_usd <= 0:
            raise ValidationError({'price_per_litre_usd': 'Price must be positive'})
        
        # Validate date logic
        if self.expiry_date and self.expiry_date <= self.effective_date:
            raise ValidationError({'expiry_date': 'Expiry date must be after effective date'})
        
        # Check for overlapping active prices
        overlapping = FuelPrice.objects.filter(
            fuel_type__in=[self.fuel_type, 'BOTH'],
            is_active=True,
            effective_date__lte=self.expiry_date or timezone.now().date() + timezone.timedelta(days=365*10)
        ).filter(
            models.Q(expiry_date__isnull=True) | 
            models.Q(expiry_date__gte=self.effective_date)
        ).exclude(pk=self.pk)
        
        if overlapping.exists():
            raise ValidationError(
                'This price period overlaps with existing active prices for the same fuel type'
            )
    
    def save(self, *args, **kwargs):
        # Calculate ZWG price if exchange rate is provided
        if self.exchange_rate_usd_zwg and not self.price_per_litre_zwg:
            self.price_per_litre_zwg = self.price_per_litre_usd * self.exchange_rate_usd_zwg
        
        super().save(*args, **kwargs)


class DynamicAllocation(TimeStampedModel):
    """
    Records of dynamic fuel allocations calculated and assigned to beneficiaries.
    Provides audit trail and supports preview/commit workflow.
    """
    ALLOCATION_STATUS_CHOICES = [
        ('PREVIEW', 'Preview (Not Committed)'),
        ('COMMITTED', 'Committed'),
        ('PARTIALLY_FULFILLED', 'Partially Fulfilled'),
        ('FULFILLED', 'Fully Fulfilled'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    ALLOCATION_TYPE_CHOICES = [
        ('REGULAR', 'Regular Allocation'),
        ('SESSION_BASED', 'Parliament Session'),
        ('EMERGENCY', 'Emergency Allocation'),
        ('ADJUSTMENT', 'Adjustment/Correction'),
        ('BONUS', 'Bonus Allocation'),
    ]
    
    # Allocation Identification
    allocation_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique allocation identifier"
    )
    allocation_type = models.CharField(
        max_length=20,
        choices=ALLOCATION_TYPE_CHOICES,
        default='REGULAR',
        help_text="Type of allocation"
    )
    status = models.CharField(
        max_length=20,
        choices=ALLOCATION_STATUS_CHOICES,
        default='PREVIEW',
        help_text="Current status of allocation"
    )
    
    # Relationships
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dynamic_allocations',
        help_text="Beneficiary receiving this allocation"
    )
    rule_applied = models.ForeignKey(
        FuelAllocationRule,
        on_delete=models.PROTECT,
        related_name='allocations',
        help_text="Allocation rule used for calculation"
    )
    parliament_session = models.ForeignKey(
        ParliamentSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dynamic_allocations',
        help_text="Related parliament session (if applicable)"
    )
    fuel_price = models.ForeignKey(
        FuelPrice,
        on_delete=models.PROTECT,
        related_name='allocations',
        help_text="Fuel price used for calculation"
    )
    
    # Allocation Period
    allocation_period_start = models.DateField(
        help_text="Start date of allocation period"
    )
    allocation_period_end = models.DateField(
        help_text="End date of allocation period"
    )
    period_type = models.CharField(
        max_length=20,
        choices=FuelAllocationRule.PERIOD_TYPES,
        default='MONTHLY',
        help_text="Type of allocation period"
    )
    
    # Calculated Amounts
    base_allocation_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Base allocation before supplements"
    )
    session_supplement_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Additional litres for session attendance"
    )
    total_allocation_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total allocated litres"
    )
    allocated_value_usd = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        help_text="USD value of allocation"
    )
    
    # Calculation Details (for audit and transparency)
    calculation_details = models.JSONField(
        default=dict,
        help_text="Detailed calculation breakdown"
    )
    engine_capacity_cc = models.IntegerField(
        help_text="Engine capacity used in calculation"
    )
    distance_from_parliament_km = models.IntegerField(
        help_text="Distance from parliament used in calculation"
    )
    engine_constant_applied = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        help_text="Engine constant rate used"
    )
    distance_factor_applied = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        help_text="Distance factor applied"
    )
    fuel_price_used = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        help_text="Fuel price per litre used"
    )
    
    # Fulfillment Tracking
    coupons_allocated = models.IntegerField(
        default=0,
        help_text="Number of coupons allocated to fulfill this allocation"
    )
    litres_fulfilled = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Litres actually provided via coupons"
    )
    remaining_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Remaining litres to be fulfilled"
    )
    
    # Workflow and Approval
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_dynamic_allocations',
        help_text="User who created this allocation"
    )
    committed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='committed_dynamic_allocations',
        help_text="User who committed this allocation"
    )
    committed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this allocation was committed"
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_dynamic_allocations',
        help_text="User who approved this allocation"
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this allocation was approved"
    )
    
    # Metadata
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this allocation"
    )
    preview_generated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the allocation preview was generated"
    )
    
    class Meta:
        verbose_name = "Dynamic Allocation"
        verbose_name_plural = "Dynamic Allocations"
        ordering = ['-created']
        indexes = [
            models.Index(fields=['beneficiary', 'status']),
            models.Index(fields=['allocation_period_start', 'allocation_period_end']),
            models.Index(fields=['status', 'allocation_type']),
            models.Index(fields=['parliament_session']),
        ]
        unique_together = [
            ('beneficiary', 'allocation_period_start', 'allocation_period_end', 'allocation_type')
        ]
    
    def __str__(self):
        return f"{self.allocation_id} - {self.beneficiary.get_full_name()} ({self.total_allocation_litres}L)"
    
    def save(self, *args, **kwargs):
        # Auto-generate allocation ID
        if not self.allocation_id:
            now = timezone.now()
            year = now.strftime("%Y")
            month = now.strftime("%m")
            last_allocation = DynamicAllocation.objects.filter(
                allocation_id__startswith=f"DA-{year}{month}-"
            ).order_by('-id').first()
            
            if last_allocation:
                last_code_part = last_allocation.allocation_id.split('-')[-1]
                try:
                    next_number = int(last_code_part) + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1
            
            self.allocation_id = f"DA-{year}{month}-{next_number:04d}"
        
        # Calculate remaining litres
        self.remaining_litres = self.total_allocation_litres - self.litres_fulfilled
        
        super().save(*args, **kwargs)
    
    def commit_allocation(self, committed_by_user):
        """Commit the allocation (change from preview to committed)"""
        if self.status != 'PREVIEW':
            raise ValueError("Only preview allocations can be committed")
        
        self.status = 'COMMITTED'
        self.committed_by = committed_by_user
        self.committed_at = timezone.now()
        self.save()
        
        # Create audit log
        AuditLog.log(
            action='ALLOCATE',
            user=committed_by_user,
            content_object=self,
            description=f"Dynamic allocation committed: {self.total_allocation_litres}L to {self.beneficiary.get_full_name()}",
            changes={'status': 'COMMITTED'},
            severity='MEDIUM'
        )
    
    def cancel_allocation(self, cancelled_by_user, reason=""):
        """Cancel the allocation and make coupons available again"""
        if self.status == 'FULFILLED':
            raise ValueError("Cannot cancel fulfilled allocations")
        
        old_status = self.status
        self.status = 'CANCELLED'
        self.notes = f"{self.notes}\nCancelled: {reason}" if self.notes else f"Cancelled: {reason}"
        self.save()
        
        # Create audit log
        AuditLog.log(
            action='UPDATE',
            user=cancelled_by_user,
            content_object=self,
            description=f"Dynamic allocation cancelled: {reason}",
            changes={'status': old_status + ' -> CANCELLED'},
            severity='MEDIUM'
        )
    
    def fulfill_with_coupons(self, coupon_list, fulfilled_by_user):
        """Fulfill allocation by assigning coupons"""

        total_litres = sum(coupon.litres for coupon in coupon_list)
        
        # Update fulfillment tracking
        self.coupons_allocated += len(coupon_list)
        self.litres_fulfilled += total_litres
        self.remaining_litres = self.total_allocation_litres - self.litres_fulfilled
        
        # Update status
        if self.remaining_litres <= 0:
            self.status = 'FULFILLED'
        elif self.litres_fulfilled > 0:
            self.status = 'PARTIALLY_FULFILLED'
        
        self.save()
        
        # Link coupons to this allocation
        for coupon in coupon_list:
            coupon.allocated_to = self.beneficiary
            coupon.allocated_date = timezone.now()
            coupon.save()
        
        # Create audit log
        AuditLog.log(
            action='ALLOCATE',
            user=fulfilled_by_user,
            content_object=self,
            description=f"Allocation fulfilled with {len(coupon_list)} coupons ({total_litres}L)",
            changes={'litres_fulfilled': float(self.litres_fulfilled)},
            severity='LOW'
        )
    
    def get_allocation_summary(self):
        """Get comprehensive allocation summary"""
        return {
            'allocation_id': self.allocation_id,
            'status': self.status,
            'allocation_type': self.allocation_type,
            'beneficiary': {
                'name': self.beneficiary.get_full_name(),
                'category': self.beneficiary.beneficiary_profile.category.name if hasattr(self.beneficiary, 'beneficiary_profile') else None,
                'constituency': self.beneficiary.beneficiary_profile.constituency.name if hasattr(self.beneficiary, 'beneficiary_profile') and self.beneficiary.beneficiary_profile.constituency else None,
            },
            'allocation_details': {
                'base_litres': float(self.base_allocation_litres),
                'session_supplement': float(self.session_supplement_litres),
                'total_litres': float(self.total_allocation_litres),
                'value_usd': float(self.allocated_value_usd),
            },
            'calculation_inputs': {
                'engine_capacity_cc': self.engine_capacity_cc,
                'distance_km': self.distance_from_parliament_km,
                'engine_constant': float(self.engine_constant_applied),
                'distance_factor': float(self.distance_factor_applied),
                'fuel_price_usd': float(self.fuel_price_used),
            },
            'fulfillment': {
                'coupons_allocated': self.coupons_allocated,
                'litres_fulfilled': float(self.litres_fulfilled),
                'remaining_litres': float(self.remaining_litres),
                'fulfillment_percentage': round((self.litres_fulfilled / self.total_allocation_litres) * 100, 2) if self.total_allocation_litres > 0 else 0,
            },
            'period': {
                'start_date': self.allocation_period_start.isoformat(),
                'end_date': self.allocation_period_end.isoformat(),
                'period_type': self.period_type,
            },
            'rule_applied': self.rule_applied.rule_name,
            'created_at': self.created.isoformat(),
            'committed_at': self.committed_at.isoformat() if self.committed_at else None,
        }
    
    @property
    def is_expired(self):
        """Check if allocation has expired"""
        return timezone.now().date() > self.allocation_period_end
    
    @property
    def fulfillment_percentage(self):
        """Calculate fulfillment percentage"""
        if self.total_allocation_litres > 0:
            return round((self.litres_fulfilled / self.total_allocation_litres) * 100, 2)
        return 0
    
    @classmethod
    def generate_preview(cls, beneficiary, rule, parliament_session=None, period_start=None, period_end=None):
        """Generate allocation preview without committing"""
        # Get beneficiary profile
        if hasattr(beneficiary, 'beneficiary_profile'):
            profile = beneficiary.beneficiary_profile
        elif hasattr(beneficiary, 'harmonized_beneficiary_profile'):
            profile = beneficiary.harmonized_beneficiary_profile
        else:
            raise ValueError("Beneficiary must have a profile")
        
        # Set default period if not provided
        if not period_start:
            period_start = timezone.now().date().replace(day=1)  # First of current month
        if not period_end:
            # Last day of current month
            next_month = period_start.replace(day=28) + timezone.timedelta(days=4)
            period_end = next_month - timezone.timedelta(days=next_month.day)
        
        # Get current fuel price
        fuel_price = FuelPrice.get_current_price(
            fuel_type=getattr(profile, 'fuel_type', 'DIESEL'),
            date=period_start
        )
        if not fuel_price:
            raise ValueError("No fuel price available for calculation")
        
        # Calculate allocation using rule
        calculation_result = rule.calculate_allocation(
            beneficiary_profile=profile,
            parliament_session=parliament_session,
            fuel_price_usd=fuel_price.price_per_litre_usd
        )
        
        if 'error' in calculation_result:
            raise ValueError(f"Calculation error: {calculation_result['error']}")
        
        # Create preview allocation
        allocation = cls(
            beneficiary=beneficiary,
            rule_applied=rule,
            parliament_session=parliament_session,
            fuel_price=fuel_price,
            allocation_period_start=period_start,
            allocation_period_end=period_end,
            period_type=rule.period_type,
            base_allocation_litres=Decimal(str(calculation_result['base_litres'])),
            session_supplement_litres=Decimal(str(calculation_result['session_litres'])),
            total_allocation_litres=Decimal(str(calculation_result['total_litres'])),
            allocated_value_usd=Decimal(str(calculation_result['total_litres'])) * fuel_price.price_per_litre_usd,
            calculation_details=calculation_result,
            engine_capacity_cc=calculation_result['engine_capacity_cc'],
            distance_from_parliament_km=calculation_result['distance_km'],
            engine_constant_applied=Decimal(str(calculation_result['engine_constant'])),
            distance_factor_applied=Decimal(str(calculation_result['distance_factor'])),
            fuel_price_used=fuel_price.price_per_litre_usd,
            status='PREVIEW',
        )
        
        return allocation


# TEMPORARY MODEL STUBS - TO BE PROPERLY IMPLEMENTED LATER

class BookDispatch(TimeStampedModel):
    """Temporary stub for BookDispatch model"""
    to_center = models.ForeignKey(SubCenter, on_delete=models.CASCADE, related_name='dispatches', null=True, blank=True)
    dispatched_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dispatches_sent', null=True, blank=True)
    received_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dispatches_received', null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('DISPATCHED', 'Dispatched'), ('RECEIVED', 'Received')], default='PENDING')
    dispatch_date = models.DateTimeField(auto_now_add=True)
    
    # Fields needed for analytics migration
    program = models.ForeignKey(Program, on_delete=models.CASCADE, null=True, blank=True, help_text="Program associated with this dispatch")
    session = models.ForeignKey(ParliamentSession, on_delete=models.CASCADE, null=True, blank=True, help_text="Parliament session associated with this dispatch")
    
    class Meta:
        db_table = 'fuel_bookdispatch'


class CouponDistribution(TimeStampedModel):
    """Temporary stub for CouponDistribution model"""
    beneficiary = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    distribution_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fuel_coupondistribution'


class CouponAllocation(TimeStampedModel):
    """Temporary stub for CouponAllocation model"""
    beneficiary = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    allocation_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fuel_couponallocation'


class FuelEntitlement(TimeStampedModel):
    """Temporary stub for FuelEntitlement model"""
    beneficiary = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    entitlement_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'fuel_fuelentitlement'


class FuelData(TimeStampedModel):
    """Temporary stub for FuelData model"""
    timestamp = models.DateTimeField(auto_now_add=True)
    total_fuel_allocated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_fuel_used = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available_fuel = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_refuel_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'fuel_fueldata'


class FuelRequirementConfiguration(TimeStampedModel):
    """Temporary stub for FuelRequirementConfiguration model"""
    fuel_type = models.CharField(max_length=50, default='Petrol')
    period = models.CharField(max_length=20, default='Monthly')
    required_litres = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    required_coupons = models.IntegerField(default=0)
    litres_per_coupon = models.DecimalField(max_digits=6, decimal_places=2, default=25)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def calculate_required_coupons(self):
        """Calculate required coupons based on litres"""
        if self.litres_per_coupon > 0:
            return int(self.required_litres / self.litres_per_coupon)
        return 0
    
    class Meta:
        db_table = 'fuel_fuelrequirementconfiguration'


class CouponHandover(TimeStampedModel):
    """Temporary stub for CouponHandover model"""
    beneficiary = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    handover_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fuel_couponhandover'


class HarmonizedBeneficiaryProfile(TimeStampedModel):
    """
    Harmonized beneficiary profile that consolidates all beneficiary information
    This model serves as a unified data structure for the dynamic allocation system
    """
    # User and Identity
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='harmonized_profile'
    )
    parliamentary_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Official parliamentary identification number"
    )
    employee_id = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True,
        help_text="Employee ID for staff members"
    )
    
    # Classification
    category = models.ForeignKey(
        BeneficiaryCategory,
        on_delete=models.PROTECT,
        related_name='harmonized_beneficiaries'
    )
    constituency = models.ForeignKey(
        Constituency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='harmonized_constituency_beneficiaries'
    )
    vehicle_category = models.ForeignKey(
        VehicleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='harmonized_vehicle_beneficiaries'
    )
    
    # Professional Information
    position = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    party_affiliation = models.CharField(max_length=100, blank=True)
    
    # Personal Information
    date_of_birth = models.DateField(null=True, blank=True)
    national_id = models.CharField(max_length=50, unique=True)
    full_address = models.TextField(blank=True)
    
    # Contact Information
    office_location = models.CharField(max_length=200, blank=True)
    office_phone = models.CharField(max_length=20, blank=True)
    mobile_phone = models.CharField(max_length=20, blank=True)
    official_email = models.EmailField(blank=True)
    personal_email = models.EmailField(blank=True)
    
    # Vehicle Information
    vehicle_make = models.CharField(max_length=50, blank=True)
    vehicle_model = models.CharField(max_length=50, blank=True)
    vehicle_year = models.IntegerField(null=True, blank=True)
    engine_size = models.CharField(max_length=20, blank=True)
    vehicle_registration = models.CharField(max_length=20, blank=True)
    fuel_type = models.CharField(
        max_length=10,
        choices=[('PETROL', 'Petrol'), ('DIESEL', 'Diesel')],
        default='DIESEL'
    )
    
    # Allocation Profile
    base_allocation = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('200')
    )
    category_multiplier = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal('1.0')
    )
    engine_multiplier = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal('1.0')
    )
    monthly_entitlement_litres = models.DecimalField(
        max_digits=8, decimal_places=2, default=0
    )
    max_per_transaction = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('50')
    )
    
    # Status and Activity
    status = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVE', 'Active'),
            ('INACTIVE', 'Inactive'),
            ('SUSPENDED', 'Suspended'),
            ('PENDING_APPROVAL', 'Pending Approval'),
        ],
        default='ACTIVE'
    )
    is_active_beneficiary = models.BooleanField(default=True)
    
    # Usage Tracking
    current_balance = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('0')
    )
    used_this_month = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('0')
    )
    last_month_usage = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('0')
    )
    year_to_date_usage = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('0')
    )
    total_usage_all_time = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal('0')
    )
    
    # Timestamps
    last_allocation_date = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    join_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Harmonized Beneficiary Profile"
        verbose_name_plural = "Harmonized Beneficiary Profiles"
        ordering = ['user__username']
    
    def __str__(self):
        return f"{self.user.username} - {self.category.name} (Harmonized)"
    
    def get_full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
    @property 
    def name(self):
        return self.get_full_name()