from django.core.management.base import BaseCommand
from fuel.models import FuelTransaction, User, FuelData
from django.utils import timezone
from datetime import datetime, timedelta
import schedule
import time
import logging
import threading


class Command(BaseCommand):
    help = 'Run scheduled background monitoring tasks for the fuel system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--daemon',
            action='store_true',
            help='Run as daemon (continuous monitoring)'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Monitoring interval in minutes (default: 60)'
        )
        parser.add_argument(
            '--log-level',
            type=str,
            choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
            default='INFO',
            help='Logging level'
        )
        parser.add_argument(
            '--enable-alerts',
            action='store_true',
            help='Enable real-time alerts'
        )

    def handle(self, *args, **options):
        daemon_mode = options['daemon']
        interval = options['interval']
        log_level = options['log_level']
        enable_alerts = options['enable_alerts']

        # Configure logging
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('fuel_monitor.log'),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger(__name__)
        self.enable_alerts = enable_alerts

        self.stdout.write(
            self.style.SUCCESS(f'🔧 Starting fuel system monitoring...')
        )
        self.stdout.write(f'Monitoring interval: {interval} minutes')
        self.stdout.write(f'Alerts enabled: {enable_alerts}')
        self.stdout.write(f'Log level: {log_level}')

        if daemon_mode:
            self.run_daemon_mode(interval)
        else:
            self.run_single_check()

    def run_daemon_mode(self, interval):
        """Run continuous monitoring"""
        self.logger.info('Starting daemon mode monitoring')
        
        # Schedule various checks
        schedule.every(interval).minutes.do(self.monitor_system_health)
        schedule.every(10).minutes.do(self.check_pending_transactions)
        schedule.every(30).minutes.do(self.monitor_unusual_activity)
        schedule.every().hour.do(self.check_price_updates)
        schedule.every().day.at("08:00").do(self.daily_summary)
        schedule.every().monday.at("09:00").do(self.weekly_report)

        self.stdout.write(
            self.style.SUCCESS('🚀 Monitoring daemon started. Press Ctrl+C to stop.')
        )

        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            self.logger.info('Monitoring daemon stopped by user')
            self.stdout.write(
                self.style.SUCCESS('👋 Monitoring daemon stopped.')
            )

    def run_single_check(self):
        """Run a single monitoring check"""
        self.logger.info('Running single monitoring check')
        self.monitor_system_health()
        self.check_pending_transactions()
        self.monitor_unusual_activity()
        self.check_price_updates()

    def monitor_system_health(self):
        """Monitor overall system health"""
        self.logger.info('Checking system health...')
        
        health_status = {
            'timestamp': timezone.now(),
            'checks': {}
        }

        # Check database connectivity
        try:
            transaction_count = FuelTransaction.objects.count()
            health_status['checks']['database'] = 'OK'
            self.logger.info(f'Database OK - {transaction_count} transactions')
        except Exception as e:
            health_status['checks']['database'] = f'ERROR: {str(e)}'
            self.logger.error(f'Database error: {e}')
            if self.enable_alerts:
                self.send_alert('DATABASE_ERROR', f'Database connectivity issue: {e}')

        # Check for recent activity
        recent_transactions = FuelTransaction.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        if recent_transactions == 0:
            health_status['checks']['activity'] = 'WARNING: No recent activity'
            self.logger.warning('No transactions in the last 24 hours')
            if self.enable_alerts:
                self.send_alert('LOW_ACTIVITY', 'No fuel transactions in the last 24 hours')
        else:
            health_status['checks']['activity'] = f'OK - {recent_transactions} recent transactions'
            self.logger.info(f'Activity OK - {recent_transactions} transactions in last 24h')

        # Check pending approval queue
        pending_count = FuelTransaction.objects.filter(status='pending').count()
        if pending_count > 50:  # Threshold for alert
            health_status['checks']['approval_queue'] = f'WARNING: {pending_count} pending approvals'
            self.logger.warning(f'High pending approval count: {pending_count}')
            if self.enable_alerts:
                self.send_alert('HIGH_PENDING_COUNT', f'{pending_count} transactions pending approval')
        else:
            health_status['checks']['approval_queue'] = f'OK - {pending_count} pending'

        return health_status

    def check_pending_transactions(self):
        """Check for transactions that have been pending too long"""
        self.logger.info('Checking long-pending transactions...')
        
        # Find transactions pending for more than 48 hours
        cutoff_time = timezone.now() - timedelta(hours=48)
        long_pending = FuelTransaction.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        )

        if long_pending.exists():
            count = long_pending.count()
            self.logger.warning(f'Found {count} transactions pending for >48 hours')
            
            if self.enable_alerts:
                oldest = long_pending.order_by('created_at').first()
                days_old = (timezone.now() - oldest.created_at).days
                self.send_alert(
                    'LONG_PENDING_TRANSACTIONS',
                    f'{count} transactions pending for >48 hours. Oldest: {days_old} days'
                )

        # Find very old pending transactions (>7 days)
        very_old_cutoff = timezone.now() - timedelta(days=7)
        very_old_pending = FuelTransaction.objects.filter(
            status='pending',
            created_at__lt=very_old_cutoff
        )

        if very_old_pending.exists():
            count = very_old_pending.count()
            self.logger.error(f'Found {count} transactions pending for >7 days')
            
            if self.enable_alerts:
                self.send_alert(
                    'CRITICAL_PENDING_TRANSACTIONS',
                    f'CRITICAL: {count} transactions pending for >7 days - immediate attention required'
                )

    def monitor_unusual_activity(self):
        """Monitor for unusual fuel consumption patterns"""
        self.logger.info('Checking for unusual activity patterns...')
        
        # Get recent transactions (last 24 hours)
        recent_start = timezone.now() - timedelta(hours=24)
        recent_transactions = FuelTransaction.objects.filter(
            created_at__gte=recent_start,
            status='approved'
        )

        # Check for unusually large transactions
        from django.db.models import Avg
        avg_transaction_size = FuelTransaction.objects.filter(
            status='approved'
        ).aggregate(avg=Avg('liters'))['avg'] or 0

        large_threshold = avg_transaction_size * 3  # 3x average
        large_transactions = recent_transactions.filter(liters__gt=large_threshold)

        if large_transactions.exists():
            count = large_transactions.count()
            max_liters = large_transactions.order_by('-liters').first().liters
            self.logger.warning(f'Found {count} unusually large transactions (max: {max_liters}L)')
            
            if self.enable_alerts:
                self.send_alert(
                    'UNUSUAL_LARGE_TRANSACTIONS',
                    f'{count} unusually large fuel transactions detected (threshold: {large_threshold:.1f}L)'
                )

        # Check for high frequency from single user
        from django.db.models import Count
        user_frequency = recent_transactions.values('user').annotate(
            transaction_count=Count('id')
        ).filter(transaction_count__gt=10)  # More than 10 transactions per day

        if user_frequency.exists():
            for user_data in user_frequency:
                user = User.objects.get(id=user_data['user'])
                count = user_data['transaction_count']
                self.logger.warning(f'High frequency activity: {user.username} - {count} transactions in 24h')
                
                if self.enable_alerts:
                    self.send_alert(
                        'HIGH_FREQUENCY_USER',
                        f'User {user.username} has {count} transactions in 24 hours'
                    )

    def check_price_updates(self):
        """Check fuel price update status"""
        self.logger.info('Checking fuel price updates...')
        
        # Check when prices were last updated
        latest_price_data = FuelData.objects.order_by('-timestamp').first()
        
        if latest_price_data:
            hours_since_update = (timezone.now() - latest_price_data.timestamp).total_seconds() / 3600
            
            if hours_since_update > 48:  # No price update in 2 days
                self.logger.warning(f'Fuel prices not updated for {hours_since_update:.1f} hours')
                
                if self.enable_alerts:
                    self.send_alert(
                        'STALE_PRICE_DATA',
                        f'Fuel prices not updated for {hours_since_update:.1f} hours'
                    )
            else:
                self.logger.info(f'Price data is current (updated {hours_since_update:.1f}h ago)')
        else:
            self.logger.error('No fuel price data found in system')
            
            if self.enable_alerts:
                self.send_alert(
                    'NO_PRICE_DATA',
                    'No fuel price data found in system'
                )

    def daily_summary(self):
        """Generate daily summary"""
        self.logger.info('Generating daily summary...')
        
        today = timezone.now().date()
        today_transactions = FuelTransaction.objects.filter(
            transaction_date=today
        )

        summary = {
            'date': today.isoformat(),
            'total_transactions': today_transactions.count(),
            'approved_transactions': today_transactions.filter(status='approved').count(),
            'pending_transactions': today_transactions.filter(status='pending').count(),
            'rejected_transactions': today_transactions.filter(status='rejected').count(),
        }

        if today_transactions.filter(status='approved').exists():
            from django.db.models import Sum
            total_fuel = today_transactions.filter(status='approved').aggregate(
                total=Sum('liters')
            )['total']
            total_cost = today_transactions.filter(status='approved').aggregate(
                total=Sum('total_cost_usd')
            )['total']
            
            summary['total_fuel_consumed'] = float(total_fuel or 0)
            summary['total_cost'] = float(total_cost or 0)

        self.logger.info(f'Daily summary: {summary}')
        
        # Could send this summary via email or notification system
        if self.enable_alerts:
            self.send_alert(
                'DAILY_SUMMARY',
                f"Daily Summary: {summary['total_transactions']} transactions, "
                f"{summary['total_fuel_consumed']:.1f}L consumed, "
                f"${summary['total_cost']:.2f} total cost"
            )

    def weekly_report(self):
        """Generate weekly report"""
        self.logger.info('Generating weekly report...')
        
        week_start = timezone.now().date() - timedelta(days=7)
        week_transactions = FuelTransaction.objects.filter(
            transaction_date__gte=week_start
        )

        from django.db.models import Sum, Avg
        week_summary = {
            'week_start': week_start.isoformat(),
            'total_transactions': week_transactions.count(),
            'approved_transactions': week_transactions.filter(status='approved').count(),
            'avg_approval_time_hours': 24,  # Could calculate actual approval time
        }

        if week_transactions.filter(status='approved').exists():
            approved = week_transactions.filter(status='approved')
            week_summary['total_fuel_consumed'] = float(approved.aggregate(Sum('liters'))['total'] or 0)
            week_summary['total_cost'] = float(approved.aggregate(Sum('total_cost_usd'))['total'] or 0)
            week_summary['avg_transaction_size'] = float(approved.aggregate(Avg('liters'))['avg'] or 0)

        self.logger.info(f'Weekly report: {week_summary}')

    def send_alert(self, alert_type, message):
        """Send alert notification"""
        self.logger.warning(f'ALERT [{alert_type}]: {message}')
        
        # Here you could implement actual alert mechanisms:
        # - Send email to administrators
        # - Post to Slack/Teams
        # - Send SMS
        # - Log to external monitoring system
        
        # For now, just log the alert
        alert_data = {
            'timestamp': timezone.now().isoformat(),
            'type': alert_type,
            'message': message,
            'severity': self.get_alert_severity(alert_type)
        }
        
        # Could save alerts to database for tracking
        self.logger.info(f'Alert sent: {alert_data}')

    def get_alert_severity(self, alert_type):
        """Get severity level for alert type"""
        severity_map = {
            'DATABASE_ERROR': 'CRITICAL',
            'NO_PRICE_DATA': 'CRITICAL',
            'CRITICAL_PENDING_TRANSACTIONS': 'CRITICAL',
            'HIGH_PENDING_COUNT': 'HIGH',
            'LONG_PENDING_TRANSACTIONS': 'HIGH',
            'STALE_PRICE_DATA': 'MEDIUM',
            'UNUSUAL_LARGE_TRANSACTIONS': 'MEDIUM',
            'HIGH_FREQUENCY_USER': 'MEDIUM',
            'LOW_ACTIVITY': 'LOW',
            'DAILY_SUMMARY': 'INFO',
        }
        return severity_map.get(alert_type, 'MEDIUM')
