"""
Django management command to create test data for book dispatch system
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from fuel.models import Box, Book, Coupon, BookDispatch, SubCenter, User
from django.contrib.auth import get_user_model
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data for book dispatch system'

    def handle(self, *args, **options):
        self.stdout.write("🚀 Creating test data for book dispatch system...")
        
        self.create_users()
        self.create_subcenters()
        self.create_boxes_and_books()
        self.test_dispatch_workflow()
        
        self.stdout.write("\n🎉 Test data creation complete!")

    def create_users(self):
        """Create test users"""
        self.stdout.write("\n👥 Creating test users...")
        
        # Create main center officer
        self.main_officer, created = User.objects.get_or_create(
            username='main_officer',
            defaults={
                'email': 'main@parliament.gov.zw',
                'first_name': 'Main',
                'last_name': 'Officer',
                'role': 'MAIN_CENTER'
            }
        )
        if created:
            self.main_officer.set_password('password123')
            self.main_officer.save()
            self.stdout.write("   ✅ Created main center officer")
        
        # Create sub center officer
        self.sub_officer, created = User.objects.get_or_create(
            username='sub_officer',
            defaults={
                'email': 'sub@parliament.gov.zw',
                'first_name': 'Sub',
                'last_name': 'Officer',
                'role': 'SUB_CENTER'
            }
        )
        if created:
            self.sub_officer.set_password('password123')
            self.sub_officer.save()
            self.stdout.write("   ✅ Created sub center officer")

    def create_subcenters(self):
        """Create test subcenters"""
        self.stdout.write("\n🏢 Creating test subcenters...")
        
        subcenters_data = [
            {'name': 'Harare SubCenter', 'code': 'HAR001', 'location': 'Harare'},
            {'name': 'Bulawayo SubCenter', 'code': 'BUL001', 'location': 'Bulawayo'},
            {'name': 'Mutare SubCenter', 'code': 'MUT001', 'location': 'Mutare'},
        ]
        
        for data in subcenters_data:
            subcenter, created = SubCenter.objects.get_or_create(
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'location': data['location']
                }
            )
            if created:
                self.stdout.write(f"   ✅ Created {data['name']}")

    def create_boxes_and_books(self):
        """Create test boxes and books"""
        self.stdout.write("\n📦 Creating test boxes and books...")
        
        boxes_data = [
            {
                'code': 'BOX-DIESEL-001',
                'fuel_type': 'DIESEL',
                'denomination': 20,
                'first_coupon': 'PU00GH355001',
                'last_coupon': 'PU00GH355500',
                'books_count': 5
            },
            {
                'code': 'BOX-PETROL-001',
                'fuel_type': 'PETROL',
                'denomination': 20,
                'first_coupon': 'PU00GH356001',
                'last_coupon': 'PU00GH356300',
                'books_count': 3
            },
            {
                'code': 'BOX-DIESEL-002',
                'fuel_type': 'DIESEL',
                'denomination': 50,
                'first_coupon': 'PU00GH357001',
                'last_coupon': 'PU00GH357200',
                'books_count': 2
            }
        ]
        
        for box_data in boxes_data:
            # Create box
            box, created = Box.objects.get_or_create(
                box_code=box_data['code'],
                defaults={
                    'fuel_type': box_data['fuel_type'],
                    'denomination': box_data['denomination'],
                    'first_coupon_number': box_data['first_coupon'],
                    'last_coupon_number': box_data['last_coupon'],
                    'is_received': True,
                    'received_at': timezone.now(),
                    'received_by': self.main_officer,
                    'coupons_per_book': 100,
                    'total_coupons_calculated': 500 if 'DIESEL-001' in box_data['code'] else 300 if 'PETROL' in box_data['code'] else 200,
                    'total_litres': 500 * box_data['denomination'] if 'DIESEL-001' in box_data['code'] else 300 * box_data['denomination'] if 'PETROL' in box_data['code'] else 200 * box_data['denomination'],
                    'total_value_usd': 500 * box_data['denomination'] * 1.45 if 'DIESEL-001' in box_data['code'] else 300 * box_data['denomination'] * 1.45 if 'PETROL' in box_data['code'] else 200 * box_data['denomination'] * 1.45
                }
            )
            
            if created:
                self.stdout.write(f"   ✅ Created box {box_data['code']}")
                
                # Create books for this box
                self.create_books_for_box(box, box_data['books_count'], box_data['first_coupon'])

    def create_books_for_box(self, box, books_count, first_coupon_base):
        """Create books for a specific box"""
        # Extract numeric part from first coupon
        import re
        match = re.search(r'(\D*)(\d+)$', first_coupon_base)
        if not match:
            return
        
        prefix = match.group(1)
        start_num = int(match.group(2))
        
        coupons_per_book = 100
        
        for book_idx in range(books_count):
            book_start = start_num + (book_idx * coupons_per_book)
            book_end = book_start + coupons_per_book - 1
            
            # Use box code in book number to ensure uniqueness
            book_number = f"{box.box_code}-BOOK-{book_idx + 1:03d}"
            first_coupon = f"{prefix}{book_start:08d}"
            last_coupon = f"{prefix}{book_end:08d}"
            
            book, created = Book.objects.get_or_create(
                box=box,
                book_number=book_number,
                defaults={
                    'first_coupon_number': first_coupon,
                    'last_coupon_number': last_coupon,
                    'initial_coupon_count': coupons_per_book,
                    'is_assigned': False
                }
            )
            
            if created:
                self.stdout.write(f"     📖 Created {book_number} ({first_coupon} - {last_coupon})")
                
                # Generate coupons for this book
                generated_coupons = book.generate_coupons()
                self.stdout.write(f"     🎫 Generated {len(generated_coupons)} coupons")

    def test_dispatch_workflow(self):
        """Test the dispatch workflow"""
        self.stdout.write("\n📤 Testing dispatch workflow...")
        
        # Get available books
        available_books = Book.objects.filter(
            box__is_received=True,
            is_assigned=False,
            dispatches__isnull=True
        )
        
        if available_books.count() >= 2:
            # Create a test dispatch
            subcenter = SubCenter.objects.first()
            
            dispatch = BookDispatch.objects.create(
                to_center=subcenter,
                dispatched_by=self.main_officer,
                status='DISPATCHED'
            )
            
            # Add 2 books to the dispatch
            books_to_dispatch = available_books[:2]
            dispatch.books.set(books_to_dispatch)
            
            # Update dispatch details
            first_serials = [book.first_coupon_number for book in books_to_dispatch]
            last_serials = [book.last_coupon_number for book in books_to_dispatch]
            
            dispatch.first_serial = min(first_serials)
            dispatch.last_serial = max(last_serials)
            dispatch.total_coupons = sum(book.initial_coupon_count or 100 for book in books_to_dispatch)
            dispatch.save()
            
            # Mark books as assigned
            for book in books_to_dispatch:
                book.is_assigned = True
                book.save()
            
            self.stdout.write(f"   ✅ Created dispatch to {subcenter.name}")
            self.stdout.write(f"   📖 Dispatched {len(books_to_dispatch)} books")
            self.stdout.write(f"   🎫 Total coupons: {dispatch.total_coupons}")
            self.stdout.write(f"   📊 Total value: ${dispatch.total_value:.2f}")
        
        # Show summary
        self.show_summary()

    def show_summary(self):
        """Show summary of created data"""
        self.stdout.write("\n📊 Summary of created data:")
        self.stdout.write("=" * 50)
        
        boxes_count = Box.objects.count()
        books_count = Book.objects.count()
        coupons_count = Coupon.objects.count()
        dispatches_count = BookDispatch.objects.count()
        available_books = Book.objects.filter(is_assigned=False, dispatches__isnull=True).count()
        
        self.stdout.write(f"   📦 Boxes: {boxes_count}")
        self.stdout.write(f"   📖 Books: {books_count}")
        self.stdout.write(f"   🎫 Coupons: {coupons_count}")
        self.stdout.write(f"   📤 Dispatches: {dispatches_count}")
        self.stdout.write(f"   📖 Available books: {available_books}")
        
        self.stdout.write("\n🧪 Test endpoints:")
        self.stdout.write("   • GET /api/fuel/book-dispatches/")
        self.stdout.write("   • GET /api/fuel/book-dispatches/available_books/")
        self.stdout.write("   • GET /api/fuel/book-dispatches/generation_options/")
        self.stdout.write("   • POST /api/fuel/book-dispatches/generate_coupons/")
        
        self.stdout.write("\n👤 Test users created:")
        self.stdout.write("   • Username: main_officer, Password: password123")
        self.stdout.write("   • Username: sub_officer, Password: password123")
