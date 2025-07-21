from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from fuel.models import Box, Book, Coupon, FuelData
from decimal import Decimal
import re


class Command(BaseCommand):
    help = 'Create a box with books and coupons based on first and last coupon numbers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--first-coupon',
            type=str,
            required=True,
            help='First coupon number (e.g., PU00GH355101)'
        )
        parser.add_argument(
            '--last-coupon',
            type=str,
            required=True,
            help='Last coupon number (e.g., PU00GH355200)'
        )
        parser.add_argument(
            '--fuel-type',
            type=str,
            choices=['PETROL', 'DIESEL'],
            default='DIESEL',
            help='Type of fuel (PETROL or DIESEL)'
        )
        parser.add_argument(
            '--denomination',
            type=int,
            choices=[5, 20, 50],
            default=20,
            help='Litres per coupon (5, 20, or 50)'
        )
        parser.add_argument(
            '--books-count',
            type=int,
            default=10,
            help='Number of books in this box'
        )
        parser.add_argument(
            '--create-coupons',
            action='store_true',
            help='Also create individual coupon records'
        )

    def handle(self, *args, **options):
        first_coupon = options['first_coupon']
        last_coupon = options['last_coupon']
        fuel_type = options['fuel_type']
        denomination = options['denomination']
        books_count = options['books_count']
        create_coupons = options['create_coupons']

        try:
            with transaction.atomic():
                # Validate coupon number format
                if not self.validate_coupon_numbers(first_coupon, last_coupon):
                    raise CommandError('Invalid coupon number format')

                # Calculate total coupons
                total_coupons = self.calculate_total_coupons(first_coupon, last_coupon)
                if total_coupons <= 0:
                    raise CommandError('Last coupon number must be greater than first coupon number')

                # Calculate coupons per book
                coupons_per_book = total_coupons // books_count
                if coupons_per_book <= 0:
                    raise CommandError('Invalid books count - results in 0 coupons per book')

                # Create the box
                box = Box.objects.create(
                    fuel_type=fuel_type,
                    denomination=denomination,
                    first_coupon_number=first_coupon,
                    last_coupon_number=last_coupon,
                    number_of_books=books_count,
                    coupons_per_book=coupons_per_book,
                    total_litres=Decimal(str(total_coupons * denomination))
                )

                self.stdout.write(
                    self.style.SUCCESS(f'Created box: {box.box_code}')
                )

                # Generate book ranges
                book_ranges = box.generate_book_ranges()
                
                if not book_ranges:
                    raise CommandError('Failed to generate book ranges')

                # Create books
                books_created = []
                for book_number, book_first, book_last in book_ranges:
                    book = Book.objects.create(
                        box=box,
                        book_number=f"Book {book_number}",
                        first_coupon_number=book_first,
                        last_coupon_number=book_last
                    )
                    books_created.append(book)
                    
                    self.stdout.write(
                        f'  Created {book.book_number}: {book_first} - {book_last}'
                    )

                    # Create individual coupons if requested
                    if create_coupons:
                        coupons = book.generate_coupons()
                        self.stdout.write(
                            f'    Generated {len(coupons)} coupons'
                        )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created box {box.box_code} with {len(books_created)} books'
                    )
                )
                
                # Display summary
                self.stdout.write('\n--- SUMMARY ---')
                self.stdout.write(f'Box Code: {box.box_code}')
                self.stdout.write(f'Fuel Type: {box.get_fuel_type_display()}')
                self.stdout.write(f'Denomination: {box.denomination}L per coupon')
                self.stdout.write(f'Total Coupons: {total_coupons}')
                self.stdout.write(f'Total Litres: {box.total_litres}L')
                self.stdout.write(f'Books: {len(books_created)}')
                self.stdout.write(f'Coupons per Book: {coupons_per_book}')
                
                if create_coupons:
                    total_coupon_records = Coupon.objects.filter(book__box=box).count()
                    self.stdout.write(f'Coupon Records Created: {total_coupon_records}')

        except Exception as e:
            raise CommandError(f'Error creating box: {str(e)}')

    def validate_coupon_numbers(self, first_coupon, last_coupon):
        """Validate that coupon numbers follow the expected format"""
        pattern = r'^[A-Z0-9]+\d+$'
        return re.match(pattern, first_coupon) and re.match(pattern, last_coupon)

    def calculate_total_coupons(self, first_coupon, last_coupon):
        """Calculate total number of coupons between first and last"""
        try:
            first_match = re.search(r'(\d+)$', first_coupon)
            last_match = re.search(r'(\d+)$', last_coupon)
            
            if first_match and last_match:
                first_num = int(first_match.group(1))
                last_num = int(last_match.group(1))
                return last_num - first_num + 1
            return 0
        except (ValueError, AttributeError):
            return 0
