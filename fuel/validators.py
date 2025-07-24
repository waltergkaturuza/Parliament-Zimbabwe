"""
Model validators for PetroTrade coupon system
"""
from django.core.exceptions import ValidationError
from .utils.petrotrade_serials import PetroTradeSerial


def validate_petrotrade_serial(value):
    """
    Django model validator for PetroTrade coupon serial numbers
    Validates format like PU006H355101
    """
    if not value:
        return value
    
    try:
        # This will raise ValidationError if invalid
        PetroTradeSerial.parse_serial(value)
        return value.strip().upper()
    except ValidationError as e:
        raise ValidationError(str(e))


def validate_serial_range(first_serial, last_serial):
    """
    Validate that a first-last serial range is valid
    """
    if not first_serial or not last_serial:
        return
    
    try:
        first_prefix, first_num = PetroTradeSerial.parse_serial(first_serial)
        last_prefix, last_num = PetroTradeSerial.parse_serial(last_serial)
        
        if first_prefix != last_prefix:
            raise ValidationError("First and last serial must have the same prefix")
        
        if first_num >= last_num:
            raise ValidationError("Last serial number must be greater than first serial number")
    
    except ValidationError:
        raise
