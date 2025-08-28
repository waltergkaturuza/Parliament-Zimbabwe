"""
Simple API views for Parliament Fuel System
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.db import connection
from django.utils import timezone
import json


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def health_check(request):
    """Health check endpoint for Render and monitoring"""
    
    if request.method == "OPTIONS":
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    try:
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
        
        # Test core packages
        package_status = {}
        
        try:
            import django
            package_status['django'] = f"✅ Django {django.get_version()}"
        except Exception as e:
            package_status['django'] = f"❌ Django error: {str(e)}"
        
        try:
            import rest_framework
            package_status['drf'] = f"✅ DRF {rest_framework.__version__}"
        except Exception as e:
            package_status['drf'] = f"❌ DRF error: {str(e)}"
        
        try:
            import psycopg2
            version = getattr(psycopg2, '__version__', 'unknown')
            package_status['psycopg2'] = f"✅ psycopg2 {version}"
        except Exception as e:
            package_status['psycopg2'] = f"❌ psycopg2 error: {str(e)}"
        
        # Data Science Libraries (lighter but powerful)
        try:
            import pandas as pd
            package_status['pandas'] = f"✅ Pandas {pd.__version__}"
        except Exception as e:
            package_status['pandas'] = f"❌ Pandas error: {str(e)}"
        
        try:
            import numpy as np
            package_status['numpy'] = f"✅ NumPy {np.__version__}"
        except Exception as e:
            package_status['numpy'] = f"❌ NumPy error: {str(e)}"
        
        try:
            import matplotlib
            package_status['matplotlib'] = f"✅ Matplotlib {matplotlib.__version__}"
        except Exception as e:
            package_status['matplotlib'] = f"❌ Matplotlib error: {str(e)}"
        
        try:
            import plotly
            package_status['plotly'] = f"✅ Plotly {plotly.__version__}"
        except Exception as e:
            package_status['plotly'] = f"❌ Plotly error: {str(e)}"
        
        # Web & API Libraries
        try:
            import requests
            package_status['requests'] = f"✅ Requests {requests.__version__}"
        except Exception as e:
            package_status['requests'] = f"❌ Requests error: {str(e)}"
        
        try:
            import httpx
            package_status['httpx'] = f"✅ HTTPX {httpx.__version__}"
        except Exception as e:
            package_status['httpx'] = f"❌ HTTPX error: {str(e)}"
        
        try:
            import aiohttp
            package_status['aiohttp'] = f"✅ aiohttp {aiohttp.__version__}"
        except Exception as e:
            package_status['aiohttp'] = f"❌ aiohttp error: {str(e)}"
        
        # Document Processing
        try:
            import reportlab
            package_status['reportlab'] = f"✅ ReportLab {reportlab.Version}"
        except Exception as e:
            package_status['reportlab'] = f"❌ ReportLab error: {str(e)}"
        
        try:
            import openpyxl
            package_status['openpyxl'] = f"✅ OpenPyXL {openpyxl.__version__}"
        except Exception as e:
            package_status['openpyxl'] = f"❌ OpenPyXL error: {str(e)}"
        
        # Count successful packages
        successful_packages = len([status for status in package_status.values() if status.startswith('✅')])
        total_packages = len(package_status)
        
        response_data = {
            'message': 'Parliament Fuel System - Optimized Django API on Render',
            'status': 'production_ready',
            'platform': 'render',
            'timestamp': timezone.now().isoformat(),
            'package_summary': f'{successful_packages}/{total_packages} packages loaded',
            'database_status': db_status,
            'packages': package_status,
            'django_info': {
                'version': django.get_version(),
                'debug': settings.DEBUG,
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'database_engine': settings.DATABASES['default']['ENGINE'],
            },
            'version': '3.1.0-optimized',
            'features': [
                'Django REST Framework',
                'JWT Authentication',
                'PostgreSQL Database',
                'Data Science Suite (Pandas, NumPy, Matplotlib)',
                'Visualization (Plotly)',
                'Document Processing (PDF, Excel, Word)',
                'Advanced HTTP Clients (Requests, HTTPX, aiohttp)',
                'Background Jobs & Celery',
                'Redis Caching',
                'AWS S3 Storage',
                'Email Integration',
                'API Documentation',
                'Testing & Development Tools',
                'Production Monitoring',
                'Async Processing',
                'Security & Authentication',
            ],
            'capabilities': {
                'data_analysis': 'Pandas, NumPy for data manipulation and analysis',
                'visualization': 'Matplotlib, Plotly for charts and interactive plots',
                'web_apis': 'Requests, HTTPX, aiohttp for API integration',
                'document_processing': 'ReportLab, OpenPyXL, python-docx for documents',
                'async_processing': 'Celery, RQ, aiohttp for background tasks',
                'monitoring': 'Sentry, Structlog for production monitoring',
                'development': 'IPython, pytest, Debug Toolbar for development',
                'build_time': 'Optimized for fast builds (~5-8 minutes)',
                'reliability': 'Stable dependency versions, tested compatibility',
            }
        }
        
        response = JsonResponse(response_data, json_dumps_params={'indent': 2})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        
        return response
        
    except Exception as e:
        import traceback
        error_response = {
            'status': 'error',
            'message': f'API initialization failed: {str(e)}',
            'error_type': type(e).__name__,
            'timestamp': timezone.now().isoformat(),
            'traceback': traceback.format_exc(),
        }
        
        response = JsonResponse(error_response, status=500, json_dumps_params={'indent': 2})
        response["Access-Control-Allow-Origin"] = "*"
        return response


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_info(request):
    """API information endpoint"""
    
    api_info = {
        'name': 'Parliament Fuel System API',
        'version': '3.0.0',
        'platform': 'render',
        'endpoints': {
            'health': '/',
            'api_info': '/api/',
            'admin': '/admin/',
        },
        'documentation': 'https://github.com/waltergkaturuza/Parliament-Zimbabwe',
        'features': [
            'RESTful API',
            'JWT Authentication',
            'Database Integration',
            'File Upload/Download',
            'Excel Export/Import',
            'PDF Generation',
        ]
    }
    
    response = JsonResponse(api_info, json_dumps_params={'indent': 2})
    response["Access-Control-Allow-Origin"] = "*"
    return response
