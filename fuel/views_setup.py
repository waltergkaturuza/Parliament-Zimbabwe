from django.http import JsonResponse, HttpResponse
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
import json

@csrf_exempt
@require_http_methods(["POST"])
def create_superuser_api(request):
    """
    API endpoint to create a superuser for Azure deployment
    Only works if no superuser exists yet for security
    """
    try:
        User = get_user_model()
        
        # Check if any superuser already exists
        if User.objects.filter(is_superuser=True).exists():
            return JsonResponse({
                'error': 'Superuser already exists. Use Django admin to manage users.',
                'status': 'blocked'
            }, status=400)
        
        # Parse request data
        try:
            data = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            data = {}
        
        # Get credentials from request or use defaults
        username = data.get('username', 'admin')
        email = data.get('email', 'admin@parliament.gov.zw')
        password = data.get('password', 'TempPassword123!')
        
        # Create superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        return JsonResponse({
            'message': 'Superuser created successfully!',
            'username': username,
            'email': email,
            'status': 'success',
            'next_steps': [
                'Go to /admin/ to log in',
                'Change the password immediately',
                'Create additional users as needed'
            ]
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Failed to create superuser: {str(e)}',
            'status': 'error'
        }, status=500)


@csrf_exempt  
@require_http_methods(["GET"])
def database_status_api(request):
    """
    Simple API endpoint to check database connectivity and show info
    """
    try:
        User = get_user_model()
        
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            db_version = cursor.fetchone()[0] if cursor.rowcount > 0 else "Unknown"
            
            cursor.execute("SELECT current_database()")
            db_name = cursor.fetchone()[0] if cursor.rowcount > 0 else "Unknown"
        
        # Get user stats
        total_users = User.objects.count()
        superusers = User.objects.filter(is_superuser=True).count()
        
        return JsonResponse({
            'database': {
                'status': 'connected',
                'version': db_version,
                'name': db_name,
                'engine': 'PostgreSQL'
            },
            'users': {
                'total': total_users,
                'superusers': superusers,
                'can_create_superuser': superusers == 0
            },
            'endpoints': {
                'admin': '/admin/',
                'create_superuser': '/api/setup/create-superuser/' if superusers == 0 else None
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'database': {
                'status': 'error',
                'error': str(e)
            }
        }, status=500)
