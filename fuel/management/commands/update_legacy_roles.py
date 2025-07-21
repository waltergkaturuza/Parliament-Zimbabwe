# fuel/management/commands/update_legacy_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Update legacy user roles to new role structure'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find users with legacy roles that need updating
        legacy_approvers = User.objects.filter(role='APPROVER')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would update {legacy_approvers.count()} legacy APPROVER users')
            )
            for user in legacy_approvers:
                self.stdout.write(f'  - {user.username} ({user.email})')
            return
        
        with transaction.atomic():
            updated_count = 0
            
            for user in legacy_approvers:
                # Default to MAIN_CENTER_APPROVER, but could be customized based on user's sub_center
                if user.sub_center:
                    new_role = 'SUB_CENTER_APPROVER'
                else:
                    new_role = 'MAIN_CENTER_APPROVER'
                
                user.role = new_role
                user.save()
                updated_count += 1
                
                self.stdout.write(
                    f'Updated {user.username} from APPROVER to {new_role}'
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {updated_count} users')
            )
