# Azure Remote Django Management Script
# This script runs Django commands against the Azure production environment

import os
import subprocess
import sys
from pathlib import Path

def run_azure_django_command(command_args):
    """Run Django management command against Azure production database"""
    
    # Set production environment
    env = os.environ.copy()
    env['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
    
    # Azure PostgreSQL connection details (from your existing setup)
    env['DATABASE_NAME'] = 'parliament-fuel-postgres'
    env['DATABASE_USER'] = 'parliament_admin'
    env['DATABASE_PASSWORD'] = 'Parliament2024!'
    env['DATABASE_HOST'] = 'parliament-fuel-postgres.postgres.database.azure.com'
    env['DATABASE_PORT'] = '5432'
    
    # Azure App Service settings
    env['SECRET_KEY'] = 'django-insecure-production-key-change-in-azure'
    env['ALLOWED_HOSTS'] = 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net'
    
    # Build the command
    cmd = [sys.executable, 'manage.py'] + command_args
    
    print(f"Running: {' '.join(cmd)}")
    print(f"Environment: DJANGO_SETTINGS_MODULE={env['DJANGO_SETTINGS_MODULE']}")
    print(f"Database: {env['DATABASE_HOST']}/{env['DATABASE_NAME']}")
    print("-" * 50)
    
    # Run the command
    try:
        result = subprocess.run(cmd, env=env, check=True, capture_output=True, text=True)
        print("STDOUT:")
        print(result.stdout)
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}")
        print("STDOUT:")
        print(e.stdout)
        print("STDERR:")
        print(e.stderr)
        return False

def main():
    """Main management interface"""
    
    print("=" * 60)
    print(" AZURE DJANGO REMOTE MANAGEMENT")
    print("=" * 60)
    print()
    
    print("Available commands:")
    print("1. Check database connection")
    print("2. Run migrations")
    print("3. Create superuser")
    print("4. Collect static files")
    print("5. Show migrations status")
    print("6. Custom command")
    print()
    
    choice = input("Select option (1-6): ").strip()
    
    if choice == "1":
        print("\n🔍 Testing database connection...")
        success = run_azure_django_command(['check', '--database', 'default'])
        if success:
            print("✅ Database connection successful!")
        else:
            print("❌ Database connection failed!")
            
    elif choice == "2":
        print("\n🔄 Running migrations...")
        success = run_azure_django_command(['migrate'])
        if success:
            print("✅ Migrations completed successfully!")
        else:
            print("❌ Migrations failed!")
            
    elif choice == "3":
        print("\n👤 Creating superuser...")
        print("Note: You'll be prompted for username, email, and password")
        
        # For interactive superuser creation
        env = os.environ.copy()
        env['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
        env['DATABASE_NAME'] = 'parliament-fuel-postgres'
        env['DATABASE_USER'] = 'parliament_admin'
        env['DATABASE_PASSWORD'] = 'Parliament2024!'
        env['DATABASE_HOST'] = 'parliament-fuel-postgres.postgres.database.azure.com'
        env['DATABASE_PORT'] = '5432'
        env['SECRET_KEY'] = 'django-insecure-production-key-change-in-azure'
        env['ALLOWED_HOSTS'] = 'parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net,parliament-fuel-system.azurewebsites.net'
        
        cmd = [sys.executable, 'manage.py', 'createsuperuser']
        subprocess.run(cmd, env=env)
        
    elif choice == "4":
        print("\n📁 Collecting static files...")
        success = run_azure_django_command(['collectstatic', '--noinput'])
        if success:
            print("✅ Static files collected!")
        else:
            print("❌ Static files collection failed!")
            
    elif choice == "5":
        print("\n📊 Checking migrations status...")
        success = run_azure_django_command(['showmigrations'])
        if success:
            print("✅ Migrations status displayed!")
        else:
            print("❌ Failed to show migrations!")
            
    elif choice == "6":
        command = input("Enter Django command (without 'manage.py'): ").strip()
        if command:
            args = command.split()
            success = run_azure_django_command(args)
            if success:
                print("✅ Command completed!")
            else:
                print("❌ Command failed!")
        else:
            print("No command entered.")
    else:
        print("Invalid choice!")

if __name__ == "__main__":
    # Check if we're in the right directory
    if not Path("manage.py").exists():
        print("❌ Error: manage.py not found. Please run this script from the Django project root.")
        sys.exit(1)
        
    main()
