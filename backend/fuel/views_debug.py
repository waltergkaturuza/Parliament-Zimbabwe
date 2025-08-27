from django.http import JsonResponse, HttpResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import io
import sys
from contextlib import redirect_stdout, redirect_stderr
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.recorder import MigrationRecorder
from django.utils.timezone import now

from .models import Box, SubCenter, User  # light-touch model imports for health checks

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
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return JsonResponse({"status": "healthy", "database": "connected"})
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def migrations_status(request):
    """Return applied vs unapplied Django migrations for the default DB."""
    try:
        executor = MigrationExecutor(connection)
        loader = executor.loader
        graph = loader.graph

        # All known migrations in graph
        all_migrations = sorted(list({f"{app}.{name}" for app, name in graph.nodes.keys()}))

        # Applied migrations from recorder
        recorder = MigrationRecorder(connection)
        applied_set = {f"{app}.{name}" for app, name in recorder.applied_migrations()}

        unapplied = [m for m in all_migrations if m not in applied_set]
        applied = [m for m in all_migrations if m in applied_set]

        return JsonResponse({
            "timestamp": now().isoformat(),
            "database": "connected",
            "counts": {
                "applied": len(applied),
                "unapplied": len(unapplied),
                "total_known": len(all_migrations),
            },
            "unapplied": unapplied,
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def model_health_check(request):
    """Attempt simple ORM queries to surface schema errors (e.g., missing columns)."""
    results = {"timestamp": now().isoformat()}
    errors = {}

    try:
        results["box_count"] = Box.objects.count()
        # Fetch only a few fields to minimize load
        results["box_sample"] = list(Box.objects.values("id", "box_code")[:3])
    except Exception as e:
        errors["Box"] = str(e)

    try:
        results["subcenter_count"] = SubCenter.objects.count()
        results["subcenter_sample"] = list(SubCenter.objects.values("id", "code", "name")[:3])
    except Exception as e:
        errors["SubCenter"] = str(e)

    try:
        results["user_count"] = User.objects.count()
        results["user_sample"] = list(User.objects.values("id", "username", "role")[:3])
    except Exception as e:
        errors["User"] = str(e)

    status_code = 200 if not errors else 500
    results["errors"] = errors
    return JsonResponse(results, status=status_code)
