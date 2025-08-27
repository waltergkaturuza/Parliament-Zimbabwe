import os
import sys
from django.core.wsgi import get_wsgi_application

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.vercel')

# Initialize Django application
application = get_wsgi_application()

# Export for Vercel
app = application
