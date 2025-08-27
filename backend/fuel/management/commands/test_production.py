from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Test production settings and configuration'

    def handle(self, *args, **options):
        self.stdout.write('🔧 Production Settings Test')
        self.stdout.write('==========================')
        
        # Check settings module
        settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'Not Set')
        self.stdout.write(f'DJANGO_SETTINGS_MODULE: {settings_module}')
        
        if 'production' in settings_module:
            self.stdout.write(self.style.SUCCESS('✅ Production settings active'))
        else:
            self.stdout.write(self.style.ERROR('❌ Production settings NOT active'))
        
        # Check DEBUG
        self.stdout.write(f'DEBUG: {settings.DEBUG}')
        if not settings.DEBUG:
            self.stdout.write(self.style.SUCCESS('✅ DEBUG is False (correct for production)'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ DEBUG is True (should be False in production)'))
        
        # Check ALLOWED_HOSTS
        self.stdout.write(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
        if settings.ALLOWED_HOSTS and len(settings.ALLOWED_HOSTS) > 0:
            self.stdout.write(self.style.SUCCESS('✅ ALLOWED_HOSTS configured'))
        else:
            self.stdout.write(self.style.ERROR('❌ ALLOWED_HOSTS not configured'))
        
        # Check CORS
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        self.stdout.write(f'CORS_ALLOWED_ORIGINS: {len(cors_origins)} origins')
        if cors_origins:
            self.stdout.write(self.style.SUCCESS('✅ CORS origins configured'))
            for origin in cors_origins:
                self.stdout.write(f'  - {origin}')
        else:
            self.stdout.write(self.style.ERROR('❌ CORS origins not configured'))
        
        # Check database
        db_engine = settings.DATABASES['default']['ENGINE']
        db_name = settings.DATABASES['default']['NAME']
        self.stdout.write(f'Database Engine: {db_engine}')
        self.stdout.write(f'Database Name: {db_name}')
        
        if 'postgresql' in db_engine:
            self.stdout.write(self.style.SUCCESS('✅ PostgreSQL database configured'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ Not using PostgreSQL'))
        
        # Check SECRET_KEY
        if settings.SECRET_KEY and len(settings.SECRET_KEY) > 20:
            self.stdout.write(self.style.SUCCESS('✅ SECRET_KEY configured'))
        else:
            self.stdout.write(self.style.ERROR('❌ SECRET_KEY missing or too short'))
        
        # Test database connection
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS('✅ Database connection successful'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Database connection failed: {e}'))
        
        self.stdout.write('')
        self.stdout.write('🎯 Configuration Summary:')
        
        issues = []
        if 'production' not in settings_module:
            issues.append('Production settings not active')
        if settings.DEBUG:
            issues.append('DEBUG is True')
        if not settings.ALLOWED_HOSTS:
            issues.append('ALLOWED_HOSTS not configured')
        if not cors_origins:
            issues.append('CORS not configured')
        
        if issues:
            self.stdout.write(self.style.ERROR(f'❌ Found {len(issues)} issues:'))
            for issue in issues:
                self.stdout.write(f'  - {issue}')
        else:
            self.stdout.write(self.style.SUCCESS('✅ All production settings look good!'))
