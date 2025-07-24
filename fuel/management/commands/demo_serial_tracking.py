"""
Comprehensive Serial Tracking Management Command
==============================================

This command demonstrates how to track coupon serials throughout the entire lifecycle:
1. Box Receipt
2. Book Dispatch to Subcenters  
3. Coupon Allocation to Beneficiaries
4. Handover and Usage Tracking
5. Remaining Inventory Calculation
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from fuel.models import (
    Box, Book, Coupon, SubCenter, User, BookDispatch, 
    CouponAllocation, SerialMovement
)
from fuel.utils.serial_tracking import SerialRangeTracker, SerialAllocationTracker
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Demonstrate comprehensive serial tracking across all operations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo-scenario',
            type=str,
            choices=['full_lifecycle', 'dispatch_only', 'allocation_only', 'inventory_check'],
            default='full_lifecycle',
            help='Which scenario to demonstrate'
        )
        parser.add_argument(
            '--box-code',
            type=str,
            help='Existing box code to use for demo (if not provided, creates new)'
        )

    def handle(self, *args, **options):
        scenario = options['demo_scenario']
        box_code = options.get('box_code')
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 STARTING SERIAL TRACKING DEMO: {scenario.upper()}')
        )
        
        try:
            if scenario == 'full_lifecycle':
                self.demonstrate_full_lifecycle(box_code)
            elif scenario == 'dispatch_only':
                self.demonstrate_dispatch_tracking(box_code)
            elif scenario == 'allocation_only':
                self.demonstrate_allocation_tracking(box_code)
            elif scenario == 'inventory_check':
                self.demonstrate_inventory_tracking(box_code)
                
        except Exception as e:
            raise CommandError(f'Demo failed: {str(e)}')

    def demonstrate_full_lifecycle(self, box_code=None):
        """Demonstrate complete coupon lifecycle with serial tracking"""
        
        with transaction.atomic():
            # Step 1: Create or get existing box
            if box_code:
                try:
                    box = Box.objects.get(box_code=box_code)
                    self.stdout.write(f'📦 Using existing box: {box.box_code}')
                except Box.DoesNotExist:
                    raise CommandError(f'Box {box_code} not found')
            else:
                box = self.create_demo_box()
            
            # Step 2: Demonstrate dispatch tracking
            dispatch = self.demo_book_dispatch(box)
            
            # Step 3: Demonstrate allocation tracking
            allocations = self.demo_coupon_allocations(dispatch)
            
            # Step 4: Demonstrate handover and usage
            self.demo_handover_and_usage(allocations)
            
            # Step 5: Show remaining inventory
            self.demo_inventory_summary(box)

    def create_demo_box(self):
        """Create a demo box for testing"""
        first_serial = 'PU006H355101'
        last_serial = 'PU006H355300'  # 200 coupons
        
        self.stdout.write('\n📦 CREATING DEMO BOX')
        self.stdout.write('='*50)
        
        # Create box with serial tracking
        box = Box.objects.create(
            fuel_type='DIESEL',
            denomination=20,
            first_coupon_number=first_serial,
            last_coupon_number=last_serial,
            number_of_books=2,  # 100 coupons per book
            coupons_per_book=100
        )
        
        # Create books
        book_ranges = SerialRangeTracker.split_range_into_books(
            first_serial, last_serial, 100
        )
        
        for book_data in book_ranges:
            Book.objects.create(
                box=box,
                book_number=f"Book {book_data['book_number']:02d}",
                first_coupon_number=book_data['first_serial'],
                last_coupon_number=book_data['last_serial'],
                initial_coupon_count=book_data['coupon_count']
            )
        
        # Record box receipt movement
        SerialMovement.create_movement(
            movement_type='BOX_RECEIVED',
            first_serial=first_serial,
            last_serial=last_serial,
            performed_by=None,
            notes=f'Demo box creation - {box.box_code}'
        )
        
        self.stdout.write(f'✅ Created demo box: {box.box_code}')
        self.stdout.write(f'   Serial Range: {first_serial} - {last_serial}')
        self.stdout.write(f'   Books: {box.books.count()}')
        
        return box

    def demo_book_dispatch(self, box):
        """Demonstrate dispatching books to subcenters with serial tracking"""
        
        self.stdout.write('\n🚚 DEMONSTRATING BOOK DISPATCH')
        self.stdout.write('='*50)
        
        # Get or create a subcenter
        subcenter, created = SubCenter.objects.get_or_create(
            name='Demo Subcenter',
            defaults={
                'code': 'DEMO001',
                'location': 'Demo Location for Serial Tracking',
                'managed_by': None,
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created demo subcenter: {subcenter.name}')
        
        # Dispatch first book
        book = box.books.first()
        
        dispatch = BookDispatch.objects.create(
            to_center=subcenter,
            status='DISPATCHED',
            notes='Demo dispatch for serial tracking'
        )
        dispatch.books.add(book)
        dispatch.calculate_serial_range()  # This calculates first/last serials
        
        # Record dispatch movement
        SerialMovement.create_movement(
            movement_type='BOOK_DISPATCH',
            first_serial=book.first_coupon_number,
            last_serial=book.last_coupon_number,
            performed_by=None,
            notes=f'Dispatched {book.book_number} to {subcenter.name}'
        )
        
        # Get dispatch summary
        summary = dispatch.get_serial_summary()
        
        self.stdout.write(f'✅ Dispatched book to {subcenter.name}')
        self.stdout.write(f'   Book: {book.book_number}')
        self.stdout.write(f'   Serial Range: {summary["overall_range"]["first_serial"]} - {summary["overall_range"]["last_serial"]}')
        self.stdout.write(f'   Total Coupons: {summary["overall_range"]["total_coupons"]}')
        
        return dispatch

    def demo_coupon_allocations(self, dispatch):
        """Demonstrate allocating coupons to beneficiaries with serial tracking"""
        
        self.stdout.write('\n👥 DEMONSTRATING COUPON ALLOCATIONS')
        self.stdout.write('='*50)
        
        # Get or create demo beneficiaries
        beneficiaries = []
        for i in range(3):
            user, created = User.objects.get_or_create(
                username=f'demo_beneficiary_{i+1}',
                defaults={
                    'first_name': f'Demo',
                    'last_name': f'Beneficiary {i+1}',
                    'email': f'demo{i+1}@parliament.zw',
                    'role': 'BENEFICIARY'
                }
            )
            beneficiaries.append(user)
            if created:
                self.stdout.write(f'✅ Created demo beneficiary: {user.get_full_name()}')
        
        # Get the dispatched book
        book = dispatch.books.first()
        subcenter = dispatch.to_center
        
        # Create allocation tracker for the book
        tracker = SerialAllocationTracker(
            book.first_coupon_number, 
            book.last_coupon_number
        )
        
        # Allocate portions to each beneficiary
        allocations = []
        current_serial_num = SerialRangeTracker.parse_coupon_serial(book.first_coupon_number)['number']
        prefix = SerialRangeTracker.parse_coupon_serial(book.first_coupon_number)['prefix']
        
        for i, beneficiary in enumerate(beneficiaries):
            # Allocate 3 coupons to each beneficiary (total 9 out of 10)
            allocation_size = 3
            first_alloc_serial = f"{prefix}{current_serial_num:06d}"
            last_alloc_serial = f"{prefix}{(current_serial_num + allocation_size - 1):06d}"
            
            # Create allocation record
            allocation = CouponAllocation.objects.create(
                sub_center=subcenter,
                beneficiary=beneficiary,
                book=book,
                first_coupon_number=first_alloc_serial,
                last_coupon_number=last_alloc_serial,
                quantity=allocation_size,
                status='ALLOCATED',
                notes=f'Demo allocation {i+1}'
            )
            allocations.append(allocation)
            
            # Add to tracker
            tracker.add_allocation(
                first_alloc_serial, 
                last_alloc_serial, 
                f'Allocated to {beneficiary.get_full_name()}'
            )
            
            # Record allocation movement
            SerialMovement.create_movement(
                movement_type='COUPON_ALLOCATED',
                first_serial=first_alloc_serial,
                last_serial=last_alloc_serial,
                performed_by=None,
                notes=f'Allocated to {beneficiary.get_full_name()}'
            )
            
            # Get allocation summary
            alloc_summary = allocation.get_allocation_summary()
            
            self.stdout.write(f'✅ Allocated to {beneficiary.get_full_name()}')
            self.stdout.write(f'   Serial Range: {first_alloc_serial} - {last_alloc_serial}')
            self.stdout.write(f'   Quantity: {allocation_size} coupons')
            
            current_serial_num += allocation_size
        
        # Show remaining inventory
        remaining_summary = tracker.get_allocation_summary()
        self.stdout.write(f'\n📊 ALLOCATION SUMMARY:')
        self.stdout.write(f'   Total Allocated: {remaining_summary["total_allocated"]} coupons')
        self.stdout.write(f'   Total Remaining: {remaining_summary["total_remaining"]} coupons')
        self.stdout.write(f'   Allocation %: {remaining_summary["allocation_percentage"]:.1f}%')
        
        if remaining_summary['remaining_ranges']:
            self.stdout.write(f'   Remaining Ranges:')
            for rng in remaining_summary['remaining_ranges']:
                self.stdout.write(f'     {rng["first_serial"]} - {rng["last_serial"]} ({rng["count"]} coupons)')
        
        return allocations

    def demo_handover_and_usage(self, allocations):
        """Demonstrate handover and usage tracking"""
        
        self.stdout.write('\n🤝 DEMONSTRATING HANDOVER & USAGE')
        self.stdout.write('='*50)
        
        # Simulate handover and usage for first allocation
        allocation = allocations[0]
        beneficiary = allocation.beneficiary
        
        # Simulate using half of the allocated coupons
        range_info = SerialRangeTracker.calculate_range_info(
            allocation.first_coupon_number, allocation.last_coupon_number
        )
        
        used_count = range_info['total_count'] // 2
        first_used_num = range_info['first_number']
        last_used_num = first_used_num + used_count - 1
        prefix = range_info['prefix']
        
        first_used_serial = f"{prefix}{first_used_num:06d}"
        last_used_serial = f"{prefix}{last_used_num:06d}"
        
        # Record handover movement
        SerialMovement.create_movement(
            movement_type='COUPON_HANDOVER',
            first_serial=first_used_serial,
            last_serial=last_used_serial,
            performed_by=None,
            notes=f'Demo handover by {beneficiary.get_full_name()}'
        )
        
        # Record usage movement
        SerialMovement.create_movement(
            movement_type='COUPON_USED',
            first_serial=first_used_serial,
            last_serial=last_used_serial,
            performed_by=None,
            notes=f'Demo coupon usage - fuel dispensed'
        )
        
        self.stdout.write(f'✅ Simulated handover and usage for {beneficiary.get_full_name()}')
        self.stdout.write(f'   Used Range: {first_used_serial} - {last_used_serial}')
        self.stdout.write(f'   Used Count: {used_count} coupons')
        self.stdout.write(f'   Remaining with Beneficiary: {range_info["total_count"] - used_count} coupons')

    def demo_inventory_summary(self, box):
        """Show comprehensive inventory summary"""
        
        self.stdout.write('\n📊 COMPREHENSIVE INVENTORY SUMMARY')
        self.stdout.write('='*50)
        
        # Get all movements related to this box's serial range
        box_first = SerialRangeTracker.parse_coupon_serial(box.first_coupon_number)
        movements = SerialMovement.objects.filter(
            first_serial__startswith=box_first['prefix']
        ).order_by('movement_date')
        
        self.stdout.write(f'📦 Box: {box.box_code}')
        self.stdout.write(f'   Original Range: {box.first_coupon_number} - {box.last_coupon_number}')
        
        # Calculate total coupons
        box_range = SerialRangeTracker.calculate_range_info(
            box.first_coupon_number, box.last_coupon_number
        )
        self.stdout.write(f'   Total Coupons: {box_range["total_count"]}')
        
        self.stdout.write(f'\n📋 MOVEMENT HISTORY ({movements.count()} movements):')
        for movement in movements:
            self.stdout.write(
                f'   {movement.movement_date.strftime("%Y-%m-%d %H:%M")} - '
                f'{movement.get_movement_type_display()}: '
                f'{movement.first_serial}-{movement.last_serial} '
                f'({movement.quantity} coupons) '
                f'[{movement.notes}]'
            )
        
        # Summary by movement type
        movement_summary = {}
        for movement in movements:
            movement_type = movement.get_movement_type_display()
            if movement_type not in movement_summary:
                movement_summary[movement_type] = 0
            movement_summary[movement_type] += movement.quantity
        
        self.stdout.write(f'\n📈 MOVEMENT SUMMARY:')
        for movement_type, total in movement_summary.items():
            self.stdout.write(f'   {movement_type}: {total} coupons')
        
        # Current status summary
        allocations = CouponAllocation.objects.filter(book__box=box)
        total_allocated = sum(a.quantity for a in allocations)
        used_movements = movements.filter(movement_type='COUPON_USED')
        total_used = sum(m.quantity for m in used_movements)
        
        self.stdout.write(f'\n🎯 CURRENT STATUS:')
        self.stdout.write(f'   Total Coupons: {box_range["total_count"]}')
        self.stdout.write(f'   Allocated: {total_allocated}')
        self.stdout.write(f'   Used: {total_used}')
        self.stdout.write(f'   Available: {box_range["total_count"] - total_allocated}')
        
        self.stdout.write('\n✨ DEMO COMPLETED SUCCESSFULLY!')
        self.stdout.write('='*50)

    def demonstrate_dispatch_tracking(self, box_code):
        """Focus on dispatch tracking only"""
        # Implementation for dispatch-only demo
        pass

    def demonstrate_allocation_tracking(self, box_code):
        """Focus on allocation tracking only"""
        # Implementation for allocation-only demo
        pass

    def demonstrate_inventory_tracking(self, box_code):
        """Focus on inventory tracking only"""
        # Implementation for inventory-only demo
        pass
