from django.core.management.base import BaseCommand
from django.db import transaction
from fuel.models_political_parties import PoliticalParty
from datetime import date


class Command(BaseCommand):
    help = 'Populate default political parties for Zimbabwe Parliament'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing parties',
        )

    def handle(self, *args, **options):
        force_update = options.get('force', False)
        
        # Default political parties in Zimbabwe
        default_parties = [
            {
                'name': 'Zimbabwe African National Union - Patriotic Front',
                'short_name': 'ZANU-PF',
                'abbreviation': 'ZANU-PF',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'headquarters_address': 'Rotten Row, Harare',
                'contact_phone': '+263-4-700451',
                'contact_email': 'info@zanupf.org.zw',
                'website': 'https://www.zanupf.org.zw',
                'leader_name': 'Emmerson Dambudzo Mnangagwa',
                'leader_title': 'President and First Secretary',
                'founded_date': date(1987, 12, 22),
                'description': 'Ruling party formed from the merger of ZANU and ZAPU',
                'is_government_party': True,
                'is_parliamentary_party': True,
                'display_order': 1,
                'primary_color': '#FFD700',
                'secondary_color': '#FF0000'
            },
            {
                'name': 'Citizens Coalition for Change',
                'short_name': 'CCC',
                'abbreviation': 'CCC',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'headquarters_address': 'Harare',
                'contact_phone': '+263-4-123456',
                'contact_email': 'info@ccc.org.zw',
                'website': 'https://www.ccc.org.zw',
                'leader_name': 'Nelson Chamisa',
                'leader_title': 'President',
                'founded_date': date(2022, 1, 24),
                'description': 'Main opposition party',
                'is_government_party': False,
                'is_parliamentary_party': True,
                'display_order': 2,
                'primary_color': '#FFFF00',
                'secondary_color': '#0000FF'
            },
            {
                'name': 'Zimbabwe African Peoples Union',
                'short_name': 'ZAPU',
                'abbreviation': 'ZAPU',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'headquarters_address': 'Bulawayo',
                'contact_phone': '+263-9-123456',
                'contact_email': 'info@zapu.org.zw',
                'website': 'https://www.zapu.org.zw',
                'leader_name': 'Sibangilizwe Nkomo',
                'leader_title': 'President',
                'founded_date': date(1961, 12, 17),
                'description': 'Historic liberation movement party',
                'is_government_party': False,
                'is_parliamentary_party': True,
                'display_order': 3,
                'primary_color': '#008000',
                'secondary_color': '#000000'
            },
            {
                'name': 'National Patriotic Front',
                'short_name': 'NPF',
                'abbreviation': 'NPF',
                'party_type': 'POLITICAL',
                'status': 'ACTIVE',
                'headquarters_address': 'Harare',
                'contact_phone': '+263-4-789123',
                'contact_email': 'info@npf.org.zw',
                'website': 'https://www.npf.org.zw',
                'leader_name': 'Ambrose Mutinhiri',
                'leader_title': 'President',
                'founded_date': date(2018, 8, 15),
                'description': 'Political party formed by former ZANU-PF members',
                'is_government_party': False,
                'is_parliamentary_party': False,
                'display_order': 4,
                'primary_color': '#800080',
                'secondary_color': '#FFFFFF'
            },
            {
                'name': 'Independent',
                'short_name': 'IND',
                'abbreviation': 'IND',
                'party_type': 'INDEPENDENT',
                'status': 'ACTIVE',
                'headquarters_address': 'N/A',
                'contact_phone': 'N/A',
                'contact_email': 'N/A',
                'website': 'N/A',
                'leader_name': 'N/A',
                'leader_title': 'N/A',
                'founded_date': None,
                'description': 'Independent candidates not affiliated with any political party',
                'is_government_party': False,
                'is_parliamentary_party': True,
                'display_order': 99,
                'primary_color': '#808080',
                'secondary_color': '#FFFFFF'
            }
        ]

        created_count = 0
        updated_count = 0
        
        with transaction.atomic():
            for party_data in default_parties:
                party, created = PoliticalParty.objects.get_or_create(
                    name=party_data['name'],
                    defaults=party_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created political party: {party.name}'
                        )
                    )
                elif force_update:
                    # Update existing party
                    for field, value in party_data.items():
                        if field != 'name':  # Don't update the name
                            setattr(party, field, value)
                    party.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'Updated political party: {party.name}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Political party already exists: {party.name}'
                        )
                    )

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary:'
                f'\n- Created: {created_count} political parties'
                f'\n- Updated: {updated_count} political parties'
                f'\n- Total political parties in system: {PoliticalParty.objects.count()}'
            )
        )
        
        # List all parties
        self.stdout.write('\nAll political parties:')
        for party in PoliticalParty.objects.all().order_by('display_order', 'name'):
            status = "Active" if party.status == 'ACTIVE' else "Inactive"
            gov_status = " (Government Party)" if party.is_government_party else ""
            self.stdout.write(
                f'- {party.short_name}: {party.name} ({status}){gov_status}'
            )
