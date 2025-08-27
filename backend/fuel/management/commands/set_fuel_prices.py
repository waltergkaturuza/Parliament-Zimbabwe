from django.core.management.base import BaseCommand
from fuel.models import FuelData
from decimal import Decimal


class Command(BaseCommand):
    help = 'Set current fuel prices in USD'

    def add_arguments(self, parser):
        parser.add_argument(
            '--petrol-price',
            type=float,
            help='Current petrol price in USD per litre'
        )
        parser.add_argument(
            '--diesel-price',
            type=float,
            help='Current diesel price in USD per litre'
        )
        parser.add_argument(
            '--exchange-rate',
            type=float,
            help='USD to ZWG exchange rate for reference'
        )

    def handle(self, *args, **options):
        petrol_price = options.get('petrol_price')
        diesel_price = options.get('diesel_price')
        exchange_rate = options.get('exchange_rate')

        if not petrol_price and not diesel_price:
            self.stdout.write(
                self.style.ERROR(
                    'You must specify at least one price (--petrol-price or --diesel-price)'
                )
            )
            return

        # Get the latest fuel data or create new
        try:
            fuel_data = FuelData.objects.latest('timestamp')
            # Store previous prices
            if petrol_price and fuel_data.petrol_price_usd:
                fuel_data.previous_petrol_price_usd = fuel_data.petrol_price_usd
            if diesel_price and fuel_data.diesel_price_usd:
                fuel_data.previous_diesel_price_usd = fuel_data.diesel_price_usd
        except FuelData.DoesNotExist:
            fuel_data = FuelData()

        # Update current prices
        if petrol_price:
            fuel_data.petrol_price_usd = Decimal(str(petrol_price))
            self.stdout.write(f'Set petrol price to: ${petrol_price:.4f} USD/L')

        if diesel_price:
            fuel_data.diesel_price_usd = Decimal(str(diesel_price))
            self.stdout.write(f'Set diesel price to: ${diesel_price:.4f} USD/L')

        if exchange_rate:
            fuel_data.usd_zwg_exchange_rate = Decimal(str(exchange_rate))
            self.stdout.write(f'Set exchange rate to: 1 USD = {exchange_rate:.4f} ZWG')

        fuel_data.save()

        self.stdout.write(
            self.style.SUCCESS('Successfully updated fuel prices')
        )

        # Display current rates
        self.stdout.write('\n--- CURRENT FUEL PRICES ---')
        if fuel_data.petrol_price_usd:
            self.stdout.write(f'Petrol: ${fuel_data.petrol_price_usd:.4f} USD/L')
        if fuel_data.diesel_price_usd:
            self.stdout.write(f'Diesel: ${fuel_data.diesel_price_usd:.4f} USD/L')
        if fuel_data.usd_zwg_exchange_rate:
            self.stdout.write(f'Exchange Rate: 1 USD = {fuel_data.usd_zwg_exchange_rate:.4f} ZWG')

        # Show coupon values
        if fuel_data.petrol_price_usd:
            for litres in [5, 20, 50]:
                value = fuel_data.petrol_price_usd * litres
                self.stdout.write(f'  {litres}L Petrol Coupon: ${value:.2f} USD')

        if fuel_data.diesel_price_usd:
            for litres in [5, 20, 50]:
                value = fuel_data.diesel_price_usd * litres
                self.stdout.write(f'  {litres}L Diesel Coupon: ${value:.2f} USD')
