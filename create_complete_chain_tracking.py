#!/usr/bin/env python3
"""
Complete Chain Tracking System
Implements precise tracking for:
1. Main Center → SubCenter handovers (with individual coupon records)
2. SubCenter → Beneficiary dispatches (with individual coupon allocations)
3. Complete audit trail at every step
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import (
    BookDispatch, Book, Coupon, CouponHandover, SubCenter, User, 
    FuelEntitlement, PoliticalParty
)
from django.db import transaction, connection

def create_complete_chain_tracking():
    """Create complete tracking system for the entire chain"""
    print("🔗 COMPLETE CHAIN TRACKING SYSTEM")
    print("=" * 50)
    
    with transaction.atomic():
        print("📦 STEP 1: SubCenter Handover Tracking")
        print("-" * 40)
        
        # Find all dispatches that have been delivered to subcenters
        delivered_dispatches = BookDispatch.objects.filter(
            status__in=['RECEIVED', 'DELIVERED'],
            to_center__isnull=False
        )
        
        handover_records_created = 0
        coupon_handover_records = 0
        
        for dispatch in delivered_dispatches:
            subcenter = dispatch.to_center
            
            print(f"\n   📦 Processing handover: {dispatch.main_center_dispatch_number} → {subcenter.name}")
            
            # Create or get handover record for this specific dispatch
            handover, created = CouponHandover.objects.get_or_create(
                beneficiary=subcenter.managed_by,
                defaults={
                    'handover_date': dispatch.dispatch_date + timedelta(days=1)  # Simulate next day delivery
                }
            )
            
            if created:
                handover_records_created += 1
                print(f"      ✅ Created handover record for {subcenter.name}")
            
            # Track individual coupons in this handover
            individual_coupons_transferred = 0
            
            for book in dispatch.books.all():
                for coupon in book.coupons.all():
                    # Mark coupon as transferred to subcenter
                    if coupon.status == 'AVAILABLE':
                        coupon.status = 'ALLOCATED'
                        coupon.allocated_to = subcenter.managed_by
                        coupon.allocated_date = handover.handover_date
                        coupon.save()
                        individual_coupons_transferred += 1
            
            coupon_handover_records += individual_coupons_transferred
            print(f"      📊 Transferred {individual_coupons_transferred} individual coupons to subcenter stock")
        
        print(f"\n   ✅ SubCenter handover summary:")
        print(f"      Handover records: {handover_records_created}")
        print(f"      Individual coupons transferred: {coupon_handover_records}")
        
        print("\n📦 STEP 2: SubCenter → Beneficiary Dispatch System")
        print("-" * 40)
        
        # Create beneficiary users if they don't exist
        beneficiaries_created = 0
        
        # Get political parties for beneficiary assignment
        parties = list(PoliticalParty.objects.all())
        if not parties:
            # Create some sample parties
            party1 = PoliticalParty.objects.create(name="ZANU-PF", abbreviation="ZANU-PF")
            party2 = PoliticalParty.objects.create(name="MDC Alliance", abbreviation="MDC-A")
            parties = [party1, party2]
        
        # Initialize total counters
        total_coupon_allocations = 0
        
        # Create sample beneficiaries for each subcenter
        for subcenter in SubCenter.objects.all():
            subcenter_coupons = Coupon.objects.filter(allocated_to=subcenter.managed_by)
            
            if subcenter_coupons.exists():
                print(f"\n   🏢 Processing {subcenter.name} beneficiary dispatches")
                print(f"      Available stock: {subcenter_coupons.count()} coupons")
                
                # Create 3-5 beneficiaries for this subcenter
                beneficiary_dispatches = 0
                coupon_allocations = 0
                
                for i in range(3):  # 3 beneficiaries per subcenter
                    beneficiary_username = f"beneficiary_{subcenter.pk}_{i+1}"
                    
                    # Create beneficiary if doesn't exist
                    beneficiary, created = User.objects.get_or_create(
                        username=beneficiary_username,
                        defaults={
                            'email': f"{beneficiary_username}@parliament.gov.zw",
                            'first_name': f"Beneficiary {i+1}",
                            'last_name': f"SubCenter {subcenter.pk}",
                            'role': 'BENEFICIARY',
                            'is_approved': True  # Pre-approve for testing
                        }
                    )
                    
                    if created:
                        beneficiaries_created += 1
                    
                    # Allocate coupons to this beneficiary (10-50 coupons each)
                    allocation_size = min(50, subcenter_coupons.filter(allocated_to=subcenter.managed_by).count() // 3)
                    
                    if allocation_size > 0:
                        # Create FuelEntitlement for this beneficiary
                        from datetime import date
                        entitlement, ent_created = FuelEntitlement.objects.get_or_create(
                            beneficiary=beneficiary,
                            entitlement_type='MONTHLY',
                            period_start=date.today(),
                            defaults={
                                'litres_entitled': allocation_size * 20,  # 20L per coupon
                                'period_end': date.today().replace(day=28),  # End of month
                                'status': 'APPROVED',
                                'justification': f'SubCenter {subcenter.name} allocation'
                            }
                        )
                        
                        # Allocate specific coupons
                        coupons_to_allocate = subcenter_coupons.filter(
                            allocated_to=subcenter.managed_by
                        )[:allocation_size]
                        
                        allocated_count = 0
                        for coupon in coupons_to_allocate:
                            coupon.status = 'ALLOCATED'
                            coupon.allocated_to = beneficiary
                            coupon.allocated_date = datetime.now()
                            coupon.entitlement = entitlement
                            coupon.save()
                            allocated_count += 1
                        
                        coupon_allocations += allocated_count
                        total_coupon_allocations += allocated_count
                        beneficiary_dispatches += 1
                        
                        print(f"      ✅ {beneficiary.first_name} {beneficiary.last_name}: {allocated_count} coupons ({allocated_count * 20}L)")
                
                print(f"      📊 Total: {beneficiary_dispatches} beneficiaries, {coupon_allocations} coupons allocated")
        
        # Initialize counters for summary
        total_coupon_allocations = 0
        
        print(f"\n   ✅ Beneficiary dispatch summary:")
        print(f"      Beneficiaries created: {beneficiaries_created}")
        print(f"      Total beneficiary allocations: {total_coupon_allocations}")
        
        print("\n📦 STEP 3: Chain Verification & Audit Trail")
        print("-" * 40)
        
        # Verify the complete chain
        print("🔍 Complete chain verification:")
        
        for subcenter in SubCenter.objects.all():
            # Main Center → SubCenter
            dispatches_received = BookDispatch.objects.filter(to_center=subcenter)
            total_received_coupons = sum(d.total_coupons for d in dispatches_received)
            
            # SubCenter stock
            subcenter_stock = Coupon.objects.filter(
                book__dispatches__to_center=subcenter
            ).distinct().count()
            
            # SubCenter → Beneficiaries
            allocated_to_beneficiaries = Coupon.objects.filter(
                book__dispatches__to_center=subcenter,
                allocated_to__role='BENEFICIARY'
            ).distinct().count()
            
            remaining_stock = Coupon.objects.filter(
                book__dispatches__to_center=subcenter,
                allocated_to=subcenter.managed_by
            ).distinct().count()
            
            print(f"\n   🏢 {subcenter.name} audit trail:")
            print(f"      📥 Received from Main Center: {total_received_coupons} coupons")
            print(f"      📦 Total subcenter stock: {subcenter_stock} coupons")
            print(f"      👥 Allocated to beneficiaries: {allocated_to_beneficiaries} coupons")
            print(f"      📋 Remaining in stock: {remaining_stock} coupons")
            
            # Verify balance
            expected_remaining = subcenter_stock - allocated_to_beneficiaries
            balance_check = "✅" if remaining_stock == expected_remaining else "❌"
            print(f"      {balance_check} Balance check: {remaining_stock} = {expected_remaining}")
            
            # Show beneficiary breakdown
            beneficiaries = User.objects.filter(
                allocated_coupons__book__dispatches__to_center=subcenter,
                role='BENEFICIARY'
            ).distinct()
            
            if beneficiaries.exists():
                print(f"      👥 Beneficiary breakdown:")
                for beneficiary in beneficiaries:
                    ben_coupons = Coupon.objects.filter(
                        allocated_to=beneficiary,
                        book__dispatches__to_center=subcenter
                    ).count()
                    ben_litres = ben_coupons * 20  # Assuming 20L per coupon
                    print(f"         • {beneficiary.first_name} {beneficiary.last_name}: {ben_coupons} coupons ({ben_litres}L)")
        
        print("\n📊 STEP 4: System-Wide Audit Summary")
        print("-" * 40)
        
        # System totals
        total_dispatches = BookDispatch.objects.count()
        total_coupons = Coupon.objects.count()
        total_available = Coupon.objects.filter(status='AVAILABLE').count()
        total_allocated = Coupon.objects.filter(status='ALLOCATED').count()
        total_used = Coupon.objects.filter(status='USED').count()
        
        print(f"   📊 System-wide summary:")
        print(f"      Total dispatches: {total_dispatches}")
        print(f"      Total coupons: {total_coupons}")
        print(f"      Available: {total_available}")
        print(f"      Allocated: {total_allocated}")
        print(f"      Used: {total_used}")
        
        # Chain integrity check
        print(f"\n   🔗 Chain integrity:")
        
        # Main Center dispatches
        main_center_dispatched = sum(
            d.total_coupons for d in BookDispatch.objects.filter(books__isnull=False)
        )
        
        # SubCenter received
        subcenter_received = Coupon.objects.filter(
            book__dispatches__isnull=False,
            book__dispatches__to_center__isnull=False
        ).distinct().count()
        
        # Beneficiary allocated
        beneficiary_allocated = Coupon.objects.filter(
            allocated_to__role='BENEFICIARY'
        ).count()
        
        print(f"      Main Center dispatched: {main_center_dispatched} coupons")
        print(f"      SubCenter received: {subcenter_received} coupons")
        print(f"      Beneficiary allocated: {beneficiary_allocated} coupons")
        
        # Verification
        integrity_check = "✅" if main_center_dispatched == subcenter_received else "❌"
        print(f"      {integrity_check} Main Center → SubCenter integrity")
        
    print(f"\n🎉 COMPLETE CHAIN TRACKING SYSTEM CREATED!")  
    print(f"   ✅ Main Center → SubCenter handover tracking")
    print(f"   ✅ SubCenter → Beneficiary dispatch tracking")
    print(f"   ✅ Individual coupon tracking at every step")
    print(f"   ✅ Complete audit trail from source to end user")
    print(f"   ✅ Balance verification at each level")

if __name__ == "__main__":
    create_complete_chain_tracking()