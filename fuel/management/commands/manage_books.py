from django.core.management.base import BaseCommand
from fuel.models import Box, Book, Coupon, BookPage, User
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from decimal import Decimal
import re


class Command(BaseCommand):
    help = 'Automated book and coupon management for boxes with sequential numbering'

    def add_arguments(self, parser):
        parser.add_argument(
            '--box-code',
            type=str,
            required=True,
            help='Box code to process'
        )
        parser.add_argument(
            '--action',
            type=str,
            choices=['create-books', 'assign-books', 'list-books', 'validate-sequence'],
            default='create-books',
            help='Action to perform'
        )
        parser.add_argument(
            '--assignee-username',
            type=str,
            help='Username to assign books to (for assign-books action)'
        )
        parser.add_argument(
            '--book-count',
            type=int,
            help='Number of books to assign (for assign-books action)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force action even if validation fails'
        )

    def handle(self, *args, **options):
        box_code = options['box_code']
        action = options['action']
        
        try:
            box = Box.objects.get(box_code=box_code)
        except Box.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Box "{box_code}" not found')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'📦 Processing Box: {box.box_code}')
        )

        if action == 'create-books':
            self.create_books_with_coupons(box, options['force'])
        elif action == 'assign-books':
            self.assign_books_to_user(box, options['assignee_username'], options['book_count'])
        elif action == 'list-books':
            self.list_books_status(box)
        elif action == 'validate-sequence':
            self.validate_coupon_sequence(box)

    def create_books_with_coupons(self, box, force=False):
        """Create books and coupons with proper sequential numbering"""
        self.stdout.write('🔨 Creating books and coupons...')
        
        # Check if books already exist
        existing_books = box.books.count()
        if existing_books > 0 and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Box already has {existing_books} books. Use --force to recreate.'
                )
            )
            return

        if force and existing_books > 0:
            self.stdout.write('🗑️  Deleting existing books and coupons...')
            box.books.all().delete()

        # Generate coupon number sequence
        coupon_numbers = self._generate_sequential_numbers(
            box.first_coupon_number,
            box.last_coupon_number
        )

        expected_total = box.number_of_books * box.coupons_per_book
        if len(coupon_numbers) != expected_total:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Coupon count mismatch! Expected: {expected_total}, Got: {len(coupon_numbers)}'
                )
            )
            return

        # Create books and coupons
        with transaction.atomic():
            self._create_books_batch(box, coupon_numbers)

        # Update box total litres
        box.total_litres = Decimal(str(len(coupon_numbers) * box.denomination))
        box.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Created {box.number_of_books} books with {len(coupon_numbers)} coupons'
            )
        )

        # Display creation summary
        self._display_creation_summary(box)

    def assign_books_to_user(self, box, username, book_count):
        """Assign books to a specific user"""
        if not username:
            self.stdout.write(
                self.style.ERROR('❌ Username required for book assignment')
            )
            return

        try:
            user = User.objects.get(username=username, role='BENEFICIARY')
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Beneficiary user "{username}" not found')
            )
            return

        # Get available books
        available_books = box.books.filter(is_assigned=False)
        if not available_books.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No available books in this box')
            )
            return

        # Determine how many books to assign
        max_assignable = available_books.count()
        if book_count:
            books_to_assign = min(book_count, max_assignable)
        else:
            books_to_assign = max_assignable

        # Assign books
        books_assigned = available_books[:books_to_assign]
        
        with transaction.atomic():
            for book in books_assigned:
                book.is_assigned = True
                book.assigned_to = user
                book.assigned_date = timezone.now()
                book.save()

                # Update coupon allocation
                book.coupons.filter(status='AVAILABLE').update(
                    status='ALLOCATED',
                    allocated_to=user,
                    allocated_date=timezone.now()
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Assigned {len(books_assigned)} books to {user.get_full_name() or username}'
            )
        )

        # Display assignment summary
        self._display_assignment_summary(user, books_assigned)

    def list_books_status(self, box):
        """List all books in the box with their status"""
        books = box.books.all().order_by('book_number')
        
        if not books.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No books found in this box')
            )
            return

        self.stdout.write(f'\n📚 BOOKS IN BOX {box.box_code}')
        self.stdout.write('=' * 80)
        
        # Header
        self.stdout.write(
            f"{'Book #':<15} {'Coupon Range':<25} {'Status':<12} {'Assigned To':<20} {'Date':<12}"
        )
        self.stdout.write('-' * 80)
        
        # Book details
        for book in books:
            status = '✅ Assigned' if book.is_assigned else '📖 Available'
            assignee = book.assigned_to.username if book.assigned_to else '-'
            date = book.assigned_date.strftime('%Y-%m-%d') if book.assigned_date else '-'
            
            self.stdout.write(
                f"{book.book_number:<15} "
                f"{book.first_coupon_number} - {book.last_coupon_number:<25} "
                f"{status:<12} {assignee:<20} {date:<12}"
            )

        # Summary statistics
        total_books = books.count()
        assigned_books = books.filter(is_assigned=True).count()
        available_books = total_books - assigned_books
        
        self.stdout.write('-' * 80)
        self.stdout.write(f'📊 SUMMARY: {total_books} total | ✅ {assigned_books} assigned | 📖 {available_books} available')

    def validate_coupon_sequence(self, box):
        """Validate that coupon sequences are correct"""
        self.stdout.write('🔍 Validating coupon sequences...')
        
        books = box.books.all().order_by('book_number')
        if not books.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No books to validate')
            )
            return

        issues_found = []
        total_coupons_expected = 0
        total_coupons_actual = 0

        for book in books:
            # Validate book coupon range
            expected_coupons = self._calculate_coupon_count(
                book.first_coupon_number,
                book.last_coupon_number
            )
            actual_coupons = book.coupons.count()
            
            total_coupons_expected += expected_coupons
            total_coupons_actual += actual_coupons

            if expected_coupons != actual_coupons:
                issues_found.append(
                    f"Book {book.book_number}: Expected {expected_coupons} coupons, found {actual_coupons}"
                )

            # Validate individual coupon numbers
            coupon_numbers = list(book.coupons.values_list('coupon_number', flat=True))
            expected_sequence = self._generate_sequential_numbers(
                book.first_coupon_number,
                book.last_coupon_number
            )

            missing_coupons = set(expected_sequence) - set(coupon_numbers)
            extra_coupons = set(coupon_numbers) - set(expected_sequence)

            if missing_coupons:
                issues_found.append(
                    f"Book {book.book_number}: Missing {len(missing_coupons)} coupons"
                )

            if extra_coupons:
                issues_found.append(
                    f"Book {book.book_number}: Extra {len(extra_coupons)} coupons"
                )

        # Display validation results
        if issues_found:
            self.stdout.write(
                self.style.ERROR(f'❌ Validation failed! Found {len(issues_found)} issues:')
            )
            for issue in issues_found:
                self.stdout.write(f'   • {issue}')
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ Validation passed! All coupon sequences are correct.')
            )

        # Summary
        self.stdout.write(f'\n📊 VALIDATION SUMMARY')
        self.stdout.write(f'Expected total coupons: {total_coupons_expected}')
        self.stdout.write(f'Actual total coupons: {total_coupons_actual}')
        self.stdout.write(f'Box capacity: {box.number_of_books * box.coupons_per_book}')

    def _generate_sequential_numbers(self, first_number, last_number):
        """Generate sequence of numbers between first and last"""
        # Extract prefix and numeric parts
        first_match = re.match(r'^(.*?)(\d+)$', first_number)
        last_match = re.match(r'^(.*?)(\d+)$', last_number)
        
        if not first_match or not last_match:
            raise ValueError(f"Invalid number format: {first_number} or {last_number}")
        
        prefix = first_match.group(1)
        first_num = int(first_match.group(2))
        last_num = int(last_match.group(2))
        num_length = len(first_match.group(2))
        
        return [
            f"{prefix}{str(num).zfill(num_length)}"
            for num in range(first_num, last_num + 1)
        ]

    def _calculate_coupon_count(self, first_number, last_number):
        """Calculate how many coupons should be in a range"""
        first_match = re.search(r'(\d+)$', first_number)
        last_match = re.search(r'(\d+)$', last_number)
        
        if first_match and last_match:
            return int(last_match.group(1)) - int(first_match.group(1)) + 1
        return 0

    def _create_books_batch(self, box, coupon_numbers):
        """Create books and coupons in batches for better performance"""
        coupons_per_book = box.coupons_per_book
        
        for book_num in range(1, box.number_of_books + 1):
            # Calculate coupon range for this book
            start_idx = (book_num - 1) * coupons_per_book
            end_idx = start_idx + coupons_per_book
            book_coupons = coupon_numbers[start_idx:end_idx]
            
            # Create book
            book = Book.objects.create(
                box=box,
                book_number=f"Book {book_num:03d}",
                first_coupon_number=book_coupons[0],
                last_coupon_number=book_coupons[-1],
                initial_coupon_count=len(book_coupons)
            )
            
            # Create coupons in bulk
            coupons_to_create = []
            for coupon_number in book_coupons:
                coupon = Coupon(
                    book=book,
                    coupon_number=coupon_number,
                    litres=Decimal(str(box.denomination)),
                    status='AVAILABLE'
                )
                coupons_to_create.append(coupon)
            
            Coupon.objects.bulk_create(coupons_to_create, batch_size=1000)
            
            self.stdout.write(f'   ✓ Created Book {book_num:03d} with {len(book_coupons)} coupons')

    def _display_creation_summary(self, box):
        """Display summary after creation"""
        books_count = box.books.count()
        coupons_count = Coupon.objects.filter(book__box=box).count()
        
        self.stdout.write(f'\n📋 CREATION SUMMARY')
        self.stdout.write('=' * 50)
        self.stdout.write(f'Box Code: {box.box_code}')
        self.stdout.write(f'Fuel Type: {box.get_fuel_type_display()}')
        self.stdout.write(f'Denomination: {box.denomination}L')
        self.stdout.write(f'Books Created: {books_count}')
        self.stdout.write(f'Coupons Created: {coupons_count}')
        self.stdout.write(f'Total Fuel Value: {coupons_count * box.denomination}L')
        self.stdout.write(f'Coupon Range: {box.first_coupon_number} - {box.last_coupon_number}')

    def _display_assignment_summary(self, user, books):
        """Display summary after book assignment"""
        total_coupons = sum(book.coupons.count() for book in books)
        total_litres = sum(book.coupons.count() * book.box.denomination for book in books)
        
        self.stdout.write(f'\n📋 ASSIGNMENT SUMMARY')
        self.stdout.write('=' * 50)
        self.stdout.write(f'Assignee: {user.get_full_name() or user.username}')
        self.stdout.write(f'Books Assigned: {len(books)}')
        self.stdout.write(f'Total Coupons: {total_coupons}')
        self.stdout.write(f'Total Fuel Allocation: {total_litres}L')
        
        self.stdout.write(f'\nAssigned Books:')
        for book in books:
            self.stdout.write(f'   📖 {book.book_number}: {book.first_coupon_number} - {book.last_coupon_number}')
