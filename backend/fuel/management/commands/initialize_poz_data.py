# management/commands/initialize_poz_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from fuel.models import (
    SubCenter, BeneficiaryCategory, Constituency, VehicleCategory,
    ParliamentSession, BeneficiaryProfile
)
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize POZ fuel coupon system with default data'

    def handle(self, *args, **options):
        self.stdout.write('Initializing POZ fuel coupon system...')
        
        # Create Sub Centers
        sub_centers_data = [
            {'code': 'SC001', 'name': 'Main Parliament Building', 'location': 'Harare Central'},
            {'code': 'SC002', 'name': 'East Wing Distribution', 'location': 'Parliament East Wing'},
            {'code': 'SC003', 'name': 'West Wing Distribution', 'location': 'Parliament West Wing'},
            {'code': 'SC004', 'name': 'Committee Block', 'location': 'Committee Building'},
            {'code': 'SC005', 'name': 'Administrative Block', 'location': 'Admin Building'},
        ]
        
        for sc_data in sub_centers_data:
            sub_center, created = SubCenter.objects.get_or_create(
                code=sc_data['code'],
                defaults=sc_data
            )
            if created:
                self.stdout.write(f'Created sub-center: {sub_center.name}')
        
        # Create Beneficiary Categories
        categories_data = [
            {
                'name': 'Member of Parliament',
                'category_type': 'MP',
                'description': 'Elected Members of Parliament',
                'base_entitlement_litres': 200
            },
            {
                'name': 'Senior Administration Staff',
                'category_type': 'ADMIN_STAFF',
                'description': 'Senior administrative personnel',
                'base_entitlement_litres': 80
            },
            {
                'name': 'Junior Administration Staff',
                'category_type': 'ADMIN_STAFF',
                'description': 'Junior administrative personnel',
                'base_entitlement_litres': 40
            },
            {
                'name': 'Parliament Driver',
                'category_type': 'DRIVER',
                'description': 'Official Parliament drivers',
                'base_entitlement_litres': 60
            },
            {
                'name': 'Contractor',
                'category_type': 'CONTRACTOR',
                'description': 'Authorized contractors and service providers',
                'base_entitlement_litres': 20
            }
        ]
        
        for cat_data in categories_data:
            category, created = BeneficiaryCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Create Constituencies (sample data)
        constituencies_data = [
            {'name': 'Harare Central', 'code': 'HAR-C', 'province': 'Harare', 'distance_from_parliament_km': 5},
            {'name': 'Harare East', 'code': 'HAR-E', 'province': 'Harare', 'distance_from_parliament_km': 15},
            {'name': 'Harare West', 'code': 'HAR-W', 'province': 'Harare', 'distance_from_parliament_km': 20},
            {'name': 'Bulawayo Central', 'code': 'BUL-C', 'province': 'Bulawayo', 'distance_from_parliament_km': 439},
            {'name': 'Mutare North', 'code': 'MUT-N', 'province': 'Manicaland', 'distance_from_parliament_km': 263},
            {'name': 'Gweru Urban', 'code': 'GWE-U', 'province': 'Midlands', 'distance_from_parliament_km': 273},
            {'name': 'Masvingo Urban', 'code': 'MAS-U', 'province': 'Masvingo', 'distance_from_parliament_km': 292},
            {'name': 'Chinhoyi', 'code': 'CHI-U', 'province': 'Mashonaland West', 'distance_from_parliament_km': 116},
            {'name': 'Bindura', 'code': 'BIN-U', 'province': 'Mashonaland Central', 'distance_from_parliament_km': 88},
            {'name': 'Rusape', 'code': 'RUS-U', 'province': 'Manicaland', 'distance_from_parliament_km': 298},
        ]
        
        for const_data in constituencies_data:
            constituency, created = Constituency.objects.get_or_create(
                code=const_data['code'],
                defaults=const_data
            )
            if created:
                self.stdout.write(f'Created constituency: {constituency.name}')
        
        # Create Vehicle Categories
        vehicle_categories_data = [
            {'name': 'Small Engine (Under 1500cc)', 'min_engine_cc': 0, 'max_engine_cc': 1500, 'fuel_multiplier': 0.8},
            {'name': 'Medium Engine (1501-2500cc)', 'min_engine_cc': 1501, 'max_engine_cc': 2500, 'fuel_multiplier': 1.0},
            {'name': 'Large Engine (2501-4000cc)', 'min_engine_cc': 2501, 'max_engine_cc': 4000, 'fuel_multiplier': 1.3},
            {'name': 'Very Large Engine (Over 4000cc)', 'min_engine_cc': 4001, 'max_engine_cc': 10000, 'fuel_multiplier': 1.6},
        ]
        
        for vc_data in vehicle_categories_data:
            vehicle_category, created = VehicleCategory.objects.get_or_create(
                name=vc_data['name'],
                defaults=vc_data
            )
            if created:
                self.stdout.write(f'Created vehicle category: {vehicle_category.name}')
        
        # Create sample Parliament Sessions
        now = datetime.now()
        sessions_data = [
            {
                'title': 'Budget Session 2025',
                'session_type': 'SITTING',
                'start_date': now + timedelta(days=7),
                'end_date': now + timedelta(days=14),
                'fuel_entitlement_litres': 40,
                'is_mandatory': True
            },
            {
                'title': 'Finance Committee Meeting',
                'session_type': 'COMMITTEE',
                'start_date': now + timedelta(days=3),
                'end_date': now + timedelta(days=3, hours=4),
                'fuel_entitlement_litres': 20,
                'is_mandatory': False
            },
            {
                'title': 'Independence Day Ceremony',
                'session_type': 'NATIONAL_EVENT',
                'start_date': now + timedelta(days=30),
                'end_date': now + timedelta(days=30, hours=6),
                'fuel_entitlement_litres': 60,
                'is_mandatory': True
            }
        ]
        
        for session_data in sessions_data:
            session, created = ParliamentSession.objects.get_or_create(
                title=session_data['title'],
                defaults=session_data
            )
            if created:
                self.stdout.write(f'Created session: {session.title}')
        
        # Create admin user if not exists
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@parliament.gov.zw',
                password='admin123',
                first_name='System',
                last_name='Administrator',
                role='ADMIN'
            )
            self.stdout.write('Created admin user (username: admin, password: admin123)')
        
        # Create sample main center officer
        if not User.objects.filter(username='main_officer').exists():
            main_officer = User.objects.create_user(
                username='main_officer',
                email='main@parliament.gov.zw',
                password='main123',
                first_name='Main Center',
                last_name='Officer',
                role='MAIN_CENTER'
            )
            self.stdout.write('Created main center officer (username: main_officer, password: main123)')
        
        # Create sample sub center officers
        for i, sub_center in enumerate(SubCenter.objects.all()[:3], 1):
            username = f'sub_officer_{i}'
            if not User.objects.filter(username=username).exists():
                sub_officer = User.objects.create_user(
                    username=username,
                    email=f'sub{i}@parliament.gov.zw',
                    password=f'sub{i}123',
                    first_name=f'Sub Center {i}',
                    last_name='Officer',
                    role='SUB_CENTER',
                    sub_center=sub_center
                )
                self.stdout.write(f'Created sub center officer: {username} (password: sub{i}123)')
        
        # Create sample MP beneficiaries
        mp_category = BeneficiaryCategory.objects.get(category_type='MP')
        constituencies = list(Constituency.objects.all()[:5])
        vehicle_categories = list(VehicleCategory.objects.all())
        
        for i, constituency in enumerate(constituencies, 1):
            username = f'mp_{constituency.code.lower()}'
            if not User.objects.filter(username=username).exists():
                mp_user = User.objects.create_user(
                    username=username,
                    email=f'{username}@parliament.gov.zw',
                    password='mp123',
                    first_name=f'Honorable {constituency.name}',
                    last_name='MP',
                    role='BENEFICIARY'
                )
                
                # Create beneficiary profile
                BeneficiaryProfile.objects.create(
                    user=mp_user,
                    category=mp_category,
                    constituency=constituency,
                    vehicle_category=vehicle_categories[i % len(vehicle_categories)],
                    employee_id=f'MP{i:03d}',
                    position='Member of Parliament',
                    monthly_entitlement_litres=mp_category.base_entitlement_litres
                )
                
                self.stdout.write(f'Created MP: {username} for {constituency.name} (password: mp123)')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully initialized POZ fuel coupon system!')
        )
        self.stdout.write('Default login credentials:')
        self.stdout.write('- Admin: admin / admin123')
        self.stdout.write('- Main Officer: main_officer / main123')
        self.stdout.write('- Sub Officers: sub_officer_1 / sub1123, etc.')
        self.stdout.write('- MPs: mp_har-c / mp123, etc.')
