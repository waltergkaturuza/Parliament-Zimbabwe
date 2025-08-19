#!/usr/bin/env python3
"""
Azure Migration Trigger Script for MainCenter Alignment
Automatically runs migrations and validates MainCenter fields
"""
import os
import sys
import subprocess
from datetime import datetime

def run_command(command, description):
    """Run a command and capture output"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout.strip():
                print(f"   Output: {result.stdout.strip()}")
        else:
            print(f"❌ {description} failed")
            print(f"   Error: {result.stderr.strip()}")
            return False
        return True
    except Exception as e:
        print(f"❌ {description} exception: {e}")
        return False

def validate_maincenter_fields():
    """Validate that MainCenter alignment fields exist"""
    print("🔍 Validating MainCenter alignment fields...")
    
    validation_script = """
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, Box

# Validate SubCenter fields
subcenter_fields = [f.name for f in SubCenter._meta.fields]
print(f"SubCenter fields: {subcenter_fields}")

contact_exists = 'contact_number' in subcenter_fields
email_exists = 'email' in subcenter_fields
print(f"✅ contact_number: {contact_exists}")
print(f"✅ email: {email_exists}")

# Validate Box fields
box_fields = [f.name for f in Box._meta.fields]
print(f"Box fields: {box_fields}")

received_exists = 'is_received' in box_fields
print(f"✅ is_received: {received_exists}")

# Summary
if contact_exists and email_exists and received_exists:
    print("🎯 ALL MAINCENTER FIELDS VALIDATED SUCCESSFULLY!")
    exit(0)
else:
    print("❌ SOME MAINCENTER FIELDS MISSING!")
    exit(1)
"""
    
    return run_command(f'python -c "{validation_script}"', "MainCenter field validation")

def main():
    """Main deployment and migration trigger function"""
    print("🚀 AZURE MAINCENTER MIGRATION TRIGGER")
    print("=" * 50)
    print(f"⏰ Started at: {datetime.now().isoformat()}")
    
    # Set Django settings
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    # Migration steps
    steps = [
        ("python manage.py migrate --noinput", "Running Django migrations"),
        ("python manage.py collectstatic --noinput", "Collecting static files"),
    ]
    
    # Execute migration steps
    for command, description in steps:
        if not run_command(command, description):
            print(f"❌ Deployment failed at: {description}")
            sys.exit(1)
    
    # Validate MainCenter fields
    if not validate_maincenter_fields():
        print("❌ MainCenter field validation failed!")
        sys.exit(1)
    
    # Success
    print("\n" + "=" * 50)
    print("✅ AZURE MAINCENTER DEPLOYMENT SUCCESSFUL!")
    print("🎯 All migrations applied and MainCenter fields validated")
    print(f"⏰ Completed at: {datetime.now().isoformat()}")
    print("🚀 MainCenter frontend-backend alignment is now live!")

if __name__ == '__main__':
    main()
