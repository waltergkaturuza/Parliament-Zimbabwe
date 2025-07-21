from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Book, Coupon
import re

@receiver(post_save, sender=Book)
def create_coupons_from_book(sender, instance, created, **kwargs):
    if created:
        # Extract numeric parts from coupon numbers
        first_num = int(re.search(r'\d+', instance.first_coupon_number).group())
        last_num = int(re.search(r'\d+', instance.last_coupon_number).group())
        
        # Create coupons for all numbers in the range
        for num in range(first_num, last_num + 1):
            coupon_number = instance.first_coupon_number.replace(str(first_num), str(num))
            Coupon.objects.create(
                book=instance,
                coupon_number=coupon_number,
                litres=20.00,  # Default value, can be configured
                status='AVAILABLE'
            )