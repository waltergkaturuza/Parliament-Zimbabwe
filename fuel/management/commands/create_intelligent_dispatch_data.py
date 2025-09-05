from django.core.management.base import BaseCommand
from fuel.models import Box, Book, User
from django.utils import timezone
from datetime import datetime
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create comprehensive test data for intelligent dispatch system'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Creating comprehensive test data for intelligent dispatch...')
        
        # Create or get a main center user for testing
        main_user, created = User.objects.get_or_create(
            username='main_admin',
            defaults={
                'email': 'main@parliament.gov.zw',
                'first_name': 'Main',
                'last_name': 'Administrator',
                'role': 'MAIN_CENTER',
                'is_staff': True,
            }
        )
        if created:
            main_user.set_password('Admin@123')
            main_user.save()
            self.stdout.write(f'✅ Created main center user: {main_user.username}')
        
        # Create box FCB-2025-0002 that the frontend is expecting
        box_code = 'FCB-2025-0002'
        box, created = Box.objects.get_or_create(
            box_code=box_code,
            defaults={
                'fuel_type': 'DIESEL',
                'denomination': 20,  # 20L per coupon
                'coupons_per_book': 100,  # 100 coupons per book
                'is_received': True,
                'received_at': timezone.now(),
                'received_by': main_user,
                'status': 'VERIFIED',
                'verified_at': timezone.now(),
                'fuel_price_per_litre_usd': Decimal('1.45'),
                'supplier': 'Parliament Fuel Supplies Ltd',
                'delivery_note': f'Test delivery for {box_code}',
                'notes': 'Test box with 20 books for intelligent dispatch testing'
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created box: {box_code}')
        else:
            # Update existing box to ensure it's properly configured
            box.is_received = True
            box.status = 'VERIFIED'
            box.verified_at = timezone.now()
            box.fuel_type = 'DIESEL'
            box.denomination = 20
            box.coupons_per_book = 100
            box.save()
            self.stdout.write(f'✅ Updated box: {box_code}')
        
        # Clear any existing books for this box to start fresh
        Book.objects.filter(box=box).delete()
        
        # Create 20 books with proper serial numbers
        books_created = 0
        base_serial = 'PU025TY'  # Prefix for Parliament of Zimbabwe fuel coupons
        start_number = 1000001   # Starting serial number
        
        for book_num in range(1, 21):  # Create 20 books
            # Calculate serial range for this book (100 coupons per book)
            first_serial_num = start_number + ((book_num - 1) * 100)
            last_serial_num = first_serial_num + 99
            
            first_coupon_number = f"{base_serial}{str(first_serial_num).zfill(6)}"
            last_coupon_number = f"{base_serial}{str(last_serial_num).zfill(6)}"
            
            book = Book.objects.create(
                box=box,
                book_code=f'FCB-2025-0002-BOOK-{book_num}',
                book_number=book_num,
                first_coupon_number=first_coupon_number,
                last_coupon_number=last_coupon_number,
                initial_coupon_count=100,
                generated_at=timezone.now(),
                generated_by=main_user,
                is_verified=True,
                verified_at=timezone.now(),
                verified_by=main_user,
                verification_notes=f'Verified for testing - Book {book_num} of 20',
                is_assigned=False  # Available for dispatch
            )
            books_created += 1
            
            if book_num <= 3:  # Show details for first 3 books
                self.stdout.write(
                    f'  📚 Book {book_num}: {book.book_code} '
                    f'({first_coupon_number} to {last_coupon_number})'
                )
        
        self.stdout.write(f'✅ Created {books_created} books in box {box_code}')
        
        # Create additional test boxes for variety
        additional_boxes = [
            ('FCB-2025-0001', 'PETROL', 5, 15),   # Petrol box with 15 books
            ('FCB-2025-0003', 'DIESEL', 20, 25),  # Another diesel box with 25 books
        ]
        
        for box_code, fuel_type, denomination, num_books in additional_boxes:
            box, created = Box.objects.get_or_create(
                box_code=box_code,
                defaults={
                    'fuel_type': fuel_type,
                    'denomination': denomination,
                    'coupons_per_book': 100,
                    'is_received': True,
                    'received_at': timezone.now(),
                    'received_by': main_user,
                    'status': 'VERIFIED',
                    'verified_at': timezone.now(),
                    'fuel_price_per_litre_usd': Decimal('1.45'),
                    'supplier': 'Parliament Fuel Supplies Ltd',
                    'delivery_note': f'Test delivery for {box_code}',
                    'notes': f'Test box with {num_books} books'
                }
            )
            
            if created:
                # Clear existing books and create new ones
                Book.objects.filter(box=box).delete()
                
                # Create books for this box
                for book_num in range(1, num_books + 1):
                    first_serial_num = 2000001 + ((len(additional_boxes) * 1000) * 100) + ((book_num - 1) * 100)
                    last_serial_num = first_serial_num + 99
                    
                    first_coupon_number = f"{base_serial}{str(first_serial_num).zfill(6)}"
                    last_coupon_number = f"{base_serial}{str(last_serial_num).zfill(6)}"
                    
                    Book.objects.create(
                        box=box,
                        book_code=f'{box_code}-BOOK-{book_num}',
                        book_number=book_num,
                        first_coupon_number=first_coupon_number,
                        last_coupon_number=last_coupon_number,
                        initial_coupon_count=100,
                        generated_at=timezone.now(),
                        generated_by=main_user,
                        is_verified=True,
                        verified_at=timezone.now(),
                        verified_by=main_user,
                        verification_notes=f'Verified for testing - {fuel_type} book',
                        is_assigned=False
                    )
                
                self.stdout.write(f'✅ Created box {box_code} with {num_books} {fuel_type} books')
        
        # Summary
        total_boxes = Box.objects.count()
        total_books = Book.objects.count()
        verified_books = Book.objects.filter(is_verified=True).count()
        
        self.stdout.write('\n📊 Test Data Summary:')
        self.stdout.write(f'   📦 Total Boxes: {total_boxes}')
        self.stdout.write(f'   📚 Total Books: {total_books}')
        self.stdout.write(f'   ✅ Verified Books: {verified_books}')
        self.stdout.write(f'   🚀 Ready for intelligent dispatch testing!')
        
        self.stdout.write('\n🎯 Test the system:')
        self.stdout.write(f'   1. Login with username: main_admin, password: Admin@123')
        self.stdout.write(f'   2. Go to Book Dispatch Management')
        self.stdout.write(f'   3. Select box: FCB-2025-0002 (should show 20 books)')
        self.stdout.write(f'   4. Click "Details" on any book to see coupon pages')
