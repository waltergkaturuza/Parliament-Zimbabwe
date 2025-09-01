#!/usr/bin/env python3
"""
Render Migration Script for Parliament Zimbabwe (Python Version)
This script can be run in the Render shell to manually execute Django migrations
"""

import os
import sys
import subprocess
import datetime
from pathlib import Path

def run_command(command, check=True, capture_output=False):
    """Run a shell command and return the result"""
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            if check and result.returncode != 0:
                print(f"ERROR: Command failed: {command}")
                print(f"Error output: {result.stderr}")
                sys.exit(1)
            return result.stdout.strip()
        else:
            result = subprocess.run(command, shell=True, check=check)
            return result.returncode == 0
    except subprocess.CalledProcessError as e:
        if check:
            print(f"ERROR: Command failed: {command}")
            print(f"Exit code: {e.returncode}")
            sys.exit(1)
        return False

def main():
    print("=" * 50)
    print("Parliament Zimbabwe - Django Migration Script")
    print("=" * 50)
    print(f"Date: {datetime.datetime.now()}")
    print("Environment: Production (Render.com)")
    print()

    # Set environment variables for production
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
    current_pythonpath = os.environ.get('PYTHONPATH', '')
    os.environ['PYTHONPATH'] = f"/opt/render/project/src:{current_pythonpath}"

    # Change to the backend directory
    backend_dir = Path("/opt/render/project/src/backend")
    if backend_dir.exists():
        os.chdir(backend_dir)
        print(f"Current directory: {os.getcwd()}")
    else:
        print("ERROR: Could not find backend directory")
        sys.exit(1)
    print()

    # Check Django installation and version
    print("1. Checking Django installation...")
    try:
        django_version = run_command(
            "python -c \"import django; print(f'Django version: {django.get_version()}')\"",
            capture_output=True
        )
        print(django_version)
        print("✓ Django is available")
    except Exception as e:
        print("ERROR: Django not found or not properly installed")
        print(f"Error: {e}")
        sys.exit(1)
    print()

    # Check database connectivity
    print("2. Checking database connectivity...")
    db_test = run_command("python manage.py dbshell --command=\"SELECT 1;\"", check=False)
    if db_test:
        print("✓ Database connection successful")
    else:
        print("WARNING: Database connection test failed - continuing anyway")
    print()

    # Show current migration status
    print("3. Current migration status:")
    print("-" * 40)
    migrations_output = run_command("python manage.py showmigrations fuel", capture_output=True)
    migration_lines = migrations_output.split('\n')
    
    # Show first 20 and last 10 lines
    for line in migration_lines[:20]:
        print(line)
    if len(migration_lines) > 30:
        print("...")
        for line in migration_lines[-10:]:
            print(line)
    print("-" * 40)
    print()

    # Check for unapplied migrations
    print("4. Checking for unapplied migrations...")
    plan_output = run_command("python manage.py showmigrations --plan", capture_output=True)
    unapplied_count = plan_output.count("[ ]")
    print(f"Number of unapplied migrations: {unapplied_count}")
    print()

    if unapplied_count > 0:
        print("5. Found unapplied migrations. Running migration...")
        print("-" * 40)
        
        # Run migrations with verbose output
        try:
            run_command("python manage.py migrate --verbosity=2")
            print("✓ Migrations completed successfully")
        except Exception as e:
            print()
            print("ERROR: Migration failed!")
            print("-" * 40)
            print("Showing recent migration files for debugging:")
            
            migrations_dir = Path("fuel/migrations")
            if migrations_dir.exists():
                migration_files = sorted(migrations_dir.glob("*.py"), key=lambda x: x.stat().st_mtime)
                for migration_file in migration_files[-10:]:
                    stat = migration_file.stat()
                    mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
                    print(f"{migration_file.name} - {mtime}")
            
            print()
            print("Checking for migration conflicts...")
            conflicts_output = run_command(
                "python manage.py showmigrations fuel | grep -E '(10014|10015|10016|10017|10018)'",
                check=False, capture_output=True
            )
            if conflicts_output:
                print(conflicts_output)
            sys.exit(1)
    else:
        print("5. No unapplied migrations found - database is up to date")

    print()
    print("6. Final migration status check:")
    print("-" * 40)
    final_status = run_command("python manage.py showmigrations fuel", capture_output=True)
    final_lines = final_status.split('\n')
    for line in final_lines[-10:]:
        print(line)
    print("-" * 40)
    print()

    # Verify critical models exist
    print("7. Verifying critical models...")
    model_test_script = """
from fuel.models import PoliticalParty, BeneficiaryProfile, User
print('✓ PoliticalParty model accessible')
print('✓ BeneficiaryProfile model accessible') 
print('✓ User model accessible')
print('All critical models verified successfully')
"""
    try:
        model_output = run_command(f"python -c \"{model_test_script}\"", capture_output=True)
        print(model_output)
    except Exception as e:
        print("ERROR: Model verification failed")
        print(f"Error: {e}")
        sys.exit(1)
    print()

    # Test API endpoint registration
    print("8. Testing API endpoint registration...")
    endpoint_test_script = """
from django.urls import reverse
try:
    url = reverse('politicalparty-list')
    print(f'✓ Political parties API endpoint registered: {url}')
except Exception as e:
    print('ERROR: Political parties API endpoint not registered')
    print(f'Error: {e}')
    exit(1)
"""
    try:
        endpoint_output = run_command(f"python -c \"{endpoint_test_script}\"", capture_output=True)
        print(endpoint_output)
    except Exception as e:
        print("ERROR: API endpoint test failed")
        print(f"Error: {e}")
        sys.exit(1)
    print()

    print("=" * 50)
    print("✓ Migration script completed successfully!")
    print("=" * 50)
    print()
    print("Next steps:")
    print("1. Test API endpoints:")
    print("   - GET /api/v1/political-parties/")
    print("   - GET /api/v1/political-parties/active_parties/")
    print("   - GET /api/v1/political-parties/statistics/")
    print()
    print("2. Access Django Admin:")
    print("   - Navigate to /admin/")
    print("   - Look for 'Political Parties' section")
    print()
    print("3. Monitor application logs for any issues")
    print()
    print(f"Script completed at: {datetime.datetime.now()}")

if __name__ == "__main__":
    main()
