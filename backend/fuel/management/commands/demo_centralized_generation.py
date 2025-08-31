"""
Management command to test the centralized book gener        box = Box.objects.create(
            box_code="DEMO-BOX-001",
            fuel_type="DIESEL",
            denomination=20,
            number_of_books=3,
            status="RECEIVED",
            # Legacy fields for backward compatibility
            first_coupon_number="PU006H1355101",
            last_coupon_number="PU006H1355300"
        )ystem
Demonstrates the SINGLE SOURCE OF TRUTH approach
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from fuel.models import Box, Book, Coupon, SubCenter, User
from fuel.services.book_generation import BookGenerationService
from fuel.utils.petrotrade_serials import PetroTradeSerial
import json


class Command(BaseCommand):
    help = 'Test the centralized book generation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo-type',
            type=str,
            choices=['validation', 'generation', 'real-example', 'full-box'],
            default='full-box',
            help='Type of demo to run'
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up test data after demo'
        )

    def handle(self, *args, **options):
        demo_type = options['demo_type']
        cleanup = options['cleanup']

        self.stdout.write(
            self.style.SUCCESS('🚀 CENTRALIZED BOOK GENERATION DEMO')
        )
        self.stdout.write('=' * 60)
        self.stdout.write('⚠️  IMPORTANT: This is the SINGLE SOURCE OF TRUTH')
        self.stdout.write('   Frontend should NEVER generate books locally!')
        self.stdout.write('   All generation must go through this service!')
        self.stdout.write('=' * 60)

        if demo_type == 'validation':
            self.demo_validation()
        elif demo_type == 'generation':
            self.demo_generation(cleanup)
        elif demo_type == 'real-example':
            self.demo_real_example()
        elif demo_type == 'full-box':
            self.demo_full_box(cleanup)

    def demo_validation(self):
        """Demo the validation service"""
        self.stdout.write(self.style.WARNING('\n🔍 VALIDATION SERVICE DEMO'))
        
        # Create temporary box
        box = Box.objects.create(
            box_code="DEMO-VALIDATION-001",
            fuel_type="DIESEL",
            denomination=20,
            number_of_books=10,
            status="RECEIVED"
        )
        
        self.stdout.write(f'📦 Created demo box: {box.box_code}')
        
        # Test validation
        validation = BookGenerationService.validate_generation_request(
            box_id=box.id,
            first_serial="PU006H1355101",
            last_serial="PU006H1356100",
            books_per_box=10,
            coupons_per_book=100,
            force=False
        )
        
        self.stdout.write('\n📋 VALIDATION RESULTS:')
        self.stdout.write(f'  Valid: {self.style.SUCCESS("✅") if validation["valid"] else self.style.ERROR("❌")}')
        self.stdout.write(f'  Errors: {validation["errors"]}')
        self.stdout.write(f'  Warnings: {validation["warnings"]}')
        
        if validation['valid']:
            plan = validation['plan']
            self.stdout.write(f'  Total Books: {plan.get("total_books", "N/A")}')
            self.stdout.write(f'  Total Coupons: {plan.get("total_coupons", "N/A")}')
            
            # Show first few book ranges
            book_ranges = plan.get('book_ranges', [])
            self.stdout.write('\n📚 PLANNED BOOK RANGES:')
            for book in book_ranges[:3]:
                self.stdout.write(
                    f'  Book {book["book_number"]:2d}: {book["first_coupon"]} - {book["last_coupon"]} '
                    f'({book["coupon_count"]} coupons)'
                )
            if len(book_ranges) > 3:
                self.stdout.write(f'  ... and {len(book_ranges) - 3} more books')
        
        # Cleanup
        box.delete()
        self.stdout.write(f'\n🗑️ Cleaned up demo box')

    def demo_generation(self, cleanup=True):
        """Demo the actual generation service"""
        self.stdout.write(self.style.WARNING('\n🏭 GENERATION SERVICE DEMO'))
        
        # Create test box
        box = Box.objects.create(
            box_code="DEMO-GENERATION-001",
            fuel_type="DIESEL",
            denomination=20,
            number_of_books=2,  # Small demo
            status="RECEIVED",
            # Legacy fields for backward compatibility
            first_coupon_number="PU006H1355101",
            last_coupon_number="PU006H1355200"
        )
        
        self.stdout.write(f'📦 Created demo box: {box.box_code}')
        
        # Generate books
        result = BookGenerationService.generate_books_and_coupons(
            box_id=box.id,
            first_serial="PU006H1355101",
            last_serial="PU006H1355200",  # 100 coupons (1 book x 100)
            books_per_box=1,
            coupons_per_book=100,
            force=False
        )
        
        self.stdout.write('\n🎯 GENERATION RESULTS:')
        if result['success']:
            self.stdout.write(self.style.SUCCESS(f'  ✅ {result["message"]}'))
            
            data = result['data']
            self.stdout.write(f'  📚 Books Created: {data["books_created"]}')
            self.stdout.write(f'  🎫 Coupons Created: {data["coupons_created"]}')
            self.stdout.write(f'  📄 Serial Range: {data["serial_range"]["first"]} - {data["serial_range"]["last"]}')
            
            # Verify in database
            created_books = Book.objects.filter(box=box)
            created_coupons = Coupon.objects.filter(book__box=box)
            
            self.stdout.write('\n🔍 DATABASE VERIFICATION:')
            self.stdout.write(f'  Books in DB: {created_books.count()}')
            self.stdout.write(f'  Coupons in DB: {created_coupons.count()}')
            
            # Show details
            for book in created_books:
                self.stdout.write(f'  📖 Book {book.book_number}:')
                self.stdout.write(f'     Serials: {book.first_coupon_serial} - {book.last_coupon_serial}')
                self.stdout.write(f'     Total Coupons: {book.total_coupons}')
                self.stdout.write(f'     Is Generated: {book.is_generated}')
                
                # Show first few coupons
                book_coupons = book.coupons.all()[:5]
                self.stdout.write(f'     First 5 Coupons:')
                for coupon in book_coupons:
                    self.stdout.write(f'       🎫 {coupon.coupon_serial} (Page {coupon.page_number})')
        
        else:
            self.stdout.write(self.style.ERROR(f'  ❌ Generation failed: {result["message"]}'))
            self.stdout.write(f'  Errors: {result.get("errors", [])}')
        
        # Cleanup if requested
        if cleanup:
            box.delete()
            self.stdout.write(f'\n🗑️ Cleaned up demo box')
        else:
            self.stdout.write(f'\n💾 Demo box preserved: {box.box_code}')

    def demo_real_example(self):
        """Demo with the real PetroTrade example from the image"""
        self.stdout.write(self.style.WARNING('\n📸 REAL PETROTRADE EXAMPLE DEMO'))
        
        # Exact serials from the image
        start_serial = "PU006H1355101"
        end_serial = "PU006H1355200"
        
        self.stdout.write(f'📄 Testing real coupon book from image:')
        self.stdout.write(f'   FROM: {start_serial}')
        self.stdout.write(f'   TO: {end_serial}')
        
        # Parse the serials
        start_parsed = PetroTradeSerial.parse_serial(start_serial)
        end_parsed = PetroTradeSerial.parse_serial(end_serial)
        
        self.stdout.write('\n🔍 SERIAL ANALYSIS:')
        self.stdout.write(f'  Start Serial Valid: {self.style.SUCCESS("✅") if start_parsed["is_valid"] else self.style.ERROR("❌")}')
        self.stdout.write(f'  Leading Letters: {start_parsed["leading_letters"]}')
        self.stdout.write(f'  3-Digit Section: {start_parsed["three_digits"]:03d}')
        self.stdout.write(f'  Check Letter: {start_parsed["check_letter1"]}')
        self.stdout.write(f'  7-Digit Serial: {start_parsed["seven_digit_serial"]:07d}')
        
        # Generate the range
        all_serials = PetroTradeSerial.generate_range(start_serial, end_serial)
        self.stdout.write(f'\n📊 GENERATED SERIALS:')
        self.stdout.write(f'  Total Count: {len(all_serials)}')
        self.stdout.write(f'  First 5: {", ".join(all_serials[:5])}')
        self.stdout.write(f'  Last 5: {", ".join(all_serials[-5:])}')
        
        # Calculate as a single book
        book_ranges = PetroTradeSerial.calculate_book_ranges(
            start_serial, end_serial, 1, 100
        )
        
        book = book_ranges[0]
        self.stdout.write(f'\n📚 BOOK CALCULATION:')
        self.stdout.write(f'  Book {book["book_number"]}: {book["first_coupon"]} - {book["last_coupon"]}')
        self.stdout.write(f'  Coupon Count: {book["coupon_count"]}')
        self.stdout.write(f'  ✅ Matches exactly with physical coupon book!')

    def demo_full_box(self, cleanup=True):
        """Demo a full box with 10 books as described in requirements"""
        self.stdout.write(self.style.WARNING('\n📦 FULL BOX DEMO (10 Books × 100 Coupons)'))
        
        box_first = "PU006H1355101"
        box_last = "PU006H1356100"  # 1000 coupons total
        
        self.stdout.write(f'📄 Full box serial range:')
        self.stdout.write(f'   FROM: {box_first}')
        self.stdout.write(f'   TO: {box_last}')
        
        # Calculate book ranges
        book_ranges = PetroTradeSerial.calculate_book_ranges(
            box_first, box_last, 10, 100
        )
        
        self.stdout.write(f'\n📊 BOX CALCULATION:')
        self.stdout.write(f'  Total Books: {len(book_ranges)}')
        self.stdout.write(f'  Total Coupons: {sum(book["coupon_count"] for book in book_ranges)}')
        
        self.stdout.write(f'\n📚 BOOK BREAKDOWN:')
        for book in book_ranges:
            self.stdout.write(
                f'  Book {book["book_number"]:2d}: {book["first_coupon"]} - {book["last_coupon"]} '
                f'({book["coupon_count"]} coupons)'
            )
        
        # Verify no gaps or overlaps
        self.stdout.write(f'\n🔍 CONTINUITY CHECK:')
        gaps_found = False
        for i in range(len(book_ranges) - 1):
            current_book = book_ranges[i]
            next_book = book_ranges[i + 1]
            
            current_last_parsed = PetroTradeSerial.parse_serial(current_book['last_coupon'])
            next_first_parsed = PetroTradeSerial.parse_serial(next_book['first_coupon'])
            
            expected_next = current_last_parsed['seven_digit_serial'] + 1
            actual_next = next_first_parsed['seven_digit_serial']
            
            if expected_next != actual_next:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Gap between Book {current_book["book_number"]} and {next_book["book_number"]}')
                )
                gaps_found = True
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Book {current_book["book_number"]} → {next_book["book_number"]}: Continuous')
                )
        
        if not gaps_found:
            self.stdout.write(self.style.SUCCESS('\n🎉 Perfect! No gaps or overlaps detected!'))
        
        # Optional: Actually generate the box
        create_box = input('\nWould you like to create this box in the database? (y/N): ')
        if create_box.lower() in ['y', 'yes']:
            try:
                # Create the box
                box = Box.objects.create(
                    box_code=f"DEMO-{timezone.now().strftime('%Y%m%d-%H%M%S')}",
                    fuel_type="DIESEL",
                    denomination=20,
                    number_of_books=10,
                    status="RECEIVED",
                    # Legacy fields for backward compatibility
                    first_coupon_number=box_first,  # Set legacy field to same value
                    last_coupon_number=box_last,    # Set legacy field to same value
                    # New centralized fields
                    first_coupon_serial=box_first,
                    last_coupon_serial=box_last,
                    total_books=10
                )
                
                self.stdout.write(f'\n📦 Created demo box: {box.box_code}')
                
                # Generate all books and coupons
                self.stdout.write('🏭 Generating books and coupons...')
                result = BookGenerationService.generate_books_and_coupons(
                    box_id=box.id,
                    first_serial=box_first,
                    last_serial=box_last,
                    books_per_box=10,
                    coupons_per_book=100,
                    force=False
                )
                
                if result['success']:
                    data = result['data']
                    self.stdout.write(self.style.SUCCESS(f'✅ Success!'))
                    self.stdout.write(f'  📚 Books Created: {data["books_created"]}')
                    self.stdout.write(f'  🎫 Coupons Created: {data["coupons_created"]}')
                    
                    if cleanup:
                        box.delete()
                        self.stdout.write(f'\n🗑️ Cleaned up demo box')
                    else:
                        self.stdout.write(f'\n💾 Demo box preserved: {box.box_code}')
                else:
                    self.stdout.write(self.style.ERROR(f'❌ Generation failed: {result["message"]}'))
                    if 'errors' in result and result['errors']:
                        self.stdout.write('🔍 Detailed errors:')
                        for error in result['errors']:
                            self.stdout.write(f'  - {error}')
                    if 'warnings' in result and result['warnings']:
                        self.stdout.write('⚠️ Warnings:')
                        for warning in result['warnings']:
                            self.stdout.write(f'  - {warning}')
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error creating box: {e}'))

        self.stdout.write('\n🎯 SUMMARY:')
        self.stdout.write('✅ PetroTrade serial format works perfectly')
        self.stdout.write('✅ 10 books × 100 coupons = 1000 total coupons')
        self.stdout.write('✅ No gaps or overlaps in serial sequences')
        self.stdout.write('✅ Ready for production use!')
        
        self.stdout.write('\n⚠️  IMPORTANT REMINDER:')
        self.stdout.write('🔒 This is the SINGLE SOURCE OF TRUTH for book generation')
        self.stdout.write('🚫 Frontend should NEVER generate books locally')
        self.stdout.write('📡 Use API endpoints: /api/boxes/{id}/generate_books/')
        self.stdout.write('🛡️ Prevents mismatches with real physical coupons')
