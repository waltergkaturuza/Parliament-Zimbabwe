# fuel/services/notifications.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from twilio.rest import Client
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for sending notifications via email and SMS"""
    
    def __init__(self):
        self.twilio_client = None
        if hasattr(settings, 'TWILIO_ACCOUNT_SID') and hasattr(settings, 'TWILIO_AUTH_TOKEN'):
            self.twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    def send_email_notification(self, subject, template, context, recipient_emails):
        """Send email notification"""
        try:
            html_content = render_to_string(template, context)
            
            send_mail(
                subject=subject,
                message='',  # Plain text version (optional)
                html_message=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_emails,
                fail_silently=False,
            )
            
            logger.info(f"Email notification sent successfully to {recipient_emails}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
            return False
    
    def send_sms_notification(self, message, phone_number):
        """Send SMS notification via Twilio"""
        if not self.twilio_client:
            logger.warning("Twilio client not configured. SMS not sent.")
            return False
        
        try:
            # Ensure phone number is in international format
            if not phone_number.startswith('+'):
                phone_number = f"+263{phone_number.lstrip('0')}"  # Zimbabwe country code
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            
            logger.info(f"SMS notification sent successfully to {phone_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {str(e)}")
            return False
    
    def notify_handover_request(self, handover):
        """Notify recipient of handover request"""
        context = {
            'handover': handover,
            'timestamp': timezone.now(),
        }
        
        # Email notification
        if handover.to_user.email:
            success = self.send_email_notification(
                subject=f"Fuel Coupon Handover Request - #{handover.id}",
                template='emails/handover_request.html',
                context=context,
                recipient_emails=[handover.to_user.email]
            )
        
        # SMS notification
        if handover.to_user.phone:
            message = f"POZ Fuel System: You have a new handover request #{handover.id} from {handover.from_user.get_full_name()}. Please review and confirm."
            self.send_sms_notification(message, handover.to_user.phone)
    
    def notify_handover_confirmation(self, handover):
        """Notify sender of handover confirmation"""
        context = {
            'handover': handover,
            'timestamp': timezone.now(),
        }
        
        # Email notification
        if handover.from_user.email:
            self.send_email_notification(
                subject=f"Handover Confirmed - #{handover.id}",
                template='emails/handover_confirmation.html',
                context=context,
                recipient_emails=[handover.from_user.email]
            )
        
        # SMS notification
        if handover.from_user.phone:
            message = f"POZ Fuel System: Handover #{handover.id} has been confirmed by {handover.to_user.get_full_name()}."
            self.send_sms_notification(message, handover.from_user.phone)
    
    def notify_fuel_allocation(self, beneficiary, coupons):
        """Notify beneficiary of fuel allocation"""
        total_litres = sum(coupon.litres for coupon in coupons)
        context = {
            'beneficiary': beneficiary,
            'coupons': coupons,
            'total_litres': total_litres,
            'timestamp': timezone.now(),
        }
        
        # Email notification
        if beneficiary.email:
            self.send_email_notification(
                subject=f"Fuel Allocation - {total_litres}L",
                template='emails/fuel_allocation.html',
                context=context,
                recipient_emails=[beneficiary.email]
            )
        
        # SMS notification
        if beneficiary.phone:
            coupon_numbers = ', '.join([c.coupon_number for c in coupons[:3]])
            if len(coupons) > 3:
                coupon_numbers += f" and {len(coupons) - 3} more"
            
            message = f"POZ Fuel System: You have been allocated {total_litres}L of fuel. Coupons: {coupon_numbers}."
            self.send_sms_notification(message, beneficiary.phone)
    
    def notify_session_attendance_due(self, session, beneficiaries):
        """Notify beneficiaries about upcoming session"""
        context = {
            'session': session,
            'timestamp': timezone.now(),
        }
        
        for beneficiary in beneficiaries:
            # Email notification
            if beneficiary.email:
                self.send_email_notification(
                    subject=f"Parliament Session Reminder - {session.title}",
                    template='emails/session_reminder.html',
                    context={**context, 'beneficiary': beneficiary},
                    recipient_emails=[beneficiary.email]
                )
            
            # SMS notification
            if beneficiary.phone:
                message = f"POZ: Parliament session '{session.title}' scheduled for {session.start_date.strftime('%Y-%m-%d %H:%M')}. Your attendance is {'required' if session.is_mandatory else 'requested'}."
                self.send_sms_notification(message, beneficiary.phone)
    
    def notify_fuel_entitlement_created(self, entitlement):
        """Notify beneficiary of new fuel entitlement"""
        context = {
            'entitlement': entitlement,
            'timestamp': timezone.now(),
        }
        
        # Email notification
        if entitlement.beneficiary.email:
            self.send_email_notification(
                subject=f"New Fuel Entitlement - {entitlement.litres_entitled}L",
                template='emails/entitlement_created.html',
                context=context,
                recipient_emails=[entitlement.beneficiary.email]
            )
        
        # SMS notification
        if entitlement.beneficiary.phone:
            message = f"POZ: You have a new fuel entitlement of {entitlement.litres_entitled}L for {entitlement.get_entitlement_type_display()}."
            self.send_sms_notification(message, entitlement.beneficiary.phone)
    
    def notify_coupon_expiry(self, coupons):
        """Notify about expiring coupons"""
        # Group coupons by beneficiary
        beneficiary_coupons = {}
        for coupon in coupons:
            if coupon.allocated_to:
                if coupon.allocated_to not in beneficiary_coupons:
                    beneficiary_coupons[coupon.allocated_to] = []
                beneficiary_coupons[coupon.allocated_to].append(coupon)
        
        for beneficiary, user_coupons in beneficiary_coupons.items():
            context = {
                'beneficiary': beneficiary,
                'coupons': user_coupons,
                'expiry_date': user_coupons[0].expiry_date,
                'timestamp': timezone.now(),
            }
            
            # Email notification
            if beneficiary.email:
                self.send_email_notification(
                    subject=f"Fuel Coupons Expiring Soon - {len(user_coupons)} coupons",
                    template='emails/coupon_expiry.html',
                    context=context,
                    recipient_emails=[beneficiary.email]
                )
            
            # SMS notification
            if beneficiary.phone:
                message = f"POZ: You have {len(user_coupons)} fuel coupons expiring on {user_coupons[0].expiry_date}. Please use them soon."
                self.send_sms_notification(message, beneficiary.phone)
    
    def notify_system_alert(self, alert_type, message, recipients):
        """Send system alerts to administrators"""
        context = {
            'alert_type': alert_type,
            'message': message,
            'timestamp': timezone.now(),
        }
        
        # Send to all recipients
        for recipient in recipients:
            if recipient.email:
                self.send_email_notification(
                    subject=f"POZ Fuel System Alert - {alert_type}",
                    template='emails/system_alert.html',
                    context=context,
                    recipient_emails=[recipient.email]
                )
            
            if recipient.phone:
                sms_message = f"POZ Alert ({alert_type}): {message}"
                self.send_sms_notification(sms_message, recipient.phone)


# Global notification service instance
notification_service = NotificationService()


# Convenience functions
def notify_handover_request(handover):
    return notification_service.notify_handover_request(handover)

def notify_handover_confirmation(handover):
    return notification_service.notify_handover_confirmation(handover)

def notify_fuel_allocation(beneficiary, coupons):
    return notification_service.notify_fuel_allocation(beneficiary, coupons)

def notify_session_attendance_due(session, beneficiaries):
    return notification_service.notify_session_attendance_due(session, beneficiaries)

def notify_fuel_entitlement_created(entitlement):
    return notification_service.notify_fuel_entitlement_created(entitlement)

def notify_coupon_expiry(coupons):
    return notification_service.notify_coupon_expiry(coupons)

def notify_system_alert(alert_type, message, recipients):
    return notification_service.notify_system_alert(alert_type, message, recipients)