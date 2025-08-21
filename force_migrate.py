#!/usr/bin/env python
"""
Force migration script for Azure - resolves database schema issues
"""
import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='[FORCE-MIGRATE] %(message)s')
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
    logger.info("Force migrating Django database for Azure...")
    
    # Set environment
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
    
    # Check current migrations status
    logger.info("Checking migration status...")
    run_command("python manage.py showmigrations", ignore_errors=True)
    
    # Run specific fuel app migrations
    logger.info("Running fuel app migrations...")
    run_command("python manage.py migrate fuel --fake-initial", ignore_errors=True)
    run_command("python manage.py migrate fuel", ignore_errors=True)
    
    # Run all migrations
    logger.info("Running all migrations...")
    run_command("python manage.py migrate --run-syncdb", ignore_errors=True)
    run_command("python manage.py migrate", ignore_errors=True)
    
    logger.info("Migration process completed!")

if __name__ == "__main__":
    main()
