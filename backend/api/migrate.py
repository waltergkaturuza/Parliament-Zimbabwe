"""
Database Migration Endpoint for Vercel Deployment
Handles Django migrations in serverless environment
"""
import os
import sys
import json
from io import StringIO
from django.core.management import execute_from_command_line
from django.http import JsonResponse

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

# Initialize Django
import django
django.setup()

def handler(request):
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
        
        return JsonResponse({
            'status': 'success',
            'message': 'Database migrations completed successfully',
            'applied_migrations': len(applied_migrations),
            'migration_details': applied_migrations,
            'showmigrations_output': showmigrations_output,
            'migrate_output': migrate_output,
            'timestamp': str(django.utils.timezone.now()),
        })
        
    except Exception as e:
        print(f"[MIGRATE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JsonResponse({
            'status': 'error',
            'message': f'Migration failed: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'timestamp': str(django.utils.timezone.now()),
        }, status=500)

# For Vercel compatibility
def application(environ, start_response):
    """WSGI application wrapper"""
    from django.core.wsgi import get_wsgi_application
    django_app = get_wsgi_application()
    return django_app(environ, start_response)
