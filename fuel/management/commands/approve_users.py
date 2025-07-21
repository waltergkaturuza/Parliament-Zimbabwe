# fuel/management/commands/approve_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Approve users for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Approve a specific user by username',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Approve all pending users',
        )
        parser.add_argument(
            '--superusers',
            action='store_true',
            help='Approve all superusers',
        )

    def handle(self, *args, **options):
        if options['username']:
            # Approve specific user
            try:
                user = User.objects.get(username=options['username'])
                if not user.is_approved:
                    user.is_approved = True
                    user.approved_at = timezone.now()
                    user.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully approved user: {user.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'User {user.username} is already approved')
                    )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with username "{options["username"]}" does not exist')
                )
        
        elif options['superusers']:
            # Approve all superusers
            superusers = User.objects.filter(is_superuser=True, is_approved=False)
            count = superusers.count()
            if count > 0:
                superusers.update(
                    is_approved=True,
                    approved_at=timezone.now()
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully approved {count} superuser(s)')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('No superusers need approval')
                )
        
        elif options['all']:
            # Approve all pending users
            pending_users = User.objects.filter(is_approved=False)
            count = pending_users.count()
            if count > 0:
                pending_users.update(
                    is_approved=True,
                    approved_at=timezone.now()
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully approved {count} user(s)')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('No users need approval')
                )
        
        else:
            # Show pending users
            pending_users = User.objects.filter(is_approved=False)
            if pending_users.exists():
                self.stdout.write('Pending users:')
                for user in pending_users:
                    self.stdout.write(f'  - {user.username} (Role: {user.role}, Superuser: {user.is_superuser})')
                self.stdout.write('\nUse --username <username>, --all, or --superusers to approve users')
            else:
                self.stdout.write(self.style.SUCCESS('No users need approval'))
