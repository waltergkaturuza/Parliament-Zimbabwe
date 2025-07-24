"""
PetroTrade Coupon Serial Number Utilities
Handles validation and generation of coupon serials in the PU006H355101 format
"""
import re
from typing import List, Tuple, Optional
from django.core.exceptions import ValidationError


class PetroTradeSerial:
    """Utility class for handling PetroTrade coupon serial numbers"""
    
    # PetroTrade serial format: PREFIX + 7-digit number
    # Example: PU006H1355101 = PU006H1 + 355101
    SERIAL_PATTERN = r'^([A-Z0-9]+[A-Z]\d?)(\d{6})$'
    
    @classmethod
    def parse_serial(cls, serial: str) -> Tuple[str, int]:
        """
        Parse a coupon serial into prefix and number
        Returns: (prefix, number)
        Example: PU006H1355101 -> ('PU006H1', 355101)
        """
        serial = serial.strip().upper()
        match = re.match(cls.SERIAL_PATTERN, serial)
        
        if not match:
            raise ValidationError(
                f'Invalid coupon serial format: {serial}. '
                f'Expected format like PU006H1355101'
            )
        
        prefix = match.group(1)
        number = int(match.group(2))
        return prefix, number
    
    @classmethod
    def validate_serial(cls, serial: str) -> bool:
        """Validate if a serial number follows PetroTrade format"""
        try:
            cls.parse_serial(serial)
            return True
        except ValidationError:
            return False
    
    @classmethod
    def generate_serial(cls, prefix: str, number: int) -> str:
        """Generate a serial number from prefix and number"""
        return f"{prefix}{number:06d}"
    
    @classmethod
    def generate_range(cls, first_serial: str, last_serial: str) -> List[str]:
        """Generate all serial numbers in a range"""
        first_prefix, first_num = cls.parse_serial(first_serial)
        last_prefix, last_num = cls.parse_serial(last_serial)
        
        if first_prefix != last_prefix:
            raise ValidationError("First and last serial must have same prefix")
        
        if first_num > last_num:
            raise ValidationError("First serial number must be <= last serial number")
        
        return [
            cls.generate_serial(first_prefix, num)
            for num in range(first_num, last_num + 1)
        ]
    
    @classmethod
    def calculate_total_coupons(cls, first_serial: str, last_serial: str) -> int:
        """Calculate total coupons between first and last serial"""
        first_prefix, first_num = cls.parse_serial(first_serial)
        last_prefix, last_num = cls.parse_serial(last_serial)
        
        if first_prefix != last_prefix:
            raise ValidationError("First and last serial must have same prefix")
        
        return max(0, last_num - first_num + 1)
    
    @classmethod
    def split_into_books(cls, first_serial: str, last_serial: str, 
                        coupons_per_book: int = 100) -> List[Tuple[str, str, int]]:
        """
        Split a serial range into books
        Returns: List of (book_first_serial, book_last_serial, coupon_count)
        """
        first_prefix, first_num = cls.parse_serial(first_serial)
        last_prefix, last_num = cls.parse_serial(last_serial)
        
        if first_prefix != last_prefix:
            raise ValidationError("First and last serial must have same prefix")
        
        books = []
        current_num = first_num
        
        while current_num <= last_num:
            book_first = current_num
            book_last = min(current_num + coupons_per_book - 1, last_num)
            book_count = book_last - book_first + 1
            
            books.append((
                cls.generate_serial(first_prefix, book_first),
                cls.generate_serial(first_prefix, book_last),
                book_count
            ))
            
            current_num = book_last + 1
        
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
    """Example usage of PetroTradeSerial utilities"""
    
    # Example from your data
    first_serial = "PU006H1355101"
    last_serial = "PU006H1355200"
    
    print("PetroTrade Coupon Serial Utilities Demo")
    print("=" * 40)
    
    # Parse serials
    first_prefix, first_num = PetroTradeSerial.parse_serial(first_serial)
    print(f"First Serial: {first_serial}")
    print(f"  Prefix: {first_prefix}")
    print(f"  Number: {first_num}")
    
    # Calculate total
    total = PetroTradeSerial.calculate_total_coupons(first_serial, last_serial)
    print(f"\nTotal Coupons: {total}")
    
    # Split into books
    books = PetroTradeSerial.split_into_books(first_serial, last_serial, 100)
    print(f"\nBooks (100 coupons each):")
    for i, (book_first, book_last, count) in enumerate(books, 1):
        print(f"  Book {i:02d}: {book_first} - {book_last} ({count} coupons)")
    
    # Generate a few serials in the range
    print(f"\nFirst 5 serials:")
    serials = PetroTradeSerial.generate_range(first_serial, 
        PetroTradeSerial.generate_serial(first_prefix, first_num + 4))
    for serial in serials:
        print(f"  {serial}")


if __name__ == "__main__":
    example_usage()
