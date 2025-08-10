from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator
import re
from model_utils.models import TimeStampedModel, SoftDeletableModel
from decimal import Decimal
import uuid
from django.contrib.contenttypes.models import ContentType
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
    ]

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
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER']}
    )
    is_active = models.BooleanField(default=True)

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
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER']}
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
    
    box_code = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        default='',
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
        help_text="Litres per coupon (5L, 20L, or 50L)"
    )
    first_coupon_number = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="First coupon number in the box (e.g., PU00GH355101)"
    )
    last_coupon_number = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Last coupon number in the box (e.g., PU00GH355200)"
    )
    number_of_books = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        help_text="Number of books in this box"
    )
    coupons_per_book = models.IntegerField(
        default=100,  # Changed from 10 to 100 to support proper pagination
        validators=[MinValueValidator(1)],
        help_text="Number of coupons per book (usually 100 pages/coupons)"
    )
    total_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Pricing and monetary fields
    monetary_value_usd = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total monetary value in USD"
    )
    fuel_price_per_litre_usd = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Fuel price per litre in USD"
    )
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="USD to ZWL exchange rate"
    )
    
    # Additional fields for frontend compatibility
    notes = models.TextField(
        blank=True,
        default='',
        help_text="Additional notes about this box"
    )
    barcode = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Barcode for the box (if applicable)"
    )
    
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
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER']}
    )

    class Meta:
        verbose_name = "Coupon Box"
        verbose_name_plural = "Coupon Boxes"
        ordering = ['-received_at']

    def __str__(self):
        return f"Box {self.box_code} ({self.get_fuel_type_display()} {self.denomination}L - {self.total_litres}L total)"

    def save(self, *args, **kwargs):
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
        
        # Auto-calculate total litres if not set
        if not self.total_litres:
            total_coupons = self.number_of_books * self.coupons_per_book
            self.total_litres = Decimal(str(total_coupons * self.denomination))
            
        super().save(*args, **kwargs)

    @property
    def total_coupons(self):
        """Calculate total number of coupons in this box"""
        return self.number_of_books * self.coupons_per_book
    
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

    class Meta:
        unique_together = ('box', 'book_number')
        verbose_name = "Coupon Book"
        verbose_name_plural = "Coupon Books"
        ordering = ['box', 'book_number']

    def __str__(self):
        return f"Book {self.book_number} (Box {self.box.box_code})"

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
    
    # Related objects
    content_type = models.ForeignKey(
        'contenttypes.ContentType',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        help_text="Related object type"
    )
    object_id = models.CharField(
        max_length=255,
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
        ordering = ['-created']
        verbose_name = "System Alert"
        verbose_name_plural = "System Alerts"
        indexes = [
            models.Index(fields=['alert_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created']),
        ]
    
    def __str__(self):
        return f"{self.get_alert_type_display()}: {self.title}"
    
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
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Venue and management fields
    venue = models.CharField(
        max_length=200,
        blank=True,
        help_text="Venue where the session will be held"
    )
    fuel_entitlement_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Fuel entitlement in litres for this session"
    )
    is_mandatory = models.BooleanField(
        default=False,
        help_text="Whether attendance is mandatory for this session"
    )
    
    organizer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_sessions',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER']},
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
    
    class Meta:
        verbose_name = "Parliament Session"
        verbose_name_plural = "Parliament Sessions"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.title} ({self.start_date} to {self.end_date})"


class Program(TimeStampedModel):
    """
    Programs associated with parliament sessions
    """
    PROGRAM_TYPES = [
        ('COMMITTEE', 'Committee Session'),
        ('DEBATE', 'Parliamentary Debate'),
        ('WORKSHOP', 'Workshop'),
        ('CONFERENCE', 'Conference'),
        ('SPECIAL', 'Special Program'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    program_type = models.CharField(
        max_length=20,
        choices=PROGRAM_TYPES,
        default='COMMITTEE'
    )
    
    # Schedule fields
    scheduled_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when the program is scheduled"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="End date of the program"
    )
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    # Location and management
    venue = models.CharField(max_length=200, blank=True)
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Alternative location field (alias for venue)"
    )
    
    # Management fields
    organizer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organized_programs',
        help_text="User organizing this program"
    )
    sub_center = models.ForeignKey(
        'SubCenter',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_programs',
        help_text="SubCenter managing this program"
    )
    
    session = models.ForeignKey(
        'ParliamentSession',
        on_delete=models.CASCADE,
        related_name='programs',
        null=True,
        blank=True,
        help_text="Associated parliament session"
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Program"
        verbose_name_plural = "Programs"
        ordering = ['-created']
    
    def __str__(self):
        return f"{self.name} ({self.get_program_type_display()})"


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
    
    class Meta:
        verbose_name = "Beneficiary Profile"
        verbose_name_plural = "Beneficiary Profiles"
        ordering = ['user__username']
    
    def __str__(self):
        return f"{self.user.username} - {self.category.name} ({self.constituency.name if self.constituency else 'No Constituency'})"
    
    def calculate_final_allocation(self):
        """Calculate final monthly allocation based on multipliers"""
        return self.base_allocation * self.category_multiplier * self.engine_multiplier
    
    def calculate_engine_multiplier_from_size(self):
        """Calculate engine multiplier based on engine size string"""
        if not self.engine_size:
            return Decimal('1.0')
        
        # Extract numeric value from engine size (e.g., "2.0L" -> 2.0)
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
        
        # Update monthly entitlement based on calculated final allocation
        self.monthly_entitlement_litres = self.calculate_final_allocation()
    
    def save(self, *args, **kwargs):
        # Auto-update allocation profile on save
        self.update_allocation_profile()
        super().save(*args, **kwargs)
    
    @property
    def vehicle_info_dict(self):
        """Return vehicle information as a dictionary for API responses"""
        return {
            'make': self.vehicle_make,
            'model': self.vehicle_model,
            'year': self.vehicle_year,
            'engine_size': self.engine_size,
            'registration_number': self.vehicle_registration,
            'fuel_type': self.fuel_type,
        }
    
    @property
    def contact_info_dict(self):
        """Return contact information as a dictionary for API responses"""
        return {
            'email': self.user.email,
            'phone': self.user.phone,
            'office': self.office_location,
        }
    
    @property
    def allocation_profile_dict(self):
        """Return allocation profile as a dictionary for API responses"""
        return {
            'base_allocation': self.base_allocation,
            'category_multiplier': self.category_multiplier,
            'engine_multiplier': self.engine_multiplier,
            'final_allocation': self.calculate_final_allocation(),
            'current_balance': self.current_balance,
            'used_this_month': self.used_this_month,
            'last_updated': self.last_allocation_date,
        }


class BookDispatch(TimeStampedModel):
    """
    Track dispatch of books from main center to subcenters
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('DISPATCHED', 'Dispatched'),
        ('RECEIVED', 'Received'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    from_center = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='dispatches_sent',
        null=True,
        blank=True,
        help_text="Source subcenter (null for main center)"
    )
    to_center = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='dispatches_received',
        help_text="Destination subcenter"
    )
    dispatched_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='dispatches_sent',
        help_text="User who dispatched the books"
    )
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dispatches_received',
        help_text="User who received the books"
    )
    books = models.ManyToManyField(
        'Book',
        related_name='dispatches',
        help_text="Books included in this dispatch"
    )
    
    # Serial Range Tracking
    first_serial = models.CharField(
        max_length=50,
        blank=True,
        help_text="First coupon serial in this dispatch"
    )
    last_serial = models.CharField(
        max_length=50,
        blank=True,
        help_text="Last coupon serial in this dispatch"
    )
    total_coupons = models.IntegerField(
        default=0,
        help_text="Total number of coupons in this dispatch"
    )
    
    dispatch_date = models.DateTimeField(auto_now_add=True)
    received_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-dispatch_date']
        verbose_name = "Book Dispatch"
        verbose_name_plural = "Book Dispatches"
    
    def __str__(self):
        return f"Dispatch to {self.to_center.name} on {self.dispatch_date.strftime('%Y-%m-%d')}"
    
    @property
    def total_books(self):
        return self.books.count()
    
    @property
    def total_value_usd(self):
        return sum(book.total_value_usd for book in self.books.all())
    
    def calculate_serial_range(self):
        """Calculate and update the first and last serials based on books"""
        from .utils.serial_tracking import SerialRangeTracker
        
        books = self.books.all().order_by('first_coupon_number')
        if not books:
            return
        
        # Get all serial ranges from books
        all_first_serials = []
        all_last_serials = []
        total_coupons = 0
        
        for book in books:
            if book.first_coupon_number and book.last_coupon_number:
                all_first_serials.append(book.first_coupon_number)
                all_last_serials.append(book.last_coupon_number)
                
                # Calculate book's coupon count
                range_info = SerialRangeTracker.calculate_range_info(
                    book.first_coupon_number, book.last_coupon_number
                )
                if range_info['is_valid']:
                    total_coupons += range_info['total_count']
        
        if all_first_serials and all_last_serials:
            # Sort to find overall first and last
            first_serials_parsed = []
            last_serials_parsed = []
            
            for serial in all_first_serials:
                parsed = SerialRangeTracker.parse_coupon_serial(serial)
                if parsed['is_valid']:
                    first_serials_parsed.append((parsed['number'], serial))
            
            for serial in all_last_serials:
                parsed = SerialRangeTracker.parse_coupon_serial(serial)
                if parsed['is_valid']:
                    last_serials_parsed.append((parsed['number'], serial))
            
            if first_serials_parsed and last_serials_parsed:
                first_serials_parsed.sort()
                last_serials_parsed.sort()
                
                self.first_serial = first_serials_parsed[0][1]  # Lowest number
                self.last_serial = last_serials_parsed[-1][1]   # Highest number
                self.total_coupons = total_coupons
                self.save()
    
    def get_serial_summary(self):
        """Get comprehensive serial tracking summary"""
        from .utils.serial_tracking import SerialRangeTracker, SerialAllocationTracker
        
        if not self.first_serial or not self.last_serial:
            return {
                'has_serial_tracking': False,
                'message': 'Serial range not calculated'
            }
        
        # Calculate overall range info
        range_info = SerialRangeTracker.calculate_range_info(self.first_serial, self.last_serial)
        
        # Get book breakdown
        books_data = []
        for book in self.books.all().order_by('first_coupon_number'):
            if book.first_coupon_number and book.last_coupon_number:
                book_range = SerialRangeTracker.calculate_range_info(
                    book.first_coupon_number, book.last_coupon_number
                )
                books_data.append({
                    'book_number': book.book_number,
                    'first_serial': book.first_coupon_number,
                    'last_serial': book.last_coupon_number,
                    'coupon_count': book_range['total_count'] if book_range['is_valid'] else 0
                })
        
        return {
            'has_serial_tracking': True,
            'overall_range': {
                'first_serial': self.first_serial,
                'last_serial': self.last_serial,
                'total_coupons': self.total_coupons,
                'is_valid': range_info['is_valid']
            },
            'books': books_data,
            'status': self.status,
            'dispatch_date': self.dispatch_date,
            'to_center': self.to_center.name if self.to_center else None
        }


class CouponAllocation(TimeStampedModel):
    """
    Track allocation of coupons to beneficiaries
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ALLOCATED', 'Allocated'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    sub_center = models.ForeignKey(
        SubCenter,
        on_delete=models.CASCADE,
        related_name='coupon_allocations',
        help_text="Subcenter managing this allocation"
    )
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coupon_allocations',
        limit_choices_to={'role': 'BENEFICIARY'},
        help_text="Beneficiary receiving the coupons"
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='allocations',
        null=True,
        blank=True,
        help_text="Book this allocation relates to"
    )
    allocated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='allocations_made',
        help_text="User who made the allocation"
    )
    first_coupon_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="First coupon in the allocated range"
    )
    last_coupon_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Last coupon in the allocated range"
    )
    quantity = models.IntegerField(
        null=True,
        blank=True,
        help_text="Number of coupons allocated"
    )
    allocation_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    notes = models.TextField(blank=True)
    
    # Session tracking fields for frontend
    session_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Legislative session or period name"
    )
    program_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Specific program or initiative name"
    )
    event_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Event or occasion for allocation"
    )
    allocation_type = models.CharField(
        max_length=50,
        choices=[
            ('MONTHLY', 'Monthly Allocation'),
            ('QUARTERLY', 'Quarterly Allocation'),
            ('SPECIAL', 'Special Event'),
            ('EMERGENCY', 'Emergency Allocation'),
            ('BONUS', 'Bonus Allocation'),
        ],
        default='MONTHLY'
    )
    total_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total monetary value of allocation"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when allocation expires"
    )
    coupons_used = models.IntegerField(
        default=0,
        help_text="Number of coupons already used"
    )
    coupons_remaining = models.IntegerField(
        default=0,
        help_text="Number of coupons still available"
    )
    
    class Meta:
        ordering = ['-allocation_date']
        verbose_name = "Coupon Allocation"
        verbose_name_plural = "Coupon Allocations"
    
    def __str__(self):
        return f"Allocation to {self.beneficiary.get_full_name()} on {self.allocation_date.strftime('%Y-%m-%d')}"
    
    @property
    def total_coupons(self):
        return self.quantity
    
    @property
    def total_litres(self):
        if self.book:
            return self.quantity * self.book.box.denomination
        return 0
    
    def validate_serial_range(self):
        """Validate that the allocation's serial range is valid"""
        from .utils.serial_tracking import SerialRangeTracker
        
        if not self.first_coupon_number or not self.last_coupon_number:
            return False, "Missing serial range"
        
        is_valid, message = SerialRangeTracker.validate_serial_range(
            self.first_coupon_number, self.last_coupon_number
        )
        
        if not is_valid:
            return False, message
        
        # Validate quantity matches range
        range_info = SerialRangeTracker.calculate_range_info(
            self.first_coupon_number, self.last_coupon_number
        )
        
        if range_info['total_count'] != self.quantity:
            return False, f"Quantity mismatch: range has {range_info['total_count']} coupons, but quantity is {self.quantity}"
        
        return True, "Valid serial range"
    
    def get_allocation_summary(self):
        """Get comprehensive allocation summary with serial tracking"""
        from .utils.serial_tracking import SerialRangeTracker
        
        summary = {
            'allocation_id': self.id,
            'beneficiary': {
                'name': self.beneficiary.get_full_name(),
                'email': self.beneficiary.email,
                'role': self.beneficiary.role
            },
            'sub_center': self.sub_center.name,
            'allocation_date': self.allocation_date,
            'status': self.status,
            'quantity': self.quantity,
            'notes': self.notes
        }
        
        if self.first_coupon_number and self.last_coupon_number:
            range_info = SerialRangeTracker.calculate_range_info(
                self.first_coupon_number, self.last_coupon_number
            )
            
            summary['serial_range'] = {
                'first_serial': self.first_coupon_number,
                'last_serial': self.last_coupon_number,
                'total_count': range_info['total_count'],
                'is_valid': range_info['is_valid'],
                'prefix': range_info.get('prefix', ''),
                'format': range_info.get('format', 'UNKNOWN')
            }
            
            # Generate list of serials if range is small
            if range_info['is_valid'] and range_info['total_count'] <= 20:
                try:
                    serials = SerialRangeTracker.generate_serial_list(
                        self.first_coupon_number, self.last_coupon_number
                    )
                    summary['serial_range']['serial_list'] = serials
                except Exception:
                    summary['serial_range']['serial_list'] = []
        
        if self.book:
            summary['book'] = {
                'book_number': self.book.book_number,
                'box_code': self.book.box.box_code,
                'denomination': self.book.box.denomination,
                'total_litres': self.total_litres
            }
        
        return summary
    
    def save(self, *args, **kwargs):
        # Auto-calculate quantity if serial range is provided
        if self.first_coupon_number and self.last_coupon_number and not self.quantity:
            from .utils.serial_tracking import SerialRangeTracker
            range_info = SerialRangeTracker.calculate_range_info(
                self.first_coupon_number, self.last_coupon_number
            )
            if range_info['is_valid']:
                self.quantity = range_info['total_count']
        
        super().save(*args, **kwargs)
    
    @property
    def usage_percentage(self):
        """Calculate percentage of coupons used"""
        if self.quantity == 0:
            return 0
        return round((self.coupons_used / self.quantity) * 100, 1)
    
    @property
    def is_expired(self):
        """Check if allocation has expired"""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.expiry_date
    
    @property
    def status_display(self):
        """Get user-friendly status display"""
        if self.is_expired:
            return "Expired"
        elif self.coupons_used >= self.quantity:
            return "Fully Used"
        elif self.coupons_used > 0:
            return "Partially Used"
        else:
            return "Available"
    
    def update_usage(self, coupons_used=None):
        """Update coupon usage tracking"""
        if coupons_used is not None:
            self.coupons_used = coupons_used
        self.coupons_remaining = max(0, self.quantity - self.coupons_used)
        self.save(update_fields=['coupons_used', 'coupons_remaining'])
    
    def get_allocation_details(self):
        """Get detailed allocation information for frontend"""
        return {
            'id': self.id,
            'beneficiary': {
                'id': self.beneficiary.id,
                'name': self.beneficiary.get_full_name(),
                'role': self.beneficiary.role,
                'category': self.beneficiary.category.name if self.beneficiary.category else None,
                'vehicle': {
                    'make': getattr(self.beneficiary, 'vehicle_make', ''),
                    'model': getattr(self.beneficiary, 'vehicle_model', ''),
                    'year': getattr(self.beneficiary, 'vehicle_year', None),
                    'engine_size': getattr(self.beneficiary, 'engine_size', None),
                    'registration': getattr(self.beneficiary, 'vehicle_registration', ''),
                }
            },
            'allocation': {
                'date': self.allocation_date,
                'type': self.allocation_type,
                'session_name': self.session_name,
                'program_name': self.program_name,
                'event_name': self.event_name,
                'quantity': self.quantity,
                'total_value': float(self.total_value) if self.total_value else 0,
                'expiry_date': self.expiry_date,
                'status': self.status,
                'status_display': self.status_display,
            },
            'usage': {
                'coupons_used': self.coupons_used,
                'coupons_remaining': self.coupons_remaining,
                'usage_percentage': self.usage_percentage,
                'is_expired': self.is_expired,
            },
            'serial_range': {
                'first_coupon': self.first_coupon_number,
                'last_coupon': self.last_coupon_number,
            },
            'sub_center': {
                'id': self.sub_center.id,
                'name': self.sub_center.name,
            } if self.sub_center else None,
            'book': {
                'id': self.book.id,
                'book_number': self.book.book_number,
                'box_code': self.book.box.box_code,
                'denomination': self.book.box.denomination,
            } if self.book else None,
            'notes': self.notes,
        }


class SerialMovement(TimeStampedModel):
    """
    Comprehensive tracking of all coupon serial movements throughout the system.
    This creates an audit trail of every serial allocation, dispatch, handover, and usage.
    """
    MOVEMENT_TYPES = [
        ('BOX_RECEIVED', 'Box Received'),
        ('BOOK_DISPATCH', 'Book Dispatched'),
        ('BOOK_RECEIVED', 'Book Received'),
        ('COUPON_ALLOCATED', 'Coupon Allocated'),
        ('COUPON_HANDOVER', 'Coupon Handover'),
        ('COUPON_USED', 'Coupon Used'),
        ('COUPON_RETURNED', 'Coupon Returned'),
        ('BOOK_TRANSFERRED', 'Book Transferred'),
        ('EMERGENCY_ALLOCATION', 'Emergency Allocation'),
    ]
    
    movement_type = models.CharField(
        max_length=30,
        choices=MOVEMENT_TYPES,
        help_text="Type of serial movement"
    )
    
    # Serial Range Information
    first_serial = models.CharField(
        max_length=50,
        help_text="First serial in the movement"
    )
    last_serial = models.CharField(
        max_length=50,
        help_text="Last serial in the movement"
    )
    quantity = models.IntegerField(
        help_text="Number of serials moved"
    )
    
    # Movement Details
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='serial_movements_performed',
        help_text="User who performed this movement"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this movement"
    )
    movement_date = models.DateTimeField(
        help_text="When the movement occurred"
    )
    
    class Meta:
        ordering = ['-movement_date']
        verbose_name = "Serial Movement"
        verbose_name_plural = "Serial Movements"
    
    @classmethod
    def create_movement(cls, movement_type, first_serial, last_serial, 
                       from_entity_type=None, from_entity_id=None, from_entity_name=None,
                       to_entity_type=None, to_entity_id=None, to_entity_name=None,
                       performed_by=None, movement_date=None, notes="", **kwargs):
        """
        Create a new serial movement record with comprehensive tracking
        """
        from .utils.serial_tracking import SerialRangeTracker
        
        # Calculate quantity using SerialRangeTracker
        range_info = SerialRangeTracker.calculate_range_info(first_serial, last_serial)
        quantity = range_info['total_count']
        
        # Use current time if not provided
        if movement_date is None:
            from django.utils import timezone
            movement_date = timezone.now()
        
        # Create movement record
        movement = cls.objects.create(
            movement_type=movement_type,
            first_serial=first_serial,
            last_serial=last_serial,
            quantity=quantity,
            performed_by=performed_by,
            movement_date=movement_date,
            notes=notes
        )
        
        return movement
    
    def __str__(self):
        return f"{self.get_movement_type_display()}: {self.first_serial}-{self.last_serial} ({self.quantity} coupons)"


class FuelEntitlement(TimeStampedModel):
    """
    Track fuel entitlements for parliament members and staff.
    This tracks what members are entitled to receive, regardless of current stock availability.
    Critical for accountability and ensuring proper allocations.
    """
    ENTITLEMENT_TYPES = [
        ('MONTHLY', 'Monthly Entitlement'),
        ('SESSION', 'Parliament Session'),
        ('COMMITTEE', 'Committee Meeting'),
        ('SPECIAL_EVENT', 'Special Event'),
        ('TRAVEL_ALLOWANCE', 'Travel Allowance'),
        ('EMERGENCY', 'Emergency Allocation'),
        ('CONSTITUENCY_WORK', 'Constituency Work'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('ALLOCATED', 'Allocated'),
        ('PARTIALLY_ALLOCATED', 'Partially Allocated'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='fuel_entitlements',
        limit_choices_to={'role': 'BENEFICIARY'},
        help_text="Parliament member or staff entitled to fuel"
    )
    entitlement_type = models.CharField(
        max_length=20,
        choices=ENTITLEMENT_TYPES,
        help_text="Type of entitlement"
    )
    session = models.ForeignKey(
        ParliamentSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fuel_entitlements',
        help_text="Related parliament session (if applicable)"
    )
    litres_entitled = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Amount of fuel entitled in litres"
    )
    litres_allocated = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Amount of fuel actually allocated/given"
    )
    period_start = models.DateField(
        help_text="Start date of entitlement period"
    )
    period_end = models.DateField(
        help_text="End date of entitlement period"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='entitlements_created',
        help_text="User who created this entitlement record"
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entitlements_approved',
        help_text="User who approved this entitlement"
    )
    approved_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when entitlement was approved"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this entitlement"
    )
    justification = models.TextField(
        help_text="Justification for this entitlement"
    )
    
    class Meta:
        ordering = ['-created']
        verbose_name = "Fuel Entitlement"
        verbose_name_plural = "Fuel Entitlements"
        indexes = [
            models.Index(fields=['beneficiary', 'period_start', 'period_end']),
            models.Index(fields=['status', 'entitlement_type']),
            models.Index(fields=['session']),
        ]
    
    def __str__(self):
        return f"{self.beneficiary.get_full_name()} - {self.litres_entitled}L ({self.get_entitlement_type_display()})"
    
    @property
    def remaining_litres(self):
        """Calculate remaining litres not yet allocated"""
        return self.litres_entitled - self.litres_allocated
    
    @property
    def allocation_percentage(self):
        """Calculate percentage of entitlement that has been allocated"""
        if self.litres_entitled > 0:
            return round((self.litres_allocated / self.litres_entitled) * 100, 2)
        return 0
    
    @property
    def is_fully_allocated(self):
        """Check if entitlement is fully allocated"""
        return self.litres_allocated >= self.litres_entitled
    
    @property
    def is_expired(self):
        """Check if entitlement period has expired"""
        from django.utils import timezone
        return timezone.now().date() > self.period_end
    
    def approve(self, approved_by_user):
        """Approve this entitlement"""
        from django.utils import timezone
        self.status = 'APPROVED'
        self.approved_by = approved_by_user
        self.approved_date = timezone.now()
        self.save()
    
    def allocate_fuel(self, litres_to_allocate):
        """
        Record allocation of fuel against this entitlement.
        Returns True if successful, False if allocation exceeds entitlement.
        """
        if litres_to_allocate <= 0:
            raise ValueError("Cannot allocate negative or zero litres")
        
        if self.litres_allocated + litres_to_allocate > self.litres_entitled:
            raise ValueError(f"Cannot allocate {litres_to_allocate}L. Only {self.remaining_litres}L remaining.")
        
        self.litres_allocated += litres_to_allocate
        
        # Update status based on allocation
        if self.is_fully_allocated:
            self.status = 'ALLOCATED'
        else:
            self.status = 'PARTIALLY_ALLOCATED'
        
        self.save()
        return True
    
    def calculate_constituency_multiplier(self):
        """Calculate distance-based multiplier for constituency work"""
        if self.beneficiary.beneficiary_profile and self.beneficiary.beneficiary_profile.constituency:
            distance = self.beneficiary.beneficiary_profile.constituency.distance_from_parliament_km
            # Base multiplier: 1.0 for distances up to 50km, then +0.1 for every 50km
            return 1.0 + max(0, (distance - 50) / 50) * 0.1
        return 1.0


class FuelData(TimeStampedModel):
    """
    Aggregated fuel statistics for reporting/dashboard.
    All prices are stored in USD as per coupon requirements.
    """
    timestamp = models.DateTimeField(default=timezone.now)
    petrol_price_usd = models.DecimalField(
        max_digits=8, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Current petrol price in USD per litre"
    )
    diesel_price_usd = models.DecimalField(
        max_digits=8, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Current diesel price in USD per litre"
    )
    previous_petrol_price_usd = models.DecimalField(
        max_digits=8, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Previous petrol price in USD per litre"
    )
    previous_diesel_price_usd = models.DecimalField(
        max_digits=8, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Previous diesel price in USD per litre"
    )
    # Exchange rate for reference if needed for reporting in local currency
    usd_zwg_exchange_rate = models.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        null=True, 
        blank=True,
        default=Decimal('27.50'),
        help_text="USD to ZWG exchange rate for reference (2025 rate ~27.50)"
    )
    total_fuel_allocated = models.FloatField(null=True, blank=True)
    total_fuel_used = models.FloatField(null=True, blank=True)
    available_fuel = models.FloatField(null=True, blank=True)
    last_refuel_date = models.DateTimeField(null=True, blank=True)
    daily_usage_trend = models.CharField(max_length=10, blank=True, null=True)
    daily_usage_change = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Fuel Statistic"
        verbose_name_plural = "Fuel Statistics"

    def __str__(self):
        return f"Fuel Data Snapshot at {self.timestamp}"

    @property
    def petrol_price(self):
        """Backward compatibility property"""
        return self.petrol_price_usd
    
    @property
    def diesel_price(self):
        """Backward compatibility property"""
        return self.diesel_price_usd


class CouponDistribution(TimeStampedModel):
    """
    Records the event of a specific coupon being distributed to a beneficiary,
    potentially within the context of a program.
    """
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name='distributions'
    )
    beneficiary = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='coupon_distributions',
        limit_choices_to={'role': 'BENEFICIARY'}
    )
    # program = models.ForeignKey(
    #     'Program',  # Use string reference to avoid circular import
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='coupon_distributions'
    # )  # TODO: Uncomment when Program model is implemented
    distributed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='coupon_distributions_made',
        limit_choices_to={'role__in': ['MAIN_CENTER', 'SUB_CENTER']}
    )
    distribution_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-distribution_date']
        verbose_name = "Coupon Distribution"
        verbose_name_plural = "Coupon Distributions"
        indexes = [
            models.Index(fields=['beneficiary']),
            # models.Index(fields=['program']),  # TODO: Uncomment when Program model is implemented
            models.Index(fields=['distribution_date']),
        ]

    def __str__(self):
        return f"Coupon {self.coupon.coupon_number} distributed to {self.beneficiary.get_full_name()}"


class FuelRequirementConfiguration(TimeStampedModel):
    """
    Configuration model for managing daily/weekly fuel requirements
    """
    FUEL_TYPE_CHOICES = [
        ('PETROL', 'Petrol'),
        ('DIESEL', 'Diesel'),
    ]
    
    PERIOD_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    ]
    
    fuel_type = models.CharField(
        max_length=10,
        choices=FUEL_TYPE_CHOICES,
        help_text="Type of fuel"
    )
    period = models.CharField(
        max_length=10,
        choices=PERIOD_CHOICES,
        default='DAILY',
        help_text="Period for which this requirement applies"
    )
    required_litres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Required litres for this period"
    )
    required_coupons = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Number of coupons needed for this period"
    )
    litres_per_coupon = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=20.00,
        validators=[MinValueValidator(0)],
        help_text="Litres per coupon for this fuel type"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this configuration is currently active"
    )
    effective_from = models.DateField(
        default=timezone.now,
        help_text="Date from which this configuration is effective"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this requirement"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_fuel_requirements',
        limit_choices_to={'role__in': ['ADMIN', 'SUPERUSER', 'MAIN_CENTER']}
    )
    
    class Meta:
        ordering = ['-created']
        verbose_name = "Fuel Requirement Configuration"
        verbose_name_plural = "Fuel Requirement Configurations"
        unique_together = ['fuel_type', 'period', 'effective_from']
        indexes = [
            models.Index(fields=['fuel_type', 'period']),
            models.Index(fields=['effective_from']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.fuel_type} - {self.required_litres}L {self.period.lower()}"
    
    def calculate_required_coupons(self):
        """Calculate required coupons based on litres and coupon size"""
        if self.litres_per_coupon > 0:
            return int(self.required_litres / self.litres_per_coupon)
        return 0
    
    def save(self, *args, **kwargs):
        # Auto-calculate required coupons if not set
        if not self.required_coupons:
            self.required_coupons = self.calculate_required_coupons()
        super().save(*args, **kwargs)