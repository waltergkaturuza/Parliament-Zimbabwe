#!/usr/bin/env python3
"""
Azure Production Migration Script
Run this to apply the SystemAlert migration on Azure production
"""

import subprocess
import sys
import os

def run_azure_migration():
    """Apply migration on Azure production"""
    
    print("🚀 Applying SystemAlert Migration on Azure Production...")
    
    # Azure CLI commands to run migration
    commands = [
        # Connect to Azure and run migration
        'az webapp ssh --name parliament-fuel-system-d0bvbjfrdbepdrfh --resource-group DefaultResourceGroup-SAF',
        'cd /home/site/wwwroot',
        'python manage.py migrate --settings=config.settings.production',
    ]
    
    print("\n📋 Commands to run on Azure:")
    for cmd in commands:
        print(f"   {cmd}")
    
    print("\n🔧 Manual Steps:")
    print("1. Open Azure Cloud Shell or Azure CLI")
    print("2. Run: az webapp ssh --name parliament-fuel-system-d0bvbjfrdbepdrfh --resource-group DefaultResourceGroup-SAF")
    print("3. Once in the SSH session, run:")
    print("   cd /home/site/wwwroot")
    print("   python manage.py migrate --settings=config.settings.production")
    print("4. Restart the web app:")
    print("   az webapp restart --name parliament-fuel-system-d0bvbjfrdbepdrfh --resource-group DefaultResourceGroup-SAF")

if __name__ == "__main__":
    run_azure_migration()
