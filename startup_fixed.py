#!/usr/bin/env python
"""
FIXED Azure startup script - resolves migration and 500 errors
"""
import os
import sys
import subprocess
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='[STARTUP-FIXED] %(message)s')
logger = logging.getLogger(__name__)

def run_command(cmd, ignore_errors=False, capture_output=True):
    """Run a command and log output"""
    logger.info(f"Running: {cmd}")
    try:
        if capture_output:
            result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
            if result.stdout:
                logger.info(f"Output: {result.stdout}")
        else:
            result = subprocess.run(cmd, shell=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {e}")
        if capture_output and hasattr(e, 'stdout') and e.stdout:
            logger.error(f"Stdout: {e.stdout}")
        if capture_output and hasattr(e, 'stderr') and e.stderr:
            logger.error(f"Stderr: {e.stderr}")
        if not ignore_errors:
            raise
        return False

def test_database_connection():
    """Test database connectivity"""
    logger.info("Testing database connection...")
    test_script = """
import django
django.setup()
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    print('✅ Database connection OK')
    exit(0)
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"""
    try:
        result = subprocess.run([sys.executable, '-c', test_script], 
                              capture_output=True, text=True, timeout=30)
        logger.info(result.stdout)
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return False

def ensure_admin_user():
    """Create admin user if it doesn't exist"""
    logger.info("Ensuring admin user exists...")
    admin_script = """
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@parliament.gov.zw', 'Parliament2024!')
        print('✅ Admin user created')
    else:
        print('✅ Admin user already exists')
except Exception as e:
    print(f'❌ Admin user creation failed: {e}')
"""
    run_command(f'python -c "{admin_script}"', ignore_errors=True)

def main():
    logger.info("Starting Parliament Fuel System (FIXED VERSION)...")
    
    # Set environment
    port = os.environ.get('PORT', '8000')
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
    os.environ['PORT'] = port
    
    logger.info(f"Port: {port}")
    logger.info(f"Python version: {sys.version}")
    
    # Install requirements
    logger.info("Installing requirements...")
    run_command("pip install -r requirements.txt", ignore_errors=True)
    
    # Test database connection first
    if not test_database_connection():
        logger.error("Database connection failed - cannot proceed")
        sys.exit(1)
    
    # Show current migration status
    logger.info("Checking migration status...")
    run_command("python manage.py showmigrations fuel", ignore_errors=True)
    
    # Run migrations with verbose output
    logger.info("Running migrations (verbose)...")
    if not run_command("python manage.py migrate --verbosity=2"):
        logger.error("Migrations failed!")
        # Try alternative migration strategies
        logger.info("Trying alternative migration approach...")
        run_command("python manage.py migrate fuel --fake-initial", ignore_errors=True)
        run_command("python manage.py migrate fuel", ignore_errors=True)
        run_command("python manage.py migrate --run-syncdb", ignore_errors=True)
    
    # Collect static files
    logger.info("Collecting static files...")
    run_command("python manage.py collectstatic --noinput", ignore_errors=True)
    
    # Ensure admin user exists
    ensure_admin_user()
    
    # Final migration status check
    logger.info("Final migration status:")
    run_command("python manage.py showmigrations fuel", ignore_errors=True)
    
    # Start server
    logger.info(f"Starting Daphne server on port {port}...")
    try:
        import daphne
        cmd = f"daphne -b 0.0.0.0 -p {port} config.asgi:application"
        logger.info(f"Executing: {cmd}")
        os.system(cmd)
    except ImportError:
        logger.error("Daphne not available, trying Gunicorn...")
        cmd = f"gunicorn config.wsgi:application --bind=0.0.0.0:{port} --workers=2 --timeout=600"
        os.system(cmd)

if __name__ == "__main__":
    main()
