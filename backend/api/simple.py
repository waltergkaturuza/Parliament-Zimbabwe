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
            # Initialize Django
            import django
            django.setup()
            
            from django.conf import settings
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
                package_status['whitenoise'] = f"✅ WhiteNoise {whitenoise.__version__}"
            except Exception as e:
                package_status['whitenoise'] = f"❌ WhiteNoise error: {str(e)}"
            
            # JWT Authentication
            try:
                import rest_framework_simplejwt
                package_status['jwt'] = "✅ JWT Authentication loaded"
            except Exception as e:
                package_status['jwt'] = f"❌ JWT error: {str(e)}"
            
            # Channels (WebSockets)
            try:
                import channels
                package_status['channels'] = f"✅ Channels {channels.__version__}"
            except Exception as e:
                package_status['channels'] = f"❌ Channels error: {str(e)}"
            
            # New packages
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
                import PIL
                package_status['pillow'] = f"✅ Pillow {PIL.__version__}"
            except Exception as e:
                package_status['pillow'] = f"❌ Pillow error: {str(e)}"
            
            try:
                import redis
                package_status['redis'] = f"✅ Redis {redis.__version__}"
            except Exception as e:
                package_status['redis'] = f"❌ Redis error: {str(e)}"
            
            try:
                import celery
                package_status['celery'] = f"✅ Celery {celery.__version__}"
            except Exception as e:
                package_status['celery'] = f"❌ Celery error: {str(e)}"
            
            try:
                import storages
                package_status['storages'] = "✅ django-storages loaded"
            except Exception as e:
                package_status['storages'] = f"❌ django-storages error: {str(e)}"
            
            try:
                import boto3
                package_status['boto3'] = f"✅ boto3 {boto3.__version__}"
            except Exception as e:
                package_status['boto3'] = f"❌ boto3 error: {str(e)}"
            
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
            
            try:
                import openpyxl
                package_status['openpyxl'] = f"✅ openpyxl {openpyxl.__version__}"
            except Exception as e:
                package_status['openpyxl'] = f"❌ openpyxl error: {str(e)}"
            
            try:
                import xlsxwriter
                package_status['xlsxwriter'] = f"✅ xlsxwriter {xlsxwriter.__version__}"
            except Exception as e:
                package_status['xlsxwriter'] = f"❌ xlsxwriter error: {str(e)}"
            
            try:
                import reportlab
                package_status['reportlab'] = f"✅ ReportLab {reportlab.Version}"
            except Exception as e:
                package_status['reportlab'] = f"❌ ReportLab error: {str(e)}"
            
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
