#!/usr/bin/env python3
"""
Test script for Book Dispatch System
Verifies books and coupon implementation for dispatch system
"""

import os
import sys
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from decimal import Decimal

# Add project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_path)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now import Django models and utilities
from fuel.models import (
    Box, Book, Coupon, BookPage, BookDispatch, SubCenter, Program, ParliamentSession
)
from django.utils import timezone
from django.db import transaction
import json

User = get_user_model()


class BookDispatchTest:
    """Test class for Book Dispatch functionality"""
    
    def __init__(self):
        self.client = Client()
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test data for dispatch testing"""
        print("Setting up test data...")
        
        try:
            with transaction.atomic():
                # Create test user
                self.user = User.objects.get_or_create(
                    username='test_dispatcher',
                    defaults={
                        'email': 'test@example.com',
                        'first_name': 'Test',
                        'last_name': 'Dispatcher'
                    }
                )[0]
                
                # Create test subcenter
                self.subcenter = SubCenter.objects.get_or_create(
                    name='Test SubCenter',
                    defaults={
                        'center_code': 'TSC001',
                        'location': 'Test Location'
                    }
                )[0]
                
                # Create test program and session
                self.program = Program.objects.get_or_create(
                    name='Test Program',
                    defaults={'description': 'Test program for dispatch'}
                )[0]
                
                self.session = ParliamentSession.objects.get_or_create(
                    name='Test Session 2025',
                    defaults={
                        'start_date': timezone.now().date(),
                        'end_date': timezone.now().date()
                    }
                )[0]
                
                # Create test box
                self.box = Box.objects.get_or_create(
                    box_code='TEST-BOX-001',
                    defaults={
                        'fuel_type': 'DIESEL',
                        'denomination': 20,
                        'first_coupon_number': 'PU00GH355001',
                        'last_coupon_number': 'PU00GH355100',
                        'is_received': True,
                        'date_received': timezone.now(),
                        'coupons_per_book': 10,
                        'total_coupons': 100
                    }
                )[0]
                
                # Create test book
                self.book = Book.objects.get_or_create(
                    box=self.box,
                    book_number='BOOK-001',
                    defaults={
                        'first_coupon_number': 'PU00GH355001',
                        'last_coupon_number': 'PU00GH355010',
                        'initial_coupon_count': 10,
                        'is_assigned': False
                    }
                )[0]
                
                # Generate coupons for the book
                if not self.book.coupons.exists():
                    self.book.generate_coupons()
                
                print(f"✅ Test data setup complete")
                print(f"   - User: {self.user.username}")
                print(f"   - SubCenter: {self.subcenter.name}")
                print(f"   - Box: {self.box.box_code}")
                print(f"   - Book: {self.book.book_number}")
                print(f"   - Coupons: {self.book.coupons.count()}")
                
        except Exception as e:
            print(f"❌ Error setting up test data: {e}")
            raise
    
    def test_book_model(self):
        """Test Book model functionality"""
        print("\n📖 Testing Book Model...")
        
        try:
            # Test book properties
            assert self.book.box == self.box, "Book should be linked to box"
            assert self.book.initial_coupon_count == 10, f"Expected 10 coupons, got {self.book.initial_coupon_count}"
            assert not self.book.is_assigned, "Book should not be assigned initially"
            
            # Test coupon generation
            coupons = self.book.coupons.all()
            assert coupons.count() > 0, "Book should have generated coupons"
            print(f"   ✅ Book has {coupons.count()} coupons")
            
            # Test coupon properties
            first_coupon = coupons.first()
            assert first_coupon.book == self.book, "Coupon should be linked to book"
            assert first_coupon.litres == self.box.denomination, "Coupon litres should match box denomination"
            assert first_coupon.status == 'AVAILABLE', "New coupon should be available"
            
            print("   ✅ Book model tests passed")
            return True
            
        except Exception as e:
            print(f"   ❌ Book model test failed: {e}")
            return False
    
    def test_coupon_model(self):
        """Test Coupon model functionality"""
        print("\n🎫 Testing Coupon Model...")
        
        try:
            coupons = self.book.coupons.all()
            
            for coupon in coupons[:3]:  # Test first 3 coupons
                # Test coupon properties
                assert coupon.coupon_number, "Coupon should have a number"
                assert coupon.litres > 0, "Coupon should have positive litres"
                assert coupon.status in ['AVAILABLE', 'ALLOCATED', 'USED', 'EXPIRED'], "Valid status"
                
                # Test generated fields
                assert coupon.serial_number, "Coupon should have serial number"
                assert coupon.barcode, "Coupon should have barcode"
                print(f"   ✅ Coupon {coupon.coupon_number}: {coupon.litres}L, Status: {coupon.status}")
            
            print("   ✅ Coupon model tests passed")
            return True
            
        except Exception as e:
            print(f"   ❌ Coupon model test failed: {e}")
            return False
    
    def test_book_dispatch_model(self):
        """Test BookDispatch model functionality"""
        print("\n📦 Testing BookDispatch Model...")
        
        try:
            # Create dispatch
            dispatch = BookDispatch.objects.create(
                to_center=self.subcenter,
                dispatched_by=self.user,
                status='PENDING',
                program=self.program,
                session=self.session
            )
            
            # Add book to dispatch
            dispatch.books.add(self.book)
            
            # Test dispatch properties
            assert dispatch.total_books == 1, f"Expected 1 book, got {dispatch.total_books}"
            assert dispatch.books.count() == 1, "Dispatch should have 1 book"
            assert self.book in dispatch.books.all(), "Book should be in dispatch"
            
            # Test calculated fields
            total_value = dispatch.total_value
            assert total_value > 0, "Dispatch should have positive value"
            print(f"   ✅ Dispatch value: ${total_value:.2f}")
            
            # Mark book as assigned
            self.book.is_assigned = True
            self.book.save()
            
            print("   ✅ BookDispatch model tests passed")
            return True
            
        except Exception as e:
            print(f"   ❌ BookDispatch model test failed: {e}")
            return False
    
    def test_dispatch_api_endpoints(self):
        """Test Book Dispatch API endpoints"""
        print("\n🔗 Testing API Endpoints...")
        
        try:
            # Login user
            self.client.force_login(self.user)
            
            # Test available books endpoint
            response = self.client.get('/api/fuel/book-dispatches/available_books/')
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert 'results' in data, "Response should have results"
            print(f"   ✅ Available books: {len(data['results'])} books")
            
            # Test generation options endpoint
            response = self.client.get('/api/fuel/book-dispatches/generation_options/')
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert 'generation_modes' in data, "Response should have generation modes"
            print(f"   ✅ Generation modes: {len(data['generation_modes'])} modes")
            
            # Test dispatch creation
            dispatch_data = {
                'to_center': self.subcenter.id,
                'books': [
                    {
                        'bookId': str(self.book.id),
                        'boxId': self.box.box_code,
                        'firstCouponId': self.book.first_coupon_number,
                        'lastCouponId': self.book.last_coupon_number,
                        'numberOfCoupons': self.book.initial_coupon_count,
                        'value': self.book.initial_coupon_count * self.box.denomination
                    }
                ],
                'status': 'DISPATCHED'
            }
            
            response = self.client.post(
                '/api/fuel/book-dispatches/',
                data=json.dumps(dispatch_data),
                content_type='application/json'
            )
            assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.content}"
            
            data = response.json()
            assert 'id' in data, "Response should have dispatch ID"
            print(f"   ✅ Created dispatch: {data.get('dispatchId', data['id'])}")
            
            print("   ✅ API endpoint tests passed")
            return True
            
        except Exception as e:
            print(f"   ❌ API endpoint test failed: {e}")
            return False
    
    def test_coupon_generation_modes(self):
        """Test intelligent coupon generation modes"""
        print("\n🧠 Testing Coupon Generation Modes...")
        
        try:
            self.client.force_login(self.user)
            
            # Test book-selection mode
            generation_data = {
                'mode': 'book-selection',
                'selectedBookIds': [str(self.book.id)]
            }
            
            response = self.client.post(
                '/api/fuel/book-dispatches/generate_coupons/',
                data=json.dumps(generation_data),
                content_type='application/json'
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert 'coupons' in data, "Response should have coupons"
            assert 'books' in data, "Response should have books"
            print(f"   ✅ Generated {len(data['coupons'])} coupons for {len(data['books'])} books")
            
            # Test quantity-based mode
            generation_data = {
                'mode': 'quantity-based',
                'targetCouponCount': 5,
                'targetBookCount': 1
            }
            
            response = self.client.post(
                '/api/fuel/book-dispatches/generate_coupons/',
                data=json.dumps(generation_data),
                content_type='application/json'
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            print(f"   ✅ Quantity-based generation: {data.get('total_coupons', 0)} coupons")
            
            print("   ✅ Coupon generation tests passed")
            return True
            
        except Exception as e:
            print(f"   ❌ Coupon generation test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Book Dispatch System Tests...")
        print("=" * 50)
        
        tests = [
            self.test_book_model,
            self.test_coupon_model,
            self.test_book_dispatch_model,
            self.test_dispatch_api_endpoints,
            self.test_coupon_generation_modes
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
                failed += 1
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed! Book dispatch system is working well.")
        else:
            print(f"⚠️  {failed} tests failed. Review the implementation.")
        
        return failed == 0


def main():
    """Main test runner"""
    test_runner = BookDispatchTest()
    success = test_runner.run_all_tests()
    
    if not success:
        sys.exit(1)


if __name__ == '__main__':
    main()
