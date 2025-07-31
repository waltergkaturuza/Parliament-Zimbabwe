# Simple startup debug script for Azure App Service
import os
import sys
import logging

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def main():
    """Test script to verify Django can start up properly"""
    try:
        logger.info("=== DJANGO STARTUP DEBUG ===")
        
        # Set Django settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production_stable')
        
        logger.info(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Python path: {sys.path}")
        
        # Test Django import
        logger.info("Testing Django import...")
        import django
        logger.info(f"Django version: {django.get_version()}")
        
        # Test settings import
        logger.info("Testing settings import...")
        from django.conf import settings
        logger.info(f"Settings DEBUG: {settings.DEBUG}")
        logger.info(f"Settings ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        
        # Test Django setup
        logger.info("Testing Django setup...")
        django.setup()
        logger.info("Django setup successful!")
        
        # Test database connection
        logger.info("Testing database connection...")
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.info("Database connection successful!")
        
        # Test URL configuration
        logger.info("Testing URL configuration...")
        from django.urls import get_resolver
        resolver = get_resolver()
        logger.info("URL configuration loaded successfully!")
        
        # Test WSGI application
        logger.info("Testing WSGI application...")
        from config.wsgi import application
        logger.info("WSGI application created successfully!")
        
        logger.info("=== ALL TESTS PASSED ===")
        return True
        
    except Exception as e:
        logger.error(f"Django startup failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
