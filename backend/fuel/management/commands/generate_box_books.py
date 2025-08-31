"""
Management command to generate books and coupons for a box
This is the SINGLE SOURCE OF TRUTH for coupon generation
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from fuel.models import Box, Book, Coupon
from fuel.utils.petrotrade_serials import PetroTradeSerial
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate books and coupons for a box (SINGLE SOURCE OF TRUTH)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--box-id',
            type=int,
            required=True,
            help='Box ID to generate books for'
        )
        parser.add_argument(
            '--first-serial',
            type=str,
            required=True,
            help='First coupon serial number (e.g., PU006H1355101)'
        )
        parser.add_argument(
            '--last-serial',
            type=str,
            required=True,
            help='Last coupon serial number (e.g., PU006H1356100)'
        )
        parser.add_argument(
            '--books-per-box',
            type=int,
            default=10,
            help='Number of books per box (default: 10)'
        )
        parser.add_argument(
            '--coupons-per-book',
            type=int,
            default=100,
            help='Number of coupons per book (default: 100)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force generation even if books already exist'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be generated without creating records'
        )

    def handle(self, *args, **options):
        box_id = options['box_id']
        first_serial = options['first_serial']
        last_serial = options['last_serial']
        books_per_box = options['books_per_box']
        coupons_per_book = options['coupons_per_book']
        force = options['force']
        dry_run = options['dry_run']

        try:
            # Get the box
            try:
                box = Box.objects.get(id=box_id)
            except Box.DoesNotExist:
                raise CommandError(f'Box with ID {box_id} does not exist')

            # Validate serial numbers
            if not PetroTradeSerial.validate_serial(first_serial):
                raise CommandError(f'Invalid first serial format: {first_serial}')
            
            if not PetroTradeSerial.validate_serial(last_serial):
                raise CommandError(f'Invalid last serial format: {last_serial}')

            # Check if books already exist
            existing_books = Book.objects.filter(box=box).count()
            if existing_books > 0 and not force:
                raise CommandError(
                    f'Box {box_id} already has {existing_books} books. '
                    f'Use --force to regenerate or choose a different box.'
                )

            # Calculate book ranges
            try:
                book_ranges = PetroTradeSerial.calculate_book_ranges(
                    first_serial, last_serial, books_per_box, coupons_per_book
                )
            except Exception as e:
                raise CommandError(f'Error calculating book ranges: {e}')

            # Validate total coupons
            total_coupons = len(book_ranges) * coupons_per_book
            expected_coupons = books_per_box * coupons_per_book
            
            if total_coupons != expected_coupons:
                raise CommandError(
                    f'Coupon count mismatch: expected {expected_coupons}, '
                    f'calculated {total_coupons}'
                )

            # Show generation plan
            self.stdout.write(self.style.SUCCESS('GENERATION PLAN'))
            self.stdout.write(f'Box: {box.box_number} (ID: {box.id})')
            self.stdout.write(f'Serial Range: {first_serial} to {last_serial}')
            self.stdout.write(f'Books to Generate: {len(book_ranges)}')
            self.stdout.write(f'Coupons per Book: {coupons_per_book}')
            self.stdout.write(f'Total Coupons: {total_coupons}')
            
            if existing_books > 0:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Will DELETE {existing_books} existing books')
                )

            self.stdout.write('\nBOOK BREAKDOWN:')
            for book_info in book_ranges:
                self.stdout.write(
                    f"  Book {book_info['book_number']:2d}: "
                    f"{book_info['first_coupon']} - {book_info['last_coupon']} "
                    f"({book_info['coupon_count']} coupons)"
                )

            if dry_run:
                self.stdout.write(
                    self.style.WARNING('\n🏃 DRY RUN - No changes made')
                )
                return

            # Confirm generation
            if not options.get('verbosity', 1) >= 2:  # Skip confirmation in verbose mode
                confirm = input('\nProceed with generation? (y/N): ')
                if confirm.lower() not in ['y', 'yes']:
                    self.stdout.write('Generation cancelled.')
                    return

            # Generate books and coupons in a single transaction
            with transaction.atomic():
                # Delete existing books if force is used
                if existing_books > 0 and force:
                    self.stdout.write('🗑️  Deleting existing books and coupons...')
                    Book.objects.filter(box=box).delete()
                    self.stdout.write(f'✅ Deleted {existing_books} existing books')

                # Update box with serial range
                box.first_coupon_serial = first_serial
                box.last_coupon_serial = last_serial
                box.total_books = books_per_box
                box.coupons_per_book = coupons_per_book
                box.save()

                self.stdout.write('\n📚 Generating books and coupons...')
                
                created_books = 0
                created_coupons = 0

                for book_info in book_ranges:
                    # Create book
                    book = Book.objects.create(
                        box=box,
                        book_number=book_info['book_number'],
                        first_coupon_serial=book_info['first_coupon'],
                        last_coupon_serial=book_info['last_coupon'],
                        total_coupons=book_info['coupon_count'],
                        date_created=timezone.now(),
                        is_generated=True
                    )
                    created_books += 1

                    # Generate all coupon serials for this book
                    coupon_serials = PetroTradeSerial.generate_range(
                        book_info['first_coupon'], 
                        book_info['last_coupon']
                    )

                    # Create coupons in bulk
                    coupons_to_create = []
                    for page_number, serial in enumerate(coupon_serials, 1):
                        coupons_to_create.append(
                            Coupon(
                                book=book,
                                coupon_serial=serial,
                                page_number=page_number,
                                fuel_type=box.fuel_type,
                                coupon_value=box.coupon_value,
                                is_used=False,
                                date_created=timezone.now()
                            )
                        )

                    # Bulk create coupons (much faster)
                    Coupon.objects.bulk_create(coupons_to_create, batch_size=100)
                    created_coupons += len(coupons_to_create)

                    self.stdout.write(
                        f'  ✅ Book {book.book_number}: {len(coupon_serials)} coupons'
                    )

            # Final summary
            self.stdout.write(self.style.SUCCESS('\n🎉 GENERATION COMPLETE'))
            self.stdout.write(f'📦 Box: {box.box_number}')
            self.stdout.write(f'📚 Books Created: {created_books}')
            self.stdout.write(f'🎫 Coupons Created: {created_coupons}')
            self.stdout.write(f'📄 Serial Range: {first_serial} to {last_serial}')
            
            # Verify generation
            final_book_count = Book.objects.filter(box=box).count()
            final_coupon_count = Coupon.objects.filter(book__box=box).count()
            
            self.stdout.write(f'\n🔍 VERIFICATION:')
            self.stdout.write(f'  Books in DB: {final_book_count}')
            self.stdout.write(f'  Coupons in DB: {final_coupon_count}')
            
            if final_book_count == books_per_box and final_coupon_count == total_coupons:
                self.stdout.write(self.style.SUCCESS('  ✅ All records created successfully'))
            else:
                self.stdout.write(self.style.ERROR('  ❌ Record count mismatch'))

        except CommandError:
            raise
        except Exception as e:
            logger.error(f'Error generating books: {e}', exc_info=True)
            raise CommandError(f'Unexpected error: {e}')
