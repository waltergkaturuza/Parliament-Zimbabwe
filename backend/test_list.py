#!/usr/bin/env python
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from fuel.views_main import BookDispatchViewSet
from fuel.models import User

factory = APIRequestFactory()
user = User.objects.filter(role='MAIN_CENTER').first()
request = factory.get('/api/v1/dispatches/')
force_authenticate(request, user=user)

view = BookDispatchViewSet.as_view({'get': 'list'})
response = view(request)

print('Updated dispatch list:')
for dispatch in response.data['results']:
    print(f"Dispatch {dispatch['dispatchId']}: {dispatch['totalBooks']} books, {dispatch['totalCoupons']} coupons, {dispatch['status']}")