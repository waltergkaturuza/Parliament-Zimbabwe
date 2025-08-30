import os
import django
from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

settings_env = os.environ.get('DJANGO_SETTINGS_MODULE') or 'backend.config.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_env)

try:
    django.setup()
except Exception as e:
    print('ERROR: django.setup failed:', e)
    raise

paths = []

def walk(patterns, prefix=''):
    for p in patterns:
        if isinstance(p, URLPattern):
            paths.append(prefix + str(p.pattern))
        elif isinstance(p, URLResolver):
            walk(p.url_patterns, prefix + str(p.pattern))

resolver = get_resolver()
walk(resolver.url_patterns)

for p in sorted([p for p in paths if 'subcenter' in p or 'benefici' in p]):
    print(p)
