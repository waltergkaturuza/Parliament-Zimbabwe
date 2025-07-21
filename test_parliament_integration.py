#!/usr/bin/env python
"""
Parliament of Zimbabwe - Dynamics 365 Integration Test Script
Run this script to verify your Business Central integration setup
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.append(str(project_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dynamics_integration.models import BusinessCentralConfig
from dynamics_integration.services import BusinessCentralAPI


def test_parliament_bc_integration():
    """Test the Parliament of Zimbabwe Business Central integration"""
    
    print("=" * 60)
    print("PARLIAMENT OF ZIMBABWE - DYNAMICS 365 INTEGRATION TEST")
    print("=" * 60)
    print()
    
    # Step 1: Check if configuration exists
    print("1. Checking Business Central Configuration...")
    try:
        config = BusinessCentralConfig.objects.get(name='parliamentzw', is_active=True)
        print(f"✓ Configuration found: {config.name}")
        print(f"  - Environment: {config.environment_name} ({config.environment_type})")
        print(f"  - Tenant ID: {config.tenant_id}")
        print(f"  - Base URL: {config.base_url}")
        print()
    except BusinessCentralConfig.DoesNotExist:
        print("✗ No Parliament BC configuration found!")
        print("  You need to create the configuration first.")
        print("  Run this in Django shell:")
        print()
        print("  from dynamics_integration.models import BusinessCentralConfig")
        print("  config = BusinessCentralConfig.objects.create(")
        print("      name='parliamentzw',")
        print("      tenant_id='086c4475-d0ef-4d2b-871c-4e078a083db5',")
        print("      environment_name='your-environment-name',")
        print("      # ... other settings")
        print("  )")
        return False
    
    # Step 2: Test API initialization
    print("2. Initializing Business Central API...")
    try:
        api = BusinessCentralAPI('parliamentzw')
        print("✓ API client initialized successfully")
        print()
    except Exception as e:
        print(f"✗ API initialization failed: {e}")
        print("  Check your environment variables:")
        print("  - DYNAMICS_CLIENT_SECRET")
        print("  - DYNAMICS_TENANT_ID")
        print("  - DYNAMICS_CLIENT_ID")
        return False
    
    # Step 3: Test authentication
    print("3. Testing Azure AD Authentication...")
    try:
        token = api.get_auth_token()
        if token:
            print("✓ Azure AD authentication successful")
            print(f"  Token length: {len(token)} characters")
            print()
        else:
            print("✗ Authentication failed - no token received")
            return False
    except Exception as e:
        print(f"✗ Authentication error: {e}")
        print("  Check your Azure AD app registration:")
        print("  - Client ID is correct")
        print("  - Client secret is valid")
        print("  - API permissions are granted")
        return False
    
    # Step 4: Test API connectivity
    print("4. Testing Business Central API Connectivity...")
    try:
        success = api.test_connection()
        if success:
            print("✓ Business Central API connection successful")
            print(f"  Connection status: {config.connection_status}")
            print()
        else:
            print("✗ Business Central API connection failed")
            print(f"  Connection status: {config.connection_status}")
            return False
    except Exception as e:
        print(f"✗ API connection error: {e}")
        print("  Check:")
        print("  - Business Central environment is running")
        print("  - Web services are published")
        print("  - Company ID is correct")
        return False
    
    # Step 5: Test basic API calls
    print("5. Testing Basic API Operations...")
    try:
        # Try to get companies
        companies = api._make_request('GET', 'companies')
        print("✓ Company data retrieved successfully")
        
        if 'value' in companies:
            print(f"  Found {len(companies['value'])} companies:")
            for company in companies['value'][:3]:  # Show first 3
                print(f"    - {company.get('displayName', 'Unknown')} (ID: {company.get('id', 'Unknown')[:8]}...)")
        print()
        
    except Exception as e:
        print(f"✗ API operation failed: {e}")
        print("  This might indicate:")
        print("  - Insufficient permissions")
        print("  - Web services not properly configured")
        print("  - Environment/company access issues")
        return False
    
    # Summary
    print("=" * 60)
    print("INTEGRATION TEST RESULTS")
    print("=" * 60)
    print("✓ All tests passed successfully!")
    print()
    print("Your Parliament of Zimbabwe Business Central integration is ready!")
    print()
    print("Next steps:")
    print("1. Test data sync with: python manage.py sync_to_dynamics --sync-type employees --dry-run")
    print("2. Create initial parliament member records")
    print("3. Set up scheduled sync jobs")
    print("4. Configure production environment")
    print()
    
    return True


def create_parliament_test_config():
    """Create a test configuration for Parliament of Zimbabwe"""
    
    print("Creating Parliament of Zimbabwe test configuration...")
    
    # You'll need to update these values with your actual configuration
    config_data = {
        'name': 'parliamentzw',
        'description': 'Parliament of Zimbabwe BC Integration',
        'tenant_id': '086c4475-d0ef-4d2b-871c-4e078a083db5',
        'environment_name': 'parliament-fuel-sandbox',  # Update this
        'environment_type': 'SANDBOX',
        'base_url': 'https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/parliament-fuel-sandbox/ODataV4/',
        'client_id': os.getenv('DYNAMICS_CLIENT_ID', 'your-client-id-here'),
        'company_id': os.getenv('DYNAMICS_COMPANY_ID', 'your-company-id-here'),
        'auto_sync_enabled': True,
        'batch_size': 50,
        'sync_interval_minutes': 15,
        'fuel_expense_account': '6100',
        'coupon_inventory_account': '1400',
        'cash_account': '1000',
        'is_active': True
    }
    
    try:
        config, created = BusinessCentralConfig.objects.get_or_create(
            name='parliamentzw',
            defaults=config_data
        )
        
        if created:
            print(f"✓ Created new configuration: {config.name}")
        else:
            print(f"✓ Configuration already exists: {config.name}")
            # Update with new values
            for key, value in config_data.items():
                setattr(config, key, value)
            config.save()
            print("✓ Updated existing configuration")
        
        return config
        
    except Exception as e:
        print(f"✗ Failed to create configuration: {e}")
        return None


if __name__ == '__main__':
    print()
    
    # Check if we should create test config
    if len(sys.argv) > 1 and sys.argv[1] == '--create-config':
        create_parliament_test_config()
        print("\nConfiguration created. Now run without --create-config to test.")
        sys.exit(0)
    
    # Run the integration test
    success = test_parliament_bc_integration()
    
    if not success:
        print()
        print("To create a test configuration, run:")
        print("python test_parliament_integration.py --create-config")
        sys.exit(1)
    
    sys.exit(0)
