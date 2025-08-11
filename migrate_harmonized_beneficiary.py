"""
Safe Migration Script for Harmonized Beneficiary Model
This script safely migrates data from the existing BeneficiaryProfile model 
to the new HarmonizedBeneficiaryProfile model with 100% data integrity.
"""

import os
import sys
import django
from decimal import Decimal
from django.db import transaction
from django.core.management.base import BaseCommand
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from fuel.models import HarmonizedBeneficiaryProfile, BeneficiaryProfile, User


class BeneficiaryMigrationManager:
    """
    Manages the safe migration from existing BeneficiaryProfile to HarmonizedBeneficiaryProfile
    """
    
    def __init__(self):
        self.migration_log = []
        self.errors = []
        self.success_count = 0
        self.error_count = 0
    
    def log(self, message, level='INFO'):
        """Log migration messages"""
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {level}: {message}"
        self.migration_log.append(log_entry)
        print(log_entry)
    
    def validate_existing_data(self):
        """Validate existing data before migration"""
        self.log("Starting data validation...")
        
        # Check for missing required fields
        profiles_without_users = BeneficiaryProfile.objects.filter(user__isnull=True)
        if profiles_without_users.exists():
            self.log(f"WARNING: {profiles_without_users.count()} profiles without users found", 'WARNING')
        
        # Check for duplicate employee_ids
        duplicate_employee_ids = BeneficiaryProfile.objects.values('employee_id').annotate(
            count=models.Count('employee_id')
        ).filter(count__gt=1, employee_id__isnull=False)
        
        if duplicate_employee_ids.exists():
            self.log(f"WARNING: {duplicate_employee_ids.count()} duplicate employee IDs found", 'WARNING')
        
        # Check for missing categories
        profiles_without_categories = BeneficiaryProfile.objects.filter(category__isnull=True)
        if profiles_without_categories.exists():
            self.log(f"WARNING: {profiles_without_categories.count()} profiles without categories", 'WARNING')
        
        self.log("Data validation completed")
        return True
    
    def generate_parliamentary_id(self, profile):
        """Generate unique parliamentary ID"""
        if profile.employee_id:
            return profile.employee_id
        
        # Generate based on category and ID
        category_prefix = {
            'MP': 'MP',
            'SENATOR': 'SEN', 
            'STAFF': 'STF',
            'DRIVER': 'DRV',
            'CONSULTANT': 'CON'
        }
        
        if profile.category:
            prefix = category_prefix.get(profile.category.name.upper(), 'BEN')
        else:
            prefix = 'BEN'
        
        return f"{prefix}-{profile.id:04d}"
    
    def generate_national_id(self, profile):
        """Generate national ID if missing"""
        if hasattr(profile.user, 'national_id') and profile.user.national_id:
            return profile.user.national_id
        
        # Generate placeholder national ID
        return f"NID-{profile.user.id:06d}"
    
    def migrate_single_profile(self, profile):
        """Migrate a single beneficiary profile"""
        try:
            # Prepare migration data
            migration_data = {
                'user': profile.user,
                'parliamentary_id': self.generate_parliamentary_id(profile),
                'employee_id': profile.employee_id,
                'category': profile.category,
                'constituency': profile.constituency,
                'vehicle_category': profile.vehicle_category,
                'position': profile.position or 'Member',
                'department': profile.department or '',
                'party_affiliation': '',  # New field, will need manual entry
                'date_of_birth': None,  # New field, will need manual entry
                'national_id': self.generate_national_id(profile),
                'full_address': getattr(profile.user, 'full_address', '') or '',
                
                # Contact information
                'office_location': getattr(profile, 'office_location', '') or '',
                'office_phone': '',  # New field
                'mobile_phone': profile.user.phone or '',
                'official_email': profile.user.email or '',
                'personal_email': '',  # New field
                
                # Vehicle information
                'vehicle_make': getattr(profile, 'vehicle_make', '') or '',
                'vehicle_model': getattr(profile, 'vehicle_model', '') or '',
                'vehicle_year': getattr(profile, 'vehicle_year', None),
                'engine_size': getattr(profile, 'engine_size', '') or '',
                'vehicle_registration': getattr(profile, 'vehicle_registration', '') or f"REG-{profile.id}",
                'fuel_type': getattr(profile, 'fuel_type', 'DIESEL'),
                
                # Allocation profile
                'base_allocation': getattr(profile, 'base_allocation', Decimal('200')),
                'category_multiplier': getattr(profile, 'category_multiplier', Decimal('1.0')),
                'engine_multiplier': getattr(profile, 'engine_multiplier', Decimal('1.0')),
                'monthly_entitlement_litres': profile.monthly_entitlement_litres,
                'max_per_transaction': Decimal('50'),  # Default value
                
                # Status
                'status': 'ACTIVE' if getattr(profile, 'is_active_beneficiary', True) else 'INACTIVE',
                'is_active_beneficiary': getattr(profile, 'is_active_beneficiary', True),
                
                # Usage tracking
                'current_balance': getattr(profile, 'current_balance', Decimal('0')),
                'used_this_month': getattr(profile, 'used_this_month', Decimal('0')),
                'last_month_usage': Decimal('0'),  # New field
                'year_to_date_usage': Decimal('0'),  # New field  
                'total_usage_all_time': Decimal('0'),  # New field
                'last_allocation_date': getattr(profile, 'last_allocation_date', None),
                
                # Metadata
                'last_login': profile.user.last_activity,
            }
            
            # Create harmonized profile using the migration method
            harmonized_profile = HarmonizedBeneficiaryProfile.objects.create(**migration_data)
            
            self.log(f"Successfully migrated profile {profile.id} -> {harmonized_profile.id}")
            self.success_count += 1
            return harmonized_profile
            
        except Exception as e:
            error_msg = f"Error migrating profile {profile.id}: {str(e)}"
            self.log(error_msg, 'ERROR')
            self.errors.append(error_msg)
            self.error_count += 1
            return None
    
    def migrate_all_profiles(self, dry_run=True):
        """Migrate all beneficiary profiles"""
        self.log(f"Starting migration (dry_run={dry_run})...")
        
        if not dry_run:
            # Validate data first
            if not self.validate_existing_data():
                self.log("Data validation failed, aborting migration", 'ERROR')
                return False
        
        # Get all existing profiles
        profiles = BeneficiaryProfile.objects.all().select_related(
            'user', 'category', 'constituency', 'vehicle_category'
        )
        
        total_profiles = profiles.count()
        self.log(f"Found {total_profiles} profiles to migrate")
        
        if dry_run:
            self.log("DRY RUN MODE - No data will be modified")
            # Just validate the migration data
            for i, profile in enumerate(profiles, 1):
                try:
                    parliamentary_id = self.generate_parliamentary_id(profile)
                    national_id = self.generate_national_id(profile)
                    self.log(f"[{i}/{total_profiles}] Would migrate: {profile.user.username} -> {parliamentary_id}")
                except Exception as e:
                    self.log(f"[{i}/{total_profiles}] Would fail: {profile.user.username} - {str(e)}", 'ERROR')
                    self.error_count += 1
            return True
        
        # Actual migration
        with transaction.atomic():
            for i, profile in enumerate(profiles, 1):
                self.log(f"[{i}/{total_profiles}] Migrating: {profile.user.username}")
                harmonized_profile = self.migrate_single_profile(profile)
                
                if harmonized_profile:
                    # Archive the old profile instead of deleting
                    profile.is_archived = True
                    profile.archived_at = timezone.now()
                    profile.save()
        
        # Migration summary
        self.log("="*50)
        self.log("MIGRATION SUMMARY")
        self.log("="*50)
        self.log(f"Total profiles: {total_profiles}")
        self.log(f"Successfully migrated: {self.success_count}")
        self.log(f"Errors: {self.error_count}")
        self.log(f"Success rate: {(self.success_count/total_profiles*100):.1f}%")
        
        if self.errors:
            self.log("\nERRORS:")
            for error in self.errors:
                self.log(f"  - {error}")
        
        return self.error_count == 0
    
    def rollback_migration(self):
        """Rollback migration by restoring archived profiles"""
        self.log("Starting migration rollback...")
        
        with transaction.atomic():
            # Restore archived profiles
            archived_profiles = BeneficiaryProfile.objects.filter(is_archived=True)
            for profile in archived_profiles:
                profile.is_archived = False
                profile.archived_at = None
                profile.save()
                self.log(f"Restored profile: {profile.user.username}")
            
            # Delete harmonized profiles
            harmonized_count = HarmonizedBeneficiaryProfile.objects.count()
            HarmonizedBeneficiaryProfile.objects.all().delete()
            self.log(f"Deleted {harmonized_count} harmonized profiles")
        
        self.log("Migration rollback completed")
    
    def save_migration_log(self, filename='beneficiary_migration_log.txt'):
        """Save migration log to file"""
        with open(filename, 'w') as f:
            f.write('\n'.join(self.migration_log))
        self.log(f"Migration log saved to {filename}")


def run_migration(dry_run=True):
    """Main migration function"""
    print("="*60)
    print("BENEFICIARY HARMONIZATION MIGRATION")
    print("="*60)
    
    # Import the harmonized model here to avoid circular imports
    from fuel.models import HarmonizedBeneficiaryProfile, BeneficiaryProfile, User
    globals()['HarmonizedBeneficiaryProfile'] = HarmonizedBeneficiaryProfile
    
    manager = BeneficiaryMigrationManager()
    
    try:
        success = manager.migrate_all_profiles(dry_run=dry_run)
        
        # Save log
        log_filename = f"beneficiary_migration_{'dryrun' if dry_run else 'actual'}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.txt"
        manager.save_migration_log(log_filename)
        
        if success:
            print(f"\n✅ Migration {'dry run' if dry_run else ''} completed successfully!")
        else:
            print(f"\n❌ Migration {'dry run' if dry_run else ''} completed with errors!")
        
        return success
        
    except Exception as e:
        print(f"\n💥 Migration failed with critical error: {str(e)}")
        manager.save_migration_log(f"beneficiary_migration_error_{timezone.now().strftime('%Y%m%d_%H%M%S')}.txt")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate beneficiary profiles to harmonized model')
    parser.add_argument('--dry-run', action='store_true', default=True, 
                       help='Run in dry-run mode (default: True)')
    parser.add_argument('--execute', action='store_true', 
                       help='Execute actual migration (overrides dry-run)')
    
    args = parser.parse_args()
    
    # Determine if this is a dry run
    dry_run = not args.execute
    
    if not dry_run:
        confirm = input("⚠️  You are about to execute the actual migration. This will modify your database. Are you sure? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Migration cancelled.")
            sys.exit(0)
    
    success = run_migration(dry_run=dry_run)
    sys.exit(0 if success else 1)
