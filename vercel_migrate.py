#!/usr/bin/env python
"""
Django Migration Script for Vercel Deployment
Run this after first deployment to set up the database
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')
    
    print("🚀 Starting Vercel Migration Process...")
    
    try:
        django.setup()
        
        # Run migrations
        print("📦 Running database migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        # Collect static files
        print("📂 Collecting static files...")
        execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        
        # Create superuser if needed
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(is_superuser=True).exists():
            print("👤 Creating superuser...")
            User.objects.create_superuser(
                username='admin',
                email='admin@parliament.gov.zw',
                password='TempPassword123!'
            )
            print("✅ Superuser created: admin / TempPassword123!")
        
        print("🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
