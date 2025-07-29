#!/usr/bin/env python
"""
Minimal test to check SECRET_KEY in production settings
"""
import os
import sys

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🔍 Testing production settings directly...")
print("=" * 50)

try:
    # Import production settings directly
    from config.settings import production
    
    print(f"✅ Production settings imported successfully!")
    print(f"SECRET_KEY length: {len(production.SECRET_KEY)}")
    print(f"SECRET_KEY preview: {production.SECRET_KEY[:10]}...")
    print(f"DATABASES: {production.DATABASES}")
    
except Exception as e:
    print(f"❌ Failed to import production settings: {e}")
    import traceback
    traceback.print_exc()

print("=" * 50)
