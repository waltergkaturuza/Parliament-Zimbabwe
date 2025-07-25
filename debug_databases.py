"""
Debug Django settings to find DATABASES issue
"""
import os
import sys

# Add the project to Python path
sys.path.insert(0, 'c:/Users/Administrator/Documents/POZ/fuel_coupon_system')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

def debug_databases():
    """Debug the DATABASES configuration"""
    print("🔍 DEBUGGING DATABASES CONFIGURATION")
    print("=" * 50)
    
    try:
        # Import and examine settings step by step
        print("1. Importing settings module...")
        from config import settings
        
        print("2. Checking if DATABASES exists...")
        if hasattr(settings, 'DATABASES'):
            print(f"✅ DATABASES exists: {type(settings.DATABASES)}")
            print(f"✅ DATABASES keys: {list(settings.DATABASES.keys())}")
            
            if 'default' in settings.DATABASES:
                db_config = settings.DATABASES['default']
                print(f"✅ Default database config:")
                for key, value in db_config.items():
                    if 'PASSWORD' in key.upper():
                        print(f"    {key}: {'*' * len(str(value))}")
                    else:
                        print(f"    {key}: {value}")
            else:
                print("❌ 'default' key missing from DATABASES!")
                print(f"   Available keys: {list(settings.DATABASES.keys())}")
        else:
            print("❌ DATABASES attribute missing from settings!")
        
        print("\n3. Checking environment variables...")
        env_vars = ['DATABASE_URL', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_HOST']
        for var in env_vars:
            value = os.environ.get(var)
            if value:
                if 'PASSWORD' in var:
                    print(f"✅ {var}: {'*' * len(value)}")
                else:
                    print(f"✅ {var}: {value}")
            else:
                print(f"❌ {var}: Not set")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_databases()
