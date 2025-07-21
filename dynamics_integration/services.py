"""
Microsoft Dynamics 365 Business Central API Integration Services
Handles authentication, API calls, and data synchronization with Business Central
"""

import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from .models import DynamicsMapping, SyncLog, BusinessCentralConfig, SyncQueue

logger = logging.getLogger(__name__)


class BusinessCentralAPIError(Exception):
    """Custom exception for Business Central API errors"""
    pass


class BusinessCentralAPI:
    """Main API client for Microsoft Dynamics 365 Business Central"""
    
    def __init__(self, config_name: str = 'default'):
        """Initialize API client with configuration"""
        try:
            self.config = BusinessCentralConfig.objects.get(name=config_name, is_active=True)
        except BusinessCentralConfig.DoesNotExist:
            raise BusinessCentralAPIError(f"No active Business Central configuration found: {config_name}")
        
        self.base_url = self.config.base_url
        self.tenant_id = self.config.tenant_id
        self.client_id = self.config.client_id
        self.company_id = self.config.company_id
        
        # Get client secret from environment (never store in database)
        self.client_secret = getattr(settings, 'DYNAMICS_CLIENT_SECRET', None)
        if not self.client_secret:
            raise BusinessCentralAPIError("DYNAMICS_CLIENT_SECRET not found in settings")
    
    def get_auth_token(self) -> str:
        """Get OAuth2 token for Business Central API with caching"""
        cache_key = f"bc_token_{self.config.name}"
        token = cache.get(cache_key)
        
        if not token:
            auth_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
            
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'https://api.businesscentral.dynamics.com/.default'
            }
            
            try:
                response = requests.post(auth_url, data=data, timeout=30)
                response.raise_for_status()
                
                token_data = response.json()
                token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 3600)
                
                # Cache token with 5 minute buffer before expiry
                cache.set(cache_key, token, expires_in - 300)
                
                logger.info(f"Successfully obtained BC API token for {self.config.name}")
                
            except requests.RequestException as e:
                logger.error(f"Failed to obtain BC API token: {e}")
                raise BusinessCentralAPIError(f"Authentication failed: {e}")
        
        return token
    
    def _make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> dict:
        """Make authenticated request to Business Central API"""
        headers = {
            'Authorization': f'Bearer {self.get_auth_token()}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Construct full URL
        if self.company_id:
            url = f"{self.base_url}/companies({self.company_id})/{endpoint.lstrip('/')}"
        else:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=60
            )
            
            # Log request for debugging
            logger.debug(f"BC API {method} {url} - Status: {response.status_code}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.RequestException as e:
            logger.error(f"BC API request failed: {method} {url} - {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            raise BusinessCentralAPIError(f"API request failed: {e}")
    
    def test_connection(self) -> bool:
        """Test API connectivity and update configuration status"""
        try:
            # Try to get company information
            companies = self._make_request('GET', 'companies')
            
            self.config.connection_status = 'CONNECTED'
            self.config.last_connection_test = timezone.now()
            self.config.save(update_fields=['connection_status', 'last_connection_test'])
            
            logger.info(f"BC API connection test successful for {self.config.name}")
            return True
            
        except BusinessCentralAPIError as e:
            self.config.connection_status = 'FAILED'
            self.config.last_connection_test = timezone.now()
            self.config.save(update_fields=['connection_status', 'last_connection_test'])
            
            logger.error(f"BC API connection test failed for {self.config.name}: {e}")
            return False
    
    # Item Management (for Coupon Inventory)
    def create_item(self, item_data: dict) -> dict:
        """Create item in Business Central for coupon inventory"""
        try:
            result = self._make_request('POST', 'items', data=item_data)
            logger.info(f"Created BC item: {item_data.get('number', 'Unknown')}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to create BC item: {e}")
            raise
    
    def update_item(self, item_id: str, item_data: dict) -> dict:
        """Update existing item in Business Central"""
        try:
            result = self._make_request('PATCH', f'items({item_id})', data=item_data)
            logger.info(f"Updated BC item: {item_id}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to update BC item {item_id}: {e}")
            raise
    
    def get_item(self, item_id: str) -> dict:
        """Get item details from Business Central"""
        try:
            return self._make_request('GET', f'items({item_id})')
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to get BC item {item_id}: {e}")
            raise
    
    # Journal Entries (for Financial Transactions)
    def post_journal_entry(self, journal_data: dict) -> dict:
        """Post journal entry for fuel transactions"""
        try:
            # First, create journal lines
            journal_lines = journal_data.get('lines', [])
            
            for line in journal_lines:
                result = self._make_request('POST', 'journals/GENERAL/journalLines', data=line)
                logger.debug(f"Created journal line: {line.get('documentNumber', 'Unknown')}")
            
            # Then post the journal
            post_result = self._make_request('POST', 'journals/GENERAL/post')
            logger.info(f"Posted journal entry: {journal_data.get('documentNumber', 'Unknown')}")
            
            return post_result
            
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to post journal entry: {e}")
            raise
    
    # Customer Management (for Parliament Members)
    def create_customer(self, customer_data: dict) -> dict:
        """Create customer record for parliament member"""
        try:
            result = self._make_request('POST', 'customers', data=customer_data)
            logger.info(f"Created BC customer: {customer_data.get('number', 'Unknown')}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to create BC customer: {e}")
            raise
    
    def update_customer(self, customer_id: str, customer_data: dict) -> dict:
        """Update existing customer record"""
        try:
            result = self._make_request('PATCH', f'customers({customer_id})', data=customer_data)
            logger.info(f"Updated BC customer: {customer_id}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to update BC customer {customer_id}: {e}")
            raise
    
    # Employee Management (for Staff and Drivers)
    def create_employee(self, employee_data: dict) -> dict:
        """Create employee record"""
        try:
            result = self._make_request('POST', 'employees', data=employee_data)
            logger.info(f"Created BC employee: {employee_data.get('number', 'Unknown')}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to create BC employee: {e}")
            raise
    
    # Fixed Assets (for Vehicles)
    def create_fixed_asset(self, asset_data: dict) -> dict:
        """Create fixed asset for vehicle"""
        try:
            result = self._make_request('POST', 'fixedAssets', data=asset_data)
            logger.info(f"Created BC fixed asset: {asset_data.get('number', 'Unknown')}")
            return result
        except BusinessCentralAPIError as e:
            logger.error(f"Failed to create BC fixed asset: {e}")
            raise


class FuelCouponSyncService:
    """Handles synchronization of fuel coupon system data with Business Central"""
    
    def __init__(self, config_name: str = 'default'):
        self.bc_api = BusinessCentralAPI(config_name)
        self.config = self.bc_api.config
    
    def sync_fuel_transaction(self, transaction) -> bool:
        """Sync a fuel transaction to Business Central as journal entry"""
        sync_log = SyncLog.objects.create(
            sync_type='TRANSACTION',
            status='PENDING'
        )
        
        try:
            # Check if already synced
            mapping = DynamicsMapping.objects.filter(
                local_model='FuelTransaction',
                local_id=str(transaction.id)
            ).first()
            
            if mapping:
                logger.info(f"Transaction {transaction.id} already synced to BC")
                sync_log.mark_completed('SUCCESS', 'Already synced')
                return True
            
            # Prepare journal entry data
            document_number = f"FC-{transaction.id:06d}"
            transaction_amount = float(transaction.litres_consumed) * 1.50  # Assume cost per litre
            
            journal_data = {
                'documentNumber': document_number,
                'lines': [
                    {
                        'accountType': 'G/L Account',
                        'accountNumber': self.config.fuel_expense_account,
                        'description': f"Fuel consumption - {transaction.beneficiary.get_full_name()}",
                        'debitAmount': transaction_amount,
                        'creditAmount': 0,
                        'documentNumber': document_number,
                        'postingDate': transaction.timestamp.date().isoformat()
                    },
                    {
                        'accountType': 'G/L Account',
                        'accountNumber': self.config.coupon_inventory_account,
                        'description': f"Coupon usage - {transaction.coupon.coupon_number}",
                        'debitAmount': 0,
                        'creditAmount': transaction_amount,
                        'documentNumber': document_number,
                        'postingDate': transaction.timestamp.date().isoformat()
                    }
                ]
            }
            
            # Post to Business Central
            result = self.bc_api.post_journal_entry(journal_data)
            
            # Create mapping record
            DynamicsMapping.objects.create(
                local_model='FuelTransaction',
                local_id=str(transaction.id),
                bc_entity='JOURNAL',
                bc_id=result.get('id', document_number),
                bc_number=document_number
            )
            
            sync_log.mark_completed('SUCCESS', f'Journal entry posted: {document_number}')
            sync_log.records_successful = 1
            sync_log.save()
            
            logger.info(f"Successfully synced transaction {transaction.id} to BC")
            return True
            
        except Exception as e:
            error_msg = f"Failed to sync transaction {transaction.id}: {str(e)}"
            logger.error(error_msg)
            
            sync_log.mark_completed('FAILED', error_msg)
            sync_log.records_failed = 1
            sync_log.save()
            
            # Add to retry queue
            SyncQueue.objects.create(
                model_name='FuelTransaction',
                object_id=str(transaction.id),
                sync_type='TRANSACTION',
                last_error=error_msg
            )
            
            return False
    
    def sync_coupon_inventory(self, box) -> bool:
        """Sync coupon inventory (box and books) to Business Central as items"""
        sync_log = SyncLog.objects.create(
            sync_type='INVENTORY',
            status='PENDING'
        )
        
        try:
            synced_count = 0
            
            # Sync each book in the box as an item
            for book in box.books.all():
                try:
                    # Check if already synced
                    mapping = DynamicsMapping.objects.filter(
                        local_model='Book',
                        local_id=str(book.id)
                    ).first()
                    
                    if mapping:
                        continue
                    
                    # Prepare item data
                    item_data = {
                        'number': f"BOOK-{book.book_number}",
                        'displayName': f"Fuel Coupon Book {book.book_number}",
                        'description': f"Box {box.box_number} - Book {book.book_number}",
                        'type': 'Inventory',
                        'baseUnitOfMeasure': {'code': 'PCS'},
                        'unitCost': book.number_of_coupons * 20.0,  # Assume $20 per coupon
                        'blocked': False
                    }
                    
                    # Create item in Business Central
                    result = self.bc_api.create_item(item_data)
                    
                    # Create mapping
                    DynamicsMapping.objects.create(
                        local_model='Book',
                        local_id=str(book.id),
                        bc_entity='ITEM',
                        bc_id=result.get('id', ''),
                        bc_number=result.get('number', item_data['number'])
                    )
                    
                    synced_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to sync book {book.id}: {e}")
            
            sync_log.mark_completed('SUCCESS', f'Synced {synced_count} books from box {box.box_number}')
            sync_log.records_successful = synced_count
            sync_log.save()
            
            logger.info(f"Successfully synced {synced_count} books from box {box.id} to BC")
            return True
            
        except Exception as e:
            error_msg = f"Failed to sync box {box.id}: {str(e)}"
            logger.error(error_msg)
            
            sync_log.mark_completed('FAILED', error_msg)
            sync_log.save()
            
            return False
    
    def sync_parliament_member(self, user) -> bool:
        """Sync parliament member to Business Central as customer"""
        sync_log = SyncLog.objects.create(
            sync_type='EMPLOYEE',
            status='PENDING'
        )
        
        try:
            # Check if already synced
            mapping = DynamicsMapping.objects.filter(
                local_model='User',
                local_id=str(user.id)
            ).first()
            
            if mapping:
                logger.info(f"User {user.id} already synced to BC")
                sync_log.mark_completed('SUCCESS', 'Already synced')
                return True
            
            # Prepare customer data
            customer_data = {
                'number': f"MP-{user.id:06d}",
                'displayName': user.get_full_name(),
                'name': user.get_full_name(),
                'email': user.email,
                'phoneNumber': getattr(user, 'phone_number', ''),
                'address': {
                    'street': getattr(user, 'address', ''),
                    'city': 'Harare',
                    'country': 'Zimbabwe'
                },
                'blocked': False,
                'customerPostingGroup': {'code': 'DOMESTIC'},
                'genBusPostingGroup': {'code': 'DOMESTIC'}
            }
            
            # Create customer in Business Central
            result = self.bc_api.create_customer(customer_data)
            
            # Create mapping
            DynamicsMapping.objects.create(
                local_model='User',
                local_id=str(user.id),
                bc_entity='CUSTOMER',
                bc_id=result.get('id', ''),
                bc_number=result.get('number', customer_data['number'])
            )
            
            sync_log.mark_completed('SUCCESS', f'Customer created: {customer_data["number"]}')
            sync_log.records_successful = 1
            sync_log.save()
            
            logger.info(f"Successfully synced user {user.id} to BC as customer")
            return True
            
        except Exception as e:
            error_msg = f"Failed to sync user {user.id}: {str(e)}"
            logger.error(error_msg)
            
            sync_log.mark_completed('FAILED', error_msg)
            sync_log.records_failed = 1
            sync_log.save()
            
            # Add to retry queue
            SyncQueue.objects.create(
                model_name='User',
                object_id=str(user.id),
                sync_type='EMPLOYEE',
                last_error=error_msg
            )
            
            return False
    
    def sync_vehicle_asset(self, vehicle) -> bool:
        """Sync pool vehicle to Business Central as fixed asset"""
        sync_log = SyncLog.objects.create(
            sync_type='VEHICLE',
            status='PENDING'
        )
        
        try:
            # Check if already synced
            mapping = DynamicsMapping.objects.filter(
                local_model='PoolVehicle',
                local_id=str(vehicle.id)
            ).first()
            
            if mapping:
                logger.info(f"Vehicle {vehicle.id} already synced to BC")
                sync_log.mark_completed('SUCCESS', 'Already synced')
                return True
            
            # Prepare fixed asset data
            asset_data = {
                'number': f"VEH-{vehicle.registration_number}",
                'description': f"{vehicle.make} {vehicle.model} ({vehicle.year})",
                'faClass': {'code': 'VEHICLES'},
                'faSubclass': {'code': 'CARS'},
                'acquisitionDate': vehicle.created.date().isoformat() if vehicle.created else None,
                'blocked': not vehicle.is_active
            }
            
            # Create fixed asset in Business Central
            result = self.bc_api.create_fixed_asset(asset_data)
            
            # Create mapping
            DynamicsMapping.objects.create(
                local_model='PoolVehicle',
                local_id=str(vehicle.id),
                bc_entity='ASSET',
                bc_id=result.get('id', ''),
                bc_number=result.get('number', asset_data['number'])
            )
            
            sync_log.mark_completed('SUCCESS', f'Fixed asset created: {asset_data["number"]}')
            sync_log.records_successful = 1
            sync_log.save()
            
            logger.info(f"Successfully synced vehicle {vehicle.id} to BC as fixed asset")
            return True
            
        except Exception as e:
            error_msg = f"Failed to sync vehicle {vehicle.id}: {str(e)}"
            logger.error(error_msg)
            
            sync_log.mark_completed('FAILED', error_msg)
            sync_log.records_failed = 1
            sync_log.save()
            
            # Add to retry queue
            SyncQueue.objects.create(
                model_name='PoolVehicle',
                object_id=str(vehicle.id),
                sync_type='VEHICLE',
                last_error=error_msg
            )
            
            return False


class SyncQueueProcessor:
    """Processes items in the sync queue for retry operations"""
    
    def __init__(self, config_name: str = 'default'):
        self.sync_service = FuelCouponSyncService(config_name)
    
    def process_queue(self, max_items: int = 50) -> Dict[str, int]:
        """Process items in the sync queue"""
        stats = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0
        }
        
        # Get items ready for retry
        queue_items = SyncQueue.objects.filter(
            is_active=True,
            next_retry__lte=timezone.now()
        ).order_by('priority', 'next_retry')[:max_items]
        
        for item in queue_items:
            if not item.can_retry():
                stats['skipped'] += 1
                continue
            
            # Mark as processing
            item.is_processing = True
            item.save()
            
            try:
                success = self._process_queue_item(item)
                
                if success:
                    item.is_active = False  # Remove from queue
                    stats['successful'] += 1
                else:
                    item.increment_retry("Retry failed")
                    stats['failed'] += 1
                
            except Exception as e:
                logger.error(f"Error processing queue item {item.id}: {e}")
                item.increment_retry(str(e))
                stats['failed'] += 1
            
            finally:
                item.is_processing = False
                item.save()
                stats['processed'] += 1
        
        return stats
    
    def _process_queue_item(self, item: SyncQueue) -> bool:
        """Process a single queue item"""
        from fuel.models import FuelTransaction, User, PoolVehicle, Box
        
        try:
            if item.model_name == 'FuelTransaction':
                obj = FuelTransaction.objects.get(id=item.object_id)
                return self.sync_service.sync_fuel_transaction(obj)
            
            elif item.model_name == 'User':
                obj = User.objects.get(id=item.object_id)
                return self.sync_service.sync_parliament_member(obj)
            
            elif item.model_name == 'PoolVehicle':
                obj = PoolVehicle.objects.get(id=item.object_id)
                return self.sync_service.sync_vehicle_asset(obj)
            
            elif item.model_name == 'Box':
                obj = Box.objects.get(id=item.object_id)
                return self.sync_service.sync_coupon_inventory(obj)
            
            else:
                logger.error(f"Unknown model type in queue: {item.model_name}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to process queue item {item.id}: {e}")
            return False
