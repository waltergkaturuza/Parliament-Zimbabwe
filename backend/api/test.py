from http.server import BaseHTTPRequestHandler
import json
import os
import sys

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Add project root to Python path  
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if project_root not in sys.path:
                sys.path.insert(0, project_root)

            # Set Django settings
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')
            
            # Fix pkg_resources issue
            try:
                import pkg_resources
            except ImportError:
                # Mock pkg_resources for compatibility
                import sys
                class MockPkgResources:
                    @staticmethod
                    def get_distribution(name):
                        class MockDistribution:
                            version = "unknown"
                        return MockDistribution()
                sys.modules['pkg_resources'] = MockPkgResources()

            # Initialize Django (only if not already configured)
            import django
            from django.conf import settings
            
            if not settings.configured:
                django.setup()
            
            from django.apps import apps
            from django.db import connection
            from django.utils import timezone
            
            # Test core packages
            package_status = {}
            
            try:
                import django
                package_status['django'] = f"✅ Django {django.get_version()}"
            except Exception as e:
                package_status['django'] = f"❌ Django error: {str(e)}"
            
            try:
                import rest_framework
                package_status['drf'] = f"✅ DRF {rest_framework.__version__}"
            except Exception as e:
                package_status['drf'] = f"❌ DRF error: {str(e)}"
            
            try:
                import corsheaders
                package_status['cors'] = "✅ CORS Headers loaded"
            except Exception as e:
                package_status['cors'] = f"❌ CORS error: {str(e)}"
            
            try:
                import whitenoise
                package_status['whitenoise'] = f"✅ WhiteNoise {whitenoise.__version__}"
            except Exception as e:
                package_status['whitenoise'] = f"❌ WhiteNoise error: {str(e)}"
            
            try:
                import rest_framework_simplejwt
                package_status['jwt'] = "✅ JWT Authentication loaded"
            except Exception as e:
                package_status['jwt'] = f"❌ JWT error: {str(e)}"

            # Test database connectivity
            db_status = "❌ Database not tested"
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT version()")
                    result = cursor.fetchone()
                    if result:
                        db_status = f"✅ Database connected: {result[0][:50]}..."
                    else:
                        db_status = "❌ Database query returned no results"
            except Exception as e:
                db_status = f"❌ Database error: {str(e)}"
            
            # Count successful packages
            successful_packages = len([status for status in package_status.values() if status.startswith('✅')])
            total_packages = len(package_status)
            
            response_data = {
                'message': 'Parliament Fuel System - Django API Fixed',
                'status': 'production_ready',
                'platform': 'vercel',
                'timestamp': timezone.now().isoformat(),
                'package_summary': f'{successful_packages}/{total_packages} packages loaded successfully',
                'database_status': db_status,
                'packages': package_status,
                'django_info': {
                    'version': django.get_version(),
                    'debug': settings.DEBUG,
                    'allowed_hosts': settings.ALLOWED_HOSTS,
                    'database_engine': settings.DATABASES['default']['ENGINE'],
                },
                'version': '2.1.0',
                'pkg_resources_fix': 'applied'
            }
            
            # Send HTTP response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data, indent=2).encode('utf-8'))
            
        except Exception as e:
            print(f"[API ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                'status': 'error',
                'message': f'API initialization failed: {str(e)}',
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc(),
                'timestamp': '2025-08-28'
            }
            
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(error_response, indent=2).encode('utf-8'))

    def do_POST(self):
        self.do_GET()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
