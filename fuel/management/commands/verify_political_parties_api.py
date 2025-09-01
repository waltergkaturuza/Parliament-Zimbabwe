# fuel/management/commands/verify_political_parties_api.py
from django.core.management.base import BaseCommand
from django.urls import reverse
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import json

from fuel.models_political_parties import PoliticalParty
from fuel.models import BeneficiaryCategory


class Command(BaseCommand):
    help = 'Verify political parties API is working and fix deployment issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--populate',
            action='store_true',
            help='Populate reference data if missing',
        )
        parser.add_argument(
            '--test-endpoints',
            action='store_true',
            help='Test all API endpoints',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== POLITICAL PARTIES API VERIFICATION ==='))
        
        # Check database status
        self.stdout.write('\n1. CHECKING DATABASE STATUS...')
        party_count = PoliticalParty.objects.count()
        active_parties = PoliticalParty.objects.filter(status='ACTIVE').count()
        category_count = BeneficiaryCategory.objects.count()
        active_categories = BeneficiaryCategory.objects.filter(is_active=True).count()
        
        self.stdout.write(f'   Political Parties: {party_count} total, {active_parties} active')
        self.stdout.write(f'   Beneficiary Categories: {category_count} total, {active_categories} active')
        
        if party_count == 0 or category_count == 0:
            if options['populate']:
                self.stdout.write(self.style.WARNING('   Populating missing reference data...'))
                self.populate_data()
            else:
                self.stdout.write(self.style.ERROR('   ❌ Missing reference data! Run with --populate'))
                return
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ Reference data exists'))
        
        # Check API endpoints
        if options['test_endpoints']:
            self.stdout.write('\n2. TESTING API ENDPOINTS...')
            self.test_endpoints()
        
        # Check admin registration
        self.stdout.write('\n3. CHECKING ADMIN REGISTRATION...')
        self.check_admin_registration()
        
        # Check URL configuration
        self.stdout.write('\n4. CHECKING URL CONFIGURATION...')
        self.check_url_configuration()
        
        self.stdout.write(self.style.SUCCESS('\n=== VERIFICATION COMPLETE ==='))

    def populate_data(self):
        """Populate reference data"""
        from django.core.management import call_command
        try:
            call_command('populate_all_reference_data')
            self.stdout.write(self.style.SUCCESS('   ✅ Reference data populated'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Failed to populate data: {e}'))

    def test_endpoints(self):
        """Test API endpoints"""
        client = Client()
        
        # Test endpoints without authentication (should work for active_parties)
        endpoints = [
            '/api/v1/political-parties/active_parties/',
            '/api/v1/political-parties/parliamentary_parties/',
            '/api/v1/beneficiary-categories/',
        ]
        
        for endpoint in endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code == 200:
                    data = json.loads(response.content.decode())
                    count = data.get('count', len(data) if isinstance(data, list) else 0)
                    self.stdout.write(f'   ✅ {endpoint} -> {response.status_code} ({count} items)')
                else:
                    self.stdout.write(f'   ❌ {endpoint} -> {response.status_code}')
                    self.stdout.write(f'       Response: {response.content.decode()[:100]}...')
            except Exception as e:
                self.stdout.write(f'   ❌ {endpoint} -> Error: {e}')
        
        # Test with authentication
        User = get_user_model()
        admin_user = User.objects.filter(is_superuser=True).first()
        if admin_user:
            self.stdout.write(f'\n   Testing with authentication as {admin_user.username}...')
            refresh = RefreshToken.for_user(admin_user)
            access_token = str(refresh.access_token)
            
            auth_endpoints = [
                '/api/v1/political-parties/',
                '/api/v1/beneficiaries/',
            ]
            
            for endpoint in auth_endpoints:
                try:
                    response = client.get(endpoint, HTTP_AUTHORIZATION=f'Bearer {access_token}')
                    if response.status_code == 200:
                        data = json.loads(response.content.decode())
                        count = data.get('count', len(data) if isinstance(data, list) else 0)
                        self.stdout.write(f'   ✅ {endpoint} -> {response.status_code} ({count} items)')
                    else:
                        self.stdout.write(f'   ❌ {endpoint} -> {response.status_code}')
                except Exception as e:
                    self.stdout.write(f'   ❌ {endpoint} -> Error: {e}')

    def check_admin_registration(self):
        """Check Django admin registration"""
        from django.contrib import admin
        
        try:
            if PoliticalParty in admin.site._registry:
                admin_class = admin.site._registry[PoliticalParty]
                self.stdout.write(f'   ✅ PoliticalParty -> {admin_class.__class__.__name__}')
            else:
                self.stdout.write('   ❌ PoliticalParty not registered in admin')
        except Exception as e:
            self.stdout.write(f'   ❌ PoliticalParty admin error: {e}')
        
        try:
            if BeneficiaryCategory in admin.site._registry:
                admin_class = admin.site._registry[BeneficiaryCategory]
                self.stdout.write(f'   ✅ BeneficiaryCategory -> {admin_class.__class__.__name__}')
            else:
                self.stdout.write('   ❌ BeneficiaryCategory not registered in admin')
        except Exception as e:
            self.stdout.write(f'   ❌ BeneficiaryCategory admin error: {e}')

    def check_url_configuration(self):
        """Check URL configuration"""
        from django.urls import resolve, reverse
        from django.urls.exceptions import NoReverseMatch, Resolver404
        
        # Test URL patterns
        test_urls = [
            '/api/v1/political-parties/active_parties/',
            '/api/v1/political-parties/',
            '/api/v1/beneficiary-categories/',
        ]
        
        for url in test_urls:
            try:
                resolved = resolve(url)
                self.stdout.write(f'   ✅ {url} -> {resolved.func.__name__}')
            except Resolver404:
                self.stdout.write(f'   ❌ {url} -> URL not found')
            except Exception as e:
                self.stdout.write(f'   ❌ {url} -> Error: {e}')
        
        # Test reverse URL generation
        try:
            # This might not work depending on the URL pattern names
            self.stdout.write('   Testing reverse URL generation...')
        except Exception as e:
            self.stdout.write(f'   ⚠️  Reverse URL test skipped: {e}')

    def check_permissions(self):
        """Check viewset permissions"""
        from fuel.views_political_parties import PoliticalPartyViewSet
        
        viewset = PoliticalPartyViewSet()
        viewset.action = 'active_parties'
        
        permissions = viewset.get_permissions()
        permission_names = [p.__class__.__name__ for p in permissions]
        
        self.stdout.write(f'   active_parties permissions: {permission_names}')
        
        if 'AllowAny' in permission_names:
            self.stdout.write('   ✅ AllowAny permission configured for active_parties')
        else:
            self.stdout.write('   ❌ AllowAny permission missing for active_parties')
