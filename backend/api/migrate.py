"""
Database Migration Endpoint for Vercel Deployment
Handles Django migrations in serverless environment
"""
from http.server import BaseHTTPRequestHandler
import os
import sys
import json
from io import StringIO
from django.core.management import execute_from_command_line

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

# Initialize Django
import django
django.setup()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """
        Vercel serverless function to run Django migrations
        GET /api/migrate.py - Run migrations and return status
        """
        try:
            # Capture management command output
            output = StringIO()
            
            # Run migrations
            print("[MIGRATE] Starting database migrations...")
            
            # First, check migration status
            old_stdout = sys.stdout
            sys.stdout = output
            
            try:
                # Show current migration status
                execute_from_command_line(['manage.py', 'showmigrations', '--verbosity=2'])
                showmigrations_output = output.getvalue()
                
                # Reset output buffer
                output = StringIO()
                sys.stdout = output
                
                # Run migrations
                execute_from_command_line(['manage.py', 'migrate', '--verbosity=2'])
                migrate_output = output.getvalue()
                
            finally:
                sys.stdout = old_stdout
            
            # Parse migration results
            migration_lines = migrate_output.split('\n')
            applied_migrations = [line for line in migration_lines if 'Applying' in line]
            
            print(f"[MIGRATE] Applied {len(applied_migrations)} migrations")
            
            response_data = {
                'status': 'success',
                'message': 'Database migrations completed successfully',
                'applied_migrations': len(applied_migrations),
                'migration_details': applied_migrations,
                'showmigrations_output': showmigrations_output,
                'migrate_output': migrate_output,
                'timestamp': str(django.utils.timezone.now()),
            }
            
            # Send HTTP response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data, indent=2).encode('utf-8'))
            
        except Exception as e:
            print(f"[MIGRATE ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                'status': 'error',
                'message': f'Migration failed: {str(e)}',
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc(),
                'timestamp': str(django.utils.timezone.now()),
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
