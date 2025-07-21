"""
Django Management Command: Sync Data to Microsoft Dynamics 365 Business Central
Provides batch synchronization capabilities for fuel coupon system data
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db.models import Q
from dynamics_integration.services import FuelCouponSyncService, SyncQueueProcessor
from dynamics_integration.models import SyncLog, BusinessCentralConfig
from fuel.models import FuelTransaction, User, PoolVehicle, Box


class Command(BaseCommand):
    help = 'Synchronize data with Microsoft Dynamics 365 Business Central'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--sync-type',
            type=str,
            required=True,
            choices=['transactions', 'inventory', 'employees', 'vehicles', 'queue', 'all'],
            help='Type of data to synchronize'
        )
        
        parser.add_argument(
            '--config',
            type=str,
            default='default',
            help='Business Central configuration name to use'
        )
        
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of records to process per batch'
        )
        
        parser.add_argument(
            '--days-back',
            type=int,
            default=7,
            help='Number of days back to sync (for transactions)'
        )
        
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even if records are already synced'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be synced without actually syncing'
        )
        
        parser.add_argument(
            '--filter-id',
            type=str,
            help='Sync only specific record ID'
        )
    
    def handle(self, *args, **options):
        self.verbosity = options.get('verbosity', 1)
        
        # Validate configuration
        try:
            config = BusinessCentralConfig.objects.get(
                name=options['config'], 
                is_active=True
            )
        except BusinessCentralConfig.DoesNotExist:
            raise CommandError(f"Business Central configuration '{options['config']}' not found or inactive")
        
        # Initialize sync service
        try:
            sync_service = FuelCouponSyncService(options['config'])
        except Exception as e:
            raise CommandError(f"Failed to initialize sync service: {e}")
        
        # Create batch sync log
        batch_log = SyncLog.objects.create(
            sync_type='BULK',
            status='PENDING',
            batch_id=f"batch_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
        )
        
        try:
            if options['sync_type'] == 'transactions':
                self._sync_transactions(sync_service, options, batch_log)
            elif options['sync_type'] == 'inventory':
                self._sync_inventory(sync_service, options, batch_log)
            elif options['sync_type'] == 'employees':
                self._sync_employees(sync_service, options, batch_log)
            elif options['sync_type'] == 'vehicles':
                self._sync_vehicles(sync_service, options, batch_log)
            elif options['sync_type'] == 'queue':
                self._process_sync_queue(options, batch_log)
            elif options['sync_type'] == 'all':
                self._sync_all(sync_service, options, batch_log)
            
            batch_log.mark_completed('SUCCESS', 'Batch sync completed successfully')
            
        except Exception as e:
            batch_log.mark_completed('FAILED', f'Batch sync failed: {str(e)}')
            raise CommandError(f"Sync failed: {e}")
    
    def _sync_transactions(self, sync_service, options, batch_log):
        """Sync fuel transactions to Business Central"""
        self._log(1, "Starting transaction sync...")
        
        # Build query
        query = Q()
        
        if options['filter_id']:
            query &= Q(id=options['filter_id'])
        else:
            # Sync transactions from the last N days
            cutoff_date = timezone.now() - timezone.timedelta(days=options['days_back'])
            query &= Q(timestamp__gte=cutoff_date)
        
        if not options['force']:
            # Exclude already synced transactions
            from dynamics_integration.models import DynamicsMapping
            synced_ids = DynamicsMapping.objects.filter(
                local_model='FuelTransaction'
            ).values_list('local_id', flat=True)
            query &= ~Q(id__in=synced_ids)
        
        transactions = FuelTransaction.objects.filter(query)
        total_count = transactions.count()
        
        self._log(1, f"Found {total_count} transactions to sync")
        
        if options['dry_run']:
            self._log(1, "DRY RUN: Would sync the following transactions:")
            for transaction in transactions[:10]:  # Show first 10
                self._log(1, f"  - Transaction {transaction.id}: {transaction.beneficiary.get_full_name()} - {transaction.litres_consumed}L")
            if total_count > 10:
                self._log(1, f"  ... and {total_count - 10} more")
            return
        
        # Process in batches
        batch_size = options['batch_size']
        successful = 0
        failed = 0
        
        for i in range(0, total_count, batch_size):
            batch = transactions[i:i + batch_size]
            self._log(2, f"Processing batch {i//batch_size + 1} ({len(batch)} transactions)")
            
            for transaction in batch:
                try:
                    success = sync_service.sync_fuel_transaction(transaction)
                    if success:
                        successful += 1
                    else:
                        failed += 1
                except Exception as e:
                    self._log(1, f"Error syncing transaction {transaction.id}: {e}")
                    failed += 1
        
        batch_log.records_processed = total_count
        batch_log.records_successful = successful
        batch_log.records_failed = failed
        batch_log.save()
        
        self._log(1, f"Transaction sync completed: {successful} successful, {failed} failed")
    
    def _sync_inventory(self, sync_service, options, batch_log):
        """Sync coupon inventory to Business Central"""
        self._log(1, "Starting inventory sync...")
        
        query = Q(status='RECEIVED')  # Only sync received boxes
        
        if options['filter_id']:
            query &= Q(id=options['filter_id'])
        
        if not options['force']:
            from dynamics_integration.models import DynamicsMapping
            synced_ids = DynamicsMapping.objects.filter(
                local_model='Box'
            ).values_list('local_id', flat=True)
            query &= ~Q(id__in=synced_ids)
        
        boxes = Box.objects.filter(query)
        total_count = boxes.count()
        
        self._log(1, f"Found {total_count} boxes to sync")
        
        if options['dry_run']:
            self._log(1, "DRY RUN: Would sync the following boxes:")
            for box in boxes[:10]:
                book_count = box.books.count()
                self._log(1, f"  - Box {box.box_number}: {book_count} books")
            if total_count > 10:
                self._log(1, f"  ... and {total_count - 10} more")
            return
        
        successful = 0
        failed = 0
        
        for box in boxes:
            try:
                success = sync_service.sync_coupon_inventory(box)
                if success:
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                self._log(1, f"Error syncing box {box.id}: {e}")
                failed += 1
        
        batch_log.records_processed = total_count
        batch_log.records_successful = successful
        batch_log.records_failed = failed
        batch_log.save()
        
        self._log(1, f"Inventory sync completed: {successful} successful, {failed} failed")
    
    def _sync_employees(self, sync_service, options, batch_log):
        """Sync parliament members to Business Central"""
        self._log(1, "Starting employee sync...")
        
        # Only sync parliament/senate members
        query = Q(is_parliament_member=True) | Q(is_senate_member=True)
        
        if options['filter_id']:
            query &= Q(id=options['filter_id'])
        
        if not options['force']:
            from dynamics_integration.models import DynamicsMapping
            synced_ids = DynamicsMapping.objects.filter(
                local_model='User'
            ).values_list('local_id', flat=True)
            query &= ~Q(id__in=synced_ids)
        
        users = User.objects.filter(query)
        total_count = users.count()
        
        self._log(1, f"Found {total_count} parliament members to sync")
        
        if options['dry_run']:
            self._log(1, "DRY RUN: Would sync the following users:")
            for user in users[:10]:
                role = "Parliament" if user.is_parliament_member else "Senate"
                self._log(1, f"  - {user.get_full_name()} ({role})")
            if total_count > 10:
                self._log(1, f"  ... and {total_count - 10} more")
            return
        
        successful = 0
        failed = 0
        
        for user in users:
            try:
                success = sync_service.sync_parliament_member(user)
                if success:
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                self._log(1, f"Error syncing user {user.id}: {e}")
                failed += 1
        
        batch_log.records_processed = total_count
        batch_log.records_successful = successful
        batch_log.records_failed = failed
        batch_log.save()
        
        self._log(1, f"Employee sync completed: {successful} successful, {failed} failed")
    
    def _sync_vehicles(self, sync_service, options, batch_log):
        """Sync pool vehicles to Business Central"""
        self._log(1, "Starting vehicle sync...")
        
        query = Q(is_active=True)  # Only sync active vehicles
        
        if options['filter_id']:
            query &= Q(id=options['filter_id'])
        
        if not options['force']:
            from dynamics_integration.models import DynamicsMapping
            synced_ids = DynamicsMapping.objects.filter(
                local_model='PoolVehicle'
            ).values_list('local_id', flat=True)
            query &= ~Q(id__in=synced_ids)
        
        vehicles = PoolVehicle.objects.filter(query)
        total_count = vehicles.count()
        
        self._log(1, f"Found {total_count} vehicles to sync")
        
        if options['dry_run']:
            self._log(1, "DRY RUN: Would sync the following vehicles:")
            for vehicle in vehicles[:10]:
                self._log(1, f"  - {vehicle.registration_number}: {vehicle.make} {vehicle.model}")
            if total_count > 10:
                self._log(1, f"  ... and {total_count - 10} more")
            return
        
        successful = 0
        failed = 0
        
        for vehicle in vehicles:
            try:
                success = sync_service.sync_vehicle_asset(vehicle)
                if success:
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                self._log(1, f"Error syncing vehicle {vehicle.id}: {e}")
                failed += 1
        
        batch_log.records_processed = total_count
        batch_log.records_successful = successful
        batch_log.records_failed = failed
        batch_log.save()
        
        self._log(1, f"Vehicle sync completed: {successful} successful, {failed} failed")
    
    def _process_sync_queue(self, options, batch_log):
        """Process items in the sync queue"""
        self._log(1, "Processing sync queue...")
        
        try:
            processor = SyncQueueProcessor(options['config'])
            
            if options['dry_run']:
                from dynamics_integration.models import SyncQueue
                pending_items = SyncQueue.objects.filter(
                    is_active=True,
                    next_retry__lte=timezone.now()
                ).count()
                self._log(1, f"DRY RUN: Would process {pending_items} queue items")
                return
            
            stats = processor.process_queue(options['batch_size'])
            
            batch_log.records_processed = stats['processed']
            batch_log.records_successful = stats['successful']
            batch_log.records_failed = stats['failed']
            batch_log.save()
            
            self._log(1, f"Queue processing completed: {stats}")
            
        except Exception as e:
            self._log(1, f"Error processing sync queue: {e}")
            raise
    
    def _sync_all(self, sync_service, options, batch_log):
        """Sync all data types"""
        self._log(1, "Starting full synchronization...")
        
        # Process each sync type
        sync_types = ['employees', 'vehicles', 'inventory', 'transactions', 'queue']
        
        for sync_type in sync_types:
            self._log(1, f"\n--- Syncing {sync_type} ---")
            options['sync_type'] = sync_type
            
            if sync_type == 'queue':
                self._process_sync_queue(options, batch_log)
            else:
                method_map = {
                    'employees': self._sync_employees,
                    'vehicles': self._sync_vehicles,
                    'inventory': self._sync_inventory,
                    'transactions': self._sync_transactions
                }
                method_map[sync_type](sync_service, options, batch_log)
        
        self._log(1, "\nFull synchronization completed!")
    
    def _log(self, level, message):
        """Log message based on verbosity level"""
        if self.verbosity >= level:
            self.stdout.write(message)
