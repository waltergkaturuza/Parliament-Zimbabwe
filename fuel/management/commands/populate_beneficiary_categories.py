from django.core.management.base import BaseCommand
from fuel.models import BeneficiaryCategory
from decimal import Decimal


class Command(BaseCommand):
    help = 'Populate default beneficiary categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Members of Parliament (MPs)',
                'description': 'Elected representatives in the National Assembly',
                'monthly_entitlement_litres': Decimal('450.00'),
                'category_multiplier': Decimal('1.5')
            },
            {
                'name': 'Senators',
                'description': 'Members of the Senate',
                'monthly_entitlement_litres': Decimal('420.00'),
                'category_multiplier': Decimal('1.4')
            },
            {
                'name': 'Speaker of the National Assembly',
                'description': 'Presiding officer of the National Assembly',
                'monthly_entitlement_litres': Decimal('600.00'),
                'category_multiplier': Decimal('2.0')
            },
            {
                'name': 'Deputy Speaker',
                'description': 'Deputy presiding officer of the National Assembly',
                'monthly_entitlement_litres': Decimal('550.00'),
                'category_multiplier': Decimal('1.8')
            },
            {
                'name': 'President of the Senate',
                'description': 'Presiding officer of the Senate',
                'monthly_entitlement_litres': Decimal('600.00'),
                'category_multiplier': Decimal('2.0')
            },
            {
                'name': 'Deputy President of the Senate',
                'description': 'Deputy presiding officer of the Senate',
                'monthly_entitlement_litres': Decimal('550.00'),
                'category_multiplier': Decimal('1.8')
            },
            {
                'name': 'Ministers',
                'description': 'Cabinet Ministers',
                'monthly_entitlement_litres': Decimal('600.00'),
                'category_multiplier': Decimal('2.0')
            },
            {
                'name': 'Deputy Ministers',
                'description': 'Deputy Cabinet Ministers',
                'monthly_entitlement_litres': Decimal('500.00'),
                'category_multiplier': Decimal('1.6')
            },
            {
                'name': 'Chief Whips',
                'description': 'Party leadership in Parliament',
                'monthly_entitlement_litres': Decimal('480.00'),
                'category_multiplier': Decimal('1.6')
            },
            {
                'name': 'Committee Chairpersons',
                'description': 'Chairs of Parliamentary Committees',
                'monthly_entitlement_litres': Decimal('450.00'),
                'category_multiplier': Decimal('1.5')
            },
            {
                'name': 'Parliamentary Staff',
                'description': 'Administrative and support staff',
                'monthly_entitlement_litres': Decimal('300.00'),
                'category_multiplier': Decimal('1.0')
            },
            {
                'name': 'Clerk of Parliament',
                'description': 'Chief administrative officer',
                'monthly_entitlement_litres': Decimal('500.00'),
                'category_multiplier': Decimal('1.6')
            },
            {
                'name': 'Sergeant-at-Arms',
                'description': 'Security and protocol officer',
                'monthly_entitlement_litres': Decimal('400.00'),
                'category_multiplier': Decimal('1.3')
            },
            {
                'name': 'Legal Advisors',
                'description': 'Parliamentary legal counsel',
                'monthly_entitlement_litres': Decimal('400.00'),
                'category_multiplier': Decimal('1.3')
            },
            {
                'name': 'Research Officers',
                'description': 'Parliamentary research staff',
                'monthly_entitlement_litres': Decimal('350.00'),
                'category_multiplier': Decimal('1.1')
            },
            {
                'name': 'Hansard Staff',
                'description': 'Parliamentary reporting staff',
                'monthly_entitlement_litres': Decimal('350.00'),
                'category_multiplier': Decimal('1.1')
            },
            {
                'name': 'Youth Quota MPs',
                'description': 'Youth representatives in Parliament',
                'monthly_entitlement_litres': Decimal('450.00'),
                'category_multiplier': Decimal('1.5')
            },
            {
                'name': 'Women Quota MPs',
                'description': 'Women representatives in Parliament',
                'monthly_entitlement_litres': Decimal('450.00'),
                'category_multiplier': Decimal('1.5')
            },
            {
                'name': 'Provincial Council Members',
                'description': 'Provincial council representatives',
                'monthly_entitlement_litres': Decimal('380.00'),
                'category_multiplier': Decimal('1.2')
            },
            {
                'name': 'Consultancy',
                'description': 'Parliamentary consultants and advisors',
                'monthly_entitlement_litres': Decimal('300.00'),
                'category_multiplier': Decimal('1.0')
            },
            {
                'name': 'Drivers',
                'description': 'Parliamentary transport staff',
                'monthly_entitlement_litres': Decimal('250.00'),
                'category_multiplier': Decimal('0.8')
            },
            {
                'name': 'General Staff',
                'description': 'General administrative and support staff',
                'monthly_entitlement_litres': Decimal('200.00'),
                'category_multiplier': Decimal('0.7')
            },
            {
                'name': 'Security Staff',
                'description': 'Parliamentary security personnel',
                'monthly_entitlement_litres': Decimal('280.00'),
                'category_multiplier': Decimal('0.9')
            },
            {
                'name': 'Maintenance Staff',
                'description': 'Parliamentary maintenance and facilities staff',
                'monthly_entitlement_litres': Decimal('220.00'),
                'category_multiplier': Decimal('0.7')
            }
        ]

        created_count = 0
        updated_count = 0

        for category_data in categories:
            category, created = BeneficiaryCategory.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                # Update existing category with new values
                for key, value in category_data.items():
                    if key != 'name':  # Don't update the name field
                        setattr(category, key, value)
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated category: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted! Created {created_count} new categories, '
                f'updated {updated_count} existing categories.'
            )
        )
