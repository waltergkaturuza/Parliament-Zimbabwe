from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection
import os

class Command(BaseCommand):
    help = 'Test database connectivity and create a superuser for Azure deployment'
    
    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Superuser username', default='admin')
        parser.add_argument('--email', type=str, help='Superuser email', default='admin@parliament.gov.zw')
        parser.add_argument('--password', type=str, help='Superuser password', default='admin123')
    
    def handle(self, *args, **options):
        self.stdout.write("🔍 Testing Azure Database Connection...")
        self.stdout.write("=" * 50)
        
        # Test database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                self.stdout.write(self.style.SUCCESS("✅ Database connection successful!"))
                self.stdout.write(f"Test query result: {result}")
                
                # Show database info
                cursor.execute("SELECT version()")
                version = cursor.fetchone()
                self.stdout.write(f"Database version: {version[0] if version else 'Unknown'}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Database connection failed: {e}"))
            return
        
        # Test user model
        try:
            User = get_user_model()
            user_count = User.objects.count()
            self.stdout.write(self.style.SUCCESS(f"✅ User model accessible! Current user count: {user_count}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ User model test failed: {e}"))
            return
        
        # Create superuser if it doesn't exist
        try:
            User = get_user_model()
            username = options['username']
            email = options['email']
            password = options['password']
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"⚠️ User '{username}' already exists!"))
            else:
                user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password
                )
                self.stdout.write(self.style.SUCCESS(f"✅ Superuser '{username}' created successfully!"))
                self.stdout.write(f"Email: {email}")
                self.stdout.write("You can now log into Django admin.")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Failed to create superuser: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
        
        self.stdout.write("=" * 50)
        self.stdout.write("✅ Azure database test completed!")
