from django.http import JsonResponse, HttpResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import io
import sys
from contextlib import redirect_stdout, redirect_stderr

@csrf_exempt
@require_http_methods(["GET", "POST"])
def test_azure_database(request):
    """
    Endpoint to test Azure database connection and create superuser
    """
    try:
        # Capture output from management command
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            call_command('test_azure_db')
        
        stdout_content = stdout_capture.getvalue()
        stderr_content = stderr_capture.getvalue()
        
        # Return as plain text response for easier reading
        response_text = f"STDOUT:\n{stdout_content}\n\nSTDERR:\n{stderr_content}"
        
        return HttpResponse(response_text, content_type='text/plain')
        
    except Exception as e:
        return HttpResponse(f"Error running database test: {str(e)}", 
                          content_type='text/plain', status=500)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Simple health check endpoint"""
    from django.db import connection
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return JsonResponse({"status": "healthy", "database": "connected"})
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=500)
