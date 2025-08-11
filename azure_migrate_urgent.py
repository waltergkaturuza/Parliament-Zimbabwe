#!/usr/bin/env python
"""
URGENT: Azure Production Migration Script
Purpose: Apply missing migration 0008_enhance_book_coupon_tracking to production
Issue: ProgrammingError - column fuel_user.digital_signature does not exist
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

def main():
    """Apply urgent migration to Azure production"""
    print("🚨 URGENT: Applying missing migration to Azure production...")
    print("Migration: 0008_enhance_book_coupon_tracking")
    print("Fields being added:")
    print("  - User: digital_signature, profile_picture, full_address, national_id, signature_uploaded_at")
    print("  - Book: book_code, generated_at, generated_by, is_verified, verification_notes, verified_at, verified_by")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_system.settings')
    django.setup()
    
    # Show current migration status
    print("\n📋 Checking current migration status...")
    execute_from_command_line(['manage.py', 'showmigrations', 'fuel'])
    
    # Apply migrations
    print("\n🔄 Applying migrations...")
    execute_from_command_line(['manage.py', 'migrate', 'fuel'])
    
    # Verify migrations applied
    print("\n✅ Verifying migration status...")
    execute_from_command_line(['manage.py', 'showmigrations', 'fuel'])
    
    print("\n🎉 Migration completed successfully!")
    print("✅ Production should now work without digital_signature column errors")

if __name__ == '__main__':
    main()
