from django.core.management.base import BaseCommand
from fuel.models import FuelTransaction, FuelData, User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json


class Command(BaseCommand):
    help = 'Send automated notifications for fuel system events'

    def add_arguments(self, parser):
        parser.add_argument(
            '--notification-type',
            type=str,
            choices=['daily-summary', 'weekly-digest', 'pending-approvals', 'budget-alerts', 'price-changes'],
            default='daily-summary',
            help='Type of notification to send'
        )
        parser.add_argument(
            '--recipients',
            type=str,
            help='Comma-separated list of email recipients'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending'
        )

    def handle(self, *args, **options):
        notification_type = options['notification_type']
        recipients = options.get('recipients', '').split(',') if options.get('recipients') else []
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.SUCCESS(f'📧 Preparing {notification_type} notifications...')
        )

        if notification_type == 'daily-summary':
            self.send_daily_summary(recipients, dry_run)
        elif notification_type == 'weekly-digest':
            self.send_weekly_digest(recipients, dry_run)
        elif notification_type == 'pending-approvals':
            self.send_pending_approvals(recipients, dry_run)
        elif notification_type == 'budget-alerts':
            self.send_budget_alerts(recipients, dry_run)
        elif notification_type == 'price-changes':
            self.send_price_change_notifications(recipients, dry_run)

    def send_daily_summary(self, recipients, dry_run):
        """Send daily fuel transaction summary"""
        today = timezone.now().date()
        
        # Get today's transactions
        today_transactions = FuelTransaction.objects.filter(
            created_at__date=today
        )
        
        pending_count = today_transactions.filter(status='pending').count()
        approved_count = today_transactions.filter(status='approved').count()
        rejected_count = today_transactions.filter(status='rejected').count()
        
        # Calculate fuel consumption
        approved_transactions = today_transactions.filter(status='approved')
        total_litres = sum(t.liters for t in approved_transactions)
        total_cost = sum(t.total_cost_usd for t in approved_transactions)

        subject = f'Daily Fuel System Summary - {today.strftime("%B %d, %Y")}'
        
        message = f"""
📊 DAILY FUEL SYSTEM SUMMARY
Date: {today.strftime("%B %d, %Y")}

🔢 TRANSACTION STATUS:
• Pending Approval: {pending_count}
• Approved: {approved_count}
• Rejected: {rejected_count}
• Total Submitted: {today_transactions.count()}

⛽ FUEL CONSUMPTION:
• Total Fuel Approved: {total_litres:.2f} L
• Total Cost: ${total_cost:.2f} USD

🚨 ACTIONS NEEDED:
{f"• {pending_count} transactions require approval" if pending_count > 0 else "• No pending approvals"}

---
Parliament of Zimbabwe Fuel Management System
Generated automatically on {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}
        """.strip()

        # Default recipients if none specified
        if not recipients:
            recipients = ['admin@parliament.gov.zw', 'finance@parliament.gov.zw']

        if dry_run:
            self.stdout.write('\n📧 EMAIL PREVIEW:')
            self.stdout.write(f'To: {", ".join(recipients)}')
            self.stdout.write(f'Subject: {subject}')
            self.stdout.write('\n' + message)
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipients,
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Daily summary sent to {len(recipients)} recipients')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed to send email: {str(e)}')
                )

    def send_pending_approvals(self, recipients, dry_run):
        """Send notification about pending approvals"""
        pending_transactions = FuelTransaction.objects.filter(status='pending')
        
        if not pending_transactions.exists():
            self.stdout.write(
                self.style.SUCCESS('✅ No pending approvals - no notification needed')
            )
            return

        # Group by urgency (older requests first)
        urgent_count = pending_transactions.filter(
            created_at__lt=timezone.now() - timedelta(days=2)
        ).count()
        
        today_count = pending_transactions.filter(
            created_at__date=timezone.now().date()
        ).count()

        subject = f'🚨 {pending_transactions.count()} Fuel Transactions Awaiting Approval'
        
        message = f"""
🚨 PENDING FUEL TRANSACTION APPROVALS

📋 SUMMARY:
• Total Pending: {pending_transactions.count()}
• Urgent (>2 days old): {urgent_count}
• Submitted Today: {today_count}

⚡ URGENT REQUESTS:
"""
        
        # List urgent requests
        urgent_requests = pending_transactions.filter(
            created_at__lt=timezone.now() - timedelta(days=2)
        ).order_by('created_at')[:5]
        
        for txn in urgent_requests:
            days_old = (timezone.now() - txn.created_at).days
            message += f"• {txn.user.get_full_name() or txn.user.username} - {txn.liters}L ({days_old} days old)\n"

        if urgent_requests.count() == 0:
            message += "• No urgent requests\n"

        message += f"""
📊 ACTION REQUIRED:
Please review and approve/reject pending transactions in the fuel management system.

🔗 Access the system: {settings.SITE_URL}/fuel/dashboard/

---
Parliament of Zimbabwe Fuel Management System
"""

        if not recipients:
            # Send to approvers/managers
            recipients = ['manager@parliament.gov.zw', 'supervisor@parliament.gov.zw']

        if dry_run:
            self.stdout.write('\n📧 EMAIL PREVIEW:')
            self.stdout.write(f'To: {", ".join(recipients)}')
            self.stdout.write(f'Subject: {subject}')
            self.stdout.write('\n' + message)
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipients,
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Pending approvals notification sent to {len(recipients)} recipients')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed to send email: {str(e)}')
                )

    def send_weekly_digest(self, recipients, dry_run):
        """Send weekly fuel consumption digest"""
        week_start = timezone.now().date() - timedelta(days=7)
        week_end = timezone.now().date()
        
        weekly_transactions = FuelTransaction.objects.filter(
            created_at__date__range=[week_start, week_end],
            status='approved'
        )
        
        total_litres = sum(t.liters for t in weekly_transactions)
        total_cost = sum(t.total_cost_usd for t in weekly_transactions)
        
        # Top consumers
        from django.db.models import Sum
        top_consumers = weekly_transactions.values(
            'user__first_name', 'user__last_name'
        ).annotate(
            total_fuel=Sum('liters')
        ).order_by('-total_fuel')[:5]

        subject = f'Weekly Fuel Digest - {week_start.strftime("%b %d")} to {week_end.strftime("%b %d, %Y")}'
        
        message = f"""
📈 WEEKLY FUEL CONSUMPTION DIGEST
Period: {week_start.strftime("%B %d")} - {week_end.strftime("%B %d, %Y")}

📊 WEEK SUMMARY:
• Total Transactions: {weekly_transactions.count()}
• Total Fuel Consumed: {total_litres:.2f} L
• Total Cost: ${total_cost:.2f} USD
• Average per Transaction: {total_litres/weekly_transactions.count():.2f} L

🏆 TOP FUEL CONSUMERS:
"""
        
        for i, consumer in enumerate(top_consumers, 1):
            name = f"{consumer['user__first_name']} {consumer['user__last_name']}"
            message += f"{i}. {name}: {consumer['total_fuel']:.2f} L\n"

        message += """
📊 TRENDS:
• [Comparison with previous week would go here]

---
Parliament of Zimbabwe Fuel Management System
"""

        if not recipients:
            recipients = ['admin@parliament.gov.zw', 'finance@parliament.gov.zw']

        if dry_run:
            self.stdout.write('\n📧 EMAIL PREVIEW:')
            self.stdout.write(f'To: {", ".join(recipients)}')
            self.stdout.write(f'Subject: {subject}')
            self.stdout.write('\n' + message)
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipients,
                    fail_silently=False,
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Weekly digest sent to {len(recipients)} recipients')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed to send email: {str(e)}')
                )

    def send_price_change_notifications(self, recipients, dry_run):
        """Notify about recent fuel price changes"""
        try:
            latest_price = FuelData.objects.latest('timestamp')
            
            # Check if price changed in last 24 hours
            if latest_price.timestamp < timezone.now() - timedelta(days=1):
                self.stdout.write('ℹ️ No recent price changes to notify about')
                return
                
            subject = '💰 Fuel Price Update - Parliament Fuel System'
            
            message = f"""
💰 FUEL PRICE UPDATE NOTIFICATION

📅 Effective Date: {latest_price.timestamp.strftime("%B %d, %Y at %H:%M")}

⛽ NEW PRICES:
• Petrol: ${latest_price.petrol_price_usd:.4f} USD per liter
• Diesel: ${latest_price.diesel_price_usd:.4f} USD per liter

📊 EXCHANGE RATE:
• 1 USD = {latest_price.usd_zwg_exchange_rate:.4f} ZWG

🔄 IMPACT:
These new prices will apply to all future fuel transactions.

---
Parliament of Zimbabwe Fuel Management System
"""

            if not recipients:
                # Send to all users who submit fuel requests
                all_users = User.objects.filter(is_active=True)
                recipients = [user.email for user in all_users if user.email]

            if dry_run:
                self.stdout.write('\n📧 EMAIL PREVIEW:')
                self.stdout.write(f'To: {len(recipients)} recipients')
                self.stdout.write(f'Subject: {subject}')
                self.stdout.write('\n' + message)
            else:
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=recipients,
                        fail_silently=False,
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Price change notification sent to {len(recipients)} recipients')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Failed to send email: {str(e)}')
                    )
                    
        except FuelData.DoesNotExist:
            self.stdout.write('⚠️ No fuel price data available')

    def send_budget_alerts(self, recipients, dry_run):
        """Send budget utilization alerts"""
        # This would be implemented when department budgets are added
        self.stdout.write('💰 Budget alerts feature - to be implemented with department budget tracking')
        
        subject = '⚠️ Budget Alert - Fuel Consumption'
        message = """
⚠️ BUDGET UTILIZATION ALERT

[This feature will be implemented when department budgets are configured]

• Department budget tracking
• Threshold alerts (80%, 90%, 100%)
• Projected monthly consumption
• Recommendations for budget adjustments

---
Parliament of Zimbabwe Fuel Management System
"""
        
        if dry_run:
            self.stdout.write('\n📧 EMAIL PREVIEW:')
            self.stdout.write(f'Subject: {subject}')
            self.stdout.write('\n' + message)
