from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from fuel.models import Box, Book, Coupon, FuelData
from decimal import Decimal
import re


class Command(BaseCommand):
    help = 'Create a box with books and coupons based on PetroTrade coupon serial format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--first-coupon',
            type=str,
            required=True,
            help='First coupon serial (e.g., PU006H355101)'
        )
        parser.add_argument(
            '--last-coupon',
            type=str,
            required=True,
            help='Last coupon serial (e.g., PU006H355200)'
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
            '--coupons-per-book',
            type=int,
            default=100,
            help='Number of coupons per book (default: 100)'
        )
        parser.add_argument(
            '--create-coupons',
            action='store_true',
            help='Also create individual coupon records'
        )

    def handle(self, *args, **options):
        first_coupon = options['first_coupon'].strip().upper()
        last_coupon = options['last_coupon'].strip().upper()
        fuel_type = options['fuel_type']
        denomination = options['denomination']
        coupons_per_book = options['coupons_per_book']
        create_coupons = options['create_coupons']

        try:
            with transaction.atomic():
                # Validate and parse coupon serials
                first_prefix, first_num = self.parse_coupon_serial(first_coupon)
                last_prefix, last_num = self.parse_coupon_serial(last_coupon)

                if first_prefix != last_prefix:
                    raise CommandError('First and last coupon must have the same prefix')

                # Calculate total coupons
                total_coupons = last_num - first_num + 1
                if total_coupons <= 0:
                    raise CommandError('Last coupon number must be greater than first coupon number')

                # Calculate number of books
                books_count = (total_coupons + coupons_per_book - 1) // coupons_per_book  # Ceiling division

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

                # Generate books with proper serial ranges
                books_created = []
                current_serial = first_num

                for book_number in range(1, books_count + 1):
                    # Calculate book range
                    book_first_serial = current_serial
                    book_last_serial = min(current_serial + coupons_per_book - 1, last_num)
                    
                    book_first_coupon = f"{first_prefix}{book_first_serial:06d}"
                    book_last_coupon = f"{first_prefix}{book_last_serial:06d}"

                    book = Book.objects.create(
                        box=box,
                        book_number=f"Book {book_number:02d}",
                        first_coupon_number=book_first_coupon,
                        last_coupon_number=book_last_coupon,
                        initial_coupon_count=book_last_serial - book_first_serial + 1
                    )
                    books_created.append(book)
                    
                    self.stdout.write(
                        f'  Created {book.book_number}: {book_first_coupon} - {book_last_coupon} ({book.initial_coupon_count} coupons)'
                    )

                    # Create individual coupons if requested
                    if create_coupons:
                        coupons_created = self.create_book_coupons(
                            book, first_prefix, book_first_serial, book_last_serial, 
                            denomination, fuel_type
                        )
                        self.stdout.write(
                            f'    Generated {len(coupons_created)} coupon records'
                        )

                    current_serial = book_last_serial + 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created box {box.box_code} with {len(books_created)} books'
                    )
                )
                
                # Display summary
                self.display_summary(box, books_created, total_coupons, create_coupons)

        except Exception as e:
            raise CommandError(f'Error creating box: {str(e)}')

    def parse_coupon_serial(self, coupon_serial):
        """Parse PetroTrade coupon serial format (e.g., PU006H355101)"""
        # Pattern: Letters + Numbers (last 6 digits are the sequential number)
        match = re.match(r'^([A-Z0-9]+[A-Z])(\d{6})$', coupon_serial)
        if not match:
            raise CommandError(f'Invalid coupon serial format: {coupon_serial}. Expected format like PU006H355101')
        
        prefix = match.group(1)
        number = int(match.group(2))
        return prefix, number

    def create_book_coupons(self, book, prefix, first_serial, last_serial, denomination, fuel_type):
        """Create individual coupon records for a book"""
        coupons = []
        
        for serial_num in range(first_serial, last_serial + 1):
            coupon_serial = f"{prefix}{serial_num:06d}"
            
            coupon = Coupon.objects.create(
                book=book,
                coupon_number=coupon_serial,
                denomination=denomination,
                fuel_type=fuel_type,
                status='AVAILABLE'
            )
            coupons.append(coupon)
        
        return coupons

    def display_summary(self, box, books_created, total_coupons, create_coupons):
        """Display creation summary"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('PETROTRADE COUPON BOX CREATED')
        self.stdout.write('='*50)
        self.stdout.write(f'Box Code: {box.box_code}')
        self.stdout.write(f'Fuel Type: {box.get_fuel_type_display()}')
        self.stdout.write(f'Denomination: {box.denomination}L per coupon')
        self.stdout.write(f'Serial Range: {box.first_coupon_number} - {box.last_coupon_number}')
        self.stdout.write(f'Total Coupons: {total_coupons:,}')
        self.stdout.write(f'Total Litres: {box.total_litres:,}L')
        self.stdout.write(f'Books Created: {len(books_created)}')
        self.stdout.write(f'Coupons per Book: {box.coupons_per_book}')
        
        if create_coupons:
            total_coupon_records = Coupon.objects.filter(book__box=box).count()
            self.stdout.write(f'Individual Coupon Records: {total_coupon_records:,}')

        # Display each book range
        self.stdout.write('\nBOOK BREAKDOWN:')
        self.stdout.write('-' * 50)
        for book in books_created:
            self.stdout.write(f'{book.book_number}: {book.first_coupon_number} - {book.last_coupon_number}')
        
        self.stdout.write('\n✅ Box creation completed successfully!')
