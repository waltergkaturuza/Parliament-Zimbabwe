from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

class AuthTests(APITestCase):
    def test_jwt_auth(self):
        """Test JWT token obtainment"""
        User = get_user_model()
        User.objects.create_user(username='testuser', password='testpass123')
        
        url = reverse('token_obtain_pair')
        data = {'username': 'testuser', 'password': 'testpass123'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)