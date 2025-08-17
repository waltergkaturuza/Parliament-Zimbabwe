#!/usr/bin/env python
"""
Production Database Fix Script
Run this script to fix database schema issues in production
"""
import os
import sys
import django

# Add the project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection, transaction
from django.core.management.color import color_style
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
style = color_style()

def check_database_connection():
    """Check if database connection is working"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        logger.info(style.SUCCESS("✓ Database connection successful"))
        return True
    except Exception as e:
        logger.error(style.ERROR(f"✗ Database connection failed: {e}"))
        return False

def check_missing_columns():
    """Check for missing columns that are causing errors"""
    try:
        with connection.cursor() as cursor:
            # Check if category_multiplier column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_beneficiarycategory' 
                AND column_name = 'category_multiplier'
            """)
            result = cursor.fetchone()
            
            if not result:
                logger.warning(style.WARNING("⚠ Missing column: fuel_beneficiarycategory.category_multiplier"))
                return False
            else:
                logger.info(style.SUCCESS("✓ Column fuel_beneficiarycategory.category_multiplier exists"))
                return True
                
    except Exception as e:
        logger.error(style.ERROR(f"✗ Error checking columns: {e}"))
        return False

def run_migrations():
    """Run Django migrations"""
    try:
        logger.info("Running migrations...")
        execute_from_command_line(['manage.py', 'migrate', '--verbosity=2'])
        logger.info(style.SUCCESS("✓ Migrations completed successfully"))
        return True
    except Exception as e:
        logger.error(style.ERROR(f"✗ Migration failed: {e}"))
        return False

def create_migrations():
    """Create new migrations"""
    try:
        logger.info("Creating migrations...")
        execute_from_command_line(['manage.py', 'makemigrations', 'fuel', '--verbosity=2'])
        logger.info(style.SUCCESS("✓ Migrations created successfully"))
        return True
    except Exception as e:
        logger.error(style.ERROR(f"✗ Failed to create migrations: {e}"))
        return False

def main():
    """Main function to run all fixes"""
    logger.info(style.HTTP_INFO("=== Production Database Fix Script ==="))
    
    # Step 1: Check database connection
    if not check_database_connection():
        logger.error(style.ERROR("Cannot proceed without database connection"))
        return False
    
    # Step 2: Check for missing columns
    columns_ok = check_missing_columns()
    
    # Step 3: Create migrations if needed
    if not columns_ok:
        logger.info("Creating migrations to fix missing columns...")
        if not create_migrations():
            return False
    
    # Step 4: Run migrations
    if not run_migrations():
        return False
    
    # Step 5: Final verification
    if check_missing_columns():
        logger.info(style.SUCCESS("🎉 All database issues have been resolved!"))
        return True
    else:
        logger.error(style.ERROR("❌ Some issues remain unresolved"))
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
