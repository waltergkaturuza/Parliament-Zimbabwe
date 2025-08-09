# fuel/views_home.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    User, SubCenter, CouponDistribution, FuelTransaction, 
    SystemAlert, AuditLog, ParliamentSession, BookDispatch
)

@api_view(['GET'])
@permission_classes([AllowAny])
def home_stats(request):
    """
    Get real-time statistics for the homepage
    """
    try:
        # Active users count (users who logged in within last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        active_users = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        
        # Sub-centers count
        sub_centers = SubCenter.objects.filter(is_active=True).count()
        
        # Distributed coupons count
        distributed_coupons = CouponDistribution.objects.count()
        
        # Success rate calculation (approved transactions vs total)
        total_transactions = FuelTransaction.objects.count()
        approved_transactions = FuelTransaction.objects.filter(
            status='APPROVED'
        ).count()
        
        success_rate = 0
        if total_transactions > 0:
            success_rate = round((approved_transactions / total_transactions) * 100, 1)
        
        stats = {
            'active_users': active_users,
            'sub_centers': sub_centers,
            'distributed_coupons': distributed_coupons,
            'success_rate': success_rate
        }
        
        return Response({
            'status': 'success',
            'data': stats
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def recent_activity(request):
    """
    Get recent system activity for the homepage
    """
    try:
        activities = []
        
        # Recent system alerts
        recent_alerts = SystemAlert.objects.filter(
            created__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created')[:2]
        
        for alert in recent_alerts:
            activities.append({
                'type': 'alert',
                'title': alert.title,
                'description': alert.message,
                'time': alert.created,
                'icon_type': 'warning' if alert.level == 'WARNING' else 'info'
            })
        
        # Recent sub-center additions
        recent_centers = SubCenter.objects.filter(
            created__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created')[:2]
        
        for center in recent_centers:
            activities.append({
                'type': 'subcenter',
                'title': 'New Sub-Center Added',
                'description': f'{center.name} is now operational',
                'time': center.created,
                'icon_type': 'team'
            })
        
        # Recent parliament sessions
        recent_sessions = ParliamentSession.objects.filter(
            start_date__gte=timezone.now() - timedelta(days=7)
        ).order_by('-start_date')[:2]
        
        for session in recent_sessions:
            activities.append({
                'type': 'session',
                'title': 'Parliament Session Started',
                'description': f'{session.name} - {session.session_type}',
                'time': session.start_date,
                'icon_type': 'bank'
            })
        
        # Sort all activities by time (most recent first)
        activities.sort(key=lambda x: x['time'], reverse=True)
        
        # Format times for frontend display
        for activity in activities:
            now = timezone.now()
            time_diff = now - activity['time']
            
            if time_diff.days > 0:
                activity['time_display'] = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                activity['time_display'] = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_diff.seconds // 60
                activity['time_display'] = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        
        return Response({
            'status': 'success',
            'data': activities[:4]  # Return top 4 activities
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def system_health(request):
    """
    Get system health metrics for the homepage
    """
    try:
        # Server performance (based on recent response times)
        server_performance = 95  # This would come from monitoring system
        
        # Database health (based on query performance)
        database_health = 98  # This would come from database monitoring
        
        # Security score (based on recent security checks)
        security_score = 99  # This would come from security monitoring
        
        # User satisfaction (based on feedback or system usage)
        total_users = User.objects.count()
        active_users = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        user_satisfaction = 97
        if total_users > 0:
            user_satisfaction = min(97, round((active_users / total_users) * 100))
        
        health_metrics = {
            'server_performance': server_performance,
            'database_health': database_health,
            'security_score': security_score,
            'user_satisfaction': user_satisfaction
        }
        
        return Response({
            'status': 'success',
            'data': health_metrics
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def quick_insights(request):
    """
    Get quick insights and trends for the homepage
    """
    try:
        # Monthly distribution trend
        current_month = timezone.now().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        current_month_distributions = CouponDistribution.objects.filter(
            distribution_date__gte=current_month
        ).aggregate(total=Sum('quantity_distributed'))['total'] or 0
        
        last_month_distributions = CouponDistribution.objects.filter(
            distribution_date__gte=last_month,
            distribution_date__lt=current_month
        ).aggregate(total=Sum('quantity_distributed'))['total'] or 0
        
        # Calculate trend
        trend_percentage = 0
        if last_month_distributions > 0:
            trend_percentage = round(
                ((current_month_distributions - last_month_distributions) / last_month_distributions) * 100, 1
            )
        
        # Recent book dispatches
        recent_dispatches = BookDispatch.objects.filter(
            dispatch_date__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Pending approvals
        pending_approvals = FuelTransaction.objects.filter(
            status='PENDING'
        ).count()
        
        insights = {
            'monthly_trend': trend_percentage,
            'current_month_distributions': current_month_distributions,
            'recent_dispatches': recent_dispatches,
            'pending_approvals': pending_approvals
        }
        
        return Response({
            'status': 'success',
            'data': insights
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)
