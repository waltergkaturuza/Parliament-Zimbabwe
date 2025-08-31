# fuel/management/commands/populate_all_reference_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from fuel.models_political_parties import PoliticalParty
from fuel.models import BeneficiaryCategory


class Command(BaseCommand):
    help = 'Populate all reference data for production deployment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing data',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        self.stdout.write(self.style.SUCCESS('Starting reference data population...'))
        
        # Populate political parties
        self.stdout.write('Populating political parties...')
        with transaction.atomic():
            political_parties_data = [
                {
                    'name': 'Zimbabwe African National Union - Patriotic Front',
                    'short_name': 'ZANU-PF',
                    'description': 'The ruling party of Zimbabwe since 1980',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': True,
                    'is_government_party': True,
                    'primary_color': '#FFD700',
                    'display_order': 1,
                },
                {
                    'name': 'Citizens Coalition for Change',
                    'short_name': 'CCC',
                    'description': 'Main opposition party formed in 2022',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': True,
                    'primary_color': '#FFA500',
                    'display_order': 2,
                },
                {
                    'name': 'Movement for Democratic Change - Tsvangirai',
                    'short_name': 'MDC-T',
                    'description': 'Opposition party led by Douglas Mwonzora',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': True,
                    'primary_color': '#DC143C',
                    'display_order': 3,
                },
                {
                    'name': 'Movement for Democratic Change - Alliance',
                    'short_name': 'MDC-A',
                    'description': 'Former opposition alliance',
                    'status': 'INACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#DC143C',
                    'display_order': 4,
                },
                {
                    'name': 'National Patriotic Front',
                    'short_name': 'NPF',
                    'description': 'Political party formed by former ZANU-PF members',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#8A2BE2',
                    'display_order': 5,
                },
                {
                    'name': 'Zimbabwe African Peoples Union',
                    'short_name': 'ZAPU',
                    'description': 'Historic liberation movement party',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#228B22',
                    'display_order': 6,
                },
                {
                    'name': 'Zimbabwe People First',
                    'short_name': 'ZPF',
                    'description': 'Political party formed by Joice Mujuru',
                    'status': 'INACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#4169E1',
                    'display_order': 7,
                },
                {
                    'name': 'Independent',
                    'short_name': 'Independent',
                    'description': 'Independent candidates not affiliated with any party',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': True,
                    'primary_color': '#696969',
                    'display_order': 8,
                },
                {
                    'name': 'Other',
                    'short_name': 'Other',
                    'description': 'Other political affiliations',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#A9A9A9',
                    'display_order': 9,
                },
                {
                    'name': 'Not Specified',
                    'short_name': 'Not Specified',
                    'description': 'Political affiliation not specified',
                    'status': 'ACTIVE',
                    'is_parliamentary_party': False,
                    'primary_color': '#D3D3D3',
                    'display_order': 10,
                },
            ]

            created_parties = 0
            updated_parties = 0
            
            for party_data in political_parties_data:
                party, created = PoliticalParty.objects.get_or_create(
                    short_name=party_data['short_name'],
                    defaults=party_data
                )
                
                if created:
                    created_parties += 1
                    self.stdout.write(f'  Created: {party.name}')
                elif force:
                    for key, value in party_data.items():
                        setattr(party, key, value)
                    party.save()
                    updated_parties += 1
                    self.stdout.write(f'  Updated: {party.name}')
                else:
                    self.stdout.write(f'  Exists: {party.name}')

            self.stdout.write(
                self.style.SUCCESS(f'Political parties: {created_parties} created, {updated_parties} updated')
            )

        # Populate beneficiary categories
        self.stdout.write('Populating beneficiary categories...')
        with transaction.atomic():
            categories_data = [
                {
                    'name': 'SPEAKER_NATIONAL_ASSEMBLY',
                    'description': 'Presiding officer of the National Assembly',
                    'monthly_entitlement_litres': 900,
                    'category_multiplier': 3.0,
                    'is_active': True,
                },
                {
                    'name': 'DEPUTY_SPEAKER',
                    'description': 'Deputy presiding officer of the National Assembly',
                    'monthly_entitlement_litres': 750,
                    'category_multiplier': 2.5,
                    'is_active': True,
                },
                {
                    'name': 'MP',
                    'description': 'Elected representatives in the National Assembly',
                    'monthly_entitlement_litres': 450,
                    'category_multiplier': 1.5,
                    'is_active': True,
                },
                {
                    'name': 'WOMEN_QUOTA_MP',
                    'description': 'Women quota members of Parliament',
                    'monthly_entitlement_litres': 450,
                    'category_multiplier': 1.5,
                    'is_active': True,
                },
                {
                    'name': 'YOUTH_QUOTA_MP',
                    'description': 'Youth quota members of Parliament',
                    'monthly_entitlement_litres': 450,
                    'category_multiplier': 1.5,
                    'is_active': True,
                },
                {
                    'name': 'MINISTER',
                    'description': 'Members of the Cabinet',
                    'monthly_entitlement_litres': 600,
                    'category_multiplier': 2.0,
                    'is_active': True,
                },
                {
                    'name': 'DEPUTY_MINISTER',
                    'description': 'Deputy members of the Cabinet',
                    'monthly_entitlement_litres': 540,
                    'category_multiplier': 1.8,
                    'is_active': True,
                },
                {
                    'name': 'SENATOR',
                    'description': 'Members of the Senate',
                    'monthly_entitlement_litres': 390,
                    'category_multiplier': 1.3,
                    'is_active': True,
                },
                {
                    'name': 'PRESIDENT_OF_SENATE',
                    'description': 'Presiding officer of the Senate',
                    'monthly_entitlement_litres': 840,
                    'category_multiplier': 2.8,
                    'is_active': True,
                },
                {
                    'name': 'DEPUTY_PRESIDENT_OF_SENATE',
                    'description': 'Deputy presiding officer of the Senate',
                    'monthly_entitlement_litres': 690,
                    'category_multiplier': 2.3,
                    'is_active': True,
                },
                {
                    'name': 'ADMINISTRATIVE_STAFF',
                    'description': 'Administrative support staff',
                    'monthly_entitlement_litres': 300,
                    'category_multiplier': 1.0,
                    'is_active': True,
                },
                {
                    'name': 'CLERK_OF_PARLIAMENT',
                    'description': 'Chief administrative officer of Parliament',
                    'monthly_entitlement_litres': 660,
                    'category_multiplier': 2.2,
                    'is_active': True,
                },
                {
                    'name': 'DEPUTY_CLERK',
                    'description': 'Deputy administrative officer',
                    'monthly_entitlement_litres': 540,
                    'category_multiplier': 1.8,
                    'is_active': True,
                },
                {
                    'name': 'PRINCIPAL_CLERK',
                    'description': 'Senior administrative clerk',
                    'monthly_entitlement_litres': 480,
                    'category_multiplier': 1.6,
                    'is_active': True,
                },
                {
                    'name': 'SENIOR_CLERK',
                    'description': 'Senior level clerk',
                    'monthly_entitlement_litres': 420,
                    'category_multiplier': 1.4,
                    'is_active': True,
                },
                {
                    'name': 'CLERK',
                    'description': 'Administrative clerk',
                    'monthly_entitlement_litres': 360,
                    'category_multiplier': 1.2,
                    'is_active': True,
                },
                {
                    'name': 'JUNIOR_CLERK',
                    'description': 'Junior level clerk',
                    'monthly_entitlement_litres': 300,
                    'category_multiplier': 1.0,
                    'is_active': True,
                },
                {
                    'name': 'SECURITY_STAFF',
                    'description': 'Parliament security personnel',
                    'monthly_entitlement_litres': 330,
                    'category_multiplier': 1.1,
                    'is_active': True,
                },
                {
                    'name': 'MAINTENANCE_STAFF',
                    'description': 'Building and grounds maintenance',
                    'monthly_entitlement_litres': 300,
                    'category_multiplier': 1.0,
                    'is_active': True,
                },
                {
                    'name': 'CATERING_STAFF',
                    'description': 'Parliament catering services',
                    'monthly_entitlement_litres': 300,
                    'category_multiplier': 1.0,
                    'is_active': True,
                },
                {
                    'name': 'DRIVER',
                    'description': 'Official parliamentary drivers',
                    'monthly_entitlement_litres': 330,
                    'category_multiplier': 1.1,
                    'is_active': True,
                },
                {
                    'name': 'IT_SUPPORT',
                    'description': 'Information technology support',
                    'monthly_entitlement_litres': 360,
                    'category_multiplier': 1.2,
                    'is_active': True,
                },
                {
                    'name': 'MEDIA_LIAISON',
                    'description': 'Parliament media and communications',
                    'monthly_entitlement_litres': 390,
                    'category_multiplier': 1.3,
                    'is_active': True,
                },
                {
                    'name': 'OTHER',
                    'description': 'Other parliamentary positions not listed',
                    'monthly_entitlement_litres': 300,
                    'category_multiplier': 1.0,
                    'is_active': True,
                },
            ]

            created_categories = 0
            updated_categories = 0
            
            for category_data in categories_data:
                category, created = BeneficiaryCategory.objects.get_or_create(
                    name=category_data['name'],
                    defaults=category_data
                )
                
                if created:
                    created_categories += 1
                    self.stdout.write(f'  Created: {category.name}')
                elif force:
                    for key, value in category_data.items():
                        setattr(category, key, value)
                    category.save()
                    updated_categories += 1
                    self.stdout.write(f'  Updated: {category.name}')
                else:
                    self.stdout.write(f'  Exists: {category.name}')

            self.stdout.write(
                self.style.SUCCESS(f'Beneficiary categories: {created_categories} created, {updated_categories} updated')
            )

        self.stdout.write(self.style.SUCCESS('Reference data population completed successfully!'))
        
        # Display summary
        total_parties = PoliticalParty.objects.count()
        active_parties = PoliticalParty.objects.filter(status='ACTIVE').count()
        total_categories = BeneficiaryCategory.objects.count()
        active_categories = BeneficiaryCategory.objects.filter(is_active=True).count()
        
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Political Parties: {total_parties} total, {active_parties} active')
        self.stdout.write(f'  Beneficiary Categories: {total_categories} total, {active_categories} active')
