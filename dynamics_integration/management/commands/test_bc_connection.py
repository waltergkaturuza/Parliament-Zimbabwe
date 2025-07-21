"""
Django Management Command: Test Business Central Connection
Tests connectivity and authentication with Microsoft Dynamics 365 Business Central
"""

from django.core.management.base import BaseCommand, CommandError
from dynamics_integration.services import BusinessCentralAPI
from dynamics_integration.models import BusinessCentralConfig


class Command(BaseCommand):
    help = 'Test connection to Microsoft Dynamics 365 Business Central'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--config',
            type=str,
            default='default',
            help='Business Central configuration name to test'
        )
        
        parser.add_argument(
            '--all',
            action='store_true',
            help='Test all active configurations'
        )
        
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed connection information'
        )
    
    def handle(self, *args, **options):
        if options['all']:
            self._test_all_configs(options)
        else:
            self._test_single_config(options['config'], options)
    
    def _test_single_config(self, config_name, options):
        """Test a single configuration"""
        try:
            config = BusinessCentralConfig.objects.get(name=config_name, is_active=True)
        except BusinessCentralConfig.DoesNotExist:
            raise CommandError(f"Configuration '{config_name}' not found or inactive")
        
        self.stdout.write(f"\nTesting connection for: {config.name}")
        self.stdout.write("=" * 50)
        
        if options['detailed']:
            self.stdout.write(f"Environment: {config.environment_name} ({config.environment_type})")
            self.stdout.write(f"Tenant ID: {config.tenant_id}")
            self.stdout.write(f"Base URL: {config.base_url}")
            self.stdout.write(f"Company ID: {config.company_id or 'Default'}")
            self.stdout.write("")
        
        try:
            # Initialize API client
            self.stdout.write("Initializing API client...")
            api = BusinessCentralAPI(config_name)
            
            # Test authentication
            self.stdout.write("Testing authentication...")
            token = api.get_auth_token()
            if token:
                self.stdout.write(self.style.SUCCESS("✓ Authentication successful"))
            else:
                self.stdout.write(self.style.ERROR("✗ Authentication failed"))
                return
            
            # Test API connectivity
            self.stdout.write("Testing API connectivity...")
            success = api.test_connection()
            
            if success:
                self.stdout.write(self.style.SUCCESS("✓ Connection test successful"))
                self.stdout.write(f"Status: {config.connection_status}")
                
                if options['detailed']:
                    # Try to get company information
                    try:
                        companies = api._make_request('GET', 'companies')
                        self.stdout.write(f"\nAvailable companies ({len(companies.get('value', []))}):")
                        for company in companies.get('value', [])[:5]:  # Show first 5
                            self.stdout.write(f"  - {company.get('displayName', 'Unknown')} (ID: {company.get('id', 'Unknown')})")
                    except Exception as e:
                        self.stdout.write(f"Could not retrieve company info: {e}")
                
            else:
                self.stdout.write(self.style.ERROR("✗ Connection test failed"))
                self.stdout.write(f"Status: {config.connection_status}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Connection error: {str(e)}"))
        
        self.stdout.write("")
    
    def _test_all_configs(self, options):
        """Test all active configurations"""
        configs = BusinessCentralConfig.objects.filter(is_active=True)
        
        if not configs.exists():
            self.stdout.write(self.style.WARNING("No active Business Central configurations found"))
            return
        
        self.stdout.write(f"Testing {configs.count()} active configurations...\n")
        
        results = []
        
        for config in configs:
            try:
                api = BusinessCentralAPI(config.name)
                success = api.test_connection()
                results.append({
                    'name': config.name,
                    'status': 'SUCCESS' if success else 'FAILED',
                    'environment': config.environment_type,
                    'last_test': config.last_connection_test
                })
            except Exception as e:
                results.append({
                    'name': config.name,
                    'status': 'ERROR',
                    'error': str(e),
                    'environment': config.environment_type,
                    'last_test': config.last_connection_test
                })
        
        # Display results table
        self.stdout.write("Connection Test Results:")
        self.stdout.write("=" * 60)
        self.stdout.write(f"{'Config Name':<20} {'Environment':<12} {'Status':<10} {'Last Test'}")
        self.stdout.write("-" * 60)
        
        for result in results:
            status_color = self.style.SUCCESS if result['status'] == 'SUCCESS' else self.style.ERROR
            last_test = result.get('last_test')
            last_test_str = last_test.strftime('%Y-%m-%d %H:%M') if last_test else 'Never'
            
            self.stdout.write(
                f"{result['name']:<20} "
                f"{result['environment']:<12} "
                f"{status_color(result['status']):<10} "
                f"{last_test_str}"
            )
        
        # Summary
        successful = sum(1 for r in results if r['status'] == 'SUCCESS')
        total = len(results)
        
        self.stdout.write("")
        if successful == total:
            self.stdout.write(self.style.SUCCESS(f"All {total} configurations tested successfully!"))
        else:
            self.stdout.write(self.style.WARNING(f"{successful}/{total} configurations successful"))
            
            # Show errors for failed configs
            failed = [r for r in results if r['status'] != 'SUCCESS']
            if failed:
                self.stdout.write("\nErrors:")
                for result in failed:
                    if 'error' in result:
                        self.stdout.write(f"  {result['name']}: {result['error']}")
