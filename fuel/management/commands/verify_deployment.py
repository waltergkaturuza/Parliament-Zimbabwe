"""
Django management command for post-deployment verification
Usage: python manage.py verify_deployment
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.test import Client
from django.db import connection
from django.contrib.auth import get_user_model
from django.core.cache import cache
import json
import sys
import time
from datetime import datetime


class Command(BaseCommand):
    help = 'Verify deployment health and functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='text',
            choices=['text', 'json'],
            help='Output format (text or json)',
        )
        parser.add_argument(
            '--critical-only',
            action='store_true',
            help='Only run critical tests',
        )

    def handle(self, *args, **options):
        self.format = options['format']
        self.critical_only = options['critical_only']
        self.results = []
        self.start_time = time.time()

        if self.format == 'text':
            self.stdout.write(
                self.style.SUCCESS('🏛️ Parliament Fuel System - Deployment Verification')
            )
            self.stdout.write('=' * 60)

        # Run all verification tests
        self.verify_django_settings()
        self.verify_database()
        self.verify_migrations()
        self.verify_static_files()
        self.verify_cors_configuration()
        self.verify_authentication()
        
        if not self.critical_only:
            self.verify_models()
            self.verify_admin_interface()
            self.verify_api_endpoints()
            self.verify_business_central_config()

        # Generate final report
        self.generate_report()

    def run_test(self, test_name, test_func, critical=False):
        """Run a test and record the result"""
        start = time.time()
        try:
            result = test_func()
            duration = time.time() - start
            
            test_result = {
                'name': test_name,
                'status': 'PASS' if result else 'FAIL',
                'critical': critical,
                'duration': round(duration, 3),
                'message': result if isinstance(result, str) else 'OK',
                'timestamp': datetime.now().isoformat()
            }
            
            if self.format == 'text':
                status_color = self.style.SUCCESS if result else self.style.ERROR
                criticality = ' [CRITICAL]' if critical else ''
                self.stdout.write(
                    f"{status_color('✅' if result else '❌')} {test_name}{criticality} "
                    f"({duration:.3f}s)"
                )
                if isinstance(result, str) and result != 'OK':
                    self.stdout.write(f"   {result}")
                    
        except Exception as e:
            duration = time.time() - start
            test_result = {
                'name': test_name,
                'status': 'ERROR',
                'critical': critical,
                'duration': round(duration, 3),
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
            if self.format == 'text':
                criticality = ' [CRITICAL]' if critical else ''
                self.stdout.write(
                    self.style.ERROR(f"❌ {test_name}{criticality} - ERROR: {e}")
                )

        self.results.append(test_result)
        return test_result['status'] == 'PASS'

    def verify_django_settings(self):
        """Verify Django configuration"""
        def test():
            issues = []
            
            # Check DEBUG setting
            if settings.DEBUG:
                issues.append("DEBUG=True in production")
            
            # Check SECRET_KEY
            if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 20:
                issues.append("SECRET_KEY too short or missing")
            
            # Check ALLOWED_HOSTS
            if not settings.ALLOWED_HOSTS or settings.ALLOWED_HOSTS == ['*']:
                issues.append("ALLOWED_HOSTS not properly configured")
            
            # Check database configuration
            if not settings.DATABASES.get('default'):
                issues.append("Database not configured")
            
            return "OK" if not issues else f"Issues: {', '.join(issues)}"
        
        return self.run_test("Django Settings", test, critical=True)

    def verify_database(self):
        """Verify database connectivity"""
        def test():
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    if result[0] != 1:
                        return False
                
                # Test connection details
                db_config = connection.settings_dict
                return f"Connected to {db_config['ENGINE']} at {db_config['HOST']}"
            except Exception as e:
                return False
        
        return self.run_test("Database Connectivity", test, critical=True)

    def verify_migrations(self):
        """Verify all migrations are applied"""
        def test():
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            if plan:
                return f"Unapplied migrations: {len(plan)}"
            return "All migrations applied"
        
        return self.run_test("Database Migrations", test, critical=True)

    def verify_static_files(self):
        """Verify static files configuration"""
        def test():
            issues = []
            
            if not hasattr(settings, 'STATIC_URL'):
                issues.append("STATIC_URL not configured")
            
            if not hasattr(settings, 'STATIC_ROOT') and not settings.DEBUG:
                issues.append("STATIC_ROOT not configured for production")
            
            return "OK" if not issues else f"Issues: {', '.join(issues)}"
        
        return self.run_test("Static Files Configuration", test)

    def verify_cors_configuration(self):
        """Verify CORS configuration"""
        def test():
            if not hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
                return "CORS_ALLOWED_ORIGINS not configured"
            
            if not settings.CORS_ALLOWED_ORIGINS:
                return "No CORS origins configured"
            
            return f"CORS configured for {len(settings.CORS_ALLOWED_ORIGINS)} origins"
        
        return self.run_test("CORS Configuration", test, critical=True)

    def verify_authentication(self):
        """Verify authentication system"""
        def test():
            User = get_user_model()
            
            # Check if admin user exists
            admin_exists = User.objects.filter(is_superuser=True).exists()
            if not admin_exists:
                return "No admin users found"
            
            # Test authentication middleware
            if 'django.contrib.auth.middleware.AuthenticationMiddleware' not in settings.MIDDLEWARE:
                return "Authentication middleware not installed"
            
            return "Authentication system configured"
        
        return self.run_test("Authentication System", test, critical=True)

    def verify_models(self):
        """Verify model integrity"""
        def test():
            from fuel.models import User, FuelData, Book, Coupon
            
            # Test model creation capability
            issues = []
            
            try:
                # Check if we can query each model
                User.objects.count()
                FuelData.objects.count()
                Book.objects.count()
                Coupon.objects.count()
                
                return "All models accessible"
            except Exception as e:
                return f"Model access error: {e}"
        
        return self.run_test("Model Integrity", test)

    def verify_admin_interface(self):
        """Verify Django admin interface"""
        def test():
            client = Client()
            response = client.get('/admin/')
            
            if response.status_code != 200:
                return f"Admin interface returned {response.status_code}"
            
            return "Admin interface accessible"
        
        return self.run_test("Admin Interface", test)

    def verify_api_endpoints(self):
        """Verify API endpoints"""
        def test():
            client = Client()
            
            endpoints = [
                ('/', 'Root'),
                ('/health/', 'Health'),
                ('/health/simple/', 'Simple Health'),
                ('/api/', 'API Root'),
            ]
            
            issues = []
            for endpoint, name in endpoints:
                try:
                    response = client.get(endpoint)
                    if response.status_code >= 500:
                        issues.append(f"{name} ({response.status_code})")
                except Exception as e:
                    issues.append(f"{name} (error: {e})")
            
            return "All endpoints responding" if not issues else f"Issues: {', '.join(issues)}"
        
        return self.run_test("API Endpoints", test)

    def verify_business_central_config(self):
        """Verify Business Central configuration"""
        def test():
            if not hasattr(settings, 'BUSINESS_CENTRAL_CONFIG'):
                return "Business Central not configured"
            
            config = settings.BUSINESS_CENTRAL_CONFIG
            required_fields = ['tenant_id', 'client_id', 'client_secret', 'environment']
            missing = [field for field in required_fields if not config.get(field)]
            
            if missing:
                return f"Missing BC config: {', '.join(missing)}"
            
            return "Business Central configured"
        
        return self.run_test("Business Central Configuration", test)

    def generate_report(self):
        """Generate final verification report"""
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.results if r['status'] in ['FAIL', 'ERROR']])
        critical_failures = len([r for r in self.results if r['status'] in ['FAIL', 'ERROR'] and r['critical']])
        
        total_time = time.time() - self.start_time

        if self.format == 'json':
            report = {
                'summary': {
                    'total_tests': total_tests,
                    'passed': passed_tests,
                    'failed': failed_tests,
                    'critical_failures': critical_failures,
                    'duration': round(total_time, 3),
                    'timestamp': datetime.now().isoformat(),
                    'overall_status': 'PASS' if critical_failures == 0 else 'FAIL'
                },
                'tests': self.results
            }
            self.stdout.write(json.dumps(report, indent=2))
        else:
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('📊 Verification Summary'))
            self.stdout.write('=' * 60)
            self.stdout.write(f"Total Tests: {total_tests}")
            self.stdout.write(f"Passed: {passed_tests}")
            self.stdout.write(f"Failed: {failed_tests}")
            self.stdout.write(f"Critical Failures: {critical_failures}")
            self.stdout.write(f"Total Time: {total_time:.3f}s")
            
            if critical_failures == 0:
                self.stdout.write(self.style.SUCCESS("\n✅ Deployment verification PASSED"))
                self.stdout.write("All critical systems are functioning correctly.")
            else:
                self.stdout.write(self.style.ERROR(f"\n❌ Deployment verification FAILED"))
                self.stdout.write(f"Found {critical_failures} critical issue(s) that need attention.")

        # Set exit code
        if critical_failures > 0:
            sys.exit(1)
        elif failed_tests > 0:
            sys.exit(2)  # Non-critical failures
        else:
            sys.exit(0)  # All good
