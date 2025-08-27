import re
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Book, Coupon

@receiver(post_save, sender=Book)
def create_coupons_from_book(sender, instance, created, **kwargs):
    if created and not Coupon.objects.filter(book=instance).exists():
        # Extract prefix and numeric part from first_coupon_number
        match_from = re.match(r'([A-Z]+\d+[A-Z]+)(\d+)', instance.first_coupon_number)
        match_to = re.match(r'([A-Z]+\d+[A-Z]+)(\d+)', instance.last_coupon_number)

        if not match_from or not match_to:
            return  # Skip if the format is invalid

        prefix_from, start_num_str = match_from.groups()
        prefix_to, end_num_str = match_to.groups()

        if prefix_from != prefix_to:
            return  # Prefix mismatch, don’t process

        start_num = int(start_num_str)
        end_num = int(end_num_str)
        num_length = len(start_num_str)

        for num in range(start_num, end_num + 1):
            coupon_number = f"{prefix_from}{str(num).zfill(num_length)}"
            Coupon.objects.create(
                book=instance,
                coupon_number=coupon_number,
                litres=instance.default_litres,  # configurable in model
                status='AVAILABLE'
            )
