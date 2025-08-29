#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter, Box, Book, Coupon
from datetime import datetime

def create_test_data():
    print("Creating test data for dashboard...")
    
    # Clean up existing test data first
    try:
        old_coupons = Coupon.objects.filter(coupon_number__startswith='PU001AA')
        old_books = Book.objects.filter(book_code__startswith='FCB-2024-0001-BOOK')
        old_boxes = Box.objects.filter(box_code='FCB-2024-0001')
        
        print(f"Cleaning up: {old_coupons.count()} coupons, {old_books.count()} books, {old_boxes.count()} boxes")
        old_coupons.delete()
        old_books.delete()
        old_boxes.delete()
    except Exception as e:
        print(f"Cleanup warning: {e}")
    
    # Create test subcenter if not exists
    subcenter, created = SubCenter.objects.get_or_create(
        code='SUB001',
        defaults={
            'name': 'Test Sub Center',
            'location': 'Test Location'
        }
    )
    if created:
        print(f"Created SubCenter: {subcenter.name}")
    
    # Create test user if not exists
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'role': 'SUB_CENTER',
            'sub_center': subcenter,
            'is_approved': True
        }
    )
    if created:
        print(f"Created User: {user.username}")
    
    # Create test box with coupons
    box = Box.objects.create(
        box_code='FCB-2024-0001',
        fuel_type='DIESEL',
        denomination=20,
        first_coupon_number='PU001AA000001',
        last_coupon_number='PU001AA000100',
        number_of_books=1,
        coupons_per_book=100,
        total_coupons_calculated=100,
        total_litres=2000,
        assigned_to=subcenter
    )
    print(f"Created Box: {box.box_code}")
    
    # Create test book with coupons
    book = Book.objects.create(
        box=box,
        book_number='Book 01',
        book_code='FCB-2024-0001-BOOK-Book 01',
        first_coupon_number='PU001AA000001',
        last_coupon_number='PU001AA000100',
        initial_coupon_count=100
    )
    print(f"Created Book: {book.book_number}")
    
    # Create test coupons
    print("Creating test coupons...")
    coupon_count = 0
    for i in range(1, 101):
        coupon_number = f'PU001AA{i:06d}'
        status = 'USED' if i <= 50 else 'AVAILABLE'
        coupon, created = Coupon.objects.get_or_create(
            coupon_number=coupon_number,
            defaults={
                'book': book,
                'litres': 20,
                'status': status
            }
        )
        if created:
            coupon_count += 1
    
    print(f"Created {coupon_count} new coupons")
    
    # Print summary
    available_count = Coupon.objects.filter(book=book, status='AVAILABLE').count()
    used_count = Coupon.objects.filter(book=book, status='USED').count()
    total_count = Coupon.objects.filter(book=book).count()
    
    print(f"\nTest data summary:")
    print(f"- SubCenter: {subcenter.name} ({subcenter.code})")
    print(f"- User: {user.username} ({user.role})")
    print(f"- Box: {box.box_code} with {box.total_coupons_calculated} coupons")
    print(f"- Book: {book.book_number} with {book.initial_coupon_count} coupons")
    print(f"- Available coupons: {available_count}")
    print(f"- Used coupons: {used_count}")
    print(f"- Total coupons: {total_count}")

if __name__ == '__main__':
    create_test_data()
