from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from fuel.models import Box, Book, Coupon, FuelData, SerialMovement
from fuel.utils.serial_tracking import SerialRangeTracker, SerialAllocationTracker
from decimal import Decimal
from django.utils import timezone
import re


class Command(BaseCommand):
    help = 'Create a box with books and coupons with comprehensive serial tracking'

    def add_arguments(self, parser):
        parser.add_argument(
            '--first-coupon',
            type=str,
            required=True,
            help='First coupon number (e.g., PU006H1355101)'
        )
        parser.add_argument(
            '--last-coupon',
            type=str,
            required=True,
            help='Last coupon number (e.g., PU006H1355200)'
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
                # Validate coupon number format using new serial tracker
                is_valid, message = SerialRangeTracker.validate_serial_range(first_coupon, last_coupon)
                if not is_valid:
                    raise CommandError(f'Invalid coupon range: {message}')

                # Calculate comprehensive range information
                range_info = SerialRangeTracker.calculate_range_info(first_coupon, last_coupon)
                total_coupons = range_info['total_count']
                
                self.stdout.write(f'Serial Range Analysis:')
                self.stdout.write(f'  Format: {range_info["format"]}')
                self.stdout.write(f'  Prefix: {range_info["prefix"]}')
                self.stdout.write(f'  First Number: {range_info["first_number"]}')
                self.stdout.write(f'  Last Number: {range_info["last_number"]}')
                self.stdout.write(f'  Total Coupons: {total_coupons}')

                # Calculate coupons per book
                coupons_per_book = total_coupons // books_count
                if coupons_per_book <= 0:
                    raise CommandError('Invalid books count - results in 0 coupons per book')

                # Create the box with enhanced serial tracking
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

                # Create serial movement record for box receipt
                SerialMovement.create_movement(
                    movement_type='BOX_RECEIVED',
                    first_serial=first_coupon,
                    last_serial=last_coupon,
                    performed_by=None,
                    movement_date=timezone.now(),
                    notes=f'Box {box.box_code} created via management command'
                )

                # Split serials into books using new utility
                book_ranges = SerialRangeTracker.split_range_into_books(
                    first_coupon, last_coupon, coupons_per_book
                )
                
                if not book_ranges:
                    raise CommandError('Failed to generate book ranges')

                # Create books with serial tracking
                books_created = []
                for book_data in book_ranges:
                    book = Book.objects.create(
                        box=box,
                        book_number=f"Book {book_data['book_number']:02d}",
                        first_coupon_number=book_data['first_serial'],
                        last_coupon_number=book_data['last_serial'],
                        initial_coupon_count=book_data['coupon_count']
                    )
                    books_created.append(book)
                    
                    self.stdout.write(
                        f'  Created {book.book_number}: {book_data["first_serial"]} - {book_data["last_serial"]} ({book_data["coupon_count"]} coupons)'
                    )

                    # Create individual coupons if requested
                    if create_coupons:
                        coupons = self.create_book_coupons_with_tracking(
                            book, book_data, denomination, fuel_type
                        )
                        self.stdout.write(
                            f'    Generated {len(coupons)} coupon records'
                        )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created box {box.box_code} with {len(books_created)} books'
                    )
                )
                
                # Display comprehensive summary with serial tracking
                self.display_enhanced_summary(box, range_info, books_created, create_coupons)

        except Exception as e:
            raise CommandError(f'Error creating box: {str(e)}')

    def create_book_coupons_with_tracking(self, book, book_data, denomination, fuel_type):
        """Create coupons for a book with enhanced serial tracking"""
        serials = SerialRangeTracker.generate_serial_list(
            book_data['first_serial'], book_data['last_serial']
        )
        
        coupons_created = []
        for serial in serials:
            # Check if coupon already exists
            if not Coupon.objects.filter(coupon_number=serial).exists():
                coupon = Coupon.objects.create(
                    book=book,
                    coupon_number=serial,
                    litres=denomination,
                    status='AVAILABLE'
                )
                coupons_created.append(coupon)
        
        return coupons_created
    
    def display_enhanced_summary(self, box, range_info, books_created, create_coupons):
        """Display comprehensive summary with serial tracking information"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('COMPREHENSIVE BOX SUMMARY WITH SERIAL TRACKING')
        self.stdout.write('='*60)
        
        # Basic Box Information
        self.stdout.write(f'Box Code: {box.box_code}')
        self.stdout.write(f'Fuel Type: {box.get_fuel_type_display()}')
        self.stdout.write(f'Denomination: {box.denomination}L per coupon')
        self.stdout.write(f'Total Litres: {box.total_litres}L')
        
        # Serial Range Information
        self.stdout.write(f'\nSerial Range Details:')
        self.stdout.write(f'  Format: {range_info["format"]}')
        self.stdout.write(f'  Prefix: {range_info["prefix"]}')
        self.stdout.write(f'  First Serial: {box.first_coupon_number}')
        self.stdout.write(f'  Last Serial: {box.last_coupon_number}')
        self.stdout.write(f'  Total Coupons: {range_info["total_count"]}')
        
        # Book Breakdown
        self.stdout.write(f'\nBook Breakdown ({len(books_created)} books):')
        for book in books_created:
            book_range = SerialRangeTracker.calculate_range_info(
                book.first_coupon_number, book.last_coupon_number
            )
            self.stdout.write(
                f'  {book.book_number}: {book.first_coupon_number} - {book.last_coupon_number} '
                f'({book_range["total_count"]} coupons)'
            )
        
        # Coupon Records Information
        if create_coupons:
            total_coupon_records = Coupon.objects.filter(book__box=box).count()
            self.stdout.write(f'\nCoupon Records Created: {total_coupon_records}')
        
        # Serial Movement Tracking
        movements = SerialMovement.objects.filter(first_serial=box.first_coupon_number)
        self.stdout.write(f'\nSerial Movement Records: {movements.count()}')
        for movement in movements:
            self.stdout.write(
                f'  {movement.get_movement_type_display()}: '
                f'{movement.first_serial}-{movement.last_serial} '
                f'({movement.quantity} coupons)'
            )
        
        # Next Steps Information
        self.stdout.write(f'\nNext Steps for Serial Tracking:')
        self.stdout.write(f'1. Dispatch books to subcenters (creates BOOK_DISPATCH movements)')
        self.stdout.write(f'2. Allocate coupons to beneficiaries (creates COUPON_ALLOCATED movements)')
        self.stdout.write(f'3. Track handovers and usage (creates HANDOVER/USED movements)')
        self.stdout.write(f'4. Monitor remaining inventory at each location')
        
        self.stdout.write('='*60)
