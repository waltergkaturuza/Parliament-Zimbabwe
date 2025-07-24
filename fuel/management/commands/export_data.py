from django.core.management.base import BaseCommand
from fuel.models import FuelTransaction, FuelData
from django.utils import timezone
from datetime import datetime, timedelta
import csv
import json
import os


class Command(BaseCommand):
    help = 'Export fuel system data in various formats'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            choices=['csv', 'json', 'excel'],
            default='csv',
            help='Export format'
        )
        parser.add_argument(
            '--data-type',
            type=str,
            choices=['transactions', 'fuel-prices', 'summary', 'all'],
            default='transactions',
            help='Type of data to export'
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['pending', 'approved', 'rejected', 'all'],
            default='all',
            help='Filter by transaction status'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='exports',
            help='Output directory for exported files'
        )

    def handle(self, *args, **options):
        export_format = options['format']
        data_type = options['data_type']
        start_date = options.get('start_date')
        end_date = options.get('end_date')
        status = options['status']
        output_dir = options['output_dir']

        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        self.stdout.write(
            self.style.SUCCESS(f'📊 Exporting {data_type} data in {export_format} format...')
        )

        if data_type == 'transactions':
            self.export_transactions(export_format, start_date, end_date, status, output_dir)
        elif data_type == 'fuel-prices':
            self.export_fuel_prices(export_format, start_date, end_date, output_dir)
        elif data_type == 'summary':
            self.export_summary(export_format, start_date, end_date, output_dir)
        elif data_type == 'all':
            self.export_all_data(export_format, start_date, end_date, status, output_dir)

    def export_transactions(self, export_format, start_date, end_date, status, output_dir):
        """Export fuel transactions"""
        # Build queryset
        queryset = FuelTransaction.objects.all()

        if start_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            queryset = queryset.filter(transaction_date__gte=start_date_obj)

        if end_date:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            queryset = queryset.filter(transaction_date__lte=end_date_obj)

        if status != 'all':
            queryset = queryset.filter(status=status)

        queryset = queryset.order_by('-transaction_date')

        # Generate filename
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f'fuel_transactions_{timestamp}.{export_format}'
        filepath = os.path.join(output_dir, filename)

        if export_format == 'csv':
            self.export_transactions_csv(queryset, filepath)
        elif export_format == 'json':
            self.export_transactions_json(queryset, filepath)
        elif export_format == 'excel':
            self.export_transactions_excel(queryset, filepath)

        self.stdout.write(
            self.style.SUCCESS(f'✅ Transactions exported to: {filepath}')
        )

    def export_transactions_csv(self, queryset, filepath):
        """Export transactions to CSV"""
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'Transaction ID', 'Employee', 'Date', 'Fuel Type', 
                'Liters', 'Unit Price (USD)', 'Total Cost (USD)', 
                'Status', 'Approved By', 'Created At', 'Department'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            for transaction in queryset:
                writer.writerow({
                    'Transaction ID': transaction.id,
                    'Employee': transaction.user.get_full_name() or transaction.user.username,
                    'Date': transaction.transaction_date.strftime('%Y-%m-%d'),
                    'Fuel Type': transaction.fuel_type,
                    'Liters': transaction.liters,
                    'Unit Price (USD)': transaction.unit_price_usd,
                    'Total Cost (USD)': transaction.total_cost_usd,
                    'Status': transaction.status.title(),
                    'Approved By': transaction.approved_by.get_full_name() if transaction.approved_by else '',
                    'Created At': transaction.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'Department': getattr(transaction.user, 'department', 'N/A')
                })

    def export_transactions_json(self, queryset, filepath):
        """Export transactions to JSON"""
        data = []
        for transaction in queryset:
            data.append({
                'id': transaction.id,
                'employee': {
                    'username': transaction.user.username,
                    'full_name': transaction.user.get_full_name(),
                    'email': transaction.user.email,
                },
                'transaction_date': transaction.transaction_date.isoformat(),
                'fuel_type': transaction.fuel_type,
                'liters': float(transaction.liters),
                'unit_price_usd': float(transaction.unit_price_usd),
                'total_cost_usd': float(transaction.total_cost_usd),
                'status': transaction.status,
                'approved_by': transaction.approved_by.get_full_name() if transaction.approved_by else None,
                'created_at': transaction.created_at.isoformat(),
                'updated_at': transaction.updated_at.isoformat(),
            })

        with open(filepath, 'w', encoding='utf-8') as jsonfile:
            json.dump({
                'export_date': timezone.now().isoformat(),
                'total_records': len(data),
                'transactions': data
            }, jsonfile, indent=2)

    def export_fuel_prices(self, export_format, start_date, end_date, output_dir):
        """Export fuel price history"""
        queryset = FuelData.objects.all()

        if start_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            queryset = queryset.filter(timestamp__gte=start_date_obj)

        if end_date:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            queryset = queryset.filter(timestamp__lte=end_date_obj)

        queryset = queryset.order_by('-timestamp')

        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f'fuel_prices_{timestamp}.{export_format}'
        filepath = os.path.join(output_dir, filename)

        if export_format == 'csv':
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = [
                    'Date', 'Petrol Price (USD)', 'Diesel Price (USD)', 
                    'Exchange Rate (USD/ZWG)', 'Previous Petrol Price', 
                    'Previous Diesel Price'
                ]
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

                for price_data in queryset:
                    writer.writerow({
                        'Date': price_data.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'Petrol Price (USD)': price_data.petrol_price_usd,
                        'Diesel Price (USD)': price_data.diesel_price_usd,
                        'Exchange Rate (USD/ZWG)': price_data.usd_zwg_exchange_rate,
                        'Previous Petrol Price': price_data.previous_petrol_price_usd or '',
                        'Previous Diesel Price': price_data.previous_diesel_price_usd or '',
                    })

        elif export_format == 'json':
            data = []
            for price_data in queryset:
                data.append({
                    'timestamp': price_data.timestamp.isoformat(),
                    'petrol_price_usd': float(price_data.petrol_price_usd or 0),
                    'diesel_price_usd': float(price_data.diesel_price_usd or 0),
                    'usd_zwg_exchange_rate': float(price_data.usd_zwg_exchange_rate or 0),
                    'previous_petrol_price_usd': float(price_data.previous_petrol_price_usd or 0),
                    'previous_diesel_price_usd': float(price_data.previous_diesel_price_usd or 0),
                })

            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump({
                    'export_date': timezone.now().isoformat(),
                    'total_records': len(data),
                    'fuel_prices': data
                }, jsonfile, indent=2)

        self.stdout.write(
            self.style.SUCCESS(f'✅ Fuel prices exported to: {filepath}')
        )

    def export_summary(self, export_format, start_date, end_date, output_dir):
        """Export summary statistics"""
        # Build date range
        if start_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start_date_obj = timezone.now().date() - timedelta(days=30)

        if end_date:
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date_obj = timezone.now().date()

        # Get transactions in date range
        transactions = FuelTransaction.objects.filter(
            transaction_date__range=[start_date_obj, end_date_obj]
        )

        # Calculate statistics
        total_transactions = transactions.count()
        approved_transactions = transactions.filter(status='approved')
        pending_transactions = transactions.filter(status='pending')
        rejected_transactions = transactions.filter(status='rejected')

        total_litres = sum(t.liters for t in approved_transactions)
        total_cost = sum(t.total_cost_usd for t in approved_transactions)

        # Employee statistics
        from django.db.models import Sum, Count
        employee_stats = approved_transactions.values(
            'user__username', 'user__first_name', 'user__last_name'
        ).annotate(
            total_litres=Sum('liters'),
            total_cost=Sum('total_cost_usd'),
            transaction_count=Count('id')
        ).order_by('-total_litres')

        summary_data = {
            'period': {
                'start_date': start_date_obj.isoformat(),
                'end_date': end_date_obj.isoformat(),
            },
            'totals': {
                'total_transactions': total_transactions,
                'approved_transactions': approved_transactions.count(),
                'pending_transactions': pending_transactions.count(),
                'rejected_transactions': rejected_transactions.count(),
                'total_fuel_consumed': float(total_litres),
                'total_cost_usd': float(total_cost),
                'average_per_transaction': float(total_litres / approved_transactions.count()) if approved_transactions.count() > 0 else 0,
            },
            'top_consumers': list(employee_stats[:10])
        }

        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f'fuel_summary_{timestamp}.{export_format}'
        filepath = os.path.join(output_dir, filename)

        if export_format == 'json':
            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(summary_data, jsonfile, indent=2)

        elif export_format == 'csv':
            # Export summary as CSV with multiple sections
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Period info
                writer.writerow(['FUEL CONSUMPTION SUMMARY'])
                writer.writerow(['Period', f"{start_date_obj} to {end_date_obj}"])
                writer.writerow([])
                
                # Totals
                writer.writerow(['SUMMARY STATISTICS'])
                writer.writerow(['Metric', 'Value'])
                writer.writerow(['Total Transactions', total_transactions])
                writer.writerow(['Approved Transactions', approved_transactions.count()])
                writer.writerow(['Pending Transactions', pending_transactions.count()])
                writer.writerow(['Rejected Transactions', rejected_transactions.count()])
                writer.writerow(['Total Fuel Consumed (L)', total_litres])
                writer.writerow(['Total Cost (USD)', total_cost])
                writer.writerow([])
                
                # Top consumers
                writer.writerow(['TOP FUEL CONSUMERS'])
                writer.writerow(['Employee', 'Total Litres', 'Total Cost', 'Transactions'])
                for employee in employee_stats[:10]:
                    name = f"{employee['user__first_name']} {employee['user__last_name']}"
                    writer.writerow([
                        name,
                        employee['total_litres'],
                        employee['total_cost'],
                        employee['transaction_count']
                    ])

        self.stdout.write(
            self.style.SUCCESS(f'✅ Summary exported to: {filepath}')
        )

    def export_all_data(self, export_format, start_date, end_date, status, output_dir):
        """Export all data types"""
        self.stdout.write('📦 Exporting all data types...')
        
        self.export_transactions(export_format, start_date, end_date, status, output_dir)
        self.export_fuel_prices(export_format, start_date, end_date, output_dir)
        self.export_summary(export_format, start_date, end_date, output_dir)
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ All data exported to: {output_dir}/')
        )
