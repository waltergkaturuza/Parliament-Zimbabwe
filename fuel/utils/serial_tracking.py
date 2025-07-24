"""
Comprehensive Serial Range Tracking System
==========================================

This module provides utilities for tracking coupon serial ranges throughout 
the entire coupon lifecycle: receiving, dispatching, handover, allocation, 
and beneficiary management.

Key Concepts:
- Every operation tracks first_serial and last_serial
- Automatic calculation of remaining serials
- Book and page level tracking
- Beneficiary allocation tracking
- Audit trail of all serial movements
"""

from typing import List, Dict, Tuple, Optional
from django.core.exceptions import ValidationError
from .petrotrade_serials import PetroTradeSerial
import re


class SerialRangeTracker:
    """
    Comprehensive utility for tracking coupon serial ranges across all operations
    """
    
    @staticmethod
    def parse_coupon_serial(serial: str) -> Dict:
        """
        Parse any coupon serial format (PetroTrade or legacy)
        Returns standardized format for tracking
        """
        # First try PetroTrade format
        try:
            prefix, number = PetroTradeSerial.parse_serial(serial)
            return {
                'is_valid': True,
                'format': 'PETROTRADE',
                'prefix': prefix,
                'number': number,
                'formatted': serial.strip().upper(),
                'sort_key': number
            }
        except ValidationError:
            pass  # Try legacy format
        
        # Try legacy format (e.g., PU00GH355101)
        legacy_pattern = r'^([A-Z0-9]+)(\d{6,})$'
        match = re.match(legacy_pattern, serial.strip().upper())
        if match:
            prefix = match.group(1)
            number = int(match.group(2))
            return {
                'is_valid': True,
                'format': 'LEGACY',
                'prefix': prefix,
                'number': number,
                'formatted': serial.strip().upper(),
                'sort_key': number
            }
        
        return {
            'is_valid': False,
            'format': 'UNKNOWN',
            'prefix': '',
            'number': 0,
            'formatted': serial,
            'sort_key': 0,
            'error': 'Invalid serial format'
        }
    
    @staticmethod
    def validate_serial_range(first_serial: str, last_serial: str) -> Tuple[bool, str]:
        """
        Validate that first and last serials form a valid range
        """
        first_info = SerialRangeTracker.parse_coupon_serial(first_serial)
        last_info = SerialRangeTracker.parse_coupon_serial(last_serial)
        
        if not first_info['is_valid']:
            return False, f"Invalid first serial: {first_info.get('error', 'Unknown format')}"
        
        if not last_info['is_valid']:
            return False, f"Invalid last serial: {last_info.get('error', 'Unknown format')}"
        
        if first_info['prefix'] != last_info['prefix']:
            return False, "First and last serials must have the same prefix"
        
        if first_info['number'] >= last_info['number']:
            return False, "Last serial number must be greater than first serial number"
        
        return True, "Valid serial range"
    
    @staticmethod
    def calculate_range_info(first_serial: str, last_serial: str) -> Dict:
        """
        Calculate comprehensive information about a serial range
        """
        is_valid, message = SerialRangeTracker.validate_serial_range(first_serial, last_serial)
        
        if not is_valid:
            return {
                'is_valid': False,
                'error': message,
                'total_count': 0,
                'first_info': None,
                'last_info': None
            }
        
        first_info = SerialRangeTracker.parse_coupon_serial(first_serial)
        last_info = SerialRangeTracker.parse_coupon_serial(last_serial)
        
        total_count = last_info['number'] - first_info['number'] + 1
        
        return {
            'is_valid': True,
            'total_count': total_count,
            'first_info': first_info,
            'last_info': last_info,
            'prefix': first_info['prefix'],
            'first_number': first_info['number'],
            'last_number': last_info['number'],
            'format': first_info['format']
        }
    
    @staticmethod
    def generate_serial_list(first_serial: str, last_serial: str) -> List[str]:
        """
        Generate list of all serials in a range
        """
        range_info = SerialRangeTracker.calculate_range_info(first_serial, last_serial)
        
        if not range_info['is_valid']:
            raise ValueError(range_info['error'])
        
        serials = []
        prefix = range_info['prefix']
        
        # Determine number length from first serial
        first_number_str = str(range_info['first_number'])
        if range_info['format'] == 'PETROTRADE':
            number_length = 6  # PetroTrade always uses 6 digits
        else:
            number_length = len(first_number_str)
        
        for num in range(range_info['first_number'], range_info['last_number'] + 1):
            serial = f"{prefix}{num:0{number_length}d}"
            serials.append(serial)
        
        return serials
    
    @staticmethod
    def split_range_into_books(first_serial: str, last_serial: str, coupons_per_book: int) -> List[Dict]:
        """
        Split a serial range into books
        """
        range_info = SerialRangeTracker.calculate_range_info(first_serial, last_serial)
        
        if not range_info['is_valid']:
            raise ValueError(range_info['error'])
        
        books = []
        current_number = range_info['first_number']
        book_number = 1
        prefix = range_info['prefix']
        
        # Determine number length
        number_length = 6 if range_info['format'] == 'PETROTRADE' else len(str(range_info['first_number']))
        
        while current_number <= range_info['last_number']:
            book_last_number = min(current_number + coupons_per_book - 1, range_info['last_number'])
            coupon_count = book_last_number - current_number + 1
            
            book_first_serial = f"{prefix}{current_number:0{number_length}d}"
            book_last_serial = f"{prefix}{book_last_number:0{number_length}d}"
            
            books.append({
                'book_number': book_number,
                'first_serial': book_first_serial,
                'last_serial': book_last_serial,
                'coupon_count': coupon_count,
                'first_number': current_number,
                'last_number': book_last_number
            })
            
            current_number = book_last_number + 1
            book_number += 1
        
        return books
    
    @staticmethod
    def find_range_gaps(allocated_ranges: List[Tuple[str, str]], total_first: str, total_last: str) -> List[Dict]:
        """
        Find gaps in allocated ranges to determine what's still available
        """
        range_info = SerialRangeTracker.calculate_range_info(total_first, total_last)
        if not range_info['is_valid']:
            return []
        
        # Convert allocated ranges to number ranges
        allocated_numbers = []
        for first, last in allocated_ranges:
            first_info = SerialRangeTracker.parse_coupon_serial(first)
            last_info = SerialRangeTracker.parse_coupon_serial(last)
            if first_info['is_valid'] and last_info['is_valid']:
                allocated_numbers.append((first_info['number'], last_info['number']))
        
        # Sort allocated ranges
        allocated_numbers.sort()
        
        # Find gaps
        gaps = []
        current_pos = range_info['first_number']
        prefix = range_info['prefix']
        number_length = 6 if range_info['format'] == 'PETROTRADE' else len(str(range_info['first_number']))
        
        for alloc_start, alloc_end in allocated_numbers:
            if current_pos < alloc_start:
                # There's a gap before this allocation
                gap_first = f"{prefix}{current_pos:0{number_length}d}"
                gap_last = f"{prefix}{(alloc_start - 1):0{number_length}d}"
                gaps.append({
                    'first_serial': gap_first,
                    'last_serial': gap_last,
                    'count': alloc_start - current_pos
                })
            current_pos = max(current_pos, alloc_end + 1)
        
        # Check for gap at the end
        if current_pos <= range_info['last_number']:
            gap_first = f"{prefix}{current_pos:0{number_length}d}"
            gap_last = f"{prefix}{range_info['last_number']:0{number_length}d}"
            gaps.append({
                'first_serial': gap_first,
                'last_serial': gap_last,
                'count': range_info['last_number'] - current_pos + 1
            })
        
        return gaps


class SerialAllocationTracker:
    """
    Track serial allocations and calculate remaining availability
    """
    
    def __init__(self, container_first_serial: str, container_last_serial: str):
        self.container_first = container_first_serial
        self.container_last = container_last_serial
        self.allocations = []  # List of (first, last, description) tuples
    
    def add_allocation(self, first_serial: str, last_serial: str, description: str = ""):
        """Add an allocation and validate it fits within container range"""
        # Validate allocation range
        is_valid, message = SerialRangeTracker.validate_serial_range(first_serial, last_serial)
        if not is_valid:
            raise ValueError(f"Invalid allocation range: {message}")
        
        # Check if allocation fits within container
        first_info = SerialRangeTracker.parse_coupon_serial(first_serial)
        last_info = SerialRangeTracker.parse_coupon_serial(last_serial)
        container_first_info = SerialRangeTracker.parse_coupon_serial(self.container_first)
        container_last_info = SerialRangeTracker.parse_coupon_serial(self.container_last)
        
        if (first_info['number'] < container_first_info['number'] or 
            last_info['number'] > container_last_info['number']):
            raise ValueError("Allocation range exceeds container boundaries")
        
        self.allocations.append((first_serial, last_serial, description))
    
    def allocate_serials(self, quantity: int, description: str = "") -> Dict:
        """
        Allocate a specific quantity of serials from the remaining ranges
        Returns dict with allocation details
        """
        remaining_ranges = self.get_remaining_ranges()
        
        if not remaining_ranges:
            raise ValueError("No serials remaining for allocation")
        
        total_remaining = sum(r['count'] for r in remaining_ranges)
        if quantity > total_remaining:
            raise ValueError(f"Requested {quantity} serials but only {total_remaining} remaining")
        
        # Allocate from the first available range
        first_range = remaining_ranges[0]
        
        if quantity > first_range['count']:
            # For now, just allocate what's available in first range
            # In a more complex implementation, we could span multiple ranges
            raise ValueError(f"Requested {quantity} serials but first available range only has {first_range['count']}")
        
        # Calculate allocation range
        first_info = SerialRangeTracker.parse_coupon_serial(first_range['first_serial'])
        allocation_first = first_range['first_serial']
        allocation_last_number = first_info['number'] + quantity - 1
        
        if first_info['format'] == 'PETROTRADE':
            allocation_last = f"{first_info['prefix']}{allocation_last_number:06d}"
        else:
            # Legacy format
            allocation_last = f"{first_info['prefix']}{allocation_last_number}"
        
        # Add the allocation
        self.add_allocation(allocation_first, allocation_last, description)
        
        return {
            'first_serial': allocation_first,
            'last_serial': allocation_last,
            'quantity': quantity,
            'description': description
        }
    
    def get_remaining_count(self) -> int:
        """Get total count of remaining serials"""
        remaining_ranges = self.get_remaining_ranges()
        return sum(r['count'] for r in remaining_ranges)
    
    def get_remaining_ranges(self) -> List[Dict]:
        """Get list of unallocated serial ranges"""
        return SerialRangeTracker.find_range_gaps(
            [(first, last) for first, last, _ in self.allocations],
            self.container_first,
            self.container_last
        )
    
    def get_allocation_summary(self) -> Dict:
        """Get comprehensive allocation summary"""
        container_info = SerialRangeTracker.calculate_range_info(self.container_first, self.container_last)
        
        total_allocated = 0
        allocation_details = []
        
        for first, last, description in self.allocations:
            alloc_info = SerialRangeTracker.calculate_range_info(first, last)
            total_allocated += alloc_info['total_count']
            allocation_details.append({
                'first_serial': first,
                'last_serial': last,
                'count': alloc_info['total_count'],
                'description': description
            })
        
        remaining_ranges = self.get_remaining_ranges()
        total_remaining = sum(r['count'] for r in remaining_ranges)
        
        return {
            'container_total': container_info['total_count'],
            'total_allocated': total_allocated,
            'total_remaining': total_remaining,
            'allocation_details': allocation_details,
            'remaining_ranges': remaining_ranges,
            'allocation_percentage': (total_allocated / container_info['total_count'] * 100) if container_info['total_count'] > 0 else 0
        }
