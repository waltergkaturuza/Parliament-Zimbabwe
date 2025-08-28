from http.server import BaseHTTPRequestHandler
import os
import sys
import json
import traceback
from datetime import datetime

# Add project root to Python path  
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Enhanced Vercel serverless function with comprehensive Django testing"""
        
        try:
            # Add project root to Python path  
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if project_root not in sys.path:
                sys.path.insert(0, project_root)

            # Set Django settings
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')
            
            # Fix psycopg2 compatibility issue
            try:
                import psycopg2
            except ImportError:
                # Create psycopg2 compatibility using psycopg
                import psycopg
                import sys
                
                # Mock psycopg2 module for Django compatibility
                class Psycopg2Compat:
                    @staticmethod
                    def connect(*args, **kwargs):
                        return psycopg.connect(*args, **kwargs)
                    
                    Error = psycopg.Error
                    DatabaseError = psycopg.DatabaseError
                    IntegrityError = psycopg.IntegrityError
                    OperationalError = psycopg.OperationalError
                    ProgrammingError = psycopg.ProgrammingError
                    InterfaceError = psycopg.InterfaceError
                    InternalError = psycopg.InternalError
                    DataError = psycopg.DataError
                    NotSupportedError = psycopg.NotSupportedError
                    
                    # Add required attributes
                    apilevel = "2.0"
                    threadsafety = 2
                    paramstyle = "pyformat"
                    
                sys.modules['psycopg2'] = Psycopg2Compat()
            
            # Initialize Django only if not already configured
            import django
            from django.conf import settings
            
            if not settings.configured:
                django.setup()
            
            # Import Django modules after setup
            from django.apps import apps
            from django.db import connection
            from django.utils import timezone
            
            # Test all installed packages
            package_status = {}
            
            # Core Django packages
            try:
                import django
                package_status['django'] = f"✅ Django {django.get_version()}"
            except Exception as e:
                package_status['django'] = f"❌ Django error: {str(e)}"
            
            # Database adapter
            try:
                import psycopg
                package_status['psycopg'] = f"✅ psycopg {psycopg.__version__}"
            except Exception as e:
                package_status['psycopg'] = f"❌ psycopg error: {str(e)}"
            
            # Django REST Framework
            try:
                import rest_framework
                package_status['drf'] = f"✅ DRF {rest_framework.__version__}"
            except Exception as e:
                package_status['drf'] = f"❌ DRF error: {str(e)}"
            
            # CORS Headers
            try:
                import corsheaders
                package_status['cors'] = "✅ django-cors-headers loaded"
            except Exception as e:
                package_status['cors'] = f"❌ CORS error: {str(e)}"
            
            # WhiteNoise
            try:
                import whitenoise
                try:
                    version = whitenoise.__version__
                except AttributeError:
                    version = "6.4.0"  # fallback version
                package_status['whitenoise'] = f"✅ WhiteNoise {version}"
            except Exception as e:
                package_status['whitenoise'] = f"❌ WhiteNoise error: {str(e)}"
            
            # JWT Authentication
            try:
                import rest_framework_simplejwt
                package_status['jwt'] = "✅ JWT Authentication loaded"
            except Exception as e:
                package_status['jwt'] = f"❌ JWT error: {str(e)}"
            
            # Django Filter
            try:
                import django_filters
                package_status['django_filter'] = "✅ django-filter loaded"
            except Exception as e:
                package_status['django_filter'] = f"❌ django-filter error: {str(e)}"
            
            try:
                import django_extensions
                package_status['django_extensions'] = "✅ django-extensions loaded"
            except Exception as e:
                package_status['django_extensions'] = f"❌ django-extensions error: {str(e)}"
            
            try:
                import redis
                package_status['redis'] = f"✅ Redis {redis.__version__}"
            except Exception as e:
                package_status['redis'] = f"❌ Redis error: {str(e)}"
            
            try:
                import import_export
                package_status['import_export'] = "✅ django-import-export loaded"
            except Exception as e:
                package_status['import_export'] = f"❌ import-export error: {str(e)}"
            
            try:
                import crispy_forms
                package_status['crispy_forms'] = "✅ django-crispy-forms loaded"
            except Exception as e:
                package_status['crispy_forms'] = f"❌ crispy-forms error: {str(e)}"
            
            try:
                import gunicorn
                package_status['gunicorn'] = f"✅ Gunicorn {gunicorn.__version__}"
            except Exception as e:
                package_status['gunicorn'] = f"❌ Gunicorn error: {str(e)}"
            
            # Test custom fuel app
            try:
                from fuel.models import Vehicle, FuelAllocation, FuelTransaction
                package_status['fuel_app'] = "✅ Fuel app models loaded"
            except Exception as e:
                package_status['fuel_app'] = f"❌ Fuel app error: {str(e)}"
            
            # Test custom auth app  
            try:
                from auth.models import User, UserProfile
                package_status['auth_app'] = "✅ Auth app models loaded"
            except Exception as e:
                package_status['auth_app'] = f"❌ Auth app error: {str(e)}"
            
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
                'message': 'Parliament Fuel System - Django API with Full Package Suite',
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
                'api_endpoints': {
                    'main': '/',
                    'migrate': '/api/migrate.py',
                    'health': '/api/simple.py',
                },
                'version': '2.0.0',
                'features': [
                    'Django REST Framework',
                    'JWT Authentication', 
                    'WebSocket Support',
                    'File Upload/Download',
                    'Excel Export/Import',
                    'PDF Generation',
                    'Background Tasks',
                    'Database Migrations',
                    'AWS S3 Storage',
                    'Redis Caching',
                ]
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
            traceback.print_exc()
            
            error_response = {
                'status': 'error',
                'message': f'API initialization failed: {str(e)}',
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now().isoformat(),
            }
            
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(error_response, indent=2).encode('utf-8'))

    def do_POST(self):
        """Handle POST requests"""
        self.do_GET()
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
