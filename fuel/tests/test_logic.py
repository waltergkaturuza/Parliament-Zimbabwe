from django.test import TestCase
from .models import Coupon, User

class BusinessLogicTests(TestCase):
    def test_coupon_allocation(self):
        """Test coupon allocation workflow"""
        beneficiary = User.objects.create_user(
            username='beneficiary',
            password='ben123',
            role='BENEFICIARY'
        )
        coupon = Coupon.objects.create(
            coupon_number='6001',
            litres=20.00,
            status='AVAILABLE'
        )
        
        # Allocate coupon
        coupon.allocated_to = beneficiary
        coupon.status = 'ALLOCATED'
        coupon.save()
        
        self.assertEqual(coupon.status, 'ALLOCATED')
        self.assertEqual(coupon.allocated_to, beneficiary)