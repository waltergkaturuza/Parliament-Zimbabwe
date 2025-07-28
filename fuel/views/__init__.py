# Views package for fuel app
# Import all views from the main views_main.py file to maintain backward compatibility

# Import everything from views_main.py
from ..views_main import *

# Also import CORS test views from cors_test.py
from .cors_test import cors_test, health_check
