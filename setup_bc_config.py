#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🛠️ Setup Business Central Configuration
"""

import os
import django
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dynamics_integration.models import BusinessCentralConfig
from datetime import datetime

def setup_business_central_config():
    """Setup Business Central configuration in database"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🛠️ Setting up Business Central Configuration")
    print("=" * 80)
    print(f"Setup Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Create Business Central configuration
        config, created = BusinessCentralConfig.objects.get_or_create(
            name="Parliament Fuel Coupon Integration",
            defaults={
                'description': 'Parliament of Zimbabwe Fuel Coupon System Integration with Microsoft Dynamics 365 Business Central',
                'tenant_id': '086c4475-d0ef-4d2b-871c-4e078a083db5',
                'environment_name': 'Production',
                'environment_type': 'PRODUCTION',
                'base_url': 'https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/Production/ODataV4/',
                'client_id': 'c26c60eb-f154-40eb-b02e-f3997e083316',
                'company_id': 'CRONUS%20International%20Ltd.',
                'auto_sync_enabled': True,
                'batch_size': 100,
                'sync_interval_minutes': 15,
                'fuel_expense_account': '6100',
                'coupon_inventory_account': '1400',
                'cash_account': '1000',
                'is_active': True,
                'connection_status': 'READY'
            }
        )
        
        if created:
            print("✅ Business Central Configuration: CREATED")
        else:
            print("✅ Business Central Configuration: ALREADY EXISTS")
            
        print(f"   📋 Name: {config.name}")
        print(f"   🌐 URL: {config.base_url}")
        print(f"   🏢 Environment: {config.environment_name}")
        print(f"   🔑 Client ID: {config.client_id}")
        print(f"   ✅ Active: {config.is_active}")
        print(f"   🔄 Auto Sync: {config.auto_sync_enabled}")
        
        # Also create default config
        default_config, default_created = BusinessCentralConfig.objects.get_or_create(
            name="default",
            defaults={
                'description': 'Default Business Central Configuration',
                'tenant_id': '086c4475-d0ef-4d2b-871c-4e078a083db5',
                'environment_name': 'Production',
                'environment_type': 'PRODUCTION',
                'base_url': 'https://api.businesscentral.dynamics.com/v2.0/086c4475-d0ef-4d2b-871c-4e078a083db5/Production/ODataV4/',
                'client_id': 'c26c60eb-f154-40eb-b02e-f3997e083316',
                'company_id': 'CRONUS%20International%20Ltd.',
                'auto_sync_enabled': True,
                'batch_size': 100,
                'sync_interval_minutes': 15,
                'fuel_expense_account': '6100',
                'coupon_inventory_account': '1400',
                'cash_account': '1000',
                'is_active': True,
                'connection_status': 'READY'
            }
        )
        
        if default_created:
            print("✅ Default Configuration: CREATED")
        else:
            print("✅ Default Configuration: ALREADY EXISTS")
        
        print("\n" + "=" * 80)
        print("🎯 CONFIGURATION SETUP COMPLETE!")
        print("✅ Business Central configurations are ready")
        print("🚀 You can now test the Django integration")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Setup Failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    setup_business_central_config()
