from django.core.management.base import BaseCommand
from fuel.models import FuelData, FuelTransaction, User
from django.utils import timezone
from decimal import Decimal
import json


class Command(BaseCommand):
    help = 'Generate comprehensive fuel system reports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--report-type',
            type=str,
            choices=['consumption', 'budget', 'employee', 'monthly', 'annual'],
            default='monthly',
            help='Type of report to generate'
        )
        parser.add_argument(
            '--department',
            type=str,
            help='Filter by department'
        )
        parser.add_argument(
            '--month',
            type=str,
            help='Month in YYYY-MM format'
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['text', 'json', 'csv'],
            default='text',
            help='Output format'
        )

    def handle(self, *args, **options):
        report_type = options['report_type']
        department = options.get('department')
        month = options.get('month')
        output_format = options['format']

        self.stdout.write(
            self.style.SUCCESS(f'🎯 Generating {report_type} report...')
        )

        if report_type == 'consumption':
            self.generate_consumption_report(department, month, output_format)
        elif report_type == 'budget':
            self.generate_budget_report(department, month, output_format)
        elif report_type == 'employee':
            self.generate_employee_report(department, month, output_format)
        elif report_type == 'monthly':
            self.generate_monthly_report(month, output_format)
        elif report_type == 'annual':
            self.generate_annual_report(output_format)

    def generate_consumption_report(self, department, month, output_format):
        """Generate fuel consumption analysis"""
        queryset = FuelTransaction.objects.filter(status='approved')
        
        if month:
            year, month_num = month.split('-')
            queryset = queryset.filter(
                transaction_date__year=year,
                transaction_date__month=month_num
            )

        # Aggregate data
        total_litres = sum(t.liters for t in queryset)
        total_cost = sum(t.total_cost_usd for t in queryset)
        transaction_count = queryset.count()

        if output_format == 'json':
            data = {
                'total_litres': float(total_litres),
                'total_cost': float(total_cost),
                'transaction_count': transaction_count,
                'average_per_transaction': float(total_litres / transaction_count) if transaction_count > 0 else 0
            }
            self.stdout.write(json.dumps(data, indent=2))
        else:
            self.stdout.write('\n📊 FUEL CONSUMPTION REPORT')
            self.stdout.write('=' * 40)
            self.stdout.write(f'Total Fuel Consumed: {total_litres:.2f} L')
            self.stdout.write(f'Total Cost: ${total_cost:.2f} USD')
            self.stdout.write(f'Number of Transactions: {transaction_count}')
            if transaction_count > 0:
                self.stdout.write(f'Average per Transaction: {total_litres/transaction_count:.2f} L')

    def generate_budget_report(self, department, month, output_format):
        """Generate budget utilization report"""
        # This would integrate with department budgets when implemented
        self.stdout.write('📈 BUDGET REPORT')
        self.stdout.write('=' * 40)
        self.stdout.write('Budget tracking feature - to be implemented with department budgets')

    def generate_employee_report(self, department, month, output_format):
        """Generate employee fuel usage report"""
        queryset = FuelTransaction.objects.filter(status='approved')
        
        if month:
            year, month_num = month.split('-')
            queryset = queryset.filter(
                transaction_date__year=year,
                transaction_date__month=month_num
            )

        # Group by employee
        from django.db.models import Sum
        employee_usage = queryset.values('user__username', 'user__first_name', 'user__last_name').annotate(
            total_litres=Sum('liters'),
            total_cost=Sum('total_cost_usd'),
            transaction_count=Sum('id')
        ).order_by('-total_litres')

        self.stdout.write('\n👥 EMPLOYEE FUEL USAGE REPORT')
        self.stdout.write('=' * 50)
        
        for employee in employee_usage:
            name = f"{employee['user__first_name']} {employee['user__last_name']}"
            self.stdout.write(
                f"{name:<25} | {employee['total_litres']:.2f}L | ${employee['total_cost']:.2f}"
            )

    def generate_monthly_report(self, month, output_format):
        """Generate comprehensive monthly report"""
        if not month:
            month = timezone.now().strftime('%Y-%m')
        
        year, month_num = month.split('-')
        
        # Get all approved transactions for the month
        transactions = FuelTransaction.objects.filter(
            status='approved',
            transaction_date__year=year,
            transaction_date__month=month_num
        )

        # Calculate totals
        total_litres = sum(t.liters for t in transactions)
        total_cost = sum(t.total_cost_usd for t in transactions)
        transaction_count = transactions.count()

        # Get fuel price data
        try:
            fuel_data = FuelData.objects.latest('timestamp')
            current_petrol_price = fuel_data.petrol_price_usd
            current_diesel_price = fuel_data.diesel_price_usd
        except FuelData.DoesNotExist:
            current_petrol_price = current_diesel_price = Decimal('0.00')

        self.stdout.write(f'\n📅 MONTHLY REPORT - {month}')
        self.stdout.write('=' * 50)
        self.stdout.write(f'Total Transactions: {transaction_count}')
        self.stdout.write(f'Total Fuel Consumed: {total_litres:.2f} L')
        self.stdout.write(f'Total Cost: ${total_cost:.2f} USD')
        self.stdout.write(f'Average per Transaction: {total_litres/transaction_count:.2f} L' if transaction_count > 0 else 'Average per Transaction: 0 L')
        self.stdout.write('\n💰 CURRENT FUEL PRICES:')
        self.stdout.write(f'Petrol: ${current_petrol_price:.4f} USD/L')
        self.stdout.write(f'Diesel: ${current_diesel_price:.4f} USD/L')

    def generate_annual_report(self, output_format):
        """Generate annual summary report"""
        current_year = timezone.now().year
        
        transactions = FuelTransaction.objects.filter(
            status='approved',
            transaction_date__year=current_year
        )

        # Monthly breakdown
        monthly_data = {}
        for month in range(1, 13):
            month_transactions = transactions.filter(transaction_date__month=month)
            monthly_data[month] = {
                'transactions': month_transactions.count(),
                'litres': sum(t.liters for t in month_transactions),
                'cost': sum(t.total_cost_usd for t in month_transactions)
            }

        self.stdout.write(f'\n📊 ANNUAL REPORT - {current_year}')
        self.stdout.write('=' * 60)
        
        for month, data in monthly_data.items():
            month_name = timezone.datetime(2024, month, 1).strftime('%B')
            self.stdout.write(
                f"{month_name:<12} | {data['transactions']:>3} txns | {data['litres']:>8.2f}L | ${data['cost']:>8.2f}"
            )

        # Annual totals
        total_annual_litres = sum(data['litres'] for data in monthly_data.values())
        total_annual_cost = sum(data['cost'] for data in monthly_data.values())
        total_annual_transactions = sum(data['transactions'] for data in monthly_data.values())

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(f"{'ANNUAL TOTAL':<12} | {total_annual_transactions:>3} txns | {total_annual_litres:>8.2f}L | ${total_annual_cost:>8.2f}")
