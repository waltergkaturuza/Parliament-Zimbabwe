# fuel/management/commands/create_test_user.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from fuel.models import SubCenter

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a test user for development'

    def handle(self, *args, **options):
        # Create a test sub center if it doesn't exist
        sub_center, created = SubCenter.objects.get_or_create(
            name='Test Sub Center',
            defaults={
                'location': 'Test Location',
                'contact_person': 'Test Person',
                'contact_email': 'test@example.com',
                'contact_phone': '+263123456789'
            }
        )
        
        # Create test users for different roles
        test_users = [
            {
                'username': 'admin_user',
                'email': 'admin@test.com',
                'password': 'testpass123',
                'role': 'ADMIN',
                'first_name': 'Admin',
                'last_name': 'User'
            },
            {
                'username': 'main_center_user',
                'email': 'maincenter@test.com',
                'password': 'testpass123',
                'role': 'MAIN_CENTER',
                'first_name': 'Main Center',
                'last_name': 'Officer'
            },
            {
                'username': 'sub_center_user',
                'email': 'subcenter@test.com',
                'password': 'testpass123',
                'role': 'SUB_CENTER',
                'first_name': 'Sub Center',
                'last_name': 'Officer',
                'sub_center': sub_center
            }
        ]
        
        for user_data in test_users:
            username = user_data['username']
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'User {username} already exists')
                continue
                
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                role=user_data['role'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                sub_center=user_data.get('sub_center')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created user: {username} with role {user.role}')
            )
