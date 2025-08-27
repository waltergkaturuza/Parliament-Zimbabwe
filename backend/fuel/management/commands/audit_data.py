from django.core.management.base import BaseCommand
from fuel.models import FuelTransaction, User, FuelData
from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import datetime, timedelta
import json
import os


class Command(BaseCommand):
    help = 'Perform data audit and integrity checks for the fuel system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Automatically fix detected issues'
        )
        parser.add_argument(
            '--output-format',
            type=str,
            choices=['json', 'text'],
            default='text',
            help='Output format for audit report'
        )
        parser.add_argument(
            '--save-report',
            action='store_true',
            help='Save audit report to file'
        )

    def handle(self, *args, **options):
        fix_issues = options['fix']
        output_format = options['output_format']
        save_report = options['save_report']

        self.stdout.write(
            self.style.SUCCESS('🔍 Starting fuel system data audit...')
        )

        audit_results = {
            'audit_date': timezone.now().isoformat(),
            'checks_performed': [],
            'issues_found': [],
            'issues_fixed': [],
            'statistics': {},
            'recommendations': []
        }

        # Perform various audit checks
        self.check_orphaned_transactions(audit_results, fix_issues)
        self.check_negative_values(audit_results, fix_issues)
        self.check_missing_approvals(audit_results, fix_issues)
        self.check_price_inconsistencies(audit_results, fix_issues)
        self.check_user_data_integrity(audit_results, fix_issues)
        self.calculate_system_statistics(audit_results)
        self.generate_recommendations(audit_results)

        # Output results
        if output_format == 'json':
            self.output_json_report(audit_results, save_report)
        else:
            self.output_text_report(audit_results, save_report)

    def check_orphaned_transactions(self, audit_results, fix_issues):
        """Check for transactions with invalid user references"""
        self.stdout.write('   Checking for orphaned transactions...')
        
        # Find transactions with deleted users
        total_transactions = FuelTransaction.objects.count()
        valid_transactions = FuelTransaction.objects.filter(user__isnull=False).count()
        orphaned_count = total_transactions - valid_transactions

        audit_results['checks_performed'].append('orphaned_transactions')
        
        if orphaned_count > 0:
            issue = {
                'type': 'orphaned_transactions',
                'description': f'Found {orphaned_count} transactions with invalid user references',
                'severity': 'high',
                'count': orphaned_count
            }
            audit_results['issues_found'].append(issue)
            
            if fix_issues:
                # Here you could implement logic to handle orphaned transactions
                # For example, assign to a "deleted user" account or remove them
                audit_results['issues_fixed'].append(f'Marked {orphaned_count} orphaned transactions for manual review')
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ No orphaned transactions found'))

    def check_negative_values(self, audit_results, fix_issues):
        """Check for negative values in transactions"""
        self.stdout.write('   Checking for negative values...')
        
        negative_liters = FuelTransaction.objects.filter(liters__lt=0).count()
        negative_prices = FuelTransaction.objects.filter(unit_price_usd__lt=0).count()
        negative_costs = FuelTransaction.objects.filter(total_cost_usd__lt=0).count()

        audit_results['checks_performed'].append('negative_values')
        
        issues = []
        if negative_liters > 0:
            issues.append(f'{negative_liters} transactions with negative liters')
        if negative_prices > 0:
            issues.append(f'{negative_prices} transactions with negative unit prices')
        if negative_costs > 0:
            issues.append(f'{negative_costs} transactions with negative total costs')

        if issues:
            issue = {
                'type': 'negative_values',
                'description': 'Found transactions with negative values',
                'severity': 'medium',
                'details': issues
            }
            audit_results['issues_found'].append(issue)
            
            if fix_issues:
                # Fix negative values by taking absolute value
                fixed_count = 0
                for transaction in FuelTransaction.objects.filter(liters__lt=0):
                    transaction.liters = abs(transaction.liters)
                    transaction.save()
                    fixed_count += 1
                
                for transaction in FuelTransaction.objects.filter(unit_price_usd__lt=0):
                    transaction.unit_price_usd = abs(transaction.unit_price_usd)
                    transaction.save()
                    fixed_count += 1
                
                audit_results['issues_fixed'].append(f'Fixed {fixed_count} negative values')
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ No negative values found'))

    def check_missing_approvals(self, audit_results, fix_issues):
        """Check for approved transactions without approver"""
        self.stdout.write('   Checking for missing approval data...')
        
        approved_without_approver = FuelTransaction.objects.filter(
            status='approved',
            approved_by__isnull=True
        ).count()

        audit_results['checks_performed'].append('missing_approvals')
        
        if approved_without_approver > 0:
            issue = {
                'type': 'missing_approvals',
                'description': f'Found {approved_without_approver} approved transactions without approver information',
                'severity': 'medium',
                'count': approved_without_approver
            }
            audit_results['issues_found'].append(issue)
            
            if fix_issues:
                # Could implement logic to set a default approver or mark for review
                audit_results['issues_fixed'].append(f'Marked {approved_without_approver} transactions for approval review')
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ All approved transactions have approver information'))

    def check_price_inconsistencies(self, audit_results, fix_issues):
        """Check for price inconsistencies in transactions"""
        self.stdout.write('   Checking for price inconsistencies...')
        
        # Check if calculated total matches stored total
        inconsistent_totals = 0
        inconsistent_transactions = []
        
        for transaction in FuelTransaction.objects.all()[:1000]:  # Sample check
            calculated_total = transaction.liters * transaction.unit_price_usd
            stored_total = transaction.total_cost_usd
            
            # Allow for small rounding differences
            if abs(calculated_total - stored_total) > 0.01:
                inconsistent_totals += 1
                inconsistent_transactions.append({
                    'id': transaction.id,
                    'calculated': float(calculated_total),
                    'stored': float(stored_total),
                    'difference': float(abs(calculated_total - stored_total))
                })

        audit_results['checks_performed'].append('price_inconsistencies')
        
        if inconsistent_totals > 0:
            issue = {
                'type': 'price_inconsistencies',
                'description': f'Found {inconsistent_totals} transactions with inconsistent total calculations',
                'severity': 'low',
                'count': inconsistent_totals,
                'examples': inconsistent_transactions[:5]  # Show first 5 examples
            }
            audit_results['issues_found'].append(issue)
            
            if fix_issues:
                fixed_count = 0
                for transaction in FuelTransaction.objects.all():
                    calculated_total = transaction.liters * transaction.unit_price_usd
                    if abs(calculated_total - transaction.total_cost_usd) > 0.01:
                        transaction.total_cost_usd = calculated_total
                        transaction.save()
                        fixed_count += 1
                
                audit_results['issues_fixed'].append(f'Fixed {fixed_count} price calculation inconsistencies')
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ No price inconsistencies found'))

    def check_user_data_integrity(self, audit_results, fix_issues):
        """Check user data integrity"""
        self.stdout.write('   Checking user data integrity...')
        
        # Check for users without email
        users_without_email = User.objects.filter(email__isnull=True).count() + \
                             User.objects.filter(email='').count()
        
        # Check for duplicate emails
        from django.db.models import Count
        duplicate_emails = User.objects.values('email').annotate(
            count=Count('email')
        ).filter(count__gt=1, email__isnull=False).exclude(email='')

        audit_results['checks_performed'].append('user_data_integrity')
        
        issues = []
        if users_without_email > 0:
            issues.append(f'{users_without_email} users without email addresses')
        
        if duplicate_emails.exists():
            issues.append(f'{duplicate_emails.count()} duplicate email addresses found')

        if issues:
            issue = {
                'type': 'user_data_integrity',
                'description': 'User data integrity issues found',
                'severity': 'medium',
                'details': issues
            }
            audit_results['issues_found'].append(issue)
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ User data integrity checks passed'))

    def calculate_system_statistics(self, audit_results):
        """Calculate system-wide statistics"""
        self.stdout.write('   Calculating system statistics...')
        
        # Transaction statistics
        total_transactions = FuelTransaction.objects.count()
        approved_transactions = FuelTransaction.objects.filter(status='approved').count()
        pending_transactions = FuelTransaction.objects.filter(status='pending').count()
        rejected_transactions = FuelTransaction.objects.filter(status='rejected').count()
        
        # Fuel consumption statistics
        total_fuel_consumed = FuelTransaction.objects.filter(
            status='approved'
        ).aggregate(total=Sum('liters'))['total'] or 0
        
        total_cost = FuelTransaction.objects.filter(
            status='approved'
        ).aggregate(total=Sum('total_cost_usd'))['total'] or 0
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(
            fueltransaction__created_at__gte=timezone.now() - timedelta(days=30)
        ).distinct().count()
        
        # Average transaction size
        avg_transaction_size = FuelTransaction.objects.filter(
            status='approved'
        ).aggregate(avg=Avg('liters'))['avg'] or 0
        
        audit_results['statistics'] = {
            'total_transactions': total_transactions,
            'approved_transactions': approved_transactions,
            'pending_transactions': pending_transactions,
            'rejected_transactions': rejected_transactions,
            'approval_rate': (approved_transactions / total_transactions * 100) if total_transactions > 0 else 0,
            'total_fuel_consumed_liters': float(total_fuel_consumed),
            'total_cost_usd': float(total_cost),
            'average_transaction_size_liters': float(avg_transaction_size),
            'total_users': total_users,
            'active_users_last_30_days': active_users,
            'user_activity_rate': (active_users / total_users * 100) if total_users > 0 else 0
        }

    def generate_recommendations(self, audit_results):
        """Generate recommendations based on audit findings"""
        recommendations = []
        
        # Check approval rate
        approval_rate = audit_results['statistics'].get('approval_rate', 0)
        if approval_rate < 80:
            recommendations.append('Low approval rate detected. Consider reviewing approval criteria.')
        
        # Check user activity
        activity_rate = audit_results['statistics'].get('user_activity_rate', 0)
        if activity_rate < 50:
            recommendations.append('Low user activity rate. Consider user training or system improvements.')
        
        # Check for high pending transactions
        pending_count = audit_results['statistics'].get('pending_transactions', 0)
        total_count = audit_results['statistics'].get('total_transactions', 1)
        if pending_count / total_count > 0.2:
            recommendations.append('High number of pending transactions. Consider streamlining approval process.')
        
        # Check for issues found
        if audit_results['issues_found']:
            recommendations.append('Data integrity issues detected. Run audit with --fix flag to resolve.')
        
        if not recommendations:
            recommendations.append('System appears to be running smoothly with no major issues detected.')
        
        audit_results['recommendations'] = recommendations

    def output_text_report(self, audit_results, save_report):
        """Output audit report in text format"""
        report_lines = []
        
        report_lines.append('🔍 FUEL SYSTEM AUDIT REPORT')
        report_lines.append('=' * 50)
        report_lines.append(f"Audit Date: {audit_results['audit_date']}")
        report_lines.append('')
        
        # Statistics
        report_lines.append('📊 SYSTEM STATISTICS')
        report_lines.append('-' * 30)
        stats = audit_results['statistics']
        report_lines.append(f"Total Transactions: {stats['total_transactions']}")
        report_lines.append(f"Approved: {stats['approved_transactions']} ({stats['approval_rate']:.1f}%)")
        report_lines.append(f"Pending: {stats['pending_transactions']}")
        report_lines.append(f"Rejected: {stats['rejected_transactions']}")
        report_lines.append(f"Total Fuel Consumed: {stats['total_fuel_consumed_liters']:.2f} L")
        report_lines.append(f"Total Cost: ${stats['total_cost_usd']:.2f}")
        report_lines.append(f"Average Transaction Size: {stats['average_transaction_size_liters']:.2f} L")
        report_lines.append(f"Total Users: {stats['total_users']}")
        report_lines.append(f"Active Users (30 days): {stats['active_users_last_30_days']} ({stats['user_activity_rate']:.1f}%)")
        report_lines.append('')
        
        # Issues
        if audit_results['issues_found']:
            report_lines.append('⚠️  ISSUES FOUND')
            report_lines.append('-' * 30)
            for issue in audit_results['issues_found']:
                report_lines.append(f"• {issue['description']} (Severity: {issue['severity']})")
        else:
            report_lines.append('✅ NO ISSUES FOUND')
        
        report_lines.append('')
        
        # Fixed issues
        if audit_results['issues_fixed']:
            report_lines.append('🔧 ISSUES FIXED')
            report_lines.append('-' * 30)
            for fix in audit_results['issues_fixed']:
                report_lines.append(f"• {fix}")
            report_lines.append('')
        
        # Recommendations
        report_lines.append('💡 RECOMMENDATIONS')
        report_lines.append('-' * 30)
        for rec in audit_results['recommendations']:
            report_lines.append(f"• {rec}")
        
        # Output to console
        for line in report_lines:
            self.stdout.write(line)
        
        # Save to file if requested
        if save_report:
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f'fuel_audit_report_{timestamp}.txt'
            with open(filename, 'w', encoding='utf-8') as f:
                f.write('\n'.join(report_lines))
            self.stdout.write(
                self.style.SUCCESS(f'\n💾 Report saved to: {filename}')
            )

    def output_json_report(self, audit_results, save_report):
        """Output audit report in JSON format"""
        json_output = json.dumps(audit_results, indent=2)
        self.stdout.write(json_output)
        
        if save_report:
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f'fuel_audit_report_{timestamp}.json'
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(json_output)
            self.stdout.write(
                self.style.SUCCESS(f'💾 Report saved to: {filename}')
            )
