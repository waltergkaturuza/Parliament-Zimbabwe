from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import SubCenter, Box, Book, Coupon

User = get_user_model()

class ModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testofficer',
            password='testpass123',
            role='SUB_CENTER'
        )
        self.subcenter = SubCenter.objects.create(
            name='Test Center',
            location='Nairobi',
            managed_by=self.user
        )
        self.box = Box.objects.create(
            box_code='BOX-001',
            first_coupon_number='1000',
            last_coupon_number='2000',
            total_litres=5000.00,
            assigned_to=self.subcenter
        )
        self.book = Book.objects.create(
            box=self.box,
            book_number='BK-001',
            first_coupon_number='1000',
            last_coupon_number='1100'
        )

    def test_coupon_creation(self):
        """Test coupon creation and string representation"""
        coupon = Coupon.objects.create(
            book=self.book,
            coupon_number='1001',
            litres=20.00,
            status='AVAILABLE'
        )
        self.assertEqual(str(coupon), "Coupon 1001 (Available)")

    def test_box_allocation(self):
        """Test box allocation to subcenter"""
        self.assertEqual(self.box.assigned_to, self.subcenter)
        self.assertIn(self.box, self.subcenter.boxes.all())