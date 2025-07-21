from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from decimal import Decimal
import random
from faker import Faker

from fuel.models import (
    User, SubCenter, SubCenterOfficer, Box, Book, Coupon, Program, Attendance,
    FuelData, CouponDistribution, FuelTransaction, Handover,
    BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession,
    BeneficiaryProfile, SessionAttendance, FuelEntitlement
)

fake = Faker()

class Command(BaseCommand):
    help = 'Create comprehensive test data for the fuel coupon system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before creating new data',
        )
        parser.add_argument(
            '--users',
            type=int,
            default=50,
            help='Number of users to create per role',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Creating test data...')
        
        # Create foundational data
        self.create_beneficiary_categories()
        self.create_constituencies()
        self.create_vehicle_categories()
        
        # Create users
        self.create_users(options['users'])
        
        # Create sub centers
        self.create_sub_centers()
        
        # Create parliament sessions
        self.create_parliament_sessions()
        
        # Create boxes, books, and coupons
        self.create_inventory()
        
        # Create programs
        self.create_programs()
        
        # Create entitlements and allocations
        self.create_entitlements()
        
        # Create transactions and usage data
        self.create_transactions()
        
        # Create fuel data statistics
        self.create_fuel_statistics()
        
        # Create handovers
        self.create_handovers()
        
        self.stdout.write(
            self.style.SUCCESS('Test data created successfully!')
        )

    def clear_data(self):
        """Clear existing test data"""
        models_to_clear = [
            FuelTransaction, CouponDistribution, Handover, Attendance, SessionAttendance,
            FuelEntitlement, Coupon, Book, Box, Program, ParliamentSession,
            BeneficiaryProfile, SubCenterOfficer, SubCenter,
            VehicleCategory, Constituency, BeneficiaryCategory, FuelData
        ]
        
        for model in models_to_clear:
            model.objects.all().delete()
        
        # Clear users except superusers
        User.objects.filter(is_superuser=False).delete()

    def create_beneficiary_categories(self):
        """Create beneficiary categories"""
        categories = [
            ('Members of Parliament', 'MP', 'Elected members of parliament', 200),
            ('Administrative Staff', 'ADMIN_STAFF', 'Parliament administrative staff', 100),
            ('Parliamentary Drivers', 'DRIVER', 'Official parliamentary drivers', 150),
            ('Service Contractors', 'CONTRACTOR', 'External service providers', 80),
            ('Other Personnel', 'OTHER', 'Other authorized personnel', 60),
        ]
        
        for name, category_type, description, base_entitlement in categories:
            BeneficiaryCategory.objects.get_or_create(
                name=name,
                defaults={
                    'category_type': category_type,
                    'description': description,
                    'base_entitlement_litres': base_entitlement,
                    'is_active': True
                }
            )
        
        self.stdout.write('Created beneficiary categories')

    def create_constituencies(self):
        """Create constituencies with realistic distances"""
        zimbabwe_constituencies = [
            ('Harare East', 'HE001', 'Harare', 5),
            ('Harare North', 'HN002', 'Harare', 8),
            ('Harare South', 'HS003', 'Harare', 12),
            ('Bulawayo Central', 'BC004', 'Bulawayo', 440),
            ('Bulawayo South', 'BS005', 'Bulawayo', 445),
            ('Mutare North', 'MN006', 'Manicaland', 265),
            ('Mutare South', 'MS007', 'Manicaland', 270),
            ('Gweru Central', 'GC008', 'Midlands', 275),
            ('Kwekwe Central', 'KC009', 'Midlands', 220),
            ('Masvingo Central', 'MC010', 'Masvingo', 292),
            ('Chinhoyi', 'CH011', 'Mashonaland West', 116),
            ('Bindura North', 'BN012', 'Mashonaland Central', 88),
            ('Marondera East', 'ME013', 'Mashonaland East', 72),
            ('Victoria Falls', 'VF014', 'Matabeleland North', 860),
            ('Hwange West', 'HW015', 'Matabeleland North', 720),
            ('Beitbridge East', 'BE016', 'Matabeleland South', 527),
            ('Gwanda South', 'GS017', 'Matabeleland South', 450),
            ('Chiredzi South', 'CS018', 'Masvingo', 430),
            ('Chipinge South', 'CPS019', 'Manicaland', 465),
            ('Kariba', 'KAR020', 'Mashonaland West', 365),
        ]
        
        for name, code, province, distance in zimbabwe_constituencies:
            Constituency.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'province': province,
                    'distance_from_parliament_km': distance,
                    'is_active': True
                }
            )
        
        self.stdout.write('Created constituencies')

    def create_vehicle_categories(self):
        """Create vehicle categories"""
        categories = [
            ('Small Car', 1000, 1600, 1.0),
            ('Medium Car', 1601, 2500, 1.2),
            ('Large Car', 2501, 3500, 1.5),
            ('SUV/4WD', 3501, 5000, 1.8),
            ('Truck/Bus', 5001, 10000, 2.5),
        ]
        
        for name, min_cc, max_cc, multiplier in categories:
            VehicleCategory.objects.get_or_create(
                name=name,
                defaults={
                    'min_engine_cc': min_cc,
                    'max_engine_cc': max_cc,
                    'fuel_multiplier': multiplier
                }
            )
        
        self.stdout.write('Created vehicle categories')

    def create_users(self, count_per_role):
        """Create users for different roles"""
        roles = ['MAIN_CENTER', 'SUB_CENTER', 'APPROVER', 'BENEFICIARY', 'AUDITOR']
        
        for role in roles:
            for i in range(count_per_role if role == 'BENEFICIARY' else min(count_per_role // 5, 10)):
                first_name = fake.first_name()
                last_name = fake.last_name()
                username = f"{role.lower()}_{first_name.lower()}_{i+1}"
                email = f"{username}@parliament.gov.zw"
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password='testpass123',
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                    phone=fake.phone_number()[:20],
                    is_approved=True,
                    approved_at=timezone.now()
                )
                
                # Create beneficiary profile for beneficiaries
                if role == 'BENEFICIARY':
                    self.create_beneficiary_profile(user)
        
        self.stdout.write(f'Created users for all roles')

    def create_beneficiary_profile(self, user):
        """Create a beneficiary profile for a user"""
        categories = list(BeneficiaryCategory.objects.all())
        constituencies = list(Constituency.objects.all())
        vehicle_categories = list(VehicleCategory.objects.all())
        
        if not categories or not constituencies or not vehicle_categories:
            return
        
        category = random.choice(categories)
        constituency = random.choice(constituencies) if random.random() > 0.1 else None
        vehicle_category = random.choice(vehicle_categories) if random.random() > 0.2 else None
        
        # Calculate monthly entitlement based on category and distance
        base_entitlement = category.base_entitlement_litres
        if constituency and constituency.distance_from_parliament_km > 100:
            distance_bonus = (constituency.distance_from_parliament_km / 100) * 20
            base_entitlement += distance_bonus
        
        BeneficiaryProfile.objects.create(
            user=user,
            category=category,
            constituency=constituency,
            vehicle_category=vehicle_category,
            employee_id=f"EMP{random.randint(1000, 9999)}",
            position=fake.job(),
            department=random.choice(['Administration', 'Legal', 'Finance', 'HR', 'ICT', 'Security']),
            monthly_entitlement_litres=base_entitlement,
            is_active_beneficiary=True
        )

    def create_sub_centers(self):
        """Create sub centers"""
        sub_center_data = [
            ('Main Parliament Building', 'MAIN001', 'Parliament Building, Harare'),
            ('Bulawayo Regional Office', 'BYO002', 'Bulawayo Government Complex'),
            ('Mutare Regional Office', 'MUT003', 'Mutare Government Building'),
            ('Gweru Regional Office', 'GWE004', 'Gweru Provincial Offices'),
            ('Masvingo Regional Office', 'MSV005', 'Masvingo Government Complex'),
        ]
        
        main_center_officers = list(User.objects.filter(role='MAIN_CENTER'))
        sub_center_officers = list(User.objects.filter(role='SUB_CENTER'))
        
        for name, code, location in sub_center_data:
            # Assign manager from main center or sub center officers
            manager = random.choice(main_center_officers + sub_center_officers) if main_center_officers or sub_center_officers else None
            
            sub_center = SubCenter.objects.create(
                code=code,
                name=name,
                location=location,
                managed_by=manager,
                is_active=True
            )
            
            # Create sub center officer relationships
            officers = random.sample(sub_center_officers, min(3, len(sub_center_officers)))
            for i, officer in enumerate(officers):
                SubCenterOfficer.objects.create(
                    user=officer,
                    sub_center=sub_center,
                    is_manager=i == 0  # First officer is manager
                )
        
        self.stdout.write('Created sub centers')

    def create_parliament_sessions(self):
        """Create parliament sessions"""
        session_types = ['SITTING', 'COMMITTEE', 'NATIONAL_EVENT', 'SPECIAL_SESSION']
        
        # Create sessions for the past 6 months and future 3 months
        start_date = timezone.now() - timedelta(days=180)
        end_date = timezone.now() + timedelta(days=90)
        
        current_date = start_date
        sessions_created = 0
        
        while current_date <= end_date and sessions_created < 50:
            # Create 1-3 sessions per week
            sessions_this_week = random.randint(1, 3)
            
            for _ in range(sessions_this_week):
                session_type = random.choice(session_types)
                session_date = current_date + timedelta(
                    hours=random.randint(8, 16),
                    minutes=random.choice([0, 30])
                )
                
                duration_hours = random.randint(2, 8)
                fuel_entitlement = random.choice([40, 60, 80, 100, 120])
                
                session = ParliamentSession.objects.create(
                    title=f"{session_type.replace('_', ' ').title()} - {fake.catch_phrase()}",
                    session_type=session_type,
                    start_date=session_date,
                    end_date=session_date + timedelta(hours=duration_hours),
                    venue='Parliament Building' if random.random() > 0.1 else fake.address(),
                    fuel_entitlement_litres=fuel_entitlement,
                    is_mandatory=random.random() > 0.3,
                    is_active=True
                )
                
                # Create attendance records for some beneficiaries
                beneficiaries = list(User.objects.filter(role='BENEFICIARY'))
                attending_beneficiaries = random.sample(
                    beneficiaries, 
                    min(random.randint(10, 30), len(beneficiaries))
                )
                
                for beneficiary in attending_beneficiaries:
                    attended = random.random() > 0.2  # 80% attendance rate
                    fuel_allocated = 0
                    
                    if attended and hasattr(beneficiary, 'beneficiary_profile'):
                        fuel_allocated = beneficiary.beneficiary_profile.calculate_session_entitlement(session)
                    
                    SessionAttendance.objects.create(
                        beneficiary=beneficiary,
                        session=session,
                        attended=attended,
                        check_in_time=session_date if attended else None,
                        check_out_time=session_date + timedelta(hours=duration_hours) if attended else None,
                        fuel_allocated=fuel_allocated if attended else 0,
                        allocation_date=session_date if attended else None,
                        notes=fake.text(max_nb_chars=100) if random.random() > 0.7 else ''
                    )
                
                sessions_created += 1
            
            current_date += timedelta(days=7)  # Move to next week
        
        self.stdout.write(f'Created {sessions_created} parliament sessions')

    def create_inventory(self):
        """Create boxes, books, and coupons"""
        sub_centers = list(SubCenter.objects.all())
        main_center_officers = list(User.objects.filter(role='MAIN_CENTER'))
        
        if not sub_centers or not main_center_officers:
            self.stdout.write('Skipping inventory creation - no sub centers or officers')
            return
        
        # Create 20 boxes
        for i in range(20):
            first_coupon = 100000 + (i * 1000)
            last_coupon = first_coupon + 999
            
            box = Box.objects.create(
                first_coupon_number=f"FC{first_coupon}",
                last_coupon_number=f"FC{last_coupon}",
                total_litres=20000,  # 1000 coupons * 20L each
                assigned_to=random.choice(sub_centers),
                received_by=random.choice(main_center_officers)
            )
            
            # Create 10 books per box
            for book_num in range(1, 11):
                book_first = first_coupon + ((book_num - 1) * 100)
                book_last = book_first + 99
                
                book = Book.objects.create(
                    box=box,
                    book_number=f"BK{box.box_code[-4:]}{book_num:02d}",
                    first_coupon_number=f"FC{book_first}",
                    last_coupon_number=f"FC{book_last}",
                    initial_coupon_count=100,
                    is_assigned=random.random() > 0.3
                )
                
                # Create 100 coupons per book
                for coupon_num in range(book_first, book_last + 1):
                    status_weights = [
                        ('AVAILABLE', 0.4),
                        ('ALLOCATED', 0.3),
                        ('USED', 0.25),
                        ('EXPIRED', 0.05)
                    ]
                    status = random.choices(
                        [s[0] for s in status_weights],
                        weights=[s[1] for s in status_weights]
                    )[0]
                    
                    expiry_date = timezone.now().date() + timedelta(days=random.randint(30, 365))
                    
                    coupon = Coupon.objects.create(
                        book=book,
                        coupon_number=f"FC{coupon_num}",
                        litres=20,
                        status=status,
                        expiry_date=expiry_date
                    )
                    
                    # Allocate or use some coupons
                    if status in ['ALLOCATED', 'USED']:
                        beneficiaries = list(User.objects.filter(role='BENEFICIARY'))
                        if beneficiaries:
                            beneficiary = random.choice(beneficiaries)
                            coupon.allocated_to = beneficiary
                            coupon.allocated_date = timezone.now() - timedelta(days=random.randint(1, 30))
                            
                            if status == 'USED':
                                coupon.used_date = coupon.allocated_date + timedelta(days=random.randint(1, 10))
                                coupon.transaction_location = fake.address()
                            
                            coupon.save()
        
        self.stdout.write('Created inventory (boxes, books, coupons)')

    def create_programs(self):
        """Create programs"""
        sub_centers = list(SubCenter.objects.all())
        organizers = list(User.objects.filter(role__in=['MAIN_CENTER', 'SUB_CENTER']))
        
        if not organizers:
            return
        
        program_types = ['TRAINING', 'DISTRIBUTION', 'MEETING', 'ACTIVITY']
        
        # Create 30 programs
        for i in range(30):
            scheduled_date = timezone.now() - timedelta(days=random.randint(-30, 90))
            end_date = scheduled_date + timedelta(hours=random.randint(2, 8))
            
            program = Program.objects.create(
                title=f"{random.choice(program_types).title()} - {fake.catch_phrase()}",
                program_type=random.choice(program_types),
                scheduled_date=scheduled_date,
                end_date=end_date,
                description=fake.text(max_nb_chars=200),
                location=fake.address(),
                organizer=random.choice(organizers),
                sub_center=random.choice(sub_centers) if random.random() > 0.2 else None,
                is_active=True
            )
            
            # Create attendance records
            beneficiaries = list(User.objects.filter(role='BENEFICIARY'))
            attending_beneficiaries = random.sample(
                beneficiaries,
                min(random.randint(5, 20), len(beneficiaries))
            )
            
            for beneficiary in attending_beneficiaries:
                Attendance.objects.create(
                    user=beneficiary,
                    program=program,
                    attended=random.random() > 0.15,  # 85% attendance rate
                    notes=fake.text(max_nb_chars=50) if random.random() > 0.8 else ''
                )
        
        self.stdout.write('Created programs')

    def create_entitlements(self):
        """Create fuel entitlements"""
        beneficiaries = list(User.objects.filter(role='BENEFICIARY'))
        sessions = list(ParliamentSession.objects.all())
        
        entitlement_types = ['MONTHLY', 'SESSION', 'DISTANCE', 'SPECIAL', 'EMERGENCY']
        
        for beneficiary in beneficiaries:
            # Create monthly entitlements for the past 6 months
            for month_offset in range(6):
                start_date = (timezone.now() - timedelta(days=30 * month_offset)).date()
                end_date = start_date + timedelta(days=30)
                
                base_entitlement = 200
                if hasattr(beneficiary, 'beneficiary_profile'):
                    base_entitlement = beneficiary.beneficiary_profile.monthly_entitlement_litres
                
                allocated = random.uniform(0.6, 1.0) * float(base_entitlement)
                
                FuelEntitlement.objects.create(
                    beneficiary=beneficiary,
                    entitlement_type='MONTHLY',
                    litres_entitled=base_entitlement,
                    litres_allocated=allocated,
                    period_start=start_date,
                    period_end=end_date,
                    is_fulfilled=allocated >= float(base_entitlement) * 0.9,
                    notes=f"Monthly allocation for {start_date.strftime('%B %Y')}"
                )
            
            # Create session entitlements for random sessions
            if sessions:
                beneficiary_sessions = random.sample(sessions, min(random.randint(5, 15), len(sessions)))
                for session in beneficiary_sessions:
                    fuel_entitled = session.fuel_entitlement_litres
                    if hasattr(beneficiary, 'beneficiary_profile'):
                        fuel_entitled = beneficiary.beneficiary_profile.calculate_session_entitlement(session)
                    
                    allocated = fuel_entitled if random.random() > 0.2 else 0
                    
                    FuelEntitlement.objects.create(
                        beneficiary=beneficiary,
                        entitlement_type='SESSION',
                        session=session,
                        litres_entitled=fuel_entitled,
                        litres_allocated=allocated,
                        period_start=session.start_date.date(),
                        period_end=session.end_date.date(),
                        is_fulfilled=allocated > 0,
                        notes=f"Session attendance: {session.title}"
                    )
        
        self.stdout.write('Created fuel entitlements')

    def create_transactions(self):
        """Create fuel transactions"""
        used_coupons = list(Coupon.objects.filter(status='USED'))
        beneficiaries = list(User.objects.filter(role='BENEFICIARY'))
        
        # Create transactions for used coupons (if not already created)
        for coupon in used_coupons:
            if not FuelTransaction.objects.filter(coupon=coupon).exists():
                FuelTransaction.objects.create(
                    timestamp=coupon.used_date or timezone.now(),
                    beneficiary=coupon.allocated_to,
                    coupon=coupon,
                    litres_consumed=coupon.litres,
                    transaction_location=coupon.transaction_location or fake.address(),
                    notes=fake.text(max_nb_chars=100) if random.random() > 0.7 else ''
                )
        
        # Create some additional transactions without coupons (direct fuel allocation)
        for _ in range(50):
            beneficiary = random.choice(beneficiaries)
            # Create timezone-aware datetime for 2025
            base_date = timezone.now().replace(year=2025)
            transaction_date = base_date - timedelta(days=random.randint(1, 180))
            
            FuelTransaction.objects.create(
                timestamp=transaction_date,
                beneficiary=beneficiary,
                litres_consumed=random.choice([20, 40, 60, 80]),
                transaction_location=fake.address(),
                notes="Direct fuel allocation"
            )
        
        self.stdout.write('Created fuel transactions')

    def create_fuel_statistics(self):
        """Create fuel statistics data"""
        # Create daily fuel statistics for the past 90 days
        for day_offset in range(90):
            date = timezone.now() - timedelta(days=day_offset)
            
            # Calculate real statistics from transactions
            day_transactions = FuelTransaction.objects.filter(
                timestamp__date=date.date()
            )
            
            total_used = day_transactions.aggregate(
                total=Sum('litres_consumed')
            )['total'] or 0
            
            # Mock some additional data
            petrol_price = Decimal(random.uniform(1.50, 2.00)).quantize(Decimal('0.01'))
            diesel_price = Decimal(random.uniform(1.30, 1.80)).quantize(Decimal('0.01'))
            
            total_allocated = random.uniform(1000, 5000)
            available_fuel = random.uniform(10000, 50000)
            
            FuelData.objects.create(
                timestamp=date,
                petrol_price=petrol_price,
                diesel_price=diesel_price,
                total_fuel_allocated=total_allocated,
                total_fuel_used=float(total_used),
                available_fuel=available_fuel,
                daily_usage_trend=random.choice(['UP', 'DOWN', 'STABLE']),
                daily_usage_change=random.uniform(-10, 10)
            )
        
        self.stdout.write('Created fuel statistics')

    def create_handovers(self):
        """Create handover records"""
        main_officers = list(User.objects.filter(role='MAIN_CENTER'))
        sub_officers = list(User.objects.filter(role='SUB_CENTER'))
        boxes = list(Box.objects.all())
        books = list(Book.objects.all())
        
        if not main_officers or not sub_officers:
            return
        
        # Create box handovers
        for box in random.sample(boxes, min(10, len(boxes))):
            from_user = random.choice(main_officers)
            to_user = random.choice(sub_officers)
            
            handover = Handover.objects.create(
                from_user=from_user,
                to_user=to_user,
                box=box,
                status=random.choice(['PENDING', 'CONFIRMED']),
                notes=fake.text(max_nb_chars=100)
            )
            
            if handover.status == 'CONFIRMED':
                handover.confirmation_date = timezone.now()
                handover.witness = random.choice(main_officers + sub_officers)
                handover.save()
        
        # Create book handovers
        for book in random.sample(books, min(20, len(books))):
            from_user = random.choice(main_officers + sub_officers)
            to_user = random.choice(sub_officers)
            
            if from_user != to_user:
                handover = Handover.objects.create(
                    from_user=from_user,
                    to_user=to_user,
                    book=book,
                    status=random.choice(['PENDING', 'CONFIRMED', 'CANCELLED']),
                    notes=fake.text(max_nb_chars=100)
                )
                
                if handover.status in ['CONFIRMED', 'CANCELLED']:
                    handover.confirmation_date = timezone.now()
                    if handover.status == 'CONFIRMED':
                        handover.witness = random.choice(main_officers + sub_officers)
                    handover.save()
        
        self.stdout.write('Created handover records')
