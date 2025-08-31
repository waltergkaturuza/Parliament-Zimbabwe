"""
Book Generation Service - SINGLE SOURCE OF TRUTH
All book and coupon generation must go through this service
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import serializers
from fuel.models import Box, Book, Coupon
from fuel.utils.petrotrade_serials import PetroTradeSerial
import logging

logger = logging.getLogger(__name__)


class BookGenerationError(Exception):
    """Custom exception for book generation errors"""
    pass


class BookGenerationService:
    """
    Centralized service for generating books and coupons
    This is the ONLY place where books should be generated
    """
    
    @staticmethod
    def validate_generation_request(box_id: int, first_serial: str, last_serial: str,
                                  books_per_box: int = 10, coupons_per_book: int = 100,
                                  force: bool = False):
        """
        Validate a book generation request
        
        Returns:
            dict: Validation result with 'valid', 'errors', 'warnings', 'plan'
        """
        errors = []
        warnings = []
        plan = {}
        
        try:
            # Check if box exists
            try:
                box = Box.objects.get(id=box_id)
                plan['box'] = {
                    'id': box.id,
                    'box_code': box.box_code,
                    'fuel_type': box.fuel_type,
                    'denomination': box.denomination
                }
            except Box.DoesNotExist:
                errors.append(f'Box with ID {box_id} does not exist')
                return {'valid': False, 'errors': errors, 'warnings': warnings, 'plan': plan}
            
            # Validate serial numbers
            if not PetroTradeSerial.validate_serial(first_serial):
                errors.append(f'Invalid first serial format: {first_serial}')
            
            if not PetroTradeSerial.validate_serial(last_serial):
                errors.append(f'Invalid last serial format: {last_serial}')
            
            if errors:
                return {'valid': False, 'errors': errors, 'warnings': warnings, 'plan': plan}
            
            # Check for existing books
            existing_books = Book.objects.filter(box=box).count()
            if existing_books > 0:
                if not force:
                    errors.append(
                        f'Box {box_id} already has {existing_books} books. '
                        f'Set force=true to regenerate.'
                    )
                    return {'valid': False, 'errors': errors, 'warnings': warnings, 'plan': plan}
                else:
                    warnings.append(f'Will delete {existing_books} existing books')
            
            # Check for overlapping serials with other boxes
            overlapping = BookGenerationService._check_serial_overlap(
                first_serial, last_serial, exclude_box_id=box_id if force else None
            )
            if overlapping:
                errors.append(f'Serial range overlaps with existing coupons: {overlapping}')
            
            # Calculate book ranges
            try:
                book_ranges = PetroTradeSerial.calculate_book_ranges(
                    first_serial, last_serial, books_per_box, coupons_per_book
                )
                plan['book_ranges'] = book_ranges
                plan['total_books'] = len(book_ranges)
                plan['total_coupons'] = sum(book['coupon_count'] for book in book_ranges)
                plan['expected_coupons'] = books_per_box * coupons_per_book
                
                if plan['total_coupons'] != plan['expected_coupons']:
                    errors.append(
                        f"Coupon count mismatch: expected {plan['expected_coupons']}, "
                        f"calculated {plan['total_coupons']}"
                    )
                    
            except Exception as e:
                errors.append(f'Error calculating book ranges: {str(e)}')
            
            return {
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'plan': plan
            }
            
        except Exception as e:
            logger.error(f'Error validating generation request: {e}', exc_info=True)
            return {
                'valid': False,
                'errors': [f'Unexpected validation error: {str(e)}'],
                'warnings': warnings,
                'plan': plan
            }
    
    @staticmethod
    def _check_serial_overlap(first_serial: str, last_serial: str, exclude_box_id: int = None):
        """Check if serial range overlaps with existing coupons"""
        # Parse serials to get numeric ranges for comparison
        first_parsed = PetroTradeSerial.parse_serial(first_serial)
        last_parsed = PetroTradeSerial.parse_serial(last_serial)
        
        if not first_parsed['is_valid'] or not last_parsed['is_valid']:
            return "Invalid serial format"
        
        # For now, check if any coupon with these exact serials already exists
        # This is a simple check - could be enhanced for range overlap detection
        existing_coupons = Coupon.objects.filter(
            coupon_serial__in=[first_serial, last_serial]
        )
        
        if exclude_box_id:
            existing_coupons = existing_coupons.exclude(book__box_id=exclude_box_id)
        
        if existing_coupons.exists():
            return f"Serials already exist in other boxes"
        
        return None
    
    @staticmethod
    @transaction.atomic
    def generate_books_and_coupons(box_id: int, first_serial: str, last_serial: str,
                                 books_per_box: int = 10, coupons_per_book: int = 100,
                                 force: bool = False):
        """
        Generate books and coupons for a box
        
        This is the SINGLE SOURCE OF TRUTH for generation
        All generation requests must go through this method
        
        Returns:
            dict: Generation result with 'success', 'message', 'data', 'errors'
        """
        try:
            # Validate the request first
            validation = BookGenerationService.validate_generation_request(
                box_id, first_serial, last_serial, books_per_box, coupons_per_book, force
            )
            
            if not validation['valid']:
                return {
                    'success': False,
                    'message': 'Validation failed',
                    'errors': validation['errors'],
                    'warnings': validation['warnings']
                }
            
            box = Box.objects.get(id=box_id)
            plan = validation['plan']
            
            # Start generation within transaction
            logger.info(f'Starting book generation for box {box_id}')
            
            # Delete existing books if force is used
            if force:
                existing_count = Book.objects.filter(box=box).count()
                if existing_count > 0:
                    Book.objects.filter(box=box).delete()
                    logger.info(f'Deleted {existing_count} existing books for box {box_id}')
            
            # Update box with serial range
            box.first_coupon_serial = first_serial
            box.last_coupon_serial = last_serial
            box.total_books = books_per_box
            box.coupons_per_book = coupons_per_book
            # Also update legacy fields for backward compatibility
            box.first_coupon_number = first_serial
            box.last_coupon_number = last_serial
            box.save()
            
            created_books = []
            created_coupons = 0
            
            # Generate books and coupons
            for book_info in plan['book_ranges']:
                # Create book
                book = Book.objects.create(
                    box=box,
                    book_number=book_info['book_number'],
                    # NEW FIELDS (single source of truth)
                    first_coupon_serial=book_info['first_coupon'],
                    last_coupon_serial=book_info['last_coupon'],
                    is_generated=True,
                    # LEGACY FIELDS (for backward compatibility)
                    first_coupon_number=book_info['first_coupon'],
                    last_coupon_number=book_info['last_coupon'],
                    # Ensure unique book_code
                    book_code=f"{box.box_code}-BOOK-{book_info['book_number']}"
                )
                created_books.append(book)
                
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
                            coupon_value=box.denomination,
                            litres=box.denomination,
                            status='AVAILABLE',
                            # Legacy fields for backward compatibility
                            coupon_number=serial,
                            serial_number=serial
                        )
                    )
                
                # Bulk create coupons (much faster)
                Coupon.objects.bulk_create(coupons_to_create, batch_size=100)
                created_coupons += len(coupons_to_create)
                
                logger.info(f'Created book {book.book_number} with {len(coupon_serials)} coupons')
            
            # Verify creation
            final_book_count = Book.objects.filter(box=box).count()
            final_coupon_count = Coupon.objects.filter(book__box=box).count()
            
            success_message = (
                f'Successfully generated {final_book_count} books and '
                f'{final_coupon_count} coupons for box {box.box_code}'
            )
            
            logger.info(success_message)
            
            return {
                'success': True,
                'message': success_message,
                'data': {
                    'box_id': box.id,
                    'box_code': box.box_code,
                    'books_created': final_book_count,
                    'coupons_created': final_coupon_count,
                    'serial_range': {
                        'first': first_serial,
                        'last': last_serial
                    },
                    'book_details': [
                        {
                            'book_number': book.book_number,
                            'first_coupon': book.first_coupon_serial,
                            'last_coupon': book.last_coupon_serial,
                            'total_coupons': book.total_coupons
                        }
                        for book in created_books
                    ]
                },
                'warnings': validation['warnings']
            }
            
        except Exception as e:
            logger.error(f'Error generating books for box {box_id}: {e}', exc_info=True)
            return {
                'success': False,
                'message': f'Generation failed: {str(e)}',
                'errors': [str(e)]
            }
    
    @staticmethod
    def get_box_generation_status(box_id: int):
        """
        Get the current generation status of a box
        
        Returns:
            dict: Status information
        """
        try:
            box = Box.objects.get(id=box_id)
            books = Book.objects.filter(box=box)
            coupons = Coupon.objects.filter(book__box=box)
            
            return {
                'box_id': box.id,
                'box_code': box.box_code,
                'has_books': books.exists(),
                'book_count': books.count(),
                'coupon_count': coupons.count(),
                'serial_range': {
                    'first': box.first_coupon_serial,
                    'last': box.last_coupon_serial
                } if box.first_coupon_serial else None,
                'is_complete': (
                    books.exists() and 
                    box.total_books and 
                    books.count() == box.total_books
                ),
                'books': [
                    {
                        'book_number': book.book_number,
                        'first_coupon': book.first_coupon_serial,
                        'last_coupon': book.last_coupon_serial,
                        'total_coupons': book.total_coupons,
                        'actual_coupons': Coupon.objects.filter(book=book).count()
                    }
                    for book in books.order_by('book_number')
                ]
            }
            
        except Box.DoesNotExist:
            return {'error': f'Box with ID {box_id} does not exist'}
        except Exception as e:
            logger.error(f'Error getting box status {box_id}: {e}', exc_info=True)
            return {'error': f'Error getting status: {str(e)}'}


class BookGenerationSerializer(serializers.Serializer):
    """Serializer for book generation requests"""
    
    box_id = serializers.IntegerField()
    first_serial = serializers.CharField(max_length=20)
    last_serial = serializers.CharField(max_length=20)
    books_per_box = serializers.IntegerField(default=10, min_value=1, max_value=50)
    coupons_per_book = serializers.IntegerField(default=100, min_value=1, max_value=1000)
    force = serializers.BooleanField(default=False)
    
    def validate_first_serial(self, value):
        if not PetroTradeSerial.validate_serial(value):
            raise serializers.ValidationError('Invalid serial format')
        return value.upper().strip()
    
    def validate_last_serial(self, value):
        if not PetroTradeSerial.validate_serial(value):
            raise serializers.ValidationError('Invalid serial format')
        return value.upper().strip()
    
    def validate(self, data):
        # Validate that last_serial comes after first_serial
        first_parsed = PetroTradeSerial.parse_serial(data['first_serial'])
        last_parsed = PetroTradeSerial.parse_serial(data['last_serial'])
        
        if first_parsed['is_valid'] and last_parsed['is_valid']:
            if (first_parsed['prefix'] == last_parsed['prefix'] and 
                first_parsed['seven_digit_serial'] >= last_parsed['seven_digit_serial']):
                raise serializers.ValidationError(
                    'Last serial must come after first serial'
                )
        
        return data
