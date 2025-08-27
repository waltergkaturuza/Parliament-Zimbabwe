"""
Django management command to test admin functionality and fix common issues.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.db import connection
from django.conf import settings
import logging

class Command(BaseCommand):
    help = 'Test Django admin functionality and identify issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix-sessions',
            action='store_true',
            help='Clear old sessions that might cause issues',
        )
        parser.add_argument(
            '--create-superuser',
            action='store_true',
            help='Create a superuser for testing',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Django Admin Diagnostic ==='))
        
        # Test database connectivity
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS('✓ Database connection working'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Database connection failed: {e}'))
            return

        # Check admin apps in INSTALLED_APPS
        required_apps = [
            'django.contrib.admin',
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.messages',
        ]
        
        for app in required_apps:
            if app in settings.INSTALLED_APPS:
                self.stdout.write(self.style.SUCCESS(f'✓ {app} installed'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ {app} missing'))

        # Check middleware
        required_middleware = [
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
        ]
        
        for middleware in required_middleware:
            if middleware in settings.MIDDLEWARE:
                self.stdout.write(self.style.SUCCESS(f'✓ {middleware} enabled'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ {middleware} missing'))

        # Check CSRF settings
        self.stdout.write(f'CSRF_COOKIE_SECURE: {getattr(settings, "CSRF_COOKIE_SECURE", "Not set")}')
        self.stdout.write(f'CSRF_COOKIE_HTTPONLY: {getattr(settings, "CSRF_COOKIE_HTTPONLY", "Not set")}')
        self.stdout.write(f'SESSION_COOKIE_SECURE: {getattr(settings, "SESSION_COOKIE_SECURE", "Not set")}')
        
        # Check admin users
        try:
            admin_users = User.objects.filter(is_superuser=True)
            self.stdout.write(f'Admin users count: {admin_users.count()}')
            for user in admin_users[:3]:  # Show first 3
                self.stdout.write(f'  - {user.username} (active: {user.is_active})')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error checking admin users: {e}'))

        # Clear old sessions if requested
        if options['fix_sessions']:
            try:
                old_sessions = Session.objects.all()
                count = old_sessions.count()
                old_sessions.delete()
                self.stdout.write(self.style.SUCCESS(f'✓ Cleared {count} old sessions'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error clearing sessions: {e}'))

        # Create superuser if requested
        if options['create_superuser']:
            try:
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser(
                        username='admin',
                        email='admin@parliament.gov.zw',
                        password='admin123'
                    )
                    self.stdout.write(self.style.SUCCESS('✓ Created superuser: admin/admin123'))
                else:
                    self.stdout.write(self.style.WARNING('⚠ Superuser "admin" already exists'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error creating superuser: {e}'))

        # Test model operations
        try:
            from fuel.models import Box
            box_count = Box.objects.count()
            self.stdout.write(self.style.SUCCESS(f'✓ Model queries working (Box count: {box_count})'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Model query failed: {e}'))

        self.stdout.write(self.style.SUCCESS('=== Diagnostic Complete ==='))
        self.stdout.write(self.style.WARNING('If admin still fails:'))
        self.stdout.write('1. Check application logs for specific error messages')
        self.stdout.write('2. Verify CSRF_TRUSTED_ORIGINS includes your domain')
        self.stdout.write('3. Ensure SECURE_PROXY_SSL_HEADER is set correctly')
        self.stdout.write('4. Try accessing /admin/ with HTTPS')
