#!/usr/bin/env python3
"""
Populate test data for development
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import BeneficiaryCategory, PoliticalParty

def create_test_data():
    print("Creating test data...")
    
    # Create Beneficiary Categories
    categories = [
        {'name': 'MP', 'description': 'Member of Parliament'},
        {'name': 'Senator', 'description': 'Senate Member'},
        {'name': 'Staff', 'description': 'Parliament Staff'},
        {'name': 'Minister', 'description': 'Cabinet Minister'},
        {'name': 'Deputy Minister', 'description': 'Deputy Cabinet Minister'},
    ]
    
    for cat_data in categories:
        category, created = BeneficiaryCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        if created:
            print(f"Created category: {category.name}")
        else:
            print(f"Category exists: {category.name}")
    
    # Create Political Parties
    parties = [
        {'name': 'ZANU-PF', 'abbreviation': 'ZANU-PF', 'is_active': True},
        {'name': 'MDC Alliance', 'abbreviation': 'MDC-A', 'is_active': True},
        {'name': 'CCC', 'abbreviation': 'CCC', 'is_active': True},
        {'name': 'ZANU', 'abbreviation': 'ZANU', 'is_active': True},
        {'name': 'Independent', 'abbreviation': 'IND', 'is_active': True},
    ]
    
    for party_data in parties:
        party, created = PoliticalParty.objects.get_or_create(
            name=party_data['name'],
            defaults={
                'abbreviation': party_data['abbreviation'],
                'is_active': party_data['is_active']
            }
        )
        if created:
            print(f"Created party: {party.name}")
        else:
            print(f"Party exists: {party.name}")
    
    print("\nFinal counts:")
    print(f"BeneficiaryCategories: {BeneficiaryCategory.objects.count()}")
    print(f"PoliticalParties: {PoliticalParty.objects.count()}")

if __name__ == "__main__":
    create_test_data()