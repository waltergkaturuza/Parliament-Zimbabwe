from django.core.management.base import BaseCommand
from django.utils import timezone
from fuel.models import User, SubCenter, Box, Book, Coupon
from django.contrib.auth.hashers import make_password
import random

class Command(BaseCommand):
    help = "Seed the database with dummy Zimbabwean fuel data."

    def handle(self, *args, **kwargs):
        # Clear previous records
        Coupon.objects.all().delete()
        Book.objects.all().delete()
        Box.objects.all().delete()
        SubCenter.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()

        # === SubCenters ===
        sub_centers = [
            SubCenter.objects.create(code="MTR001", name="Mutare Central", location="Mutare CBD"),
            SubCenter.objects.create(code="GWR002", name="Gweru Depot", location="Gweru Industrial Zone"),
            SubCenter.objects.create(code="CHZ003", name="Chiredzi Hub", location="Chiredzi Fuel Yard"),
        ]

        # === Users ===
        users = [
            User.objects.create_user(username="main_officer", email="main@zimfuel.org", password="zim1234", role="MAIN_CENTER"),
            User.objects.create_user(username="gweru_officer", email="gweru@zimfuel.org", password="zim1234", role="SUB_CENTER", sub_center=sub_centers[1]),
            User.objects.create_user(username="approver", email="approver@zimfuel.org", password="zim1234", role="APPROVER"),
            User.objects.create_user(username="tendai", email="tendai@zimfuel.org", password="zim1234", role="BENEFICIARY", sub_center=sub_centers[0], phone="0772123456"),
            User.objects.create_user(username="nyasha", email="nyasha@zimfuel.org", password="zim1234", role="BENEFICIARY", sub_center=sub_centers[2], phone="0772654321"),
        ]

        # === Boxes, Books, and Coupons ===
        for center in sub_centers:
            serial_counter = 1

            # Create Box
            box_coupons = []
            box = Box.objects.create(
                first_coupon_number="",  # will update later
                last_coupon_number="",   # will update later
                total_litres=0,
                assigned_to=center,
                received_by=random.choice(users[:2])  # MAIN_CENTER or SUB_CENTER
            )

            for book_index in range(5):  # 2 books per box
                coupons = []
                for i in range(20):  # 10 coupons per book
                    coupon_serial = f"{serial_counter:04d}"
                    coupon_number = f"COUP-{center.code}-{coupon_serial}"
                    coupons.append({
                        'serial': serial_counter,
                        'coupon_number': coupon_number,
                        'litres': random.choice([5, 10, 20]),
                        'status': random.choice(['AVAILABLE', 'ALLOCATED', 'USED']),
                        'allocated_to': random.choice(users[3:]) if random.random() < 0.6 else None,
                    })
                    serial_counter += 1

                # Create Book (now box exists)
                book = Book.objects.create(
                    box=box,
                    book_number=f"BOOK-{center.code}-{book_index+1:03d}",
                    first_coupon_number=coupons[0]['coupon_number'],
                    last_coupon_number=coupons[-1]['coupon_number'],
                    is_assigned=True,
                )

                for c in coupons:
                    Coupon.objects.create(
                        book=book,
                        coupon_number=c['coupon_number'],
                        litres=c['litres'],
                        status=c['status'],
                        allocated_to=c['allocated_to'],
                        allocated_date=timezone.now() if c['allocated_to'] else None,
                        used_date=timezone.now() if c['status'] == 'USED' else None,
                    )
                    box_coupons.append(c)

            # Update box with actual first and last coupon numbers
            box.first_coupon_number = box_coupons[0]['coupon_number']
            box.last_coupon_number = box_coupons[-1]['coupon_number']
            box.total_litres = sum(c['litres'] for c in box_coupons)
            box.save()

        self.stdout.write(self.style.SUCCESS("✅ Dummy Zimbabwean fuel coupon data seeded successfully!"))
