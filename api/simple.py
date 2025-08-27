from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Try to import Django
try:
    import django
    from django.conf import settings
    
    # Add project to path
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, project_dir)
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')
    
    # Initialize Django
    django.setup()
    
    # Test database connection
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "Database connected"
    except Exception as db_e:
        db_status = f"Database error: {str(db_e)}"
    
    django_status = "Django + Database loaded successfully"
    
except Exception as e:
    django_status = f"Django error: {str(e)}"
    db_status = "Database not tested"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "Parliament Fuel System - Django + Database Test",
            "status": "working",
            "platform": "vercel",
            "django_status": django_status,
            "database_status": db_status,
            "version": "1.2.0"
        }
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        self.do_GET()
