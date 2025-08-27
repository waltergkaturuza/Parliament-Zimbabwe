# management/commands/generate_coupons.py
from django.core.management.base import BaseCommand
from fuel.models import Box, Book, Coupon
from django.utils import timezone
from datetime import datetime, timedelta
import uuid

class Command(BaseCommand):
    help = 'Generate coupons for boxes and books'

    def add_arguments(self, parser):
        parser.add_argument(
            '--boxes',
            type=int,
            default=1,
            help='Number of boxes to create'
        )
        parser.add_argument(
            '--books-per-box',
            type=int,
            default=100,
            help='Number of books per box'
        )
        parser.add_argument(
            '--coupons-per-book',
            type=int,
            default=200,
            help='Number of coupons per book'
        )
        parser.add_argument(
            '--litres-per-coupon',
            type=int,
            default=20,
            help='Litres per coupon'
        )
        parser.add_argument(
            '--expiry-months',
            type=int,
            default=12,
            help='Months until coupon expiry'
        )

    def handle(self, *args, **options):
        boxes_count = options['boxes']
        books_per_box = options['books_per_box']
        coupons_per_book = options['coupons_per_book']
        litres_per_coupon = options['litres_per_coupon']
        expiry_months = options['expiry_months']
        
        expiry_date = timezone.now().date() + timedelta(days=30 * expiry_months)
        
        self.stdout.write(f'Generating {boxes_count} boxes with {books_per_box} books each...')
        self.stdout.write(f'Each book will have {coupons_per_book} coupons of {litres_per_coupon}L each')
        self.stdout.write(f'Coupons will expire on: {expiry_date}')
        
        total_coupons = 0
        current_year = datetime.now().year
        
        # Get the last coupon number to continue sequence
        last_coupon = Coupon.objects.order_by('-id').first()
        if last_coupon:
            # Extract number from last coupon number
            import re
            match = re.search(r'(\d+)$', last_coupon.coupon_number)
            last_number = int(match.group(1)) if match else 0
        else:
            last_number = 0
        
        current_coupon_number = last_number + 1
        
        for box_num in range(1, boxes_count + 1):
            # Create box
            first_book_num = (box_num - 1) * books_per_box + 1
            last_book_num = box_num * books_per_box
            
            first_coupon_in_box = current_coupon_number
            last_coupon_in_box = current_coupon_number + (books_per_box * coupons_per_book) - 1
            
            box = Box.objects.create(
                first_coupon_number=f'FC{current_year}{first_coupon_in_box:08d}',
                last_coupon_number=f'FC{current_year}{last_coupon_in_box:08d}',
                total_litres=books_per_box * coupons_per_book * litres_per_coupon,
                received_at=timezone.now()
            )
            
            self.stdout.write(f'Created box: {box.box_code}')
            
            # Create books for this box
            for book_num in range(first_book_num, last_book_num + 1):
                first_coupon_in_book = current_coupon_number
                last_coupon_in_book = current_coupon_number + coupons_per_book - 1
                
                book = Book.objects.create(
                    box=box,
                    book_number=f'BK{current_year}{book_num:06d}',
                    first_coupon_number=f'FC{current_year}{first_coupon_in_book:08d}',
                    last_coupon_number=f'FC{current_year}{last_coupon_in_book:08d}',
                    initial_coupon_count=coupons_per_book
                )
                
                # Create coupons for this book
                coupons_to_create = []
                for coupon_num in range(first_coupon_in_book, last_coupon_in_book + 1):
                    coupon_number = f'FC{current_year}{coupon_num:08d}'
                    
                    coupon = Coupon(
                        book=book,
                        coupon_number=coupon_number,
                        litres=litres_per_coupon,
                        status='AVAILABLE',
                        expiry_date=expiry_date
                    )
                    coupons_to_create.append(coupon)
                
                # Bulk create coupons
                Coupon.objects.bulk_create(coupons_to_create, batch_size=1000)
                total_coupons += len(coupons_to_create)
                current_coupon_number = last_coupon_in_book + 1
                
                if book_num % 10 == 0:
                    self.stdout.write(f'  Created {book_num - first_book_num + 1} books so far...')
            
            self.stdout.write(f'  Completed box {box_num}/{boxes_count}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated {total_coupons} coupons in '
                f'{boxes_count * books_per_box} books across {boxes_count} boxes!'
            )
        )
