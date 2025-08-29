# backend/fuel/management/commands/check_subcenters.py
from django.core.management.base import BaseCommand
from fuel.models import SubCenter, User

class Command(BaseCommand):
    help = 'Check and create subcenters if needed'

    def handle(self, *args, **options):
        self.stdout.write('Checking SubCenters...')
        
        subcenters = SubCenter.objects.all()
        self.stdout.write(f'Found {subcenters.count()} subcenters:')
        
        for sc in subcenters:
            self.stdout.write(f'  ID: {sc.id}, Name: {sc.name}, Active: {sc.is_active}')
        
        if subcenters.count() == 0:
            self.stdout.write('No subcenters found. Creating test subcenter...')
            
            # Create a test subcenter
            subcenter = SubCenter.objects.create(
                name='Test SubCenter',
                code='TSC001',
                location='Test Location',
                is_active=True
            )
            self.stdout.write(f'Created subcenter: ID {subcenter.id}')
        
        # Check users that can create beneficiaries
        admin_users = User.objects.filter(role__in=['MAIN_CENTER', 'SUB_CENTER', 'ADMIN', 'SUPERUSER'])
        self.stdout.write(f'\nUsers who can create beneficiaries: {admin_users.count()}')
        for user in admin_users:
            self.stdout.write(f'  {user.username} ({user.role})')
