#!/usr/bin/env python3
"""
Azure Deployment Complete Fix
============================

This script performs a comprehensive fix for the Azure production deployment
to resolve 500 Internal Server Errors.

Usage: python deploy_azure_complete_fix.py
"""

import os
import sys
import subprocess
import logging
import time
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('azure_deployment_fix.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def run_command(command, description, ignore_errors=False):
    """Run a command and log the output"""
    logger.info(f"Running: {description}")
    logger.info(f"Command: {command}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.stdout:
            logger.info(f"STDOUT:\n{result.stdout}")
        if result.stderr:
            logger.warning(f"STDERR:\n{result.stderr}")
            
        if result.returncode != 0 and not ignore_errors:
            logger.error(f"Command failed with return code {result.returncode}")
            return False
        else:
            logger.info(f"Command completed successfully")
            return True
            
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out after 5 minutes")
        return False
    except Exception as e:
        logger.error(f"Error running command: {e}")
        return False

def check_azure_cli():
    """Check if Azure CLI is installed and logged in"""
    logger.info("Checking Azure CLI...")
    
    # Check if Azure CLI is installed
    if not run_command("az --version", "Check Azure CLI version", ignore_errors=True):
        logger.error("Azure CLI is not installed. Please install it first.")
        return False
    
    # Check if logged in
    if not run_command("az account show", "Check Azure login status", ignore_errors=True):
        logger.error("Not logged into Azure. Please run 'az login' first.")
        return False
    
    return True

def deploy_to_azure():
    """Deploy the application to Azure App Service"""
    logger.info("Starting Azure deployment...")
    
    app_name = "parliament-fuel-system"
    resource_group = "parliament-fuel-rg"
    
    # Get current directory
    current_dir = Path.cwd()
    logger.info(f"Deploying from directory: {current_dir}")
    
    # Create deployment package
    logger.info("Creating deployment package...")
    
    # Ensure requirements.txt is up to date
    if not run_command("pip freeze > requirements.txt", "Update requirements.txt"):
        logger.warning("Failed to update requirements.txt")
    
    # Deploy using Azure CLI
    deploy_command = f"""az webapp deploy \
        --resource-group {resource_group} \
        --name {app_name} \
        --src-path . \
        --type zip \
        --async false"""
    
    if not run_command(deploy_command, "Deploy to Azure App Service"):
        logger.error("Deployment failed")
        return False
    
    logger.info("Deployment completed successfully")
    return True

def configure_app_settings():
    """Configure Azure App Service settings"""
    logger.info("Configuring Azure App Service settings...")
    
    app_name = "parliament-fuel-system"
    resource_group = "parliament-fuel-rg"
    
    # App settings to configure
    settings = {
        "DJANGO_SETTINGS_MODULE": "config.settings.production",
        "PYTHONPATH": "/home/site/wwwroot",
        "SCM_DO_BUILD_DURING_DEPLOYMENT": "true",
        "WEBSITE_RUN_FROM_PACKAGE": "0",
        "POST_BUILD_SCRIPT_PATH": "startup.sh",
    }
    
    for key, value in settings.items():
        command = f'az webapp config appsettings set --resource-group {resource_group} --name {app_name} --settings {key}="{value}"'
        if not run_command(command, f"Set {key} app setting"):
            logger.warning(f"Failed to set {key}")
    
    # Configure startup command
    startup_command = "bash startup.sh"
    command = f'az webapp config set --resource-group {resource_group} --name {app_name} --startup-file "{startup_command}"'
    run_command(command, "Set startup command")

def run_database_migrations():
    """Run database migrations on Azure"""
    logger.info("Running database migrations on Azure...")
    
    app_name = "parliament-fuel-system"
    resource_group = "parliament-fuel-rg"
    
    # Run migrations via Azure CLI
    migration_commands = [
        "python manage.py migrate --settings=config.settings.production",
        "python manage.py collectstatic --noinput --settings=config.settings.production",
        "python manage.py check --settings=config.settings.production"
    ]
    
    for cmd in migration_commands:
        azure_command = f'az webapp ssh --resource-group {resource_group} --name {app_name} --command "{cmd}"'
        run_command(azure_command, f"Run: {cmd}", ignore_errors=True)

def check_deployment_health():
    """Check if the deployment is healthy"""
    logger.info("Checking deployment health...")
    
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # Health check endpoints to test
    endpoints = [
        "/health/",
        "/health/simple/",
        "/",
        "/api/v1/boxes/",
        "/admin/"
    ]
    
    import requests
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            logger.info(f"Testing endpoint: {url}")
            response = requests.get(url, timeout=30)
            logger.info(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                logger.info(f"✅ {endpoint} - OK")
            else:
                logger.warning(f"⚠️ {endpoint} - Status: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ {endpoint} - Error: {e}")

def main():
    """Main deployment function"""
    logger.info("=" * 60)
    logger.info("AZURE DEPLOYMENT COMPLETE FIX")
    logger.info("=" * 60)
    
    try:
        # Check prerequisites
        if not check_azure_cli():
            sys.exit(1)
        
        # Deploy application
        if not deploy_to_azure():
            sys.exit(1)
        
        # Configure app settings
        configure_app_settings()
        
        # Wait for deployment to settle
        logger.info("Waiting for deployment to settle...")
        time.sleep(30)
        
        # Run migrations
        run_database_migrations()
        
        # Wait for migrations to complete
        logger.info("Waiting for migrations to complete...")
        time.sleep(30)
        
        # Check health
        check_deployment_health()
        
        logger.info("=" * 60)
        logger.info("DEPLOYMENT COMPLETE!")
        logger.info("=" * 60)
        logger.info("Check the application at:")
        logger.info("https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net")
        
    except KeyboardInterrupt:
        logger.info("Deployment cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
