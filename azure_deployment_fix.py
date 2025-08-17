"""
Azure Production Deployment and Database Fix Script
This script addresses the 500 errors by ensuring proper database setup
"""
import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run a command and log the result"""
    logger.info(f"🔄 {description}")
    logger.info(f"   Command: {command}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info(f"✅ {description} - SUCCESS")
            if result.stdout:
                logger.info(f"   Output: {result.stdout[:500]}")
        else:
            logger.error(f"❌ {description} - FAILED")
            logger.error(f"   Error: {result.stderr}")
            logger.error(f"   Output: {result.stdout}")
            
        return result.returncode == 0, result.stdout, result.stderr
        
    except subprocess.TimeoutExpired:
        logger.error(f"⏱️ {description} - TIMEOUT")
        return False, "", "Command timed out"
    except Exception as e:
        logger.error(f"💥 {description} - EXCEPTION: {e}")
        return False, "", str(e)

def main():
    """Main deployment function"""
    logger.info("🚀 Starting Azure Production Deployment Script")
    logger.info("=" * 60)
    
    # Set production settings
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
    
    steps = [
        # 1. Install dependencies
        ("pip install -r requirements.txt --no-cache-dir", 
         "Installing Python dependencies"),
        
        # 2. Test Django import
        ("python -c \"import django; django.setup(); print('Django setup successful')\"", 
         "Testing Django configuration"),
        
        # 3. Create migrations
        ("python manage.py makemigrations --dry-run", 
         "Checking for pending migrations"),
        
        ("python manage.py makemigrations fuel", 
         "Creating fuel app migrations"),
        
        # 4. Show migration status
        ("python manage.py showmigrations", 
         "Showing migration status"),
        
        # 5. Run migrations
        ("python manage.py migrate --run-syncdb", 
         "Running database migrations"),
        
        # 6. Collect static files
        ("python manage.py collectstatic --noinput --clear", 
         "Collecting static files"),
        
        # 7. Test database connection
        ("python manage.py shell -c \"from django.db import connection; connection.ensure_connection(); print('Database connection successful')\"", 
         "Testing database connection"),
        
        # 8. Check for specific issues
        ("python manage.py shell -c \"from fuel.models import BeneficiaryCategory; print(f'BeneficiaryCategory model loaded: {BeneficiaryCategory._meta.fields}')\"", 
         "Testing BeneficiaryCategory model"),
    ]
    
    failed_steps = []
    
    for command, description in steps:
        success, stdout, stderr = run_command(command, description)
        if not success:
            failed_steps.append((description, stderr))
        
        # Don't stop on non-critical failures
        if "static" in description.lower() and not success:
            logger.warning(f"⚠️ Non-critical failure: {description}")
            continue
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 DEPLOYMENT SUMMARY")
    logger.info("=" * 60)
    
    if failed_steps:
        logger.error(f"❌ {len(failed_steps)} steps failed:")
        for desc, error in failed_steps:
            logger.error(f"   - {desc}: {error}")
    else:
        logger.info("✅ All steps completed successfully!")
    
    # Additional diagnostics
    logger.info("\n🔍 RUNNING DIAGNOSTICS")
    logger.info("-" * 40)
    
    diagnostic_commands = [
        ("python manage.py check", "Django system check"),
        ("python manage.py check --deploy", "Django deployment check"),
        ("python -c \"from django.conf import settings; print(f'DEBUG: {settings.DEBUG}'); print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')\"", "Settings verification"),
    ]
    
    for command, description in diagnostic_commands:
        run_command(command, description)
    
    logger.info("\n🎯 SPECIFIC ISSUE CHECKS")
    logger.info("-" * 40)
    
    # Check for the specific column issue
    column_check = """
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_beneficiarycategory' AND column_name = 'category_multiplier'")
        result = cursor.fetchone()
        if result:
            print("✅ category_multiplier column exists")
        else:
            print("❌ category_multiplier column is missing")
except Exception as e:
    print(f"❌ Error checking column: {e}")
"""
    
    run_command(f'python manage.py shell -c "{column_check}"', "Checking for missing columns")
    
    return len(failed_steps) == 0

if __name__ == '__main__':
    success = main()
    
    if success:
        logger.info("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
        logger.info("The application should now be ready to handle requests without 500 errors.")
    else:
        logger.error("\n💥 DEPLOYMENT HAD ISSUES!")
        logger.error("Check the logs above and fix the identified problems.")
    
    sys.exit(0 if success else 1)
