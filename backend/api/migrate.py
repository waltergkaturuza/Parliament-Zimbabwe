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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """
        Vercel serverless function to run Django migrations
        GET /api/migrate.py - Run migrations and return status
        """
        try:
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
                    # Version info
                    __version__ = "2.9.6"  # Mock version for compatibility
                    
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
                    
                    # PostgreSQL data types compatibility
                    try:
                        Inet = psycopg.types.net.Inet
                    except (AttributeError, ImportError):
                        # Fallback if psycopg doesn't have Inet
                        class Inet:
                            def __init__(self, addr):
                                self.addr = addr
                            def __str__(self):
                                return str(self.addr)
                    
                    # Add required attributes
                    apilevel = "2.0"
                    threadsafety = 2
                    paramstyle = "pyformat"
                    
                    # PostgreSQL specific data types
                    class Inet:
                        """Mock Inet class for PostgreSQL network address types"""
                        def __init__(self, value):
                            self.value = str(value)
                        
                        def __str__(self):
                            return self.value
                        
                        def __repr__(self):
                            return f"Inet('{self.value}')"
                    
                    # Extensions module for Django compatibility
                    class extensions:
                        # Use numeric values for isolation levels (psycopg 3 compatible)
                        ISOLATION_LEVEL_AUTOCOMMIT = 0
                        ISOLATION_LEVEL_READ_COMMITTED = 2
                        ISOLATION_LEVEL_SERIALIZABLE = 4
                        ISOLATION_LEVEL_REPEATABLE_READ = 3
                        ISOLATION_LEVEL_READ_UNCOMMITTED = 1
                        
                        class cursor:
                            pass
                        
                        class connection:
                            pass
                    
                    # Extras module for Django compatibility
                    class extras:
                        @staticmethod
                        def RealDictCursor(*args, **kwargs):
                            return psycopg.extras.RealDictCursor(*args, **kwargs)
                        
                        @staticmethod
                        def NamedTupleCursor(*args, **kwargs):
                            return psycopg.extras.NamedTupleCursor(*args, **kwargs)
                        
                        @staticmethod
                        def DictCursor(*args, **kwargs):
                            return psycopg.extras.DictCursor(*args, **kwargs)
                    
                    # Errorcodes module for Django compatibility
                    class errorcodes:
                        # Common PostgreSQL error codes that Django might use
                        UNIQUE_VIOLATION = '23505'
                        FOREIGN_KEY_VIOLATION = '23503'
                        CHECK_VIOLATION = '23514'
                        NOT_NULL_VIOLATION = '23502'
                        EXCLUSION_VIOLATION = '23P01'
                        INVALID_TEXT_REPRESENTATION = '22P02'
                        NUMERIC_VALUE_OUT_OF_RANGE = '22003'
                        DIVISION_BY_ZERO = '22012'
                        DATETIME_FIELD_OVERFLOW = '22008'
                        INVALID_DATETIME_FORMAT = '22007'
                        CONNECTION_EXCEPTION = '08000'
                        CONNECTION_DOES_NOT_EXIST = '08003'
                        CONNECTION_FAILURE = '08006'
                        SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION = '08001'
                        SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION = '08004'
                
                psycopg2_compat = Psycopg2Compat()
                sys.modules['psycopg2'] = psycopg2_compat
                sys.modules['psycopg2.extensions'] = psycopg2_compat.extensions()
                sys.modules['psycopg2.extras'] = psycopg2_compat.extras()
                sys.modules['psycopg2.errorcodes'] = psycopg2_compat.errorcodes()
                
                # Also add Inet to the main module namespace
                import types
                psycopg2_module = types.ModuleType('psycopg2')
                for attr in dir(psycopg2_compat):
                    if not attr.startswith('_'):
                        setattr(psycopg2_module, attr, getattr(psycopg2_compat, attr))
                sys.modules['psycopg2'] = psycopg2_module

            # Initialize Django (only if not already configured)
            import django
            from django.conf import settings
            
            if not settings.configured:
                django.setup()
            
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
