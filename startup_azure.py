#!/usr/bin/env python
"""
Azure startup script in Python to avoid shell script deployment issues
"""
import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='[STARTUP] %(message)s')
logger = logging.getLogger(__name__)

def run_command(cmd, ignore_errors=False):
    """Run a command and log output"""
    logger.info(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            logger.info(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {e}")
        if e.stdout:
            logger.error(f"Stdout: {e.stdout}")
        if e.stderr:
            logger.error(f"Stderr: {e.stderr}")
        if not ignore_errors:
            raise
        return False

def main():
    logger.info("Starting Django application for Azure...")
    
    # Set defaults
    port = os.environ.get('PORT', '8000')
    django_settings = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.production')
    
    logger.info(f"Port: {port}")
    logger.info(f"Django settings: {django_settings}")
    
    # Set environment
    os.environ['PORT'] = port
    os.environ['DJANGO_SETTINGS_MODULE'] = django_settings
    
    # Run migrations and collect static files in production
    if django_settings == 'config.settings.production':
        logger.info("Running migrations...")
        # First try to show migration status
        run_command("python manage.py showmigrations", ignore_errors=True)
        
        # Run migrations without ignoring errors to catch issues
        logger.info("Applying migrations...")
        run_command("python manage.py migrate --noinput")
        
        logger.info("Collecting static files...")
        run_command("python manage.py collectstatic --noinput --clear", ignore_errors=True)
    
    # Start the appropriate server
    try:
        # Try daphne for ASGI/WebSocket support
        import daphne
        logger.info("Starting Daphne for ASGI/WebSocket support...")
        cmd = f"daphne -b 0.0.0.0 -p {port} config.asgi:application"
        os.system(cmd)
    except ImportError:
        try:
            # Try gunicorn
            import gunicorn
            logger.info("Starting Gunicorn...")
            cmd = f"gunicorn config.wsgi:application --bind=0.0.0.0:{port} --workers=2 --timeout=600"
            os.system(cmd)
        except ImportError:
            # Fallback to Django runserver
            logger.info("Using Django runserver...")
            cmd = f"python manage.py runserver 0.0.0.0:{port}"
            os.system(cmd)

if __name__ == "__main__":
    main()
