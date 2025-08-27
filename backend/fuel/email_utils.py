"""
Email utilities for user management
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.html import strip_tags
import logging
import secrets
import string

logger = logging.getLogger(__name__)
User = get_user_model()

def generate_temporary_password(length=12):
    """Generate a secure temporary password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password

def send_user_approval_email(user, approved_by=None):
    """
    Send email notification when user is approved
    Includes username and temporary password that user can change
    """
    try:
        # Generate temporary password
        temp_password = generate_temporary_password()
        
        # Set the temporary password
        user.set_password(temp_password)
        user.save()
        
        # Email context
        context = {
            'user': user,
            'username': user.username,
            'temporary_password': temp_password,
            'approved_by': approved_by,
            'login_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:5173') + '/login',
            'system_name': 'Parliament Fuel Coupon System'
        }
        
        # Render email templates
        subject = f'{settings.EMAIL_SUBJECT_PREFIX}Account Approved - Access Granted'
        
        # HTML email template
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Account Approved</h2>
            
            <p>Dear {user.get_full_name() or user.username},</p>
            
            <p>We are pleased to inform you that your account for the <strong>{context['system_name']}</strong> has been approved!</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="margin-top: 0; color: #28a745;">Your Login Credentials</h3>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">{temp_password}</code></p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #856404;">Important Security Notice</h4>
                <p style="margin-bottom: 0;">For your security, please change this temporary password immediately after your first login.</p>
            </div>
            
            <p><strong>Your Role:</strong> {user.get_role_display()}</p>
            {f'<p><strong>Sub Center:</strong> {user.sub_center.name}</p>' if user.sub_center else ''}
            {f'<p><strong>Approved by:</strong> {approved_by.get_full_name() or approved_by.username}</p>' if approved_by else ''}
            
            <div style="margin: 30px 0;">
                <a href="{context['login_url']}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to System</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px;">
                If you have any questions or issues accessing your account, please contact the system administrator.
            </p>
            
            <p style="color: #6c757d; font-size: 12px;">
                This is an automated message from the Parliament Fuel Coupon System. Please do not reply to this email.
            </p>
        </div>
        """
        
        # Plain text fallback
        plain_message = f"""
Account Approved - Parliament Fuel Coupon System

Dear {user.get_full_name() or user.username},

We are pleased to inform you that your account for the Parliament Fuel Coupon System has been approved!

Your Login Credentials:
Username: {user.username}
Temporary Password: {temp_password}

IMPORTANT: For your security, please change this temporary password immediately after your first login.

Your Role: {user.get_role_display()}
{f'Sub Center: {user.sub_center.name}' if user.sub_center else ''}
{f'Approved by: {approved_by.get_full_name() or approved_by.username}' if approved_by else ''}

Login URL: {context['login_url']}

If you have any questions or issues accessing your account, please contact the system administrator.

This is an automated message from the Parliament Fuel Coupon System. Please do not reply to this email.
        """
        
        # Send email
        success = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        if success:
            logger.info(f"Approval email sent successfully to {user.email} for user {user.username}")
            return True, temp_password
        else:
            logger.error(f"Failed to send approval email to {user.email} for user {user.username}")
            return False, None
            
    except Exception as e:
        logger.error(f"Error sending approval email to {user.email}: {str(e)}")
        return False, None

def send_user_rejection_email(user, reason, rejected_by=None):
    """
    Send email notification when user registration is rejected
    """
    try:
        # Email context
        context = {
            'user': user,
            'reason': reason,
            'rejected_by': rejected_by,
            'system_name': 'Parliament Fuel Coupon System'
        }
        
        # Render email templates
        subject = f'{settings.EMAIL_SUBJECT_PREFIX}Registration Application Status'
        
        # HTML email template
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Registration Application Update</h2>
            
            <p>Dear {user.get_full_name() or user.username},</p>
            
            <p>Thank you for your interest in the <strong>{context['system_name']}</strong>.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545; border-radius: 4px;">
                <p>Unfortunately, your registration application could not be approved at this time.</p>
                
                <p><strong>Reason:</strong></p>
                <p style="font-style: italic;">{reason}</p>
            </div>
            
            {f'<p><strong>Reviewed by:</strong> {rejected_by.get_full_name() or rejected_by.username}</p>' if rejected_by else ''}
            
            <p>If you believe this decision was made in error or if you have additional information to provide, please contact the system administrator for further assistance.</p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px;">
                If you have any questions, please contact the system administrator.
            </p>
            
            <p style="color: #6c757d; font-size: 12px;">
                This is an automated message from the Parliament Fuel Coupon System. Please do not reply to this email.
            </p>
        </div>
        """
        
        # Plain text fallback
        plain_message = f"""
Registration Application Update - Parliament Fuel Coupon System

Dear {user.get_full_name() or user.username},

Thank you for your interest in the Parliament Fuel Coupon System.

Unfortunately, your registration application could not be approved at this time.

Reason: {reason}

{f'Reviewed by: {rejected_by.get_full_name() or rejected_by.username}' if rejected_by else ''}

If you believe this decision was made in error or if you have additional information to provide, please contact the system administrator for further assistance.

This is an automated message from the Parliament Fuel Coupon System. Please do not reply to this email.
        """
        
        # Send email
        success = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        if success:
            logger.info(f"Rejection email sent successfully to {user.email} for user {user.username}")
            return True
        else:
            logger.error(f"Failed to send rejection email to {user.email} for user {user.username}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending rejection email to {user.email}: {str(e)}")
        return False
