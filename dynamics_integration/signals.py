"""
Django Signal Handlers for Real-time Dynamics 365 Integration
Automatically sync data changes to Business Central when models are created/updated
"""

import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from fuel.models import FuelTransaction, User, PoolVehicle, Box, Book, CouponAllocation
from .services import FuelCouponSyncService
from .models import SyncQueue

logger = logging.getLogger(__name__)


def is_sync_enabled():
    """Check if Dynamics sync is enabled"""
    return getattr(settings, 'DYNAMICS_SYNC_ENABLED', True)


@receiver(post_save, sender=FuelTransaction)
def sync_fuel_transaction_to_bc(sender, instance, created, **kwargs):
    """Sync fuel transactions to Business Central in real-time"""
    if not is_sync_enabled() or not created:
        return
    
    try:
        sync_service = FuelCouponSyncService()
        success = sync_service.sync_fuel_transaction(instance)
        
        if success:
            logger.info(f"Real-time sync successful for transaction {instance.id}")
        else:
            logger.warning(f"Real-time sync failed for transaction {instance.id}, queued for retry")
            
    except Exception as e:
        logger.error(f"Error in real-time sync for transaction {instance.id}: {e}")
        
        # Add to retry queue if real-time sync fails
        SyncQueue.objects.get_or_create(
            model_name='FuelTransaction',
            object_id=str(instance.id),
            defaults={
                'sync_type': 'TRANSACTION',
                'last_error': str(e),
                'priority': 3  # High priority for transactions
            }
        )


@receiver(post_save, sender=User)
def sync_user_to_bc(sender, instance, created, **kwargs):
    """Sync parliament members to Business Central as customers"""
    if not is_sync_enabled() or not created:
        return
    
    # Only sync users with parliament roles
    if not (instance.is_parliament_member or instance.is_senate_member):
        return
    
    try:
        sync_service = FuelCouponSyncService()
        success = sync_service.sync_parliament_member(instance)
        
        if success:
            logger.info(f"Real-time sync successful for user {instance.id}")
        else:
            logger.warning(f"Real-time sync failed for user {instance.id}, queued for retry")
            
    except Exception as e:
        logger.error(f"Error in real-time sync for user {instance.id}: {e}")
        
        # Add to retry queue if real-time sync fails
        SyncQueue.objects.get_or_create(
            model_name='User',
            object_id=str(instance.id),
            defaults={
                'sync_type': 'EMPLOYEE',
                'last_error': str(e),
                'priority': 2  # Normal priority for users
            }
        )


@receiver(post_save, sender=PoolVehicle)
def sync_vehicle_to_bc(sender, instance, created, **kwargs):
    """Sync pool vehicles to Business Central as fixed assets"""
    if not is_sync_enabled() or not created:
        return
    
    try:
        sync_service = FuelCouponSyncService()
        success = sync_service.sync_vehicle_asset(instance)
        
        if success:
            logger.info(f"Real-time sync successful for vehicle {instance.id}")
        else:
            logger.warning(f"Real-time sync failed for vehicle {instance.id}, queued for retry")
            
    except Exception as e:
        logger.error(f"Error in real-time sync for vehicle {instance.id}: {e}")
        
        # Add to retry queue if real-time sync fails
        SyncQueue.objects.get_or_create(
            model_name='PoolVehicle',
            object_id=str(instance.id),
            defaults={
                'sync_type': 'VEHICLE',
                'last_error': str(e),
                'priority': 1  # Low priority for vehicles
            }
        )


@receiver(post_save, sender=Box)
def sync_box_inventory_to_bc(sender, instance, created, **kwargs):
    """Sync new box inventory to Business Central when boxes are received"""
    if not is_sync_enabled() or not created:
        return
    
    # Only sync if box has been received
    if instance.status != 'RECEIVED':
        return
    
    try:
        sync_service = FuelCouponSyncService()
        success = sync_service.sync_coupon_inventory(instance)
        
        if success:
            logger.info(f"Real-time sync successful for box {instance.id}")
        else:
            logger.warning(f"Real-time sync failed for box {instance.id}, queued for retry")
            
    except Exception as e:
        logger.error(f"Error in real-time sync for box {instance.id}: {e}")
        
        # Add to retry queue if real-time sync fails
        SyncQueue.objects.get_or_create(
            model_name='Box',
            object_id=str(instance.id),
            defaults={
                'sync_type': 'INVENTORY',
                'last_error': str(e),
                'priority': 2  # Normal priority for inventory
            }
        )


@receiver(post_save, sender=CouponAllocation)
def sync_coupon_allocation_to_bc(sender, instance, created, **kwargs):
    """Sync coupon allocations to Business Central as inventory adjustments"""
    if not is_sync_enabled() or not created:
        return
    
    # Only sync approved allocations
    if instance.status != 'APPROVED':
        return
    
    try:
        # For coupon allocations, we can create a more detailed transaction
        # This could be implemented as a separate method in the sync service
        logger.info(f"Coupon allocation {instance.id} approved, could sync inventory movement")
        
        # TODO: Implement specific allocation sync if needed
        # sync_service = FuelCouponSyncService()
        # sync_service.sync_coupon_allocation(instance)
        
    except Exception as e:
        logger.error(f"Error in allocation sync for {instance.id}: {e}")


# Additional signal handlers for data integrity

@receiver(post_delete, sender=FuelTransaction)
def handle_transaction_deletion(sender, instance, **kwargs):
    """Handle transaction deletion - log for audit purposes"""
    logger.warning(f"FuelTransaction {instance.id} was deleted - this may affect BC sync integrity")
    
    # Optionally, you could create a reversal entry in Business Central
    # or mark the mapping as inactive


@receiver(post_delete, sender=User)
def handle_user_deletion(sender, instance, **kwargs):
    """Handle user deletion - update Business Central customer status"""
    if not is_sync_enabled():
        return
    
    logger.warning(f"User {instance.id} was deleted - should update BC customer status")
    
    # TODO: Implement customer deactivation in Business Central
    # This would involve updating the customer record to blocked = true


@receiver(post_delete, sender=PoolVehicle)
def handle_vehicle_deletion(sender, instance, **kwargs):
    """Handle vehicle deletion - update Business Central asset status"""
    if not is_sync_enabled():
        return
    
    logger.warning(f"PoolVehicle {instance.id} was deleted - should update BC asset status")
    
    # TODO: Implement asset disposal/deactivation in Business Central


# Bulk operation handlers

def sync_bulk_transactions(transaction_ids: list) -> dict:
    """Sync multiple transactions in batch for better performance"""
    if not is_sync_enabled():
        return {'success': False, 'message': 'Sync disabled'}
    
    results = {'successful': 0, 'failed': 0, 'errors': []}
    
    try:
        sync_service = FuelCouponSyncService()
        
        for transaction_id in transaction_ids:
            try:
                transaction = FuelTransaction.objects.get(id=transaction_id)
                success = sync_service.sync_fuel_transaction(transaction)
                
                if success:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to sync transaction {transaction_id}")
                    
            except FuelTransaction.DoesNotExist:
                results['failed'] += 1
                results['errors'].append(f"Transaction {transaction_id} not found")
                
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error syncing transaction {transaction_id}: {str(e)}")
    
    except Exception as e:
        results['errors'].append(f"Bulk sync error: {str(e)}")
    
    logger.info(f"Bulk transaction sync completed: {results['successful']} successful, {results['failed']} failed")
    return results


def sync_bulk_users(user_ids: list) -> dict:
    """Sync multiple users in batch"""
    if not is_sync_enabled():
        return {'success': False, 'message': 'Sync disabled'}
    
    results = {'successful': 0, 'failed': 0, 'errors': []}
    
    try:
        sync_service = FuelCouponSyncService()
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                # Only sync parliament members
                if not (user.is_parliament_member or user.is_senate_member):
                    continue
                
                success = sync_service.sync_parliament_member(user)
                
                if success:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to sync user {user_id}")
                    
            except User.DoesNotExist:
                results['failed'] += 1
                results['errors'].append(f"User {user_id} not found")
                
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error syncing user {user_id}: {str(e)}")
    
    except Exception as e:
        results['errors'].append(f"Bulk user sync error: {str(e)}")
    
    logger.info(f"Bulk user sync completed: {results['successful']} successful, {results['failed']} failed")
    return results
