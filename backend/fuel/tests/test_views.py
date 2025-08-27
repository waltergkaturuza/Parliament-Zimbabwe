from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class CouponAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            password='admin123',
            role='MAIN_CENTER'
        )
        self.officer = User.objects.create_user(
            username='officer',
            password='officer123',
            role='SUB_CENTER'
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_coupon(self):
        """Test creating a coupon (admin only)"""
        url = reverse('coupon-list')
        data = {
            'book': 1,
            'coupon_number': '5001',
            'litres': 20.00,
            'status': 'AVAILABLE'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_unauthorized_access(self):
        """Test non-admin cannot create coupons"""
        self.client.force_authenticate(user=self.officer)
        url = reverse('coupon-list')
        data = {'coupon_number': '5002', 'litres': 20.00}
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)