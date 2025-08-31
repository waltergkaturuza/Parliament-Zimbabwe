"""
Enhanced PetroTrade Coupon Serial Number Utilities
Handles the complex PetroTrade coupon numbering system with proper overflow logic

Format: [A-Z][A-Z][000-999][A-Z][A-Z][0000000-9999999]
Example: PU006H1355101
- PU: 2 leading letters  
- 006: 3 digits (000-999)
- H: 1 check letter (A-Z) 
- 1355101: 7-digit serial (0000000-9999999)
"""
import re
from typing import List, Tuple, Optional, Dict
from django.core.exceptions import ValidationError


class PetroTradeSerial:
    """Enhanced utility class for handling PetroTrade coupon serial numbers"""
    
    # Updated pattern to match the actual PetroTrade format from the image
    # Format: 2 letters + 3 digits + 1-2 letters + 7 digits
    SERIAL_PATTERN = r'^([A-Z]{2})(\d{3})([A-Z])([A-Z]?)(\d{7})$'
    
    @classmethod
    def parse_serial(cls, serial: str) -> Dict[str, any]:
        """
        Parse a PetroTrade serial number into components
        
        Args:
            serial: Serial number like 'PU006H1355101'
            
        Returns:
            Dict with parsed components:
            {
                'is_valid': bool,
                'leading_letters': str,    # PU
                'three_digits': int,       # 006
                'check_letter1': str,      # H
                'check_letter2': str,      # (optional)
                'seven_digit_serial': int, # 1355101
                'prefix': str,             # PU006H
                'full_serial': str         # Original serial
            }
        """
        serial = serial.strip().upper()
        match = re.match(cls.SERIAL_PATTERN, serial)
        
        if not match:
            return {
                'is_valid': False,
                'error': f'Invalid PetroTrade serial format: {serial}',
                'expected_format': 'PU006H1355101 (2 letters + 3 digits + 1-2 letters + 7 digits)'
            }
        
        leading_letters = match.group(1)      # PU
        three_digits = int(match.group(2))    # 006
        check_letter1 = match.group(3)        # H
        check_letter2 = match.group(4) or ''  # Optional second check letter
        seven_digit_serial = int(match.group(5))  # 1355101
        
        return {
            'is_valid': True,
            'leading_letters': leading_letters,
            'three_digits': three_digits,
            'check_letter1': check_letter1,
            'check_letter2': check_letter2,
            'seven_digit_serial': seven_digit_serial,
            'prefix': leading_letters + f"{three_digits:03d}" + check_letter1 + check_letter2,
            'full_serial': serial
        }
    
    @classmethod
    def validate_serial(cls, serial: str) -> bool:
        """Validate if a serial number follows PetroTrade format"""
        result = cls.parse_serial(serial)
        return result.get('is_valid', False)
    
    @classmethod
    def generate_serial(cls, leading_letters: str, three_digits: int, 
                       check_letter1: str, check_letter2: str, seven_digit_serial: int) -> str:
        """Generate a serial number from components"""
        return f"{leading_letters}{three_digits:03d}{check_letter1}{check_letter2}{seven_digit_serial:07d}"
    
    @classmethod
    def increment_serial(cls, serial: str) -> str:
        """
        Increment a PetroTrade serial number by 1 using the overflow logic:
        
        1. Increment 7-digit serial (primary incrementer)
        2. If it overflows (9999999 -> 0000000), increment check letters
        3. If check letters overflow (Z -> A), increment 3-digit section  
        4. If 3-digit section overflows (999 -> 000), increment leading letters
        
        Args:
            serial: Current serial number like 'PU006H1355101'
            
        Returns:
            Next serial number in sequence
        """
        parsed = cls.parse_serial(serial)
        if not parsed['is_valid']:
            raise ValidationError(f"Invalid serial format: {serial}")
        
        # Start with current values
        leading = parsed['leading_letters']
        three_digits = parsed['three_digits']
        check1 = parsed['check_letter1']
        check2 = parsed['check_letter2']
        seven_serial = parsed['seven_digit_serial']
        
        # Increment the 7-digit serial (primary incrementer)
        seven_serial += 1
        
        # Handle overflow from 7-digit serial (9999999 -> 0000000)
        if seven_serial >= 10000000:  # 10,000,000 (7 digits max is 9,999,999)
            seven_serial = 0
            
            # Increment check letters
            if check2:  # Two check letters
                check2_ord = ord(check2) + 1
                if check2_ord > ord('Z'):
                    check2 = 'A'
                    check1_ord = ord(check1) + 1
                    if check1_ord > ord('Z'):
                        check1 = 'A'
                        # Increment 3-digit section
                        three_digits += 1
                        if three_digits >= 1000:
                            three_digits = 0
                            # Increment leading letters
                            leading = cls._increment_leading_letters(leading)
                    else:
                        check1 = chr(check1_ord)
                else:
                    check2 = chr(check2_ord)
            else:  # One check letter
                check1_ord = ord(check1) + 1
                if check1_ord > ord('Z'):
                    check1 = 'A'
                    # Increment 3-digit section
                    three_digits += 1
                    if three_digits >= 1000:
                        three_digits = 0
                        # Increment leading letters
                        leading = cls._increment_leading_letters(leading)
                else:
                    check1 = chr(check1_ord)
        
        # Construct the new serial
        return cls.generate_serial(leading, three_digits, check1, check2, seven_serial)
    
    @classmethod
    def _increment_leading_letters(cls, letters: str) -> str:
        """Increment the 2 leading letters (base-26 counter)"""
        if len(letters) != 2:
            raise ValidationError("Leading letters must be exactly 2 characters")
        
        first, second = letters[0], letters[1]
        second_ord = ord(second) + 1
        
        if second_ord > ord('Z'):
            second = 'A'
            first_ord = ord(first) + 1
            if first_ord > ord('Z'):
                first = 'A'  # Complete overflow - start again
            else:
                first = chr(first_ord)
        else:
            second = chr(second_ord)
        
        return first + second
    
    @classmethod
    def generate_range(cls, start_serial: str, end_serial: str) -> List[str]:
        """
        Generate a list of serial numbers from start to end (inclusive)
        
        Args:
            start_serial: Starting serial number like 'PU006H1355101'
            end_serial: Ending serial number like 'PU006H1355200'
            
        Returns:
            List of serial numbers in sequence
        """
        start_parsed = cls.parse_serial(start_serial)
        end_parsed = cls.parse_serial(end_serial)
        
        if not start_parsed['is_valid']:
            raise ValidationError(f"Invalid start serial: {start_serial}")
        if not end_parsed['is_valid']:
            raise ValidationError(f"Invalid end serial: {end_serial}")
        
        # For the same prefix (common case), use simple numeric increment
        if start_parsed['prefix'] == end_parsed['prefix']:
            return cls._generate_simple_range(start_parsed, end_parsed)
        
        # For complex ranges spanning multiple prefixes, use full increment logic
        return cls._generate_complex_range(start_serial, end_serial)
    
    @classmethod
    def _generate_simple_range(cls, start_parsed: Dict, end_parsed: Dict) -> List[str]:
        """Generate range when prefix is the same (most common case)"""
        prefix = start_parsed['prefix']
        start_num = start_parsed['seven_digit_serial']
        end_num = end_parsed['seven_digit_serial']
        
        if end_num < start_num:
            raise ValidationError("End serial must be greater than or equal to start serial")
        
        serials = []
        for num in range(start_num, end_num + 1):
            serials.append(f"{prefix}{num:07d}")
        
        return serials
    
    @classmethod
    def _generate_complex_range(cls, start_serial: str, end_serial: str) -> List[str]:
        """Generate range spanning multiple prefixes (less common)"""
        serials = []
        current = start_serial
        
        # Safety limit to prevent infinite loops
        max_iterations = 1000000
        iterations = 0
        
        while current <= end_serial and iterations < max_iterations:
            serials.append(current)
            if current == end_serial:
                break
            current = cls.increment_serial(current)
            iterations += 1
        
        if iterations >= max_iterations:
            raise ValidationError("Range too large or infinite loop detected")
        
        return serials
    
    @classmethod
    def calculate_book_ranges(cls, box_first: str, box_last: str, 
                            num_books: int, coupons_per_book: int) -> List[Dict[str, any]]:
        """
        Calculate the coupon ranges for each book in a box
        
        Args:
            box_first: First coupon in the box like 'PU006H1355101'
            box_last: Last coupon in the box like 'PU006H1356100'
            num_books: Number of books in the box (e.g., 10)
            coupons_per_book: Number of coupons per book (e.g., 100)
            
        Returns:
            List of dicts with book ranges:
            [
                {
                    'book_number': 1,
                    'first_coupon': 'PU006H1355101', 
                    'last_coupon': 'PU006H1355200',
                    'coupon_count': 100
                },
                ...
            ]
        """
        # Validate inputs
        start_parsed = cls.parse_serial(box_first)
        end_parsed = cls.parse_serial(box_last)
        
        if not start_parsed['is_valid'] or not end_parsed['is_valid']:
            raise ValidationError("Invalid serial number format")
        
        # Calculate total coupons expected
        total_expected = num_books * coupons_per_book
        
        # For simple case (same prefix), calculate directly
        if start_parsed['prefix'] == end_parsed['prefix']:
            actual_total = end_parsed['seven_digit_serial'] - start_parsed['seven_digit_serial'] + 1
            if actual_total != total_expected:
                raise ValidationError(f"Total coupons mismatch: expected {total_expected}, got {actual_total}")
            
            return cls._calculate_simple_book_ranges(start_parsed, num_books, coupons_per_book)
        
        # For complex case, generate full range and split
        all_serials = cls.generate_range(box_first, box_last)
        if len(all_serials) != total_expected:
            raise ValidationError(f"Total coupons mismatch: expected {total_expected}, got {len(all_serials)}")
        
        return cls._split_serials_into_books(all_serials, num_books, coupons_per_book)
    
    @classmethod
    def _calculate_simple_book_ranges(cls, start_parsed: Dict, 
                                    num_books: int, coupons_per_book: int) -> List[Dict[str, any]]:
        """Calculate book ranges for simple case (same prefix)"""
        prefix = start_parsed['prefix']
        start_num = start_parsed['seven_digit_serial']
        
        books = []
        current_start = start_num
        
        for book_num in range(1, num_books + 1):
            book_start = f"{prefix}{current_start:07d}"
            book_end = f"{prefix}{current_start + coupons_per_book - 1:07d}"
            
            books.append({
                'book_number': book_num,
                'first_coupon': book_start,
                'last_coupon': book_end,
                'coupon_count': coupons_per_book
            })
            
            current_start += coupons_per_book
        
        return books
    
    @classmethod
    def _split_serials_into_books(cls, all_serials: List[str], 
                                num_books: int, coupons_per_book: int) -> List[Dict[str, any]]:
        """Split a list of serials into books"""
        books = []
        
        for book_num in range(num_books):
            start_idx = book_num * coupons_per_book
            end_idx = start_idx + coupons_per_book - 1
            
            books.append({
                'book_number': book_num + 1,
                'first_coupon': all_serials[start_idx],
                'last_coupon': all_serials[end_idx],
                'coupon_count': coupons_per_book
            })
        
        return books
    
    @classmethod
    def get_next_serial(cls, serial: str) -> str:
        """Get the next serial number"""
        prefix, number = cls.parse_serial(serial)
        return cls.generate_serial(prefix, number + 1)
    
    @classmethod
    def get_previous_serial(cls, serial: str) -> str:
        """Get the previous serial number"""
        prefix, number = cls.parse_serial(serial)
        if number <= 0:
            raise ValidationError("Cannot get previous serial for number 0")
        return cls.generate_serial(prefix, number - 1)
    
    @classmethod
    def format_for_display(cls, serial: str) -> str:
        """Format serial for display with separators"""
        prefix, number = cls.parse_serial(serial)
        return f"{prefix}-{number:06d}"


def validate_coupon_serial(value: str) -> str:
    """Django model field validator for coupon serials"""
    if not PetroTradeSerial.validate_serial(value):
        raise ValidationError(
            f'Invalid coupon serial format: {value}. '
            f'Expected format like PU006H1355101'
        )
    return value.strip().upper()


# Example usage functions
def example_usage():
    """Example usage of Enhanced PetroTradeSerial utilities"""
    
    print("Enhanced PetroTrade Coupon Serial Utilities Demo")
    print("=" * 50)
    
    # Example from the coupon book image
    first_serial = "PU006H1355101"
    last_serial = "PU006H1355200"
    
    print(f"Testing with serials from the image:")
    print(f"Start: {first_serial}")
    print(f"End: {last_serial}")
    
    # Parse serials
    start_info = PetroTradeSerial.parse_serial(first_serial)
    end_info = PetroTradeSerial.parse_serial(last_serial)
    
    print(f"\nParsed Start: {start_info}")
    print(f"Parsed End: {end_info}")
    
    # Generate the range
    serials = PetroTradeSerial.generate_range(first_serial, last_serial)
    print(f"\nGenerated {len(serials)} serials")
    print(f"First 5: {serials[:5]}")
    print(f"Last 5: {serials[-5:]}")
    
    # Test box with 10 books calculation
    print("\n" + "=" * 50)
    print("Box with 10 Books Example")
    print("=" * 50)
    
    box_first = "PU006H1355101"
    box_last = "PU006H1356100"  # 1000 coupons total (10 books × 100 coupons)
    
    try:
        book_ranges = PetroTradeSerial.calculate_book_ranges(box_first, box_last, 10, 100)
        
        print(f"Box: {box_first} to {box_last}")
        print("Book ranges:")
        for book in book_ranges:
            print(f"  Book {book['book_number']:2d}: {book['first_coupon']} - {book['last_coupon']} ({book['coupon_count']} coupons)")
    
    except Exception as e:
        print(f"Error: {e}")
    
    # Test increment logic
    print("\n" + "=" * 50)
    print("Testing Increment Logic")
    print("=" * 50)
    
    test_serials = ["PU006H1355199", "PU006H1355200", "PU006H1359999"]
    
    for serial in test_serials:
        try:
            next_serial = PetroTradeSerial.increment_serial(serial)
            print(f"{serial} -> {next_serial}")
        except Exception as e:
            print(f"{serial} -> Error: {e}")
    
    # Test the actual book from the image
    print("\n" + "=" * 50)
    print("Single Book from Image (100 coupons)")
    print("=" * 50)
    
    image_book_ranges = PetroTradeSerial.calculate_book_ranges(
        "PU006H1355101", "PU006H1355200", 1, 100
    )
    
    for book in image_book_ranges:
        print(f"Book {book['book_number']}: {book['first_coupon']} - {book['last_coupon']} ({book['coupon_count']} coupons)")
        
        # Generate first and last few coupons
        book_serials = PetroTradeSerial.generate_range(book['first_coupon'], book['last_coupon'])
        print(f"  First 3: {book_serials[:3]}")
        print(f"  Last 3: {book_serials[-3:]}")
        print(f"  Total: {len(book_serials)} coupons")


if __name__ == "__main__":
    example_usage()
