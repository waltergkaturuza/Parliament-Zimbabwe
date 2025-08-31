# fuel/models_political_parties.py
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone

class PoliticalParty(models.Model):
    """Political Party model for dynamic party management"""
    
    # Party Status Choices
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('DISBANDED', 'Disbanded'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    # Party Type Choices
    TYPE_CHOICES = [
        ('POLITICAL', 'Political Party'),
        ('COALITION', 'Coalition'),
        ('ALLIANCE', 'Alliance'),
        ('INDEPENDENT', 'Independent'),
        ('OTHER', 'Other'),
    ]
    
    # Basic Information
    name = models.CharField(
        max_length=200, 
        unique=True,
        help_text="Full party name (e.g., Zimbabwe African National Union - Patriotic Front)"
    )
    
    short_name = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Short name or acronym (e.g., ZANU-PF)"
    )
    
    abbreviation = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Official abbreviation if different from short name"
    )
    
    # Party Details
    party_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='POLITICAL'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    
    # Contact Information
    headquarters_address = models.TextField(
        blank=True,
        null=True,
        help_text="Main headquarters address"
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Phone number must be entered in format: '+999999999'. Up to 15 digits allowed."
        )]
    )
    
    contact_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Official party email"
    )
    
    website = models.URLField(
        blank=True,
        null=True,
        help_text="Official party website"
    )
    
    # Party Leadership
    leader_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Current party leader"
    )
    
    leader_title = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Leader's official title (e.g., President, Chairperson)"
    )
    
    # Historical Information
    founded_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date the party was founded"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Brief description of the party"
    )
    
    # System Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    is_government_party = models.BooleanField(
        default=False,
        help_text="Is this currently the ruling party?"
    )
    
    is_parliamentary_party = models.BooleanField(
        default=True,
        help_text="Does this party have parliamentary representation?"
    )
    
    display_order = models.PositiveIntegerField(
        default=100,
        help_text="Display order in dropdowns (lower numbers first)"
    )
    
    # Colors for UI (optional)
    primary_color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Primary party color (hex code, e.g., #FF0000)"
    )
    
    secondary_color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Secondary party color (hex code)"
    )
    
    class Meta:
        db_table = 'fuel_political_party'
        verbose_name = 'Political Party'
        verbose_name_plural = 'Political Parties'
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['status', 'is_parliamentary_party']),
            models.Index(fields=['display_order']),
            models.Index(fields=['short_name']),
        ]
    
    def __str__(self):
        return f"{self.short_name} ({self.name})"
    
    def save(self, *args, **kwargs):
        # Auto-generate short_name if not provided
        if not self.short_name and self.name:
            # Simple logic to create short name from full name
            words = self.name.upper().split()
            if len(words) > 1:
                self.short_name = ''.join([word[0] for word in words if len(word) > 2])
            else:
                self.short_name = words[0][:10]
        
        super().save(*args, **kwargs)
    
    @property
    def display_name(self):
        """Get display name for dropdowns"""
        if self.abbreviation:
            return f"{self.abbreviation} ({self.name})"
        elif self.short_name != self.name:
            return f"{self.short_name} ({self.name})"
        else:
            return self.name
    
    @property
    def member_count(self):
        """Get number of beneficiaries in this party"""
        return self.beneficiaries.filter(is_active_beneficiary=True).count()
    
    @classmethod
    def get_active_parties(cls):
        """Get all active parliamentary parties for dropdowns"""
        return cls.objects.filter(
            status='ACTIVE',
            is_parliamentary_party=True
        ).order_by('display_order', 'name')
    
    @classmethod
    def seed_default_parties(cls):
        """Create default Zimbabwe political parties"""
        default_parties = [
            {
                'name': 'Zimbabwe African National Union - Patriotic Front',
                'short_name': 'ZANU-PF',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'is_government_party': True,
                'is_parliamentary_party': True,
                'display_order': 1,
                'primary_color': '#FFD700',
                'description': 'Ruling party of Zimbabwe'
            },
            {
                'name': 'Citizens Coalition for Change',
                'short_name': 'CCC',
                'party_type': 'COALITION',
                'status': 'ACTIVE',
                'is_parliamentary_party': True,
                'display_order': 2,
                'primary_color': '#FF4500',
                'description': 'Main opposition party'
            },
            {
                'name': 'Movement for Democratic Change - Tsvangirai',
                'short_name': 'MDC-T',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'is_parliamentary_party': True,
                'display_order': 3,
                'primary_color': '#FF0000'
            },
            {
                'name': 'Movement for Democratic Change - Alliance',
                'short_name': 'MDC-A',
                'party_type': 'ALLIANCE',
                'status': 'INACTIVE',
                'is_parliamentary_party': False,
                'display_order': 4,
                'primary_color': '#FF0000'
            },
            {
                'name': 'Zimbabwe African Peoples Union',
                'short_name': 'ZAPU',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'is_parliamentary_party': True,
                'display_order': 5,
                'primary_color': '#008000'
            },
            {
                'name': 'Zimbabwe People First',
                'short_name': 'ZPF',
                'party_type': 'POLITICAL',
                'status': 'INACTIVE',
                'is_parliamentary_party': False,
                'display_order': 6
            },
            {
                'name': 'Independent',
                'short_name': 'Independent',
                'party_type': 'INDEPENDENT',
                'status': 'ACTIVE',
                'is_parliamentary_party': True,
                'display_order': 97,
                'description': 'Independent parliamentarians'
            },
            {
                'name': 'Other',
                'short_name': 'Other',
                'party_type': 'OTHER',
                'status': 'ACTIVE',
                'is_parliamentary_party': True,
                'display_order': 98,
                'description': 'Other political parties'
            },
            {
                'name': 'Not Specified',
                'short_name': 'Not Specified',
                'party_type': 'OTHER',
                'status': 'ACTIVE',
                'is_parliamentary_party': False,
                'display_order': 99,
                'description': 'For beneficiaries without party affiliation'
            }
        ]
        
        created_count = 0
        for party_data in default_parties:
            party, created = cls.objects.get_or_create(
                short_name=party_data['short_name'],
                defaults=party_data
            )
            if created:
                created_count += 1
        
        return created_count
