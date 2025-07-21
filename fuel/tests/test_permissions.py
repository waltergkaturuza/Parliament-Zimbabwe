from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class PermissionTests(APITestCase):
    def setUp(self):
        self.main_center = User.objects.create_user(
            username='main',
            password='main123',
            role='MAIN_CENTER'
        )
        self.sub_center = User.objects.create_user(
            username='sub',
            password='sub123',
            role='SUB_CENTER'
        )

    def test_main_center_permissions(self):
        """Test main center officer has correct permissions"""
        self.assertTrue(self.main_center.is_main_center_officer())
        self.assertFalse(self.main_center.is_beneficiary())

    def test_sub_center_permissions(self):
        """Test sub-center officer permissions"""
        self.assertTrue(self.sub_center.is_sub_center_officer())
        self.assertFalse(self.sub_center.is_main_center_officer())