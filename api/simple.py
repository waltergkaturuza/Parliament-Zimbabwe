from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Try to import Django and other packages
packages_status = {}

try:
    import django
    from django.conf import settings
    packages_status["django"] = f"✅ Django {django.get_version()}"
    
    # Add project to path
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, project_dir)
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')
    
    # Initialize Django
    django.setup()
    
    # Test additional packages
    try:
        import rest_framework
        packages_status["drf"] = "✅ Django REST Framework"
    except ImportError:
        packages_status["drf"] = "❌ DRF not found"
        
    try:
        import corsheaders
        packages_status["cors"] = "✅ CORS Headers"
    except ImportError:
        packages_status["cors"] = "❌ CORS not found"
        
    try:
        import whitenoise
        packages_status["whitenoise"] = "✅ WhiteNoise"
    except ImportError:
        packages_status["whitenoise"] = "❌ WhiteNoise not found"
        
    try:
        import rest_framework_simplejwt
        packages_status["jwt"] = "✅ Simple JWT"
    except ImportError:
        packages_status["jwt"] = "❌ JWT not found"
    
    # Test database connection
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "✅ Database connected"
    except Exception as db_e:
        db_status = f"⚠️ Database error: {str(db_e)[:50]}"
    
    django_status = "✅ Django + Packages loaded successfully"
    
except Exception as e:
    django_status = f"❌ Django error: {str(e)[:50]}"
    db_status = "❌ Database not tested"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "Parliament Fuel System - Django + DRF + More",
            "status": "working",
            "platform": "vercel",
            "django_status": django_status,
            "database_status": db_status,
            "packages": packages_status,
            "version": "1.3.0"
        }
        
        self.wfile.write(json.dumps(response, indent=2).encode())

    def do_POST(self):
        self.do_GET()
