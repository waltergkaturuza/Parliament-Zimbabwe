#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Test each import step by step
try:
    print("1. Testing os import...")
    import os
    print("✓ os imported")
    
    print("2. Testing pathlib...")
    from pathlib import Path
    print("✓ pathlib imported")
    
    print("3. Testing timedelta...")
    from datetime import timedelta
    print("✓ timedelta imported")
    
    print("4. Testing corsheaders...")
    from corsheaders.defaults import default_headers
    print("✓ corsheaders imported")
    
    print("5. Testing dj_database_url...")
    import dj_database_url
    print("✓ dj_database_url imported")
    
    print("6. Testing custom modules...")
    
    # Try importing the settings module in parts
    print("7. Importing settings...")
    exec(open("config/settings.py").read())
    
    print("Settings executed successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
