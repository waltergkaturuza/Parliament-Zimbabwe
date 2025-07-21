# management/commands/generate_monthly_entitlements.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from fuel.models import (
    BeneficiaryProfile, FuelEntitlement, ParliamentSession
)
from datetime import datetime, timedelta
from calendar import monthrange

User = get_user_model()

class Command(BaseCommand):
    help = 'Generate monthly fuel entitlements for all active beneficiaries'

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=int,
            default=datetime.now().month,
            help='Month for entitlements (1-12)'
        )
        parser.add_argument(
            '--year',
            type=int,
            default=datetime.now().year,
            help='Year for entitlements'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating entitlements'
        )

    def handle(self, *args, **options):
        month = options['month']
        year = options['year']
        dry_run = options['dry_run']
        
        if not (1 <= month <= 12):
            self.stdout.write(self.style.ERROR('Month must be between 1 and 12'))
            return
        
        start_date = datetime(year, month, 1).date()
        _, last_day = monthrange(year, month)
        end_date = datetime(year, month, last_day).date()
        
        if dry_run:
            self.stdout.write(f'DRY RUN: Generating entitlements for {start_date} to {end_date}')
        else:
            self.stdout.write(f'Generating entitlements for {start_date} to {end_date}')
        
        # Get all active beneficiary profiles
        profiles = BeneficiaryProfile.objects.filter(
            is_active_beneficiary=True,
            monthly_entitlement_litres__gt=0
        ).select_related('user', 'category')
        
        created_count = 0
        skipped_count = 0
        
        for profile in profiles:
            # Check if entitlement already exists for this period
            existing = FuelEntitlement.objects.filter(
                beneficiary=profile.user,
                entitlement_type='MONTHLY',
                period_start=start_date,
                period_end=end_date
            ).exists()
            
            if existing:
                skipped_count += 1
                if not dry_run:
                    self.stdout.write(f'Skipped {profile.user.username} - entitlement already exists')
                continue
            
            if not dry_run:
                FuelEntitlement.objects.create(
                    beneficiary=profile.user,
                    entitlement_type='MONTHLY',
                    litres_entitled=profile.monthly_entitlement_litres,
                    period_start=start_date,
                    period_end=end_date,
                    notes=f'Monthly entitlement for {profile.category.name}'
                )
            
            created_count += 1
            self.stdout.write(
                f'{"Would create" if dry_run else "Created"} entitlement for {profile.user.username}: '
                f'{profile.monthly_entitlement_litres}L'
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'{"Would create" if dry_run else "Created"} {created_count} entitlements, '
                f'skipped {skipped_count} existing'
            )
        )
