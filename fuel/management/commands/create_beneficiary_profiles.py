from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from fuel.models import BeneficiaryProfile, BeneficiaryCategory
from decimal import Decimal
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create BeneficiaryProfile records for existing users with Beneficiary role'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating anything',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if some profiles already exist',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write("=== Beneficiary Profile Creation Tool ===\n")
        
        # Debug: Check all roles in the system
        all_users = User.objects.all()
        role_counts = {}
        for user in all_users:
            role = user.role
            role_counts[role] = role_counts.get(role, 0) + 1
        
        self.stdout.write("Current user roles in system:")
        for role, count in role_counts.items():
            self.stdout.write(f"  {role}: {count} users")
        
        # Get users with Beneficiary role who don't have BeneficiaryProfile
        beneficiary_users = User.objects.filter(role='BENEFICIARY')
        existing_profiles = BeneficiaryProfile.objects.filter(
            user__in=beneficiary_users
        ).values_list('user_id', flat=True)
        
        users_without_profiles = beneficiary_users.exclude(id__in=existing_profiles)
        
        self.stdout.write(f"\nAnalysis:")
        self.stdout.write(f"  Total users: {all_users.count()}")
        self.stdout.write(f"  Users with Beneficiary role: {beneficiary_users.count()}")
        self.stdout.write(f"  Existing BeneficiaryProfiles: {len(existing_profiles)}")
        self.stdout.write(f"  Users needing profiles: {users_without_profiles.count()}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("\nDRY RUN - No changes will be made\n"))
            
        # Get a default category (or None for optional category)
        default_category = BeneficiaryCategory.objects.filter(
            name__icontains='Parliamentary Staff'
        ).first()
        
        if not default_category:
            default_category = BeneficiaryCategory.objects.first()
            
        if default_category:
            self.stdout.write(f"Using default category: {default_category.name}")
        else:
            self.stdout.write("No categories found - profiles will be created without category")
        
        created_count = 0
        error_count = 0
        
        for user in users_without_profiles:
            # Create meaningful data from user info
            first_name = user.first_name or user.username.split('.')[0].title()
            last_name = user.last_name or user.username.split('.')[-1].title() if '.' in user.username else ''
            
            profile_data = {
                'user': user,
                'first_name': first_name,
                'last_name': last_name,
                'email': user.email or f'{user.username}@parliament.co.zw',
                'phone_number': getattr(user, 'phone_number', '') or '+263777000000',
                'address': 'Parliament of Zimbabwe, Mount Pleasant, Harare',
                'date_of_birth': '1980-01-01',  # Default date
                'national_id': f'{user.username.upper()}-ID',  # Generate ID
                'employee_id': user.username,
                'position': 'Parliamentary Representative',
                'department': 'Parliament',
                'category': default_category,  # Optional - can be None
                'constituency': None,  # Optional
                'monthly_entitlement_litres': Decimal('300.00'),
                'vehicle_make': '',
                'vehicle_model': '',
                'vehicle_year': 2020,
                'engine_size': '',
                'vehicle_registration': '',
                'fuel_type': 'PETROL',
                'office_location': 'Parliament Building',
                'base_allocation': Decimal('200.00'),
                'category_multiplier': Decimal('1.0'),
                'status': 'ACTIVE',
                'is_active_beneficiary': True
            }
            
            if dry_run:
                self.stdout.write(f"Would create profile for: {user.username} ({first_name} {last_name})")
            else:
                try:
                    profile = BeneficiaryProfile.objects.create(**profile_data)
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ Created profile for: {user.username} ({first_name} {last_name})")
                    )
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"✗ Failed to create profile for {user.username}: {e}")
                    )
        
        # Final summary
        self.stdout.write(f"\n=== Summary ===")
        if not dry_run:
            self.stdout.write(f"Created: {created_count} BeneficiaryProfile records")
            self.stdout.write(f"Errors: {error_count} failed creations")
            if created_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'\n✓ Successfully created {created_count} profiles!')
                )
        else:
            self.stdout.write(f"Would create: {users_without_profiles.count()} profiles")
            self.stdout.write(
                self.style.WARNING(f'\nRe-run without --dry-run to create the profiles.')
            )
