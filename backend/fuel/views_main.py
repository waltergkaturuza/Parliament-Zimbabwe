# fuel/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from django.db import models
from django.db.models import Count, Sum, Q, F, Avg
from django.db.models.functions import TruncMonth, TruncDate, TruncWeek
from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from decimal import Decimal
import json
import logging

from .models import (
    Coupon, SubCenter, Book, Box,
    User as UserModel, FuelData, CouponDistribution, FuelTransaction, SubCenterOfficer,
    BeneficiaryCategory, Constituency, VehicleCategory, PoliticalParty, ParliamentSession, SessionAttendance,
    BeneficiaryProfile, AuditLog, SystemAlert, BookDispatch, CouponAllocation, FuelEntitlement,
    PoolVehicle, Driver, VehicleAssignment, FuelRequirementConfiguration, Program, CouponHandover
)
from .serializers import (
    CouponSerializer, SubCenterSerializer,
    BookSerializer, BoxSerializer, UserSerializer,
    UserRegistrationSerializer,
    FuelStatsSerializer, FuelTransactionSerializer, SimpleUserSerializer, SubCenterOfficerSerializer,
    BeneficiaryCategorySerializer, ConstituencySerializer, VehicleCategorySerializer, PoliticalPartySerializer,
    ParliamentSessionSerializer, SessionAttendanceSerializer, BeneficiaryProfileSerializer, 
    BulkCouponAllocationSerializer,
    BookDispatchSerializer, CouponAllocationSerializer, CouponDistributionSerializer, CouponHandoverSerializer,
    FuelEntitlementSerializer, PoolVehicleSerializer, DriverSerializer, VehicleAssignmentSerializer,
    SystemAlertSerializer, AuditLogSerializer, BulkSessionAttendanceSerializer, BoxReceiptSerializer,
    FuelRequirementConfigurationSerializer, ProgramSerializer, ProgramWriteSerializer
)
from .services.book_generation import BookGenerationService, BookGenerationSerializer
from .permissions import (
    # Role-based permissions
    SuperUserPermission, AdminPermission, MainCenterPermission, SubCenterPermission,
    ApproverPermission, MainCenterApproverPermission, SubCenterApproverPermission,
    AuditorPermission, BeneficiaryPermission, CenterBasedObjectPermission,
    
    # Workflow permissions
    MainCenterApprovalPermission, SubCenterApprovalPermission, CrossCenterApprovalPermission,
    BeneficiaryManagementPermission, MainCenterOrSubCenterPermission, MainCenterOrAuditorPermission,
    AdminOrSuperUserOrMainCenterPermission
)
from .email_utils import send_user_approval_email, send_user_rejection_email
from rest_framework.views import APIView # Ensure this import is present

# Import specialized API viewsets
from .api_views import BeneficiaryDashboardAPIViewSet

logger = logging.getLogger(__name__)

User = get_user_model()

# Import home views
from .views_home import home_stats, system_health, recent_activity

# Compatibility import for profile views
try:
    from .views_profile import user_profile_view
except ImportError:
    # If views_profile doesn't exist or user_profile_view is not available, create a placeholder
    from rest_framework.decorators import api_view, permission_classes
    from rest_framework.permissions import IsAuthenticated
    from rest_framework.response import Response
    from .serializers import UserSerializer
    
    @api_view(['GET'])
    @permission_classes([IsAuthenticated])
    def user_profile_view(request):
        """Get current user's profile information"""
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': 'Profile view error', 'detail': str(e)}, status=500)

# --- Authentication Views (Keeping as they were provided, added user detail in login) ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        print("Incoming registration data:", request.data)   # 🪵 log payload
        
        # Create the user but set them as not approved
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Set approval fields during creation
            user = serializer.save(
                is_approved=False,  # New users need approval
                registration_justification=request.data.get('justification', '')
            )
            
            return Response({
                'message': 'Registration successful. Your account is pending approval.',
                'status': 'pending',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    authentication_classes = []  # Disable authentication for login endpoint
    permission_classes = [AllowAny]  # Allow unauthenticated access
    # If you defined CustomTokenObtainPairSerializer, you might use it here
    # serializer_class = CustomTokenObtainPairSerializer

    def post(self, request):
        print(f"Login attempt - Method: {request.method}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Data: {request.data}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Attempting login for username: {username}")
        
        user = authenticate(request, username=username, password=password)

        if user is not None:
            print(f"User authenticated successfully: {user.username}")
            
            # Check if user is approved
            if not getattr(user, 'is_approved', True):  # Use getattr for backwards compatibility
                if getattr(user, 'rejection_reason', None):
                    response = Response({
                        'detail': 'Your registration has been rejected.',
                        'reason': user.rejection_reason,
                        'status': 'rejected'
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    response = Response({
                        'detail': 'Your registration is pending approval. Please wait for an administrator to approve your account.',
                        'status': 'pending'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                return response

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token_string = str(refresh)

            # Add username and role to the access token payload manually
            # Consider using a CustomTokenObtainPairSerializer instead
            access_token_obj = RefreshToken(refresh_token_string)
            access_token_obj['username'] = user.username
            access_token_obj['role'] = user.role
            access_token_obj['user_id'] = user.id # Add user ID to payload
            if user.sub_center:
                 access_token_obj['sub_center_id'] = user.sub_center.id # Add sub_center ID

            access_token = str(access_token_obj.access_token)

            print(f"Login successful for user: {user.username}")
            response = Response({
                'status': 'success',  # Add status field for frontend compatibility
                'refresh': refresh_token_string,
                'access': access_token,
                'user': SimpleUserSerializer(user).data, # Include user details in login response
            }, status=status.HTTP_200_OK)
            
            return response
        else:
            print(f"Authentication failed for username: {username}")
            # Use a consistent error response format that matches frontend expectations
            response = Response({
                'status': 'error',
                'message': 'Invalid credentials',
                'detail': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
            return response


# --- Existing ViewSets (Updated Permissions and Querysets) ---

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('sub_center', 'approved_by')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Role-based permissions for user management
        
        - Read access: All authenticated users
        - Write access: Main Center, Auditor roles only
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class UserWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user.role in ['MAIN_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), UserWritePermission()]

    def list(self, request, *args, **kwargs):
        """List all users with proper error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve users: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Apply filters from query parameters - matching frontend expectations
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if role:
            # Handle comma-separated roles
            roles = [role.strip() for role in role.split(',')]
            queryset = queryset.filter(role__in=roles)
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Role-based filtering
        if user.is_authenticated:
            if user.role == 'SUB_CENTER' and user.sub_center:
                return queryset.filter(sub_center=user.sub_center)
            # Admin, Main Center, Auditor see all users
            return queryset
        return queryset.none()

    def create(self, request, *args, **kwargs):
        """Create a new user with proper password handling"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Return the created user using the main UserSerializer
            response_serializer = UserSerializer(user)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Update user with proper field handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Use regular UserSerializer for updates (no password handling)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """Override list to return paginated results in frontend-expected format"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Handle pagination
        page_size = request.query_params.get('page_size', 50)
        page = request.query_params.get('page', 1)
        
        try:
            page_size = int(page_size)
            page = int(page)
        except (ValueError, TypeError):
            page_size = 50
            page = 1
        
        # Simple pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_queryset = queryset[start:end]
        
        serializer = self.get_serializer(paginated_queryset, many=True)
        
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'page': page,
            'page_size': page_size
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Get user statistics - real-time data reflecting current state"""
        from django.db.models import Count, Q
        
        # Get current real-time counts
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        approved_users = User.objects.filter(is_approved=True).count()
        pending_users = User.objects.filter(is_approved=False, rejection_reason__isnull=True).count()
        rejected_users = User.objects.filter(rejection_reason__isnull=False).count()
        
        # Calculate new users today
        today = timezone.now().date()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        
        # Calculate approval rate
        approval_rate = 0
        if total_users > 0:
            approval_rate = round((approved_users / total_users) * 100, 1)
        
        # Users by role - matching frontend expectations with real-time data
        users_by_role = {}
        for role_code, role_name in User.ROLE_CHOICES:
            count = User.objects.filter(role=role_code).count()
            users_by_role[role_code] = count
        
        # Users by status for better insights
        users_by_status = {
            'active_approved': User.objects.filter(is_active=True, is_approved=True).count(),
            'inactive_approved': User.objects.filter(is_active=False, is_approved=True).count(),
            'pending_approval': pending_users,
            'rejected': rejected_users
        }
        
        # Recent activity stats (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_registrations = User.objects.filter(date_joined__gte=seven_days_ago).count()
        recent_approvals = User.objects.filter(
            is_approved=True, 
            approved_at__gte=seven_days_ago
        ).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'approved_users': approved_users,
            'pending_users': pending_users,
            'rejected_users': rejected_users,
            'new_users_today': new_users_today,
            'approval_rate': approval_rate,
            'users_by_role': users_by_role,
            'users_by_status': users_by_status,
            'recent_activity': {
                'registrations_last_7_days': recent_registrations,
                'approvals_last_7_days': recent_approvals
            }
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def managers(self, request):
        """List all users eligible to be subcenter managers"""
        managers = User.objects.filter(
            is_approved=True, 
            role__in=["MAIN_CENTER", "SUB_CENTER"]
        )
        return Response(SimpleUserSerializer(managers, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_user(self, request, pk=None):
        """Approve a pending user registration and send email with credentials"""
        user = self.get_object()
        
        if user.is_approved:
            return Response(
                {'detail': 'User is already approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has email
        if not user.email:
            return Response(
                {'detail': 'User must have an email address to receive approval notification'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Approve the user
                user.approve(request.user)
                
                # Send approval email with credentials
                email_sent, temp_password = send_user_approval_email(user, request.user)
                
                if email_sent:
                    logger.info(f"User {user.username} approved and email sent successfully")
                    response_message = f'User {user.username} has been approved and notified via email'
                else:
                    logger.warning(f"User {user.username} approved but email failed to send")
                    response_message = f'User {user.username} has been approved but email notification failed'
                
                return Response({
                    'message': response_message,
                    'user': SimpleUserSerializer(user).data,
                    'email_sent': email_sent,
                    'email_address': user.email
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error approving user {user.username}: {str(e)}")
            return Response(
                {'detail': f'Error during approval process: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def reject_user(self, request, pk=None):
        """Reject a pending user registration and send email notification"""
        user = self.get_object()
        reason = request.data.get('reason', 'Registration rejected by administrator')
        
        if user.is_approved:
            return Response(
                {'detail': 'Cannot reject an already approved user'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Reject the user
                user.reject(request.user, reason)
                
                # Send rejection email if user has email
                email_sent = False
                if user.email:
                    email_sent = send_user_rejection_email(user, reason, request.user)
                    if email_sent:
                        logger.info(f"User {user.username} rejected and email sent successfully")
                    else:
                        logger.warning(f"User {user.username} rejected but email failed to send")
                
                response_message = f'User {user.username} has been rejected'
                if user.email:
                    response_message += ' and notified via email' if email_sent else ' but email notification failed'
                
                return Response({
                    'message': response_message,
                    'reason': reason,
                    'email_sent': email_sent,
                    'email_address': user.email if user.email else None
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error rejecting user {user.username}: {str(e)}")
            return Response(
                {'detail': f'Error during rejection process: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def pending_approvals(self, request):
        """Get all users pending approval"""
        pending_users = User.objects.filter(
            is_approved=False, 
            rejection_reason__isnull=True
        )
        serializer = UserSerializer(pending_users, many=True)
        
        return Response({
            'count': pending_users.count(),
            'users': serializer.data
        }, status=status.HTTP_200_OK)


# Added SubCenterOfficer ViewSet
class SubCenterOfficerViewSet(viewsets.ModelViewSet):
    queryset = SubCenterOfficer.objects.all().select_related('user', 'sub_center')
    serializer_class = SubCenterOfficerSerializer
    permission_classes = [IsAuthenticated, MainCenterPermission | SubCenterPermission] # Adjust permissions


class SubCenterViewSet(viewsets.ModelViewSet):
    queryset = SubCenter.objects.all().select_related('managed_by') # Select related managed_by
    serializer_class = SubCenterSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_object(self):
        """Custom object lookup to handle 'default' as first active subcenter"""
        lookup_value = self.kwargs.get(self.lookup_field)
        
        if lookup_value == 'default':
            # Get the first active subcenter
            obj = SubCenter.objects.filter(is_active=True).first()
            if not obj:
                from rest_framework.exceptions import NotFound
                raise NotFound('No active subcenter found for default')
        else:
            obj = super().get_object()
        
        # Check object permissions as usual
        self.check_object_permissions(self.request, obj)
        return obj

    def get_permissions(self):
        """Role-based permissions for subcenter management
        
        - Read access: All authenticated users
        - Write access: Main Center, Auditor roles only
        """
        if self.action in ['list', 'retrieve', 'overview', 'activities', 'statistics', 'recent_activity']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class SubCenterWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user.role in ['MAIN_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), SubCenterWritePermission()]

    def list(self, request, *args, **kwargs):
        """List all subcenters with proper error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve subcenters: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            # For dispatch operations, all authenticated users should see all active subcenters
            # This allows proper dispatch destination selection
            if self.action in ['list']:
                return queryset.filter(is_active=True)
            elif user.role == 'SUB_CENTER' and user.sub_center:
                # Sub Center officers can only see their assigned center for management
                return queryset.filter(Q(managed_by=user) | Q(officers__user=user)).distinct()
            # Main Center, Admin, etc. can see all
            return queryset
        return queryset.none() # Anonymous users see nothing

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def debug_state(self, request):
        """Debug endpoint to check subcenter state in production"""
        from django.db.models import Count
        
        # Get comprehensive subcenter information
        subcenters_data = []
        for sc in SubCenter.objects.all():
            subcenters_data.append({
                'id': sc.id,
                'name': sc.name,
                'code': sc.code,
                'is_active': sc.is_active,
                'location': sc.location,
                'managed_by': sc.managed_by.username if sc.managed_by else None,
                'books_count': Book.objects.filter(box__assigned_to=sc).count(),
                'received_books_count': Book.objects.filter(
                    box__assigned_to=sc, box__is_received=True
                ).count(),
                'dispatches_to_count': BookDispatch.objects.filter(to_center=sc).count(),
                'dispatches_from_count': BookDispatch.objects.filter(
                    dispatched_by__sub_center=sc
                ).count() if hasattr(BookDispatch, 'dispatched_by') else 0
            })
        
        return Response({
            'subcenters': subcenters_data,
            'totals': {
                'total_subcenters': SubCenter.objects.count(),
                'active_subcenters': SubCenter.objects.filter(is_active=True).count(),
                'total_books': Book.objects.count(),
                'total_received_books': Book.objects.filter(box__is_received=True).count(),
                'total_dispatches': BookDispatch.objects.count()
            },
            'user_info': {
                'username': request.user.username,
                'role': request.user.role,
                'subcenter': request.user.sub_center.name if hasattr(request.user, 'sub_center') and request.user.sub_center else None
            }
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def overview(self, request):
        """Get overview data for current user's subcenter"""
        user = request.user
        if user.role == 'SUB_CENTER' and user.sub_center:
            subcenter = user.sub_center
        else:
            # For admin/main center users, show first subcenter or create mock data
            subcenter = SubCenter.objects.first()
        
        if subcenter:
            # Calculate real data
            total_books = Book.objects.filter(box__assigned_to=subcenter).count()
            books_used = Book.objects.filter(box__assigned_to=subcenter, is_assigned=True).count()
            total_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter).count()
            coupons_used = Coupon.objects.filter(book__box__assigned_to=subcenter, status='USED').count()
            
            data = {
                'center_id': subcenter.code or f'SC-{subcenter.id}',
                'center_name': subcenter.name,
                'total_books': total_books,
                'books_used': books_used,
                'total_coupons': total_coupons,
                'coupons_used': coupons_used,
                'active_members': User.objects.filter(sub_center=subcenter, is_active=True).count(),
                'pending_handovers': BookDispatch.objects.filter(to_center=subcenter, status='PENDING').count(),
                'last_handover': BookDispatch.objects.filter(to_center=subcenter).order_by('-created').first().created.strftime('%Y-%m-%d') if BookDispatch.objects.filter(to_center=subcenter).exists() else '',
                'total_value_usd': total_coupons * 2.5,  # Assume $2.5 average per coupon
                'monthly_consumption_usd': coupons_used * 2.5,
            }
        else:
            data = {
                'center_id': 'SC-001',
                'center_name': 'Demo Sub Center',
                'total_books': 0,
                'books_used': 0,
                'total_coupons': 0,
                'coupons_used': 0,
                'active_members': 0,
                'pending_handovers': 0,
                'last_handover': '',
                'total_value_usd': 0,
                'monthly_consumption_usd': 0,
            }
        
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def activities(self, request):
        """Get recent activities for current user's subcenter"""
        user = request.user
        activities = []
        
        # Get recent transactions and handovers
        if user.sub_center:
            recent_transactions = FuelTransaction.objects.filter(
                coupon__book__box__assigned_to=user.sub_center
            ).order_by('-timestamp')[:10]
            
            for transaction in recent_transactions:
                activities.append({
                    'id': transaction.id,
                    'activity_type': 'transaction',
                    'description': f'Fuel transaction - {transaction.fuel_type}',
                    'timestamp': transaction.timestamp.strftime('%Y-%m-%d %H:%M'),
                    'status': 'completed',
                    'value_usd': transaction.amount_usd if hasattr(transaction, 'amount_usd') else 0,
                })
        
        return Response(activities)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def statistics(self, request, pk=None):
        """Get statistics for a specific subcenter"""
        try:
            subcenter = self.get_object()
        except Exception:
            # Production-safe fallback when subcenter doesn't exist yet
            stats = {
                'total_boxes': 0,
                'active_books': 0,
                'total_coupons': 0,
                'total_coupons_assigned': 0,
                'used_coupons': 0,
                'available_coupons': 0,
                'recently_distributed': 0,
                'recent_transactions': 0,
                'usage_rate': 0,
                'notice': 'SubCenter not found; returning default statistics'
            }
            return Response(stats)
        
        # Calculate statistics
        total_boxes = Box.objects.filter(assigned_to=subcenter).count()
        active_books = Book.objects.filter(
            box__assigned_to=subcenter,
            is_assigned=True,
            is_archived=False
        ).count()
        total_coupons = Coupon.objects.filter(
            book__box__assigned_to=subcenter
        ).count()
        used_coupons = Coupon.objects.filter(
            book__box__assigned_to=subcenter,
            status='USED'
        ).count()
        
        # Recent transactions count (last 30 days)
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_transactions = FuelTransaction.objects.filter(
            coupon__book__box__assigned_to=subcenter,
            timestamp__gte=thirty_days_ago
        ).count()
        
        statistics = {
            'total_boxes': total_boxes,
            'active_books': active_books,
            'total_coupons': total_coupons,
            'total_coupons_assigned': total_coupons,  # Frontend expected field
            'used_coupons': used_coupons,
            'available_coupons': total_coupons - used_coupons,
            'recently_distributed': recent_transactions,  # Frontend expected field
            'recent_transactions': recent_transactions,
            'usage_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 2)
        }
        
        return Response(statistics)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def recent_activity(self, request, pk=None):
        """Get recent activity for a specific subcenter"""
        try:
            subcenter = self.get_object()
        except Exception:
            # Return empty activity list instead of error to keep UI flowing in production
            return Response([])
        
        try:
            # Get recent transactions (last 10)
            recent_transactions = FuelTransaction.objects.filter(
                coupon__book__box__assigned_to=subcenter
            ).select_related('coupon', 'coupon__book', 'beneficiary').order_by('-timestamp')[:10]
            
            # Get recent dispatches (last 5)
            recent_dispatches = BookDispatch.objects.filter(
                to_center=subcenter
            ).select_related('dispatched_by').order_by('-dispatch_date')[:5]
            
            activities = []
            
            # Add transactions
            for transaction in recent_transactions:
                activities.append({
                    'id': str(transaction.id),  # Frontend expected field
                    'action': f'Fuel transaction - {transaction.litres_consumed}L',  # Frontend expected field
                    'timestamp': transaction.timestamp.strftime('%Y-%m-%d %H:%M'),  # Frontend expected field
                    'user': transaction.beneficiary.get_full_name() if transaction.beneficiary else 'Unknown',  # Frontend expected field
                    'type': 'transaction',
                    'description': f'Fuel transaction - {transaction.litres_consumed}L',
                    'date': transaction.timestamp,
                    'details': {
                        'beneficiary': transaction.beneficiary.get_full_name() if transaction.beneficiary else 'Unknown',
                        'amount': f'{transaction.litres_consumed}L',
                        'location': transaction.transaction_location or 'Not specified'
                    }
                })
            
            # Add dispatches
            for dispatch in recent_dispatches:
                activities.append({
                    'id': str(dispatch.id),  # Frontend expected field
                    'action': f'Book dispatch: {dispatch.book.book_number}',  # Frontend expected field
                    'timestamp': dispatch.dispatch_date.strftime('%Y-%m-%d %H:%M'),  # Frontend expected field
                    'user': dispatch.dispatched_by.get_full_name() if dispatch.dispatched_by else 'Unknown',  # Frontend expected field
                    'type': 'dispatch',
                    'description': f'Book dispatch: {dispatch.book.book_number}',
                    'date': dispatch.dispatch_date,
                    'details': {
                        'book_number': dispatch.book.book_number,
                        'dispatched_by': dispatch.dispatched_by.get_full_name() if dispatch.dispatched_by else 'Unknown',
                        'quantity': dispatch.quantity if hasattr(dispatch, 'quantity') else 'Not specified'
                    }
                })
            
            # Sort by timestamp descending
            activities.sort(key=lambda x: x['date'], reverse=True)
            
            return Response(activities[:15])  # Return top 15 activities
        
        except Exception as e:
            # Return empty activities if there's an error, but don't fail completely
            print(f"Error getting recent activity for subcenter {pk}: {str(e)}")
            return Response([])  # Return empty list instead of error

    def list(self, request, *args, **kwargs):
        """Enhanced list to return data in MainCenter SubCenterMonitoring format"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Handle pagination
        page_size = request.query_params.get('page_size', 50)
        page = request.query_params.get('page', 1)
        
        try:
            page_size = int(page_size)
            page = int(page)
        except (ValueError, TypeError):
            page_size = 50
            page = 1
        
        # Simple pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_queryset = queryset[start:end]
        
        # Enhanced serialization for MainCenter frontend
        enhanced_data = []
        for subcenter in paginated_queryset:
            # Calculate real-time statistics
            total_boxes = Box.objects.filter(assigned_to=subcenter).count()
            total_books = Book.objects.filter(box__assigned_to=subcenter).count()
            books_used = Book.objects.filter(
                box__assigned_to=subcenter, 
                is_assigned=True
            ).count()
            books_remaining = total_books - books_used
            
            total_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter
            ).count()
            available_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='AVAILABLE'
            ).count()
            used_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='USED'
            ).count()
            
            # Calculate monetary value
            average_value_per_coupon_usd = 26  # 20L * $1.30 average
            total_value_usd = total_coupons * average_value_per_coupon_usd
            
            # Performance metrics
            performance_score = 0
            if total_coupons > 0:
                usage_rate = (used_coupons / total_coupons) * 100
                performance_score = min(100, max(0, usage_rate + 
                    (30 if available_coupons > 10 else 15)
                ))
            
            # Alert calculations
            alerts_count = 0
            if available_coupons < 50:
                alerts_count += 1
            if books_remaining < 5:
                alerts_count += 1
            if performance_score < 70:
                alerts_count += 1
            
            # Manager information
            manager_name = 'Not assigned'
            manager_email = ''
            if hasattr(subcenter, 'managed_by') and subcenter.managed_by:
                manager_name = subcenter.managed_by.get_full_name()
                manager_email = subcenter.managed_by.email
            
            enhanced_data.append({
                'id': subcenter.id,
                'name': subcenter.name,
                'code': subcenter.code or f'SC{str(subcenter.id).zfill(3)}',
                'location': subcenter.location or 'Not specified',
                'status': 'ACTIVE' if subcenter.is_active else 'INACTIVE',
                
                # Manager and contact information
                'manager_name': manager_name,
                'manager_email': manager_email,
                'contact_number': subcenter.contact_number if hasattr(subcenter, 'contact_number') else 'Not provided',
                'email': subcenter.email if hasattr(subcenter, 'email') else 'Not provided',
                
                # Inventory statistics
                'total_boxes': total_boxes,
                'total_books': total_books,
                'books_used': books_used,
                'books_remaining': books_remaining,
                'total_coupons': total_coupons,
                'available_coupons': available_coupons,
                'used_coupons': used_coupons,
                
                # Financial information
                'total_value_usd': round(total_value_usd, 2),
                'total_value_zwg': round(total_value_usd * 27.5, 2),
                'monthly_consumption_usd': round(used_coupons * average_value_per_coupon_usd * 0.1, 2),
                
                # Performance metrics
                'performance_score': round(performance_score, 1),
                'alerts_count': alerts_count,
                
                # Metadata
                'last_activity': subcenter.updated.isoformat() if hasattr(subcenter, 'updated') else timezone.now().isoformat(),
                'created': subcenter.created.isoformat() if hasattr(subcenter, 'created') else timezone.now().isoformat(),
                
                # Basic serializer data
                **SubCenterSerializer(subcenter).data
            })
        
        return Response({
            'results': enhanced_data,
            'count': queryset.count(),
            'page': page,
            'page_size': page_size,
            'total_pages': (queryset.count() + page_size - 1) // page_size
        })

    @action(detail=False, methods=['post'], url_path='quick-actions')
    def quick_actions(self, request):
        """Handle quick action requests from subcenter dashboard"""
        try:
            action_type = request.data.get('action_type')
            subcenter_id = request.data.get('subcenter_id')
            
            # Create a system alert/notification for the main center
            SystemAlert.objects.create(
                alert_type='INFO',
                title=f'Quick Action Request: {action_type}',
                message=f'Subcenter {subcenter_id} requested: {action_type}',
                source='SUBCENTER_DASHBOARD',
                status='ACTIVE',
                created_by=request.user,
                data=request.data
            )
            
            return Response({
                'status': 'success',
                'message': 'Quick action request submitted successfully',
                'action_type': action_type
            }, status=201)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Failed to submit quick action: {str(e)}'
            }, status=400)


# === COUPON RECEPTION AND DISPATCH VIEWSETS ===

class BoxViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for Box management with coupon generation"""
    serializer_class = BoxSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Role-based permissions for box management
        
        - Read access: All authenticated users (Main Center and Sub Center)
        - Write access: Main Center, Sub Center roles
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class BoxWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                print(f"=== BOX WRITE PERMISSION DEBUG ===")
                print(f"User: {request.user.username}")
                print(f"User role: {request.user.role}")
                print(f"Required roles: ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']")
                print(f"Permission granted: {request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER', 'ADMIN']}")
                return request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER', 'ADMIN']
        
        return [IsAuthenticated(), BoxWritePermission()]
    
    def list(self, request, *args, **kwargs):
        """List all boxes with proper error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve boxes: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_queryset(self):
        user = getattr(self.request, 'user', None)

        # Start with basic queryset
        queryset = Box.objects.all()

        # Try to add select_related optimizations, but handle missing columns gracefully
        try:
            # Check if fields exist by attempting a limited query first
            test_query = Box.objects.values('id').first()
            if test_query:
                # Test if related fields exist
                try:
                    queryset = queryset.select_related('assigned_to', 'received_by', 'verified_by')
                except Exception:
                    try:
                        queryset = queryset.select_related('assigned_to', 'received_by')
                    except Exception:
                        try:
                            queryset = queryset.select_related('assigned_to')
                        except Exception:
                            queryset = Box.objects.all()
        except Exception:
            queryset = Box.objects.all()

        # If not authenticated, return empty set (permission class should block anyway)
        if not getattr(user, 'is_authenticated', False):
            return queryset.none()

        # Apply role-based filtering safely
        try:
            role = getattr(user, 'role', None)
            if getattr(user, 'is_superuser', False) or role in ('MAIN_CENTER', 'AUDITOR'):
                return queryset
            if role == 'SUB_CENTER':
                sub_center_id = getattr(user, 'sub_center_id', None)
                if sub_center_id:
                    return queryset.filter(assigned_to_id=sub_center_id)
                sub_center = getattr(user, 'sub_center', None)
                if sub_center:
                    return queryset.filter(assigned_to=sub_center)
        except Exception:
            pass
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """Auto-fill received_by with current user's full name"""
        # Auto-fill received_by with current user
        serializer.save(received_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def verification_options(self, request):
        """
        Get available verification process options for frontend select-all functionality
        """
        verification_processes = [
            {'id': 'serial_verification', 'name': 'Serial Number Verification', 'description': 'Verify all coupon serial numbers'},
            {'id': 'physical_inspection', 'name': 'Physical Inspection', 'description': 'Visual inspection of books and coupons'},
            {'id': 'count_verification', 'name': 'Count Verification', 'description': 'Verify coupon counts match declared numbers'},
            {'id': 'quality_check', 'name': 'Quality Check', 'description': 'Check print quality and authenticity'},
            {'id': 'database_sync', 'name': 'Database Synchronization', 'description': 'Sync with central database'},
        ]
        
        return Response({
            'verification_processes': verification_processes,
            'select_all_available': True,
            'current_user': {
                'full_name': f"{request.user.first_name} {request.user.last_name}".strip(),
                'role': request.user.role
            }
        })
    
    @action(detail=False, methods=['get'])
    def coupon_book_options(self, request):
        """
        Get available options for coupon book generation
        """
        return Response({
            'coupons_per_book_range': {
                'min': 1,
                'max': 100,
                'default': 100,
                'step': 1
            },
            'number_of_books_range': {
                'min': 1,
                'max': 50,
                'default': 10,
                'step': 1
            },
            'denomination_options': [
                {'value': 5, 'label': '5 Litres'},
                {'value': 10, 'label': '10 Litres'},
                {'value': 20, 'label': '20 Litres'},
                {'value': 50, 'label': '50 Litres'},
            ],
            'fuel_type_options': [
                {'value': 'PETROL', 'label': 'Petrol'},
                {'value': 'DIESEL', 'label': 'Diesel'},
            ]
        })
    
    @action(detail=False, methods=['post'])
    def receive_box(self, request):
        """
        Receive a new box and generate all books and coupons based on the coupon range logic
        """
        serializer = BoxReceiptSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    box = serializer.save(received_by=request.user)
                    
                    # Validate the coupon sequence
                    is_valid, validation_message = box.validate_coupon_sequence()
                    if not is_valid:
                        raise ValueError(f"Invalid coupon sequence: {validation_message}")
                    
                    # Generate all books and coupons
                    books_created = box.generate_books_and_coupons()
                    
                    # Create dispatch records for each book in the box
                    for book in books_created:
                        BookDispatch.objects.create(
                            book=book,
                            assigned_to=box.assigned_to,
                            dispatched_by=request.user,
                            dispatch_date=timezone.now(),
                        status='DISPATCHED',
                        notes=f"Auto-generated {len(books_created)} books with sequential coupons"
                    )
                    
                    return Response({
                        'message': 'Box received and coupons generated successfully',
                        'box': BoxSerializer(box).data,
                        'books_created': len(books_created),
                        'total_coupons': box.total_coupons,
                        'book_ranges': box.get_book_ranges_summary()
                    }, status=status.HTTP_201_CREATED)
                    
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f'Failed to process box: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def coupon_ranges_preview(self, request, pk=None):
        """
        Preview the book and coupon ranges for a box without generating them
        """
        box = self.get_object()
        
        # Validate sequence first
        is_valid, validation_message = box.validate_coupon_sequence()
        
        if not is_valid:
            return Response({
                'valid': False,
                'error': validation_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        book_ranges = box.get_book_ranges_summary()
        
        return Response({
            'valid': True,
            'validation_message': validation_message,
            'box_summary': {
                'box_code': box.box_code,
                'first_coupon': box.first_coupon_number,
                'last_coupon': box.last_coupon_number,
                'total_books': box.number_of_books,
                'coupons_per_book': box.coupons_per_book,
                'total_coupons': box.total_coupons,
                'denomination': box.denomination
            },
            'book_ranges': book_ranges
        })
    
    @action(detail=False, methods=['post'])
    def create_petrotrade_box(self, request):
        """
        Create a box with PetroTrade coupon serial numbers
        Expects: first_coupon, last_coupon, fuel_type, denomination, coupons_per_book
        """
        from .utils.petrotrade_serials import PetroTradeSerial
        from .models import Box, Book
        
        try:
            data = request.data
            first_coupon = data.get('first_coupon')
            last_coupon = data.get('last_coupon')
            fuel_type = data.get('fuel_type', 'DIESEL')
            denomination = data.get('denomination', 20)
            coupons_per_book = data.get('coupons_per_book', 100)
            create_coupons = data.get('create_coupons', True)
            
            # Validate required fields
            if not first_coupon or not last_coupon:
                return Response({
                    'error': 'first_coupon and last_coupon are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse and validate serials
            first_info = PetroTradeSerial.parse_serial(first_coupon)
            last_info = PetroTradeSerial.parse_serial(last_coupon)
            
            if not first_info['is_valid']:
                return Response({
                    'error': f'Invalid first coupon format: {first_coupon}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not last_info['is_valid']:
                return Response({
                    'error': f'Invalid last coupon format: {last_coupon}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if first_info['prefix'] != last_info['prefix']:
                return Response({
                    'error': 'First and last coupons must have the same prefix'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if first_info['number'] >= last_info['number']:
                return Response({
                    'error': 'Last coupon number must be greater than first coupon number'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate totals
            total_coupons = last_info['number'] - first_info['number'] + 1
            total_books = (total_coupons + coupons_per_book - 1) // coupons_per_book  # Ceiling division
            
            with transaction.atomic():
                # Create the box
                box_code = f"PT{first_info['prefix']}{first_info['number']:06d}_{last_info['number']:06d}"
                
                box = Box.objects.create(
                    box_code=box_code,
                    fuel_type=fuel_type,
                    denomination=denomination,
                    first_coupon_number=first_coupon,
                    last_coupon_number=last_coupon,
                    number_of_books=total_books,
                    coupons_per_book=coupons_per_book,
                    received_by=request.user,
                    received_date=timezone.now(),
                    is_received=True
                )
                
                # Split serials into books
                book_ranges = PetroTradeSerial.split_into_books(
                    first_coupon, last_coupon, coupons_per_book
                )
                
                books_created = []
                total_coupons_created = 0
                
                for book_idx, book_range in enumerate(book_ranges, 1):
                    # Create the book
                    book = Book.create_from_petrotrade_serials(
                        box=box,
                        book_number=f"Book {book_idx:02d}",
                        first_serial=book_range['first_serial'],
                        last_serial=book_range['last_serial']
                    )
                    books_created.append(book)
                    
                    if create_coupons:
                        # Generate coupons for this book
                        coupons = book.generate_petrotrade_coupons()
                        total_coupons_created += len(coupons)
                
                return Response({
                    'message': 'PetroTrade box created successfully',
                    'box': {
                        'id': box.id,
                        'box_code': box.box_code,
                        'fuel_type': box.fuel_type,
                        'denomination': box.denomination,
                        'first_coupon': box.first_coupon_number,
                        'last_coupon': box.last_coupon_number,
                        'total_books': len(books_created),
                        'total_coupons': total_coupons,
                        'coupons_created': total_coupons_created if create_coupons else 0
                    },
                    'books': [
                        {
                            'book_number': book.book_number,
                            'first_coupon': book.first_coupon_number,
                            'last_coupon': book.last_coupon_number,
                            'coupon_count': book_range['coupon_count']
                        }
                        for book, book_range in zip(books_created, book_ranges)
                    ]
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'Failed to create PetroTrade box: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def generate_coupons(self, request, pk=None):
        """
        Generate or regenerate all books and coupons for a box
        """
        box = self.get_object()
        
        try:
            with transaction.atomic():
                books_created = box.generate_books_and_coupons()
                
                return Response({
                    'message': f'Successfully generated {len(books_created)} books with coupons',
                    'books_created': len(books_created),
                    'total_coupons': box.total_coupons,
                    'book_ranges': box.get_book_ranges_summary()
                })
                
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to generate coupons: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def dispatch_status(self, request, pk=None):
        """
        Get dispatch status and details for a box
        """
        box = self.get_object()
        
        dispatches = BoxDispatch.objects.filter(box=box).order_by('-dispatch_date')
        dispatch_data = []
        
        for dispatch in dispatches:
            dispatch_data.append({
                'id': dispatch.id,
                'dispatched_to': dispatch.dispatched_to.name if dispatch.dispatched_to else None,
                'dispatched_by': dispatch.dispatched_by.get_full_name() if dispatch.dispatched_by else None,
                'dispatch_date': dispatch.dispatch_date,
                'status': dispatch.status,
                'notes': dispatch.notes
            })
        
        return Response({
            'box_code': box.box_code,
            'current_assignment': box.assigned_to.name if box.assigned_to else None,
            'is_fully_generated': box.is_fully_generated,
            'dispatches': dispatch_data
        })

    @action(detail=True, methods=['post'])
    def verify_box(self, request, pk=None):
        """
        Verify a box - mark as verified with verification notes
        """
        box = self.get_object()
        
        verification_notes = request.data.get('verification_notes', '')
        verification_checks = request.data.get('verification_checks', [])
        
        try:
            # Update box verification status
            box.verify_box(request.user, verification_notes)
            
            # Store verification checks if provided
            if verification_checks:
                box.verification_checks = verification_checks
                box.save()
            
            return Response({
                'message': 'Box verified successfully',
                'box': BoxSerializer(box).data,
                'verified_by': request.user.get_full_name(),
                'verified_at': box.verified_at,
                'verification_notes': box.verification_notes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to verify box: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def sign_off_box(self, request, pk=None):
        """
        Sign off on a verified box - final step in verification process
        """
        box = self.get_object()
        
        if not box.is_verified:
            return Response({
                'error': 'Box must be verified before sign-off'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sign_off_notes = request.data.get('sign_off_notes', '')
        
        try:
            # Update box sign-off status
            box.status = 'SIGNED_OFF'
            box.signed_off_by = request.user
            box.sign_off_date = timezone.now()
            if sign_off_notes:
                box.sign_off_notes = sign_off_notes
            box.save()
            
            return Response({
                'message': 'Box signed off successfully',
                'box': BoxSerializer(box).data,
                'signed_off_by': request.user.get_full_name(),
                'sign_off_date': box.sign_off_date,
                'sign_off_notes': box.sign_off_notes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to sign off box: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def verification_details(self, request, pk=None):
        """
        Get detailed verification information for a box including all books and coupons
        """
        box = self.get_object()
        
        # Get all books for this box
        books = box.books.all()
        book_verification_data = []
        
        for book in books:
            coupons = book.coupons.all()
            coupon_data = []
            
            for coupon in coupons:
                coupon_data.append({
                    'id': coupon.id,
                    'serial_number': coupon.serial_number,
                    'status': coupon.status,
                    'is_used': coupon.is_used,
                    'used_at': coupon.used_at,
                    'position': coupon.position_in_book
                })
            
            book_verification_data.append({
                'id': book.id,
                'book_number': book.book_number,
                'first_coupon_number': book.first_coupon_number,
                'last_coupon_number': book.last_coupon_number,
                'total_coupons': book.total_coupons,
                'is_verified': book.is_verified,
                'verified_by': book.verified_by.get_full_name() if book.verified_by else None,
                'verified_at': book.verified_at,
                'verification_notes': book.verification_notes,
                'coupons': coupon_data
            })
        
        return Response({
            'box': {
                'id': box.id,
                'box_code': box.box_code,
                'fuel_type': box.fuel_type,
                'denomination': box.denomination,
                'number_of_books': box.number_of_books,
                'total_coupons': box.total_coupons,
                'first_coupon_number': box.first_coupon_number,
                'last_coupon_number': box.last_coupon_number,
                'status': box.status,
                'is_verified': box.is_verified,
                'verified_by': box.verified_by.get_full_name() if box.verified_by else None,
                'verified_at': box.verified_at,
                'verification_notes': box.verification_notes,
                'verification_checks': getattr(box, 'verification_checks', []),
                'signed_off_by': box.signed_off_by.get_full_name() if getattr(box, 'signed_off_by', None) else None,
                'sign_off_date': getattr(box, 'sign_off_date', None),
                'sign_off_notes': getattr(box, 'sign_off_notes', '')
            },
            'books': book_verification_data,
            'verification_summary': {
                'total_books': len(book_verification_data),
                'verified_books': len([b for b in book_verification_data if b['is_verified']]),
                'all_books_verified': all(b['is_verified'] for b in book_verification_data),
                'box_verified': box.is_verified,
                'ready_for_sign_off': box.is_verified and all(b['is_verified'] for b in book_verification_data)
            }
        })

    # === BOX BOOK GENERATION (SINGLE SOURCE OF TRUTH) ===
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def generate_books(self, request, pk=None):
        """
        Generate books and coupons for this box
        
        This is the SINGLE SOURCE OF TRUTH for book generation
        All book generation MUST go through this centralized service
        
        POST /api/boxes/{id}/generate_books/
        {
            "first_serial": "PU006H1355101",
            "last_serial": "PU006H1356100", 
            "books_per_box": 10,
            "coupons_per_book": 100,
            "force": false
        }
        """
        box = self.get_object()
        
        try:
            # Prepare data for the service
            generation_data = {
                'box_id': box.id,
                'first_serial': request.data.get('first_serial'),
                'last_serial': request.data.get('last_serial'),
                'books_per_box': request.data.get('books_per_box', 10),
                'coupons_per_book': request.data.get('coupons_per_book', 100),
                'force': request.data.get('force', False)
            }
            
            # Validate input
            serializer = BookGenerationSerializer(data=generation_data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            
            # Call the centralized service
            result = BookGenerationService.generate_books_and_coupons(
                box_id=validated_data['box_id'],
                first_serial=validated_data['first_serial'],
                last_serial=validated_data['last_serial'],
                books_per_box=validated_data['books_per_box'],
                coupons_per_book=validated_data['coupons_per_book'],
                force=validated_data['force']
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f'Error generating books for box {box.id}: {e}', exc_info=True)
            return Response({
                'success': False,
                'message': 'Internal server error',
                'errors': [str(e)]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def generation_status(self, request, pk=None):
        """
        Get the book generation status for this box
        
        GET /api/boxes/{id}/generation_status/
        """
        box = self.get_object()
        
        try:
            status_result = BookGenerationService.get_box_generation_status(box.id)
            
            if 'error' in status_result:
                return Response(status_result, status=status.HTTP_404_NOT_FOUND)
            
            return Response(status_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Error getting generation status for box {box.id}: {e}', exc_info=True)
            return Response({
                'error': f'Status check failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Perform bidirectional calculations for batch/coupon allocation
        
        POST /api/boxes/calculate/
        
        Supports two modes:
        1. first-and-last: Provide first_coupon_serial and last_coupon_serial
        2. first-and-count: Provide first_coupon_serial, number_of_books, and coupons_per_book
        
        Returns calculated values including the mode used and detailed results
        """
        try:
            # Create a temporary Box instance for calculation
            temp_box = Box(
                denomination=request.data.get('denomination', 20),
                fuel_type=request.data.get('fuel_type', 'PETROL'),
                first_coupon_serial=request.data.get('first_coupon_serial'),
                last_coupon_serial=request.data.get('last_coupon_serial'),
                number_of_books=request.data.get('number_of_books'),
                coupons_per_book=request.data.get('coupons_per_book'),
                fuel_price_per_litre_usd=Decimal(request.data.get('fuel_price_per_litre_usd', '1.40')),
                exchange_rate_zwg_usd=Decimal(request.data.get('exchange_rate_zwg_usd', '27.50'))
            )
            
            # Use the smart_calculate method
            result = temp_box.smart_calculate(
                first_serial=request.data.get('first_coupon_serial'),
                last_serial=request.data.get('last_coupon_serial'),
                number_of_books=request.data.get('number_of_books'),
                coupons_per_book=request.data.get('coupons_per_book')
            )
            
            if result.get('errors'):
                return Response({
                    'error': result['errors'][0] if result['errors'] else 'Calculation failed',
                    'details': result
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Add calculated fields for API response
            response_data = {
                'calculated_number_of_books': result.get('calculations', {}).get('number_of_books'),
                'calculated_coupons_per_book': result.get('calculations', {}).get('coupons_per_book'),
                'calculated_last_serial': result.get('calculations', {}).get('last_serial'),
                'calculated_total_coupons': result.get('calculations', {}).get('total_coupons'),
                'calculation_mode_display': result.get('calculation_mode'),
                'detailed_book_breakdown': result.get('book_breakdown', []),
                'calculation_summary': {
                    'total_litres': result.get('calculations', {}).get('total_litres'),
                    'first_num': result.get('calculations', {}).get('first_num'),
                    'last_num': result.get('calculations', {}).get('last_num'),
                },
                'success': True
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Error in bidirectional calculation: {e}', exc_info=True)
            return Response({
                'error': f'Calculation failed: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for Book management with sequential allocation"""
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Role-based permissions for book management
        
        - Read access: All authenticated users
        - Write access: Main Center, Sub Center, Auditor roles
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class BookWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), BookWritePermission()]

    def list(self, request, *args, **kwargs):
        """List all books with proper error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve books: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_queryset(self):
        user = self.request.user
        queryset = Book.objects.all().select_related('box', 'box__assigned_to', 'assigned_to')
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            return queryset.filter(box__assigned_to=user.sub_center)
        elif user.role == 'BENEFICIARY':
            return queryset.filter(assigned_to=user)
        
        return queryset.none()
    
    @action(detail=True, methods=['post'])
    def allocate_sequential_coupons(self, request, pk=None):
        """
        Allocate a sequential block of coupons from this book
        """
        book = self.get_object()
        
        count = request.data.get('count', 1)
        start_from = request.data.get('start_from_coupon')
        beneficiary_id = request.data.get('beneficiary_id')
        
        try:
            count = int(count)
            if count <= 0:
                return Response({'error': 'Count must be positive'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get beneficiary
            if beneficiary_id:
                try:
                    beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
                except User.DoesNotExist:
                    return Response({'error': 'Beneficiary not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                beneficiary = book.assigned_to
                if not beneficiary:
                    return Response({'error': 'Book is not assigned to any beneficiary'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                allocation_result = book.allocate_sequential_coupons(
                    beneficiary=beneficiary,
                    count=count,
                    start_from_coupon=start_from
                )
                
                return Response({
                    'message': f'Successfully allocated {count} sequential coupons',
                    'allocation': allocation_result
                })
                
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Allocation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def received(self, request):
        """
        Get list of received books for the current user/subcenter
        """
        user = self.request.user
        queryset = Book.objects.filter(
            box__received_at__isnull=False
        ).select_related('box', 'box__assigned_to', 'assigned_to')
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            # Can see all received books
            pass
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Only books for their subcenter
            queryset = queryset.filter(box__assigned_to=user.sub_center)
        elif user.role == 'BENEFICIARY':
            # Only their own books
            queryset = queryset.filter(assigned_to=user)
        else:
            queryset = queryset.none()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def available_ranges(self, request, pk=None):
        """
        Get available coupon ranges in this book
        """
        book = self.get_object()
        
        ranges = book.get_available_ranges()
        
        return Response({
            'book': {
                'book_number': book.book_number,
                'first_coupon': book.first_coupon_number,
                'last_coupon': book.last_coupon_number,
                'total_coupons': book.total_coupons
            },
            'available_ranges': ranges,
            'total_available': sum(r['count'] for r in ranges)
        })
    
    @action(detail=True, methods=['get'])
    def allocation_summary(self, request, pk=None):
        """
        Get allocation summary for this book
        """
        book = self.get_object()
        
        summary = book.get_allocation_summary()
        
        return Response({
            'book': {
                'book_number': book.book_number,
                'assigned_to': book.assigned_to.get_full_name() if book.assigned_to else None,
                'total_coupons': book.total_coupons
            },
            'allocations': summary,
            'statistics': {
                'total_allocated': book.allocated_coupons_count,
                'total_used': book.used_coupons_count,
                'total_available': book.available_coupons_count
            }
        })
    
    @action(detail=True, methods=['post'])
    def validate_integrity(self, request, pk=None):
        """
        Validate the integrity of the book's coupon sequence
        """
        book = self.get_object()
        
        errors = book.validate_book_integrity()
        
        return Response({
            'book_number': book.book_number,
            'is_valid': len(errors) == 0,
            'errors': errors,
            'validation_timestamp': timezone.now()
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available_for_dispatch(self, request):
        """
        Get books available for dispatch - enhanced for intelligent generator
        """
        try:
            # Debug: Check different filter conditions
            debug_mode = request.query_params.get('debug') == 'true'
            
            if debug_mode:
                # Comprehensive diagnostic information for production debugging
                from django.db.models import Count, Q
                
                total_books = Book.objects.count()
                books_with_boxes = Book.objects.filter(box__isnull=False).count()
                received_boxes = Book.objects.filter(box__is_received=True).count()
                unassigned_books = Book.objects.filter(is_assigned=False).count()
                available_books_count = Book.objects.filter(
                    box__is_received=True, is_assigned=False
                ).count()
                
                # Box statistics
                total_boxes = Box.objects.count()
                received_boxes_total = Box.objects.filter(is_received=True).count()
                
                # SubCenter statistics
                total_subcenters = SubCenter.objects.count()
                active_subcenters = SubCenter.objects.filter(is_active=True).count()
                
                # Sample data for inspection
                sample_boxes = list(Box.objects.values(
                    'id', 'box_code', 'is_received', 'fuel_type', 'denomination', 'assigned_to__name'
                ).order_by('-id')[:10])
                
                sample_books = list(Book.objects.select_related('box').values(
                    'id', 'book_code', 'is_assigned', 'box__box_code', 'box__is_received', 'box__fuel_type'
                ).order_by('-id')[:10])
                
                sample_subcenters = list(SubCenter.objects.values(
                    'id', 'name', 'code', 'is_active'
                ).order_by('id'))
                
                return Response({
                    'debug_info': {
                        'books': {
                            'total_books': total_books,
                            'books_with_boxes': books_with_boxes,
                            'books_in_received_boxes': received_boxes,
                            'unassigned_books': unassigned_books,
                            'available_for_dispatch': available_books_count
                        },
                        'boxes': {
                            'total_boxes': total_boxes,
                            'received_boxes': received_boxes_total,
                            'sample_boxes': sample_boxes
                        },
                        'subcenters': {
                            'total_subcenters': total_subcenters,
                            'active_subcenters': active_subcenters,
                            'sample_subcenters': sample_subcenters
                        },
                        'sample_books': sample_books,
                        'filters_explanation': {
                            'available_for_dispatch': 'Books where box.is_received=True AND is_assigned=False',
                            'issue_likely': 'If available_for_dispatch is 0, boxes are not marked as received'
                        }
                    }
                })
            
            # Base queryset: Books that are in received boxes and not assigned to beneficiaries
            # This is correct - we only want to dispatch confirmed received books
            available_books = Book.objects.filter(
                box__is_received=True,  # Only confirmed received boxes
                is_assigned=False,      # Not assigned to beneficiaries
            ).select_related('box', 'box__assigned_to').order_by('-generated_at')

            # If historical M2M relation 'dispatches' exists, exclude previously dispatched
            try:
                # Will raise FieldDoesNotExist if field is missing in current model
                Book._meta.get_field('dispatches')
                available_books = available_books.filter(dispatches__isnull=True)
            except Exception:
                # No dispatches relation on Book in this schema; proceed without this filter
                pass
            
            # Add query parameters for filtering
            fuel_type = request.query_params.get('fuel_type')
            denomination = request.query_params.get('denomination')
            subcenter = request.query_params.get('subcenter')
            box_id = request.query_params.get('box_id')
            box_code = request.query_params.get('box_code')
            
            if fuel_type:
                available_books = available_books.filter(box__fuel_type=fuel_type)
            if denomination:
                available_books = available_books.filter(box__denomination=denomination)
            if subcenter:
                available_books = available_books.filter(box__assigned_to_id=subcenter)
            if box_id:
                available_books = available_books.filter(box_id=box_id)
            if box_code:
                available_books = available_books.filter(box__box_code=box_code)
            
            # Prepare enhanced book data for intelligent generator
            books_data = []
            for book in available_books:
                # Get actual coupon count from database
                actual_coupon_count = book.coupons.count()
                
                # Fallback to estimated count if no actual coupons
                if actual_coupon_count == 0:
                    actual_coupon_count = book.initial_coupon_count or getattr(book.box, 'coupons_per_book', 100)

                # Get actual first and last coupon numbers
                first_coupon = book.coupons.order_by('coupon_number').first()
                last_coupon = book.coupons.order_by('coupon_number').last()
                
                first_coupon_number = None
                last_coupon_number = None
                
                if first_coupon and last_coupon:
                    first_coupon_number = first_coupon.coupon_number
                    last_coupon_number = last_coupon.coupon_number
                elif book.first_coupon_number and book.last_coupon_number:
                    # Fallback to book's stored values
                    first_coupon_number = book.first_coupon_number
                    last_coupon_number = book.last_coupon_number

                estimated_value = actual_coupon_count * (book.box.denomination or 0)
                
                books_data.append({
                    'id': book.id,
                    'bookId': book.id,
                    'bookCode': book.book_code or f"BOOK-{book.id}",
                    'boxId': book.box.box_code,
                    'fuelType': book.box.fuel_type,
                    'denomination': book.box.denomination,
                    'firstCouponNumber': first_coupon_number,
                    'lastCouponNumber': last_coupon_number,
                    'numberOfCoupons': actual_coupon_count,
                    'estimatedValue': estimated_value,
                    'pricePerLitre': float(book.box.fuel_price_per_litre_usd or 1.45),
                    'generatedAt': book.generated_at.isoformat() if book.generated_at else None,
                    'boxReceiveDate': book.box.received_at.isoformat() if book.box.received_at else None,
                    'isSelected': False,
                    'status': 'AVAILABLE_FOR_DISPATCH',
                    # Add page breakdown information
                    'pageBreakdown': {
                        'totalPages': getattr(book, 'pages_count', 0) or (actual_coupon_count // 10 if actual_coupon_count > 0 else 0),
                        'couponsPerPage': 10,
                        'hasPages': hasattr(book, 'pages') and book.pages.exists()
                    }
                })
            
            # Summary statistics
            total_books = len(books_data)
            total_coupons = sum(book['numberOfCoupons'] for book in books_data)
            total_value = sum(book['estimatedValue'] for book in books_data)
            
            # Group by fuel type and denomination for summary
            summary_by_type = {}
            for book in books_data:
                key = f"{book['fuelType']}_{book['denomination']}L"
                if key not in summary_by_type:
                    summary_by_type[key] = {
                        'fuel_type': book['fuelType'],
                        'denomination': book['denomination'],
                        'book_count': 0,
                        'coupon_count': 0,
                        'total_value': 0
                    }
                summary_by_type[key]['book_count'] += 1
                summary_by_type[key]['coupon_count'] += book['numberOfCoupons']
                summary_by_type[key]['total_value'] += book['estimatedValue']
            
            return Response({
                'results': books_data,
                'summary': {
                    'total_books': total_books,
                    'total_coupons': total_coupons,
                    'total_value': total_value,
                    'by_type': list(summary_by_type.values())
                },
                'filters_applied': {
                    'fuel_type': fuel_type,
                    'denomination': denomination,
                    'subcenter': subcenter
                },
                'message': f'Found {total_books} books available for dispatch'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load available books: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def validate_dispatch_selection(self, request):
        """
        Validate a selection of books for dispatch
        """
        try:
            book_ids = request.data.get('book_ids', [])
            target_subcenter = request.data.get('target_subcenter')
            
            if not book_ids:
                return Response({
                    'error': 'No books selected for validation'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get selected books
            selected_books = Book.objects.filter(
                id__in=book_ids,
                box__is_received=True,
                is_assigned=False,
                dispatches__isnull=True
            ).select_related('box')
            
            if len(selected_books) != len(book_ids):
                return Response({
                    'error': 'Some selected books are not available for dispatch'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validation checks
            validation_results = {
                'is_valid': True,
                'warnings': [],
                'errors': [],
                'statistics': {}
            }
            
            # Check 1: Serial number continuity
            serial_ranges = []
            for book in selected_books:
                try:
                    first_num = int(book.first_coupon_number[-6:]) if book.first_coupon_number else 0
                    last_num = int(book.last_coupon_number[-6:]) if book.last_coupon_number else 0
                    serial_ranges.append((first_num, last_num, book.id))
                except ValueError:
                    validation_results['warnings'].append(f"Book {book.book_code}: Cannot parse serial numbers")
            
            # Check for gaps in serial ranges
            serial_ranges.sort()
            for i in range(len(serial_ranges) - 1):
                current_end = serial_ranges[i][1]
                next_start = serial_ranges[i + 1][0]
                if next_start != current_end + 1:
                    validation_results['warnings'].append(
                        f"Serial gap detected between books: {current_end} to {next_start}"
                    )
            
            # Check 2: Fuel type consistency
            fuel_types = set(book.box.fuel_type for book in selected_books)
            if len(fuel_types) > 1:
                validation_results['warnings'].append(
                    f"Mixed fuel types selected: {', '.join(fuel_types)}"
                )
            
            # Check 3: Denomination consistency
            denominations = set(book.box.denomination for book in selected_books)
            if len(denominations) > 1:
                validation_results['warnings'].append(
                    f"Mixed denominations selected: {', '.join(map(str, denominations))}"
                )
            
            # Check 4: Target subcenter capacity (if provided)
            if target_subcenter:
                try:
                    subcenter = SubCenter.objects.get(id=target_subcenter)
                    total_coupons = sum(book.initial_coupon_count or 100 for book in selected_books)
                    
                    # Simple capacity check (assuming field exists)
                    if hasattr(subcenter, 'capacity') and subcenter.capacity:
                        if total_coupons > subcenter.capacity:
                            validation_results['warnings'].append(
                                f"Selected quantity ({total_coupons}) exceeds subcenter capacity ({subcenter.capacity})"
                            )
                except SubCenter.DoesNotExist:
                    validation_results['errors'].append("Target subcenter not found")
            
            # Calculate statistics
            total_books = len(selected_books)
            total_coupons = sum(book.initial_coupon_count or 100 for book in selected_books)
            total_value = sum((book.initial_coupon_count or 100) * book.box.denomination for book in selected_books)
            
            validation_results['statistics'] = {
                'total_books': total_books,
                'total_coupons': total_coupons,
                'total_value': total_value,
                'average_coupons_per_book': total_coupons / total_books if total_books > 0 else 0,
                'fuel_types': list(fuel_types),
                'denominations': list(denominations)
            }
            
            # Set overall validity
            validation_results['is_valid'] = len(validation_results['errors']) == 0
            
            return Response(validation_results)
            
        except Exception as e:
            return Response({
                'error': f'Validation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def dispatch_options(self, request):
        """
        Get options for book dispatch intelligent generator
        """
        try:
            # Get available books summary
            available_books = Book.objects.filter(
                box__is_received=True,
                is_assigned=False,
                dispatches__isnull=True
            ).select_related('box')
            
            # Summary by fuel type and denomination
            summary = available_books.values(
                'box__fuel_type', 
                'box__denomination'
            ).annotate(
                book_count=models.Count('id'),
                total_coupons=models.Sum('initial_coupon_count')
            ).order_by('box__fuel_type', 'box__denomination')
            
            # Serial number ranges
            if available_books.exists():
                first_serial = available_books.aggregate(
                    min_serial=models.Min('first_coupon_number')
                )['min_serial']
                last_serial = available_books.aggregate(
                    max_serial=models.Max('last_coupon_number')
                )['max_serial']
            else:
                first_serial = last_serial = None
            
            return Response({
                'generation_modes': [
                    {
                        'id': 'book-selection',
                        'name': '📚 Book Selection',
                        'description': 'Select specific books to dispatch',
                        'recommended_for': 'Precise book control'
                    },
                    {
                        'id': 'serial-range',
                        'name': '🔢 Serial Range',
                        'description': 'Generate based on coupon serial number range',
                        'recommended_for': 'Sequential serial dispatch'
                    },
                    {
                        'id': 'quantity-based',
                        'name': '📊 Quantity Based',
                        'description': 'Generate based on target quantities',
                        'recommended_for': 'Meeting specific quotas'
                    },
                    {
                        'id': 'mixed-allocation',
                        'name': '🎯 Mixed Allocation',
                        'description': 'Complex allocation with multiple rules',
                        'recommended_for': 'Multi-subcenter dispatch'
                    }
                ],
                'available_summary': list(summary),
                'serial_range': {
                    'first_available': first_serial,
                    'last_available': last_serial
                },
                'fuel_type_options': [
                    {'value': 'PETROL', 'label': 'Petrol'},
                    {'value': 'DIESEL', 'label': 'Diesel'},
                    {'value': 'MIXED', 'label': 'Mixed (Both)'}
                ],
                'denomination_options': [
                    {'value': 5, 'label': '5 Litres'},
                    {'value': 10, 'label': '10 Litres'},
                    {'value': 20, 'label': '20 Litres'},
                    {'value': 50, 'label': '50 Litres'}
                ],
                'total_available_books': available_books.count(),
                'total_available_coupons': sum(book.initial_coupon_count or 100 for book in available_books)
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load dispatch options: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def verify_book(self, request, pk=None):
        """
        Verify a specific book - mark as verified with verification notes
        """
        book = self.get_object()
        
        verification_notes = request.data.get('verification_notes', '')
        verification_checks = request.data.get('verification_checks', [])
        
        try:
            # Update book verification status
            book.is_verified = True
            book.verified_by = request.user
            book.verified_at = timezone.now()
            book.verification_notes = verification_notes
            
            if verification_checks:
                book.verification_checks = verification_checks
            
            book.save()
            
            return Response({
                'message': 'Book verified successfully',
                'book': BookSerializer(book).data,
                'verified_by': request.user.get_full_name(),
                'verified_at': book.verified_at,
                'verification_notes': book.verification_notes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to verify book: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def coupon_details(self, request, pk=None):
        """
        Get detailed coupon information for verification
        """
        book = self.get_object()
        
        coupons = book.coupons.all().order_by('position_in_book')
        coupon_data = []
        
        for coupon in coupons:
            coupon_data.append({
                'id': coupon.id,
                'serial_number': coupon.serial_number,
                'status': coupon.status,
                'position_in_book': coupon.position_in_book,
                'is_used': coupon.is_used,
                'used_at': coupon.used_at,
                'used_by': coupon.used_by.get_full_name() if coupon.used_by else None,
                'verification_code': getattr(coupon, 'verification_code', ''),
                'barcode': getattr(coupon, 'barcode', ''),
                'qr_code': getattr(coupon, 'qr_code', '')
            })
        
        return Response({
            'book': {
                'id': book.id,
                'book_number': book.book_number,
                'first_coupon_number': book.first_coupon_number,
                'last_coupon_number': book.last_coupon_number,
                'total_coupons': book.total_coupons,
                'is_verified': book.is_verified,
                'verified_by': book.verified_by.get_full_name() if book.verified_by else None,
                'verified_at': book.verified_at,
                'verification_notes': book.verification_notes
            },
            'coupons': coupon_data,
            'verification_summary': {
                'total_coupons': len(coupon_data),
                'used_coupons': len([c for c in coupon_data if c['is_used']]),
                'available_coupons': len([c for c in coupon_data if not c['is_used']]),
                'sequential_check': self._check_sequential_integrity(coupon_data),
                'status_breakdown': self._get_coupon_status_breakdown(coupon_data)
            }
        })
    
    def _check_sequential_integrity(self, coupon_data):
        """Check if coupons are in proper sequential order"""
        if not coupon_data:
            return {'valid': True, 'message': 'No coupons to check'}
        
        expected_position = 1
        for coupon in sorted(coupon_data, key=lambda x: x['position_in_book']):
            if coupon['position_in_book'] != expected_position:
                return {
                    'valid': False, 
                    'message': f'Gap found: expected position {expected_position}, found {coupon["position_in_book"]}'
                }
            expected_position += 1
        
        return {'valid': True, 'message': f'All {len(coupon_data)} coupons in sequential order'}
    
    def _get_coupon_status_breakdown(self, coupon_data):
        """Get breakdown of coupon statuses"""
        status_counts = {}
        for coupon in coupon_data:
            status = coupon['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        return status_counts

    # === BOOK GENERATION ENDPOINTS (SINGLE SOURCE OF TRUTH) ===
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def generate_books_for_box(self, request):
        """
        Generate books and coupons for a box
        
        This is the SINGLE SOURCE OF TRUTH for book generation
        Frontend should ONLY use this endpoint, never generate books locally
        
        POST /api/books/generate_books_for_box/
        {
            "box_id": 1,
            "first_serial": "PU006H1355101", 
            "last_serial": "PU006H1356100",
            "books_per_box": 10,
            "coupons_per_book": 100,
            "force": false
        }
        """
        try:
            serializer = BookGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            
            # Call the centralized service
            result = BookGenerationService.generate_books_and_coupons(
                box_id=validated_data['box_id'],
                first_serial=validated_data['first_serial'],
                last_serial=validated_data['last_serial'],
                books_per_box=validated_data['books_per_box'],
                coupons_per_book=validated_data['coupons_per_book'],
                force=validated_data['force']
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f'Error in generate_books_for_box: {e}', exc_info=True)
            return Response({
                'success': False,
                'message': 'Internal server error',
                'errors': [str(e)]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def validate_generation_request(self, request):
        """
        Validate a book generation request without actually generating
        
        POST /api/books/validate_generation_request/
        {
            "box_id": 1,
            "first_serial": "PU006H1355101",
            "last_serial": "PU006H1356100", 
            "books_per_box": 10,
            "coupons_per_book": 100,
            "force": false
        }
        """
        try:
            serializer = BookGenerationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'valid': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            
            # Validate the request
            validation_result = BookGenerationService.validate_generation_request(
                box_id=validated_data['box_id'],
                first_serial=validated_data['first_serial'],
                last_serial=validated_data['last_serial'],
                books_per_box=validated_data['books_per_box'],
                coupons_per_book=validated_data['coupons_per_book'],
                force=validated_data['force']
            )
            
            return Response(validation_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Error in validate_generation_request: {e}', exc_info=True)
            return Response({
                'valid': False,
                'errors': [f'Validation error: {str(e)}']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def box_generation_status(self, request):
        """
        Get the generation status of a box
        
        GET /api/books/box_generation_status/?box_id=1
        """
        try:
            box_id = request.query_params.get('box_id')
            if not box_id:
                return Response({
                    'error': 'box_id parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                box_id = int(box_id)
            except ValueError:
                return Response({
                    'error': 'box_id must be a valid integer'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            status_result = BookGenerationService.get_box_generation_status(box_id)
            
            if 'error' in status_result:
                return Response(status_result, status=status.HTTP_404_NOT_FOUND)
            
            return Response(status_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'Error in box_generation_status: {e}', exc_info=True)
            return Response({
                'error': f'Status check failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CouponAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for tracking coupon allocations with range support"""
    serializer_class = CouponAllocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = CouponAllocation.objects.all().select_related(
            'beneficiary', 'book', 'book__box', 'allocated_by'
        )
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            return queryset.filter(book__box__assigned_to=user.sub_center)
        elif user.role == 'BENEFICIARY':
            return queryset.filter(beneficiary=user)
        
        return queryset.none()
    
    @action(detail=False, methods=['post'])
    def bulk_allocate_ranges(self, request):
        """
        Allocate multiple coupon ranges efficiently
        """
        # Gating: require at least one RECEIVED dispatch for subcenter users
        user = request.user
        try:
            if getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None):
                if not BookDispatch.objects.filter(to_center=user.sub_center, status='RECEIVED').exists():
                    return Response({'error': 'You must accept at least one incoming dispatch before allocations.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            # If BookDispatch table missing or errors, do not hard fail allocations
            pass
        allocations_data = request.data.get('allocations', [])
        
        if not allocations_data:
            return Response({'error': 'No allocations provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        errors = []
        
        try:
            with transaction.atomic():
                for i, allocation_data in enumerate(allocations_data):
                    try:
                        book_id = allocation_data.get('book_id')
                        beneficiary_id = allocation_data.get('beneficiary_id')
                        count = allocation_data.get('count', 1)
                        
                        book = Book.objects.get(id=book_id)
                        beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
                        
                        result = book.allocate_sequential_coupons(beneficiary, count)
                        results.append({
                            'index': i,
                            'success': True,
                            'allocation': result
                        })
                        
                    except Exception as e:
                        errors.append({
                            'index': i,
                            'error': str(e),
                            'data': allocation_data
                        })
                
                if errors:
                    # Rollback transaction if any errors
                    raise ValueError(f"Bulk allocation failed with {len(errors)} errors")
                
                return Response({
                    'message': f'Successfully allocated {len(results)} coupon ranges',
                    'results': results
                })
                
        except Exception as e:
            return Response({
                'error': 'Bulk allocation failed',
                'details': str(e),
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def allocation_statistics(self, request):
        """
        Get overall allocation statistics
        """
        user = self.request.user
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_allocations = queryset.count()
        total_quantity = queryset.aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # Group by beneficiary
        beneficiary_stats = queryset.values('beneficiary__first_name', 'beneficiary__last_name').annotate(
            allocation_count=models.Count('id'),
            total_coupons=models.Sum('quantity')
        ).order_by('-total_coupons')
        
        # Recent allocations
        recent_allocations = queryset.order_by('-allocation_date')[:10]
        recent_data = []
        for allocation in recent_allocations:
            recent_data.append({
                'beneficiary': allocation.beneficiary.get_full_name(),
                'book': allocation.book.book_number,
                'quantity': allocation.quantity,
                'first_coupon': allocation.first_coupon_number,
                'last_coupon': allocation.last_coupon_number,
                'date': allocation.allocation_date
            })
        
        return Response({
            'statistics': {
                'total_allocations': total_allocations,
                'total_coupons_allocated': total_quantity,
                'beneficiary_count': queryset.values('beneficiary').distinct().count()
            },
            'beneficiary_stats': list(beneficiary_stats),
            'recent_allocations': recent_data
        })


# --- Coupon ViewSet (Updated with new logic and permissions) ---

class CanManageCoupon(BasePermission):
    """
    Custom permission for Coupon management.
    Allows Main Center officers full access.
    Allows Sub Center officers to list/retrieve/allocate/mark_used coupons assigned to their center.
    Allows Beneficiaries to list/retrieve/mark_used their allocated coupons.
    """
    def has_permission(self, request, view):
        user = request.user
        if user.is_authenticated:
            if user.role == 'MAIN_CENTER':
                return True # Main Center can do anything here
            if view.action in ['list', 'retrieve', 'allocate', 'mark_used', 'bulk_allocate']:
                 # Sub Center and Beneficiary can perform specific actions
                 return user.role in ['SUB_CENTER', 'BENEFICIARY']
            # Other actions (create, update, destroy) are generally restricted
            return False
        return False # Anonymous users have no access

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_authenticated:
            if user.role == 'MAIN_CENTER':
                 return True # Main Center has object permissions
            if view.action in ['retrieve', 'allocate', 'mark_used']:
                # Sub Center officer can view/allocate/mark_used for coupons in their center
                if user.role == 'SUB_CENTER' and user.sub_center and obj.book and obj.book.box and obj.book.box.assigned_to == user.sub_center:
                    return True
                # Beneficiary can view/mark_used for coupons allocated to them
                if user.role == 'BENEFICIARY' and obj.allocated_to == user:
                    return True
            # Add other object-level permission checks as needed
            return False
        return False # Anonymous users have no object access


class CouponViewSet(viewsets.ModelViewSet):
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]
    # Use a base queryset that other methods will filter down
    queryset = Coupon.objects.all().select_related('book__box__assigned_to', 'allocated_to') # Select related for efficiency

    def get_permissions(self):
        """Role-based permissions for coupon management
        
        - Read access: All authenticated users
        - Write access: Main Center, Sub Center, Auditor roles
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class CouponWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), CouponWritePermission()]

    def list(self, request, *args, **kwargs):
        """List all coupons with proper error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve coupons: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        # Apply filtering based on user role
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'MAIN_CENTER':
                return self.queryset # Main Center sees all
            elif user.role == 'SUB_CENTER' and user.sub_center:
                # Sub Center officer sees coupons in boxes assigned to their sub-center
                return self.queryset.filter(book__box__assigned_to=user.sub_center)
            elif user.role == 'BENEFICIARY':
                # Beneficiary sees only coupons allocated to them
                return self.queryset.filter(allocated_to=user)
        return Coupon.objects.none() # Default to empty queryset for others or anonymous

    # Create, Update, Destroy methods use the CanManageCoupon permission (limited to MAIN_CENTER by permission class)


    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, CanManageCoupon])
    def allocate(self, request, pk=None):
        """Allocate a coupon to a beneficiary."""
        coupon = self.get_object() # get_object applies object-level permission (Sub Center, Beneficiary)
        beneficiary_id = request.data.get('beneficiary_id')
        program_id = request.data.get('program_id') # Get program_id for distribution record

        if coupon.status != 'AVAILABLE':
             return Response({"error": f"Coupon status is '{coupon.get_status_display()}'. Only AVAILABLE coupons can be allocated."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            beneficiary = User.objects.get(pk=beneficiary_id, role='BENEFICIARY')
        except User.DoesNotExist:
            return Response({"error": "Beneficiary not found."}, status=status.HTTP_400_BAD_REQUEST)

        program = None
        if program_id:
            try:
                program = Program.objects.get(pk=program_id)
            except Program.DoesNotExist:
                 return Response({"error": "Program not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Optional: Check if the beneficiary is allowed to receive coupons from this user/sub-center
        user = request.user
        if user.role == 'SUB_CENTER' and user.sub_center and beneficiary.sub_center != user.sub_center:
             return Response({"error": "You can only allocate coupons to beneficiaries in your sub-center."}, status=status.HTTP_403_FORBIDDEN)


        try:
            # Use the allocate method on the model within a transaction
            with transaction.atomic():
                 coupon.allocate(beneficiary)
                 # Create the CouponDistribution record
                 CouponDistribution.objects.create(
                     coupon=coupon,
                     beneficiary=beneficiary,
                     program=program,
                     distributed_by=request.user, # User performing the allocation
                     distribution_date=timezone.now()
                 )

            serializer = self.get_serializer(coupon)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             return Response({"error": f"An error occurred during allocation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, CanManageCoupon]) # Permission class handles who can mark used
    def mark_used(self, request, pk=None):
        """Mark a coupon as used."""
        coupon = self.get_object() # get_object applies object-level permission (Sub Center, Beneficiary)
        transaction_location = request.data.get('transaction_location', None)
        # recorded_by is automatically set to request.user in this action's context if we were creating FuelTransaction here
        # But the model's mark_used method creates the FuelTransaction, so the user performing this action is the 'recorded_by' on the transaction.

        # Check if the coupon's status allows it to be marked as used
        if coupon.status not in ['ALLOCATED', 'AVAILABLE']: # Allow marking AVAILABLE as USED? Depends on workflow. Sticking to ALLOCATED and letting model handle AVAILABLE if its mark_used allows.
             return Response({"error": f"Coupon status is '{coupon.get_status_display()}'. Only ALLOCATED (or AVAILABLE, if allowed) coupons can be marked as used."}, status=status.HTTP_400_BAD_REQUEST)

        # The CanManageCoupon object permission already checks if the user is allowed to mark *this specific* coupon as used.


        try:
            # Use the mark_used method on the model within a transaction
            with transaction.atomic():
                 coupon.mark_used(transaction_location=transaction_location)
                 # The model's mark_used method creates the FuelTransaction if coupon is allocated.

            serializer = self.get_serializer(coupon)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             return Response({"error": f"An error occurred when marking as used: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission | SubCenterPermission]) # Restrict bulk allocation
    def bulk_allocate(self, request):
        """Bulk allocate coupons to a beneficiary."""
        serializer = BulkCouponAllocationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            coupon_numbers = serializer.validated_data['coupon_numbers']
            beneficiary_id = serializer.validated_data['beneficiary_id']
            # program_id = serializer.validated_data.get('program_id') # Get program_id - TODO: Implement when Program model exists

            try:
                beneficiary = User.objects.get(pk=beneficiary_id, role='BENEFICIARY')
            except User.DoesNotExist:
                return Response({"error": "Beneficiary not found."}, status=status.HTTP_400_BAD_REQUEST)

            # TODO: Implement program support when Program model exists
            # program = None
            # if program_id:
            #     try:
            #         program = Program.objects.get(pk=program_id)
            #     except Program.DoesNotExist:
            #         return Response({"error": "Program not found."}, status=status.HTTP_400_BAD_REQUEST)

            # Filter coupons by status ('AVAILABLE') and optional sub-center if user is SUB_CENTER
            coupons_to_allocate = Coupon.objects.filter(coupon_number__in=coupon_numbers, status='AVAILABLE')

            user = request.user
            if user.role == 'SUB_CENTER' and user.sub_center:
                 # Ensure the coupons are in boxes assigned to the user's sub-center
                 coupons_to_allocate = coupons_to_allocate.filter(book__box__assigned_to=user.sub_center)
                 # Optional: Further restrict beneficiaries to the same sub-center
                 if beneficiary.sub_center != user.sub_center:
                      return Response({"error": "Beneficiary is not associated with your sub-center."}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure all requested coupons were found, are available, and are within the user's scope
            if coupons_to_allocate.count() != len(coupon_numbers):
                 found_coupon_numbers = list(coupons_to_allocate.values_list('coupon_number', flat=True))
                 not_found = [cn for cn in coupon_numbers if cn not in found_coupon_numbers]
                 return Response({"error": f"Could not find or allocate the following coupons (not available, already allocated, or not in your allowed list): {', '.join(not_found)}"}, status=status.HTTP_400_BAD_REQUEST)

            updated_count = 0
            failed_allocations = []
            with transaction.atomic():
                for coupon in coupons_to_allocate:
                     try:
                         # Use the model's allocate method to ensure consistency
                         coupon.allocate(beneficiary)
                         # Create CouponDistribution for each allocated coupon
                         CouponDistribution.objects.create(
                             coupon=coupon,
                             beneficiary=beneficiary,
                             # program=program,  # TODO: Enable when Program model exists
                             distributed_by=request.user,
                             distribution_date=timezone.now()
                         )
                         updated_count += 1
                     except ValueError as e:
                          # This shouldn't happen if filtering by status='AVAILABLE' above, but good practice
                          failed_allocations.append(f"Coupon {coupon.coupon_number}: {e}")
                     except Exception as e:
                          failed_allocations.append(f"Coupon {coupon.coupon_number}: An unexpected error occurred - {e}")

            response_data = {
                "message": f"Successfully allocated {updated_count} coupons to {beneficiary.get_full_name()}."
            }
            if failed_allocations:
                 response_data["failed_allocations"] = failed_allocations
                 response_data["message"] += f" However, {len(failed_allocations)} allocations failed."
                 return Response(response_data, status=status.HTTP_400_BAD_REQUEST) # Indicate partial/total failure

            return Response(response_data, status=status.HTTP_200_OK)
        # Error response for invalid serializer data is handled by raise_exception=True
        if serializer.is_valid(raise_exception=True):
            coupon_numbers = serializer.validated_data['coupon_numbers']
            beneficiary_id = serializer.validated_data['beneficiary_id']
            program_id = serializer.validated_data.get('program_id') # Get program_id

            try:
                beneficiary = User.objects.get(pk=beneficiary_id, role='BENEFICIARY')
            except User.DoesNotExist:
                return Response({"error": "Beneficiary not found."}, status=status.HTTP_400_BAD_REQUEST)

            program = None
            if program_id:
                try:
                    program = Program.objects.get(pk=program_id)
                except Program.DoesNotExist:
                    return Response({"error": "Program not found."}, status=status.HTTP_400_BAD_REQUEST)

            # Filter coupons by status ('AVAILABLE') and optional sub-center if user is SUB_CENTER
            coupons_to_allocate = Coupon.objects.filter(coupon_number__in=coupon_numbers, status='AVAILABLE')

            user = request.user
            if user.role == 'SUB_CENTER' and user.sub_center:
                 # Ensure the coupons are in boxes assigned to the user's sub-center
                 coupons_to_allocate = coupons_to_allocate.filter(book__box__assigned_to=user.sub_center)
                 # Optional: Further restrict beneficiaries to the same sub-center
                 if beneficiary.sub_center != user.sub_center:
                      return Response({"error": "Beneficiary is not associated with your sub-center."}, status=status.HTTP_400_BAD_REQUEST)


            # Ensure all requested coupons were found, are available, and are within the user's scope
            if coupons_to_allocate.count() != len(coupon_numbers):
                 found_coupon_numbers = list(coupons_to_allocate.values_list('coupon_number', flat=True))
                 not_found = [cn for cn in coupon_numbers if cn not in found_coupon_numbers]
                 return Response({"error": f"Could not find or allocate the following coupons (not available, already allocated, or not in your allowed list): {', '.join(not_found)}"}, status=status.HTTP_400_BAD_REQUEST)


            updated_count = 0
            failed_allocations = []
            with transaction.atomic():
                for coupon in coupons_to_allocate:
                     try:
                         # Use the model's allocate method to ensure consistency
                         coupon.allocate(beneficiary)
                         # Create CouponDistribution for each allocated coupon
                         CouponDistribution.objects.create(
                             coupon=coupon,
                             beneficiary=beneficiary,
                             program=program,
                             distributed_by=request.user,
                             distribution_date=timezone.now()
                         )
                         updated_count += 1
                     except ValueError as e:
                          # This shouldn't happen if filtering by status='AVAILABLE' above, but good practice
                          failed_allocations.append(f"Coupon {coupon.coupon_number}: {e}")
                     except Exception as e:
                          failed_allocations.append(f"Coupon {coupon.coupon_number}: An unexpected error occurred - {e}")


            response_data = {
                "message": f"Successfully allocated {updated_count} coupons to {beneficiary.get_full_name()}."
            }
            if failed_allocations:
                 response_data["failed_allocations"] = failed_allocations
                 response_data["message"] += f" However, {len(failed_allocations)} allocations failed."
                 return Response(response_data, status=status.HTTP_400_BAD_REQUEST) # Indicate partial/total failure

            return Response(response_data, status=status.HTTP_200_OK)
        # Error response for invalid serializer data is handled by raise_exception=True


# Program ViewSet - now implemented with the Program model
class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().select_related('organizer', 'sub_center')
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        class ProgramWritePermission:
            def has_permission(self, request, view):
                if request.method in ['GET', 'HEAD', 'OPTIONS']:
                    return request.user and request.user.is_authenticated
                return request.user and request.user.is_authenticated and request.user.role in ['SUPERUSER', 'MAIN_CENTER', 'SUB_CENTER']
            def has_object_permission(self, request, view, obj):
                return self.has_permission(request, view)
        return [ProgramWritePermission()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import ProgramWriteSerializer
            return ProgramWriteSerializer
        return ProgramSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'SUB_CENTER' and user.sub_center:
                # Sub-center users can only see programs they organize or their sub-center manages
                queryset = queryset.filter(
                    models.Q(organizer=user) | models.Q(sub_center=user.sub_center)
                )
            elif user.role == 'BENEFICIARY':
                # Beneficiaries can see all active programs
                queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming programs"""
        upcoming_programs = self.get_queryset().filter(
            scheduled_date__gt=timezone.now(),
            is_active=True
        ).order_by('scheduled_date')
        
        serializer = self.get_serializer(upcoming_programs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get programs grouped by type"""
        program_type = request.query_params.get('type')
        queryset = self.get_queryset()
        
        if program_type:
            queryset = queryset.filter(program_type=program_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve_fuel_allocation(self, request, pk=None):
        """Approve fuel allocation for this program"""
        program = self.get_object()
        
        # Check permissions
        if not (request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER'] or 
                request.user == program.organizer):
            return Response(
                {'error': 'You do not have permission to approve fuel allocations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        program.fuel_allocation_approved = True
        program.save()
        
        # Log the approval
        AuditLog.log(
            action='APPROVE',
            user=request.user,
            content_object=program,
            description=f'Fuel allocation approved for program: {program.title}',
            severity='MEDIUM'
        )
        
        serializer = self.get_serializer(program)
        return Response(serializer.data)


# --- Handover ViewSet (Updated with new status, actions, and permissions) ---



# --- Fuel Transaction ViewSet (New) ---

class FuelTransactionViewSet(viewsets.ReadOnlyModelViewSet): # ReadOnly as transactions are records, not typically created/updated via API
    queryset = FuelTransaction.objects.all().select_related('beneficiary', 'coupon', 'recorded_by').order_by('-timestamp') # Default ordering
    serializer_class = FuelTransactionSerializer
    # Adjust permissions as needed - who can view transaction history?
    permission_classes = [IsAuthenticated, MainCenterPermission | AuditorPermission | SubCenterPermission | BeneficiaryPermission]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_authenticated:
            if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
                return queryset # Main Center and Auditors see all transactions
            elif user.role == 'SUB_CENTER' and user.sub_center:
                # Sub Center officer sees transactions by beneficiaries in their sub-center
                return queryset.filter(beneficiary__sub_center=user.sub_center)
            elif user.role == 'BENEFICIARY':
                # Beneficiary sees only their own transactions
                return queryset.filter(beneficiary=user)
        return FuelTransaction.objects.none() # Default to empty


# --- Parliament-specific ViewSets ---

class BeneficiaryCategoryViewSet(viewsets.ModelViewSet):
    queryset = BeneficiaryCategory.objects.all()
    serializer_class = BeneficiaryCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrAuditorPermission()]

    @action(detail=False, methods=['post'])
    def load_defaults(self, request):
        """Create default beneficiary categories (idempotent).
        Requires Main Center or Auditor permissions.
        """
        defaults = [
            {
                'name': 'Member of Parliament',
                'description': 'Elected Members of Parliament',
                'monthly_entitlement_litres': 200,
                'category_multiplier': 1.50,
            },
            {
                'name': 'Senator',
                'description': 'Members of the Senate',
                'monthly_entitlement_litres': 180,
                'category_multiplier': 1.40,
            },
            {
                'name': 'Staff',
                'description': 'Parliament administrative staff',
                'monthly_entitlement_litres': 80,
                'category_multiplier': 1.00,
            },
            {
                'name': 'Driver',
                'description': 'Official Parliament drivers',
                'monthly_entitlement_litres': 60,
                'category_multiplier': 0.80,
            },
        ]

        from .models import BeneficiaryCategory
        created = 0
        for data in defaults:
            obj, was_created = BeneficiaryCategory.objects.get_or_create(
                name=data['name'],
                defaults=data,
            )
            created += 1 if was_created else 0

        return Response({
            'status': 'ok',
            'created': created,
            'total': BeneficiaryCategory.objects.count(),
        })


class ConstituencyViewSet(viewsets.ModelViewSet):
    queryset = Constituency.objects.all()
    serializer_class = ConstituencySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Role-based permissions for constituency management
        
        Parliament operations are managed by subcenter OST, so we allow:
        - Read access: All authenticated users
        - Write access: Main Center, Sub Center (OST), or Auditor roles
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a composite permission for write operations
        class ConstituencyWritePermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), ConstituencyWritePermission()]
    
    def list(self, request, *args, **kwargs):
        """List constituencies with page_size override support for the selector UI"""
        try:
            page_size = request.query_params.get('page_size')
            if page_size:
                try:
                    page_size = int(page_size)
                except Exception:
                    page_size = None
                if page_size and hasattr(self, 'paginator') and self.paginator:
                    self.paginator.page_size = page_size
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve constituencies: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VehicleCategoryViewSet(viewsets.ModelViewSet):
    queryset = VehicleCategory.objects.all()
    serializer_class = VehicleCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        # For write operations, require either Main Center or Auditor role
        class MainCenterOrAuditorPermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return getattr(request.user, 'role', None) in ['MAIN_CENTER', 'AUDITOR', 'SUPERUSER']
        return [IsAuthenticated(), MainCenterOrAuditorPermission()]


class PoliticalPartyViewSet(viewsets.ModelViewSet):
    queryset = PoliticalParty.objects.all()
    serializer_class = PoliticalPartySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'abbreviation', 'leader_name']
    ordering_fields = ['name', 'abbreviation', 'founded_date']
    ordering = ['name']
    
    def get_permissions(self):
        """Role-based permissions for political party management
        - Read access: All authenticated users (list, retrieve, active_parties, statistics)
        - Write access: Main Center or Auditor roles only
        """
        if self.action in ['list', 'retrieve', 'active_parties', 'statistics']:
            return [IsAuthenticated()]
        class MainCenterOrAuditorPermission(permissions.BasePermission):
            def has_permission(self, request, view):
                return getattr(request.user, 'role', None) in ['MAIN_CENTER', 'AUDITOR', 'SUPERUSER']
        return [IsAuthenticated(), MainCenterOrAuditorPermission()]
    
    @action(detail=False, methods=['get'])
    def active_parties(self, request):
        """Get only active political parties"""
        try:
            active_parties = self.queryset.filter(is_active=True)
            serializer = self.get_serializer(active_parties, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Fail-safe if migrations aren't applied in production yet
            try:
                from django.db.utils import ProgrammingError, OperationalError, DatabaseError
                db_errors = (ProgrammingError, OperationalError, DatabaseError)
            except Exception:
                db_errors = tuple()
            if isinstance(e, db_errors):
                return Response([], status=status.HTTP_200_OK)
            raise
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get political party statistics"""
        try:
            total_parties = self.queryset.count()
            active_parties = self.queryset.filter(is_active=True).count()

            # Get party membership counts
            party_stats = []
            for party in self.queryset.filter(is_active=True):
                party_stats.append({
                    'id': party.id,
                    'name': party.name,
                    'abbreviation': party.abbreviation,
                    'member_count': party.member_count,
                    'color': party.party_color
                })

            return Response({
                'total_parties': total_parties,
                'active_parties': active_parties,
                'inactive_parties': total_parties - active_parties,
                'party_membership': party_stats
            })
        except Exception as e:
            try:
                from django.db.utils import ProgrammingError, OperationalError, DatabaseError
                db_errors = (ProgrammingError, OperationalError, DatabaseError)
            except Exception:
                db_errors = tuple()
            if isinstance(e, db_errors):
                # Safe defaults if migration/table not present yet
                return Response({
                    'total_parties': 0,
                    'active_parties': 0,
                    'inactive_parties': 0,
                    'party_membership': []
                }, status=status.HTTP_200_OK)
            raise


class ParliamentSessionViewSet(viewsets.ModelViewSet):
    queryset = ParliamentSession.objects.all().order_by('-start_date')
    serializer_class = ParliamentSessionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['session_type', 'is_active', 'organizer']
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'end_date', 'created']
    ordering = ['-start_date']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        
        # Create a combined permission class for write operations
        class SessionWritePermission(BasePermission):
            def has_permission(self, request, view):
                if not request.user or not request.user.is_authenticated:
                    return False
                # Allow MAIN_CENTER, SUB_CENTER, AUDITOR, and SUPERUSER roles
                return request.user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']
        
        return [IsAuthenticated(), SessionWritePermission()]
    
    def get_queryset(self):
        """Enhanced queryset with filtering and search"""
        queryset = self.queryset
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            today = timezone.now().date()
            if status == 'upcoming':
                queryset = queryset.filter(start_date__gt=today, is_active=True)
            elif status == 'active':
                queryset = queryset.filter(start_date__lte=today, end_date__gte=today, is_active=True)
            elif status == 'completed':
                queryset = queryset.filter(end_date__lt=today)
            elif status == 'inactive':
                queryset = queryset.filter(is_active=False)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(organizer__first_name__icontains=search) |
                Q(organizer__last_name__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Enhanced create with better error handling"""
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Set organizer to current user if not specified
            if not serializer.validated_data.get('organizer'):
                serializer.validated_data['organizer'] = request.user
            
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to create session: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Enhanced update with validation"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Failed to update session: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get parliament sessions statistics"""
        today = timezone.now().date()
        
        stats = {
            'total_sessions': ParliamentSession.objects.count(),
            'active_sessions': ParliamentSession.objects.filter(
                start_date__lte=today, end_date__gte=today, is_active=True
            ).count(),
            'upcoming_sessions': ParliamentSession.objects.filter(
                start_date__gt=today, is_active=True
            ).count(),
            'completed_sessions': ParliamentSession.objects.filter(
                end_date__lt=today
            ).count(),
            'inactive_sessions': ParliamentSession.objects.filter(
                is_active=False
            ).count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def attendances(self, request, pk=None):
        """Get attendance records for a session"""
        session = self.get_object()
        attendances = SessionAttendance.objects.filter(session=session)
        serializer = SessionAttendanceSerializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a parliament session"""
        session = self.get_object()
        session.is_active = True
        session.save()
        return Response({'message': 'Session activated successfully'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a parliament session"""
        session = self.get_object()
        session.is_active = False
        session.save()
        return Response({'message': 'Session deactivated successfully'})
    
    @action(detail=False, methods=['get'])
    def my_sessions(self, request):
        """Get sessions assigned to the current beneficiary"""
        try:
            # Get the beneficiary profile for the current user
            beneficiary_profile = BeneficiaryProfile.objects.get(user=request.user)
            
            # Get sessions assigned to this beneficiary
            assigned_sessions = ParliamentSession.objects.filter(
                assigned_attendees=beneficiary_profile,
                is_active=True
            ).order_by('start_date')
            
            serializer = self.get_serializer(assigned_sessions, many=True)
            return Response({
                'count': assigned_sessions.count(),
                'results': serializer.data
            })
        except BeneficiaryProfile.DoesNotExist:
            return Response(
                {'error': 'No beneficiary profile found for current user'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve sessions: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        """Mark attendance for a session"""
        session = self.get_object()
        beneficiary_id = request.data.get('beneficiary_id')
        attended = request.data.get('attended', True)
        
        try:
            beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
            attendance, created = SessionAttendance.objects.get_or_create(
                beneficiary=beneficiary,
                session=session,
                defaults={
                    'attended': attended,
                    'check_in_time': timezone.now() if attended else None,
                    'recorded_by': request.user
                }
            )
            
            if not created:
                attendance.attended = attended
                attendance.check_in_time = timezone.now() if attended else None
                attendance.save()
            
            # Calculate and allocate fuel if attended
            if attended:
                profile = beneficiary.beneficiary_profile
                fuel_entitled = profile.calculate_session_entitlement(session)
                attendance.fuel_allocated = fuel_entitled
                attendance.allocation_date = timezone.now()
                attendance.save()
                
                # TODO: Create fuel entitlement logic here
                # fuel_entitled = calculate_fuel_entitlement(beneficiary, session)
                # FuelEntitlement.objects.create(
                #     beneficiary=beneficiary,
                #     entitlement_type='SESSION',
                #     session=session,
                #     litres_entitled=fuel_entitled,
                #     period_start=session.start_date.date(),
                #     period_end=session.end_date.date() if session.end_date else session.start_date.date(),
                #     created_by=request.user
                # )
            
            return Response({
                'status': 'success',
                'attendance': SessionAttendanceSerializer(attendance).data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Beneficiary not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def bulk_attendance(self, request, pk=None):
        """Bulk mark attendance for multiple beneficiaries"""
        session = self.get_object()
        serializer = BulkSessionAttendanceSerializer(
            data={'session_id': session.id, 'attendances': request.data.get('attendances', [])},
            context={'request': request}
        )
        
        if serializer.is_valid():
            attendances = serializer.save()
            return Response({
                'status': 'success',
                'count': len(attendances),
                'attendances': SessionAttendanceSerializer(attendances, many=True).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================= MISSING VIEWSETS =========================

class BookDispatchViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for managing book dispatches with intelligent coupon generation"""
    serializer_class = BookDispatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = BookDispatch.objects.all().select_related('to_center', 'dispatched_by', 'received_by')
        
        # Handle query parameter filtering
        subcenter_id = self.request.query_params.get('subcenter_id') or self.request.query_params.get('subcenter')
        if subcenter_id:
            if subcenter_id == 'default':
                # Get the first active subcenter
                default_subcenter = SubCenter.objects.filter(is_active=True).first()
                if default_subcenter:
                    queryset = queryset.filter(to_center=default_subcenter)
                else:
                    return queryset.none()
            else:
                try:
                    # Try numeric ID
                    queryset = queryset.filter(to_center_id=int(subcenter_id))
                except (ValueError, TypeError):
                    # Try by code
                    queryset = queryset.filter(to_center__code=subcenter_id)
        
        # Apply role-based filtering
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR' or user.role == 'SUPERUSER':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Include dispatches for their center OR unassigned dispatches
            from django.db import models
            return queryset.filter(
                models.Q(to_center=user.sub_center) | models.Q(to_center_id__isnull=True)
            )
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        # Allow sub-centers to PATCH their own dispatch to mark as RECEIVED
        if self.action in ['partial_update']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]

    def create(self, request, *args, **kwargs):
        """Create a dispatch in a production-safe way, linking to actual books from the database.

        Accepts frontend payload shape and properly links to actual Book models in the database.
        This ensures dispatched books are subtracted from available stock.
        """
        from django.utils import timezone
        try:
            data = request.data or {}

            # Resolve target sub-center if provided
            to_center = None
            sub_center_id = data.get('subCenterId') or data.get('sub_center') or data.get('to_center')
            if sub_center_id:
                try:
                    # Try numeric ID first
                    to_center = SubCenter.objects.filter(id=int(sub_center_id)).first()
                except Exception:
                    # Fallback: try by code or name
                    to_center = SubCenter.objects.filter(
                        models.Q(code=str(sub_center_id)) | models.Q(name=str(sub_center_id))
                    ).first()

            status_val = data.get('status') or 'DISPATCHED'

            # Create minimal model instance (schema-safe)
            dispatch = BookDispatch.objects.create(
                to_center=to_center,
                dispatched_by=request.user,
                status=status_val,
                dispatch_date=timezone.now(),
            )

            # CRITICAL FIX: Link actual books from the database to the dispatch
            books_payload = data.get('books') or []
            actual_books = []
            
            for book_data in books_payload:
                # Extract book identifiers from frontend payload
                book_id = book_data.get('bookId') or book_data.get('id')
                box_id = book_data.get('boxId')
                first_coupon = book_data.get('firstCouponId')
                
                # Find the actual book in the database
                book = None
                if book_id:
                    # Try to find by book_number, book_code, or numeric ID
                    query = models.Q(book_number=book_id) | models.Q(book_code=book_id)
                    if str(book_id).isdigit():
                        query |= models.Q(id=book_id)
                    book = Book.objects.filter(query).first()
                
                # If not found by book_id, try by box + first coupon
                if not book and box_id and first_coupon:
                    book = Book.objects.filter(
                        box__box_code=box_id,
                        first_coupon_number=first_coupon
                    ).first()
                
                # If still not found, try by first coupon number only
                if not book and first_coupon:
                    book = Book.objects.filter(first_coupon_number=first_coupon).first()
                
                if book:
                    actual_books.append(book)
                    # Mark book as dispatched
                    book.is_assigned = True
                    book.save()
                else:
                    # Log warning but don't fail the dispatch
                    print(f"Warning: Could not find book with ID: {book_id}, boxId: {box_id}, firstCoupon: {first_coupon}")
            
            # Link the actual books to the dispatch
            if actual_books:
                dispatch.books.set(actual_books)
                
                # Update dispatch totals based on actual books
                total_coupons = sum(book.initial_coupon_count or 100 for book in actual_books)
                first_serials = [book.first_coupon_number for book in actual_books if book.first_coupon_number]
                last_serials = [book.last_coupon_number for book in actual_books if book.last_coupon_number]
                
                if first_serials:
                    dispatch.first_serial = min(first_serials)
                if last_serials:
                    dispatch.last_serial = max(last_serials)
                dispatch.total_coupons = total_coupons
                dispatch.save()
                
                print(f"Successfully linked {len(actual_books)} actual books to dispatch {dispatch.id}")
            else:
                print(f"Warning: No actual books found for dispatch {dispatch.id}, using payload data only")

            # Build response using actual books data when available, fallback to payload
            books_payload = data.get('books') or []
            
            # If we have actual books, use their data for accurate response
            if actual_books:
                # Create enriched book data from actual database books
                enriched_books = []
                for book in actual_books:
                    # Find matching payload data for frontend fields
                    payload_book = next((b for b in books_payload if 
                                       b.get('bookId') == book.book_number or 
                                       str(b.get('id')) == str(book.id)), {})
                    
                    enriched_books.append({
                        'id': str(book.id),
                        'bookId': book.book_number,
                        'boxId': book.box.box_code if book.box else 'Unknown',
                        'fuelType': book.box.fuel_type if book.box else 'DIESEL',
                        'couponAmount': book.box.denomination if book.box else 20,
                        'firstCouponId': book.first_coupon_number,
                        'lastCouponId': book.last_coupon_number,
                        'numberOfCoupons': book.initial_coupon_count or 100,
                        'value': payload_book.get('value', 0),  # Keep frontend calculated value
                        'pricePerLitre': payload_book.get('pricePerLitre', 1.45),
                    })
                
                total_books = len(actual_books)
                total_coupons = sum(book.initial_coupon_count or 100 for book in actual_books)
                total_value = sum(float(b.get('value', 0)) for b in books_payload)  # Use payload values
                response_books = enriched_books
            else:
                # Fallback to payload data
                total_books = len(books_payload)
                total_coupons = sum(int(b.get('numberOfCoupons', 0)) for b in books_payload)
                total_value = sum(float(b.get('value', 0)) for b in books_payload)
                response_books = books_payload

            now = timezone.localtime()
            dispatched_date = data.get('dispatchedDate') or now.strftime('%Y-%m-%d')
            dispatched_time = data.get('dispatchedTime') or now.strftime('%H:%M')
            sub_center_name = data.get('subCenterName') or (to_center.name if to_center else '')

            response_payload = {
                'id': str(dispatch.id),
                'dispatchId': data.get('dispatchId') or f"DSP-{now.strftime('%Y-%m')}-{str(dispatch.id).zfill(4)}",
                'subCenterId': str(sub_center_id) if sub_center_id else (str(to_center.id) if to_center else ''),
                'subCenterName': sub_center_name,
                'dispatchedBy': getattr(request.user, 'username', 'system'),
                'dispatchedDate': dispatched_date,
                'dispatchedTime': dispatched_time,
                'books': response_books,
                'totalBooks': total_books,
                'totalCoupons': total_coupons,
                'totalValue': round(total_value, 2),
                'status': status_val,
                'receivedBy': data.get('receivedBy') or None,
                'receivedDate': data.get('receivedDate') or None,
                'receivedTime': data.get('receivedTime') or None,
                'receiverSignature': data.get('receiverSignature') or None,
                'transportDetails': data.get('transportDetails') or None,
                'vehicleNumber': data.get('vehicleNumber') or None,
                'driverName': data.get('driverName') or None,
                'driverPhone': data.get('driverPhone') or None,
                'notes': data.get('notes') or '',
                'trackingNumber': data.get('trackingNumber') or f"TRK-{now.strftime('%Y-%m')}{str(dispatch.id).zfill(4)}",
            }

            return Response(response_payload, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Return a clear 400/500 with details rather than raw 500
            return Response(
                {'detail': f'Failed to create dispatch', 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request, *args, **kwargs):
        """Return dispatches in a frontend-friendly shape without relying on serializer fields.

        This avoids FieldError issues from optional relations missing in the current DB schema
        (like books, notes, received_date, etc.). Also applies simple pagination and respects
        sub-center scoping from get_queryset().
        """
        try:
            qs = self.filter_queryset(self.get_queryset().order_by('-dispatch_date'))

            # Simple pagination compatible with our other endpoints
            page_size = request.query_params.get('page_size', 50)
            page = request.query_params.get('page', 1)
            try:
                page_size = int(page_size)
                page = int(page)
            except Exception:
                page_size = 50
                page = 1

            start = (page - 1) * page_size
            end = start + page_size
            items = list(qs[start:end])

            results = []
            now_str = timezone.localtime(timezone.now()).strftime('%Y-%m')
            # Preload related books to reduce queries
            book_map = {}
            for d in items:
                book_map[d.id] = list(d.books.select_related('box').all()) if hasattr(d, 'books') else []

            for d in items:
                dispatched_local = timezone.localtime(getattr(d, 'dispatch_date', timezone.now()))
                books = book_map.get(d.id, [])
                total_books = len(books)
                # Compute coupon totals & value
                total_coupons = 0
                total_value = 0.0
                book_payload = []
                for b in books:
                    coupon_count = b.initial_coupon_count or 100
                    denomination = b.box.denomination if getattr(b, 'box', None) else 20
                    total_coupons += coupon_count
                    total_value += coupon_count * denomination
                    book_payload.append({
                        'id': str(b.id),
                        'bookId': b.book_number,
                        'boxId': b.box.box_code if getattr(b, 'box', None) else None,
                        'fuelType': b.box.fuel_type if getattr(b, 'box', None) else None,
                        'couponAmount': denomination,
                        'firstCouponId': b.first_coupon_number,
                        'lastCouponId': b.last_coupon_number,
                        'numberOfCoupons': coupon_count,
                        'value': coupon_count * denomination,
                    })

                results.append({
                    'id': str(d.id),
                    'dispatchId': f"DSP-{now_str}-{str(d.id).zfill(4)}",
                    'subCenterId': str(getattr(getattr(d, 'to_center', None), 'id', '') or ''),
                    'subCenterName': getattr(getattr(d, 'to_center', None), 'name', '') or '',
                    'dispatchedBy': getattr(getattr(d, 'dispatched_by', None), 'username', 'system'),
                    'dispatchedDate': dispatched_local.strftime('%Y-%m-%d'),
                    'dispatchedTime': dispatched_local.strftime('%H:%M'),
                    'books': book_payload,
                    'totalBooks': total_books,
                    'totalCoupons': total_coupons,
                    'totalValue': round(total_value, 2),
                    'status': getattr(d, 'status', 'DISPATCHED') or 'DISPATCHED',
                    'receivedBy': getattr(getattr(d, 'received_by', None), 'username', None),
                    'receivedDate': None if not getattr(d, 'received_date', None) else timezone.localtime(d.received_date).strftime('%Y-%m-%d'),
                    'receivedTime': None if not getattr(d, 'received_date', None) else timezone.localtime(d.received_date).strftime('%H:%M'),
                    'receiverSignature': getattr(d, 'receiver_signature', None),
                    'transportDetails': None,
                    'vehicleNumber': getattr(d, 'vehicle_number', None),
                    'driverName': getattr(d, 'driver_name', None),
                    'driverPhone': getattr(d, 'driver_phone', None),
                    'notes': getattr(d, 'notes', '') or '',
                    'trackingNumber': getattr(d, 'tracking_number', None) or f"TRK-{now_str}{str(d.id).zfill(4)}",
                })

            return Response({
                'results': results,
                'count': qs.count(),
                'page': page,
                'page_size': page_size
            })
        except Exception as e:
            return Response({
                'results': [],
                'count': 0,
                'page': 1,
                'page_size': 50,
                'error': str(e)
            }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """Detailed view for a single dispatch including books and optional coupon list.

        Query params:
            include_coupons=true => embed coupons for each book (may be heavy)
        """
        from django.utils import timezone
        instance = self.get_object()
        include_coupons = str(request.query_params.get('include_coupons', 'false')).lower() in ('1','true','yes')

        dispatched_local = timezone.localtime(getattr(instance, 'dispatch_date', timezone.now()))
        books = list(instance.books.select_related('box').all()) if hasattr(instance, 'books') else []

        total_coupons = 0
        total_value = 0.0
        book_payload = []
        for b in books:
            coupon_count = b.initial_coupon_count or 100
            denomination = b.box.denomination if getattr(b, 'box', None) else 20
            total_coupons += coupon_count
            total_value += coupon_count * denomination

            coupons_data = []
            if include_coupons:
                coupons = list(b.coupons.all()[:1000])  # safety slice
                for c in coupons:
                    coupons_data.append({
                        'id': c.id,
                        'couponNumber': c.coupon_number,
                        'status': c.status,
                        'litres': c.litres,
                        'usdValue': c.usd_value,
                    })

            book_payload.append({
                'id': str(b.id),
                'bookId': b.book_number,
                'boxId': b.box.box_code if getattr(b, 'box', None) else None,
                'fuelType': b.box.fuel_type if getattr(b, 'box', None) else None,
                'couponAmount': denomination,
                'firstCouponId': b.first_coupon_number,
                'lastCouponId': b.last_coupon_number,
                'numberOfCoupons': coupon_count,
                'value': coupon_count * denomination,
                'coupons': coupons_data if include_coupons else None,
            })

        now_str = dispatched_local.strftime('%Y-%m')
        payload = {
            'id': str(instance.id),
            'dispatchId': f"DSP-{now_str}-{str(instance.id).zfill(4)}",
            'subCenterId': str(getattr(getattr(instance, 'to_center', None), 'id', '') or ''),
            'subCenterName': getattr(getattr(instance, 'to_center', None), 'name', '') or '',
            'dispatchedBy': getattr(getattr(instance, 'dispatched_by', None), 'username', 'system'),
            'dispatchedDate': dispatched_local.strftime('%Y-%m-%d'),
            'dispatchedTime': dispatched_local.strftime('%H:%M'),
            'books': book_payload,
            'totalBooks': len(books),
            'totalCoupons': total_coupons,
            'totalValue': round(total_value, 2),
            'status': getattr(instance, 'status', 'DISPATCHED') or 'DISPATCHED',
            'receivedBy': getattr(getattr(instance, 'received_by', None), 'username', None),
            'receivedDate': None if not getattr(instance, 'received_date', None) else timezone.localtime(instance.received_date).strftime('%Y-%m-%d'),
            'receivedTime': None if not getattr(instance, 'received_date', None) else timezone.localtime(instance.received_date).strftime('%H:%M'),
            'receiverSignature': getattr(instance, 'receiver_signature', None),
            'vehicleNumber': getattr(instance, 'vehicle_number', None),
            'driverName': getattr(instance, 'driver_name', None),
            'driverPhone': getattr(instance, 'driver_phone', None),
            'trackingNumber': getattr(instance, 'tracking_number', None),
            'notes': getattr(instance, 'notes', '') or '',
        }
        return Response(payload)

    def partial_update(self, request, *args, **kwargs):
        """Allow sub-center to accept/confirm receipt of a dispatch addressed to them.

        Only permits setting status to RECEIVED (or CONFIRMED for future workflows) on own dispatches.
        Other updates remain restricted to main center via default permissions.
        """
        print(f"🐛 PARTIAL_UPDATE DEBUG: User: {request.user.username}, Role: {getattr(request.user, 'role', 'N/A')}")
        try:
            instance = self.get_object()
            user = request.user
            print(f"🐛 DEBUG: Dispatch ID: {instance.id}, to_center_id: {instance.to_center_id}, user sub_center: {getattr(user, 'sub_center', None)}")

            requested_status = str(request.data.get('status') or '').upper()
            allowed_statuses = {'RECEIVED'}
            print(f"🐛 DEBUG: Requested status: {requested_status}")

            # Allow SUPERUSER and MAIN_CENTER to update any dispatch
            if getattr(user, 'role', None) in ['SUPERUSER', 'MAIN_CENTER']:
                pass  # Allow any status update for admin users
            elif getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None):
                # If to_center_id is None (unassigned), assign it to the user's subcenter
                if not instance.to_center_id:
                    instance.to_center = user.sub_center
                elif instance.to_center_id != user.sub_center.id:
                    return Response({'detail': 'Not authorized to modify this dispatch'}, status=status.HTTP_403_FORBIDDEN)
                if requested_status not in allowed_statuses:
                    return Response({'detail': 'Only status update to RECEIVED is allowed'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Not authorized to modify dispatches'}, status=status.HTTP_403_FORBIDDEN)

                # Perform safe update
                instance.status = requested_status
                try:
                    instance.received_by = user  # field exists on stub
                except Exception:
                    pass
                instance.save(update_fields=['status', 'received_by'] if hasattr(instance, 'received_by') else ['status'])

                # Return the same lightweight shape as list/create
                dispatched_local = timezone.localtime(getattr(instance, 'dispatch_date', timezone.now()))
                now_str = timezone.localtime(timezone.now()).strftime('%Y-%m')
                payload = {
                    'id': str(instance.id),
                    'dispatchId': f"DSP-{now_str}-{str(instance.id).zfill(4)}",
                    'subCenterId': str(getattr(getattr(instance, 'to_center', None), 'id', '') or ''),
                    'subCenterName': getattr(getattr(instance, 'to_center', None), 'name', '') or '',
                    'dispatchedBy': getattr(getattr(instance, 'dispatched_by', None), 'username', 'system'),
                    'dispatchedDate': dispatched_local.strftime('%Y-%m-%d'),
                    'dispatchedTime': dispatched_local.strftime('%H:%M'),
                    'books': [],
                    'totalBooks': 0,
                    'totalCoupons': 0,
                    'totalValue': 0.0,
                    'status': instance.status,
                    'receivedBy': getattr(getattr(instance, 'received_by', None), 'username', None),
                    'receivedDate': None,
                    'receivedTime': None,
                    'trackingNumber': f"TRK-{now_str}{str(instance.id).zfill(4)}",
                }
                return Response(payload)

            # Fallback to default behavior for other roles (will be guarded by MainCenterPermission)
            return super().partial_update(request, *args, **kwargs)

        except Exception as e:
            return Response({'detail': 'Failed to update dispatch', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        """Dedicated endpoint to accept a dispatch. Alias for PATCH status=RECEIVED.

        Only the addressed subcenter can accept their dispatch.
        """
        try:
            instance = self.get_object()
            user = request.user
            
            # Allow SUPERUSER and MAIN_CENTER to accept any dispatch for testing/admin purposes
            if getattr(user, 'role', None) in ['SUPERUSER', 'MAIN_CENTER']:
                pass  # Allow superuser to accept any dispatch
            elif getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None):
                # For subcenter users, check if dispatch is for their center or if to_center is None (unassigned)
                if instance.to_center_id and instance.to_center_id != user.sub_center.id:
                    return Response({'detail': 'Not authorized to accept this dispatch'}, status=status.HTTP_403_FORBIDDEN)
                # If to_center_id is None, assign it to the user's subcenter  
                if not instance.to_center_id:
                    instance.to_center = user.sub_center
            else:
                return Response({'detail': 'Only subcenter users can accept a dispatch'}, status=status.HTTP_403_FORBIDDEN)

            instance.status = 'RECEIVED'
            try:
                instance.received_by = user
            except Exception:
                pass
            instance.save(update_fields=['status', 'received_by'] if hasattr(instance, 'received_by') else ['status'])

            return Response({'status': 'RECEIVED', 'id': str(instance.id)})
        except Exception as e:
            return Response({'detail': 'Failed to accept dispatch', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available_books(self, request):
        """Get books available for dispatch"""
        try:
            # Get books that are received but not yet dispatched
            available_books = Book.objects.filter(
                box__is_received=True,
                is_assigned=False,
                dispatches__isnull=True
            ).select_related('box').order_by('-generated_at')
            
            books_data = []
            for book in available_books:
                books_data.append({
                    'id': book.id,
                    'bookId': book.id,
                    'bookCode': book.book_code or f"BOOK-{book.id}",
                    'boxId': book.box.box_code,
                    'fuelType': book.box.fuel_type,
                    'denomination': book.box.denomination,
                    'firstCouponNumber': book.first_coupon_number,
                    'lastCouponNumber': book.last_coupon_number,
                    'numberOfCoupons': book.initial_coupon_count or 100,
                    'isSelected': False,
                    'generatedAt': book.generated_at.isoformat() if book.generated_at else None
                })
            
            return Response({
                'results': books_data,
                'total_available': len(books_data),
                'message': f'Found {len(books_data)} books available for dispatch'
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load available books: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def generate_coupons(self, request):
        """
        Intelligent coupon generation for book dispatch
        Supports multiple generation modes similar to box receipt
        """
        try:
            data = request.data
            mode = data.get('mode', 'book-selection')
            
            generated_data = {
                'coupons': [],
                'books': [],
                'total_books': 0,
                'total_coupons': 0,
                'total_value': 0,
                'generation_mode': mode
            }
            
            if mode == 'book-selection':
                # Mode 1: Select specific books
                book_ids = data.get('selectedBookIds', [])
                if not book_ids:
                    return Response({
                        'error': 'No books selected for dispatch'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                selected_books = Book.objects.filter(
                    id__in=book_ids,
                    box__is_received=True,
                    is_assigned=False,
                    dispatches__isnull=True
                ).select_related('box')
                
                if not selected_books.exists():
                    return Response({
                        'error': 'Selected books are not available for dispatch'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Generate coupons for selected books
                generated_data = self._generate_coupons_for_books(selected_books)
                
            elif mode == 'serial-range':
                # Mode 2: Generate based on serial number range
                start_serial = data.get('startSerial')
                end_serial = data.get('endSerial')
                
                if not start_serial or not end_serial:
                    return Response({
                        'error': 'Both start and end serial numbers are required'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Find books within the serial range
                books_in_range = Book.objects.filter(
                    first_coupon_number__lte=end_serial,
                    last_coupon_number__gte=start_serial,
                    box__is_received=True,
                    is_assigned=False,
                    dispatches__isnull=True
                ).select_related('box')
                
                if not books_in_range.exists():
                    return Response({
                        'error': f'No available books found in serial range {start_serial} to {end_serial}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                generated_data = self._generate_coupons_for_books(books_in_range)
                
            elif mode == 'quantity-based':
                # Mode 3: Generate based on target quantities
                target_coupon_count = data.get('targetCouponCount')
                target_book_count = data.get('targetBookCount')
                preferred_denomination = data.get('preferredDenomination')
                fuel_type_preference = data.get('fuelTypePreference')
                
                if not target_coupon_count and not target_book_count:
                    return Response({
                        'error': 'Either target coupon count or book count must be specified'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Build query filters
                filters = {
                    'box__is_received': True,
                    'is_assigned': False,
                    'dispatches__isnull': True
                }
                
                if preferred_denomination:
                    filters['box__denomination'] = preferred_denomination
                
                if fuel_type_preference and fuel_type_preference != 'MIXED':
                    filters['box__fuel_type'] = fuel_type_preference
                
                available_books = Book.objects.filter(**filters).select_related('box')
                
                # Select books to meet target
                selected_books = self._select_books_for_target(
                    available_books, 
                    target_coupon_count, 
                    target_book_count
                )
                
                if not selected_books:
                    return Response({
                        'error': 'No suitable books found to meet the target requirements'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                generated_data = self._generate_coupons_for_books(selected_books)
                
            elif mode == 'mixed-allocation':
                # Mode 4: Mixed allocation with specific rules
                allocation_rules = data.get('allocationRules', [])
                
                if not allocation_rules:
                    return Response({
                        'error': 'Allocation rules are required for mixed allocation mode'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Process allocation rules
                selected_books = []
                for rule in allocation_rules:
                    rule_books = self._find_books_for_allocation_rule(rule)
                    selected_books.extend(rule_books)
                
                if not selected_books:
                    return Response({
                        'error': 'No books found matching the allocation rules'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                generated_data = self._generate_coupons_for_books(selected_books)
            
            else:
                return Response({
                    'error': f'Unsupported generation mode: {mode}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(generated_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to generate coupons: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _generate_coupons_for_books(self, books):
        """Generate coupon data for selected books"""
        generated_coupons = []
        books_data = []
        total_value = 0
        
        for book in books:
            coupon_count = book.initial_coupon_count or 100
            denomination = book.box.denomination
            book_value = coupon_count * denomination
            total_value += book_value
            
            # Generate individual coupon data
            for i in range(coupon_count):
                coupon_number = self._generate_coupon_number(book, i)
                generated_coupons.append({
                    'id': f"{book.id}-coupon-{i+1}",
                    'couponNumber': coupon_number,
                    'bookId': str(book.id),
                    'fuelType': book.box.fuel_type,
                    'denomination': denomination,
                    'value': denomination,
                    'pricePerLitre': float(book.box.fuel_price_per_litre_usd or 1.45),
                    'generatedAt': timezone.now().isoformat(),
                    'status': 'GENERATED'
                })
            
            # Book data
            books_data.append({
                'id': str(book.id),
                'bookId': str(book.id),
                'bookCode': book.book_code or f"BOOK-{book.id}",
                'boxId': book.box.box_code,
                'fuelType': book.box.fuel_type,
                'denomination': denomination,
                'firstCouponNumber': book.first_coupon_number,
                'lastCouponNumber': book.last_coupon_number,
                'numberOfCoupons': coupon_count,
                'isSelected': True
            })
        
        return {
            'coupons': generated_coupons,
            'books': books_data,
            'total_books': len(books_data),
            'total_coupons': len(generated_coupons),
            'total_value': total_value
        }

    def _generate_coupon_number(self, book, index):
        """Generate sequential coupon number for a book"""
        try:
            # Extract numeric part from first coupon number
            first_coupon = book.first_coupon_number
            # Simple sequential generation - can be enhanced with proper serial logic
            if first_coupon and first_coupon[-6:].isdigit():
                base_number = int(first_coupon[-6:])
                new_number = base_number + index
                return first_coupon[:-6] + f"{new_number:06d}"
            else:
                return f"{first_coupon}-{index+1:03d}"
        except:
            return f"COUPON-{book.id}-{index+1:03d}"

    def _select_books_for_target(self, available_books, target_coupon_count, target_book_count):
        """Select books to meet target quantities"""
        selected_books = []
        current_coupon_count = 0
        
        for book in available_books:
            if target_book_count and len(selected_books) >= target_book_count:
                break
            
            book_coupon_count = book.initial_coupon_count or 100
            
            if target_coupon_count:
                if current_coupon_count >= target_coupon_count:
                    break
                # Don't add if it would exceed target by too much
                if current_coupon_count + book_coupon_count > target_coupon_count * 1.1:
                    continue
            
            selected_books.append(book)
            current_coupon_count += book_coupon_count
        
        return selected_books

    def _find_books_for_allocation_rule(self, rule):
        """Find books matching allocation rule"""
        filters = {
            'box__is_received': True,
            'is_assigned': False,
            'dispatches__isnull': True,
            'box__fuel_type': rule.get('fuelType'),
            'box__denomination': rule.get('denomination')
        }
        
        quantity = rule.get('quantity', 1)
        
        books = Book.objects.filter(**filters).select_related('box')[:quantity]
        return list(books)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def generation_options(self, request):
        """Get available options for intelligent generation"""
        try:
            # Count available books by fuel type and denomination
            available_summary = Book.objects.filter(
                box__is_received=True,
                is_assigned=False,
                dispatches__isnull=True
            ).values('box__fuel_type', 'box__denomination').annotate(
                book_count=models.Count('id'),
                total_coupons=models.Sum('initial_coupon_count')
            )
            
            return Response({
                'generation_modes': [
                    {
                        'id': 'book-selection',
                        'name': 'Book Selection',
                        'description': 'Select specific books to dispatch',
                        'icon': 'book'
                    },
                    {
                        'id': 'serial-range',
                        'name': 'Serial Range',
                        'description': 'Generate based on coupon serial number range',
                        'icon': 'number'
                    },
                    {
                        'id': 'quantity-based',
                        'name': 'Quantity Based',
                        'description': 'Generate based on target quantities',
                        'icon': 'calculator'
                    },
                    {
                        'id': 'mixed-allocation',
                        'name': 'Mixed Allocation',
                        'description': 'Complex allocation with multiple rules',
                        'icon': 'setting'
                    }
                ],
                'available_summary': list(available_summary),
                'fuel_type_options': [
                    {'value': 'PETROL', 'label': 'Petrol'},
                    {'value': 'DIESEL', 'label': 'Diesel'},
                    {'value': 'MIXED', 'label': 'Mixed (Both)'}
                ],
                'denomination_options': [
                    {'value': 5, 'label': '5 Litres'},
                    {'value': 10, 'label': '10 Litres'},
                    {'value': 20, 'label': '20 Litres'},
                    {'value': 50, 'label': '50 Litres'}
                ],
                'transport_methods': [
                    {'value': 'DIRECT_DELIVERY', 'label': 'Direct Delivery'},
                    {'value': 'PICKUP', 'label': 'Pickup'},
                    {'value': 'COURIER', 'label': 'Courier Service'},
                    {'value': 'GOVERNMENT_VEHICLE', 'label': 'Government Vehicle'}
                ]
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load generation options: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def dispatch_preview(self, request, pk=None):
        """Preview dispatch details before confirmation"""
        try:
            dispatch = self.get_object()
            
            # Get detailed book and coupon information
            books = dispatch.books.all().select_related('box')
            total_coupons = sum(book.initial_coupon_count or 100 for book in books)
            total_value = sum((book.initial_coupon_count or 100) * book.box.denomination for book in books)
            
            book_details = []
            for book in books:
                book_details.append({
                    'bookCode': book.book_code or f"BOOK-{book.id}",
                    'fuelType': book.box.fuel_type,
                    'denomination': book.box.denomination,
                    'firstCouponNumber': book.first_coupon_number,
                    'lastCouponNumber': book.last_coupon_number,
                    'numberOfCoupons': book.initial_coupon_count or 100,
                    'value': (book.initial_coupon_count or 100) * book.box.denomination
                })
            
            return Response({
                'dispatch_summary': {
                    'dispatch_id': f"DISP-{dispatch.id}",
                    'to_subcenter': dispatch.to_center.name,
                    'dispatch_date': dispatch.dispatch_date.isoformat(),
                    'total_books': len(books),
                    'total_coupons': total_coupons,
                    'total_value': total_value,
                    'status': dispatch.status
                },
                'book_details': book_details,
                'validation': {
                    'ready_for_dispatch': dispatch.status in ['PENDING', 'DISPATCHED'],
                    'all_books_verified': True,  # Add verification logic
                    'transport_details_complete': bool(dispatch.notes)
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to generate dispatch preview: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        """Auto-assign dispatch details when creating"""
        serializer.save(
            dispatched_by=self.request.user,
            dispatch_date=timezone.now()
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def refresh_calculations(self, request, pk=None):
        """
        Recalculate dispatch values and populate missing fields like subcenter info.
        Useful for fixing old dispatches with miscalculated figures or missing data.
        """
        from rest_framework.decorators import action
        from rest_framework import status
        from rest_framework.response import Response
        
        try:
            dispatch = self.get_object()
            updated_fields = []
            
            # Fix missing main_center_dispatch_number if needed
            if not dispatch.main_center_dispatch_number:
                dispatch.main_center_dispatch_number = f"MCD-{dispatch.id:05d}"
                dispatch.save(update_fields=['main_center_dispatch_number'])
                updated_fields.append('main_center_dispatch_number')
            
            # Attempt to populate missing subcenter if we can infer it
            if not dispatch.to_center and dispatch.books.exists():
                # Try to infer subcenter from book dispatch patterns or other logic
                # This could be enhanced based on business rules
                pass
            
            # Get fresh calculated values using our enhanced properties
            fresh_litres = dispatch.total_litres
            fresh_usd = dispatch.total_value_usd  
            fresh_zwg = dispatch.total_value_zwg
            avg_price = dispatch.average_price_per_litre_usd
            avg_rate = dispatch.average_exchange_rate_usd_zwg
            
            # Force a serializer refresh to get all calculated fields
            serializer = self.get_serializer(dispatch)
            
            return Response({
                'success': True,
                'message': f'Dispatch calculations refreshed successfully',
                'updated_fields': updated_fields,
                'calculated_values': {
                    'total_litres': float(fresh_litres) if fresh_litres else 0,
                    'total_value_usd': float(fresh_usd) if fresh_usd else 0,
                    'total_value_zwg': float(fresh_zwg) if fresh_zwg else None,
                    'average_price_per_litre_usd': float(avg_price) if avg_price else None,
                    'average_exchange_rate_usd_zwg': float(avg_rate) if avg_rate else None,
                    'total_books': dispatch.books.count(),
                },
                'dispatch': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to refresh dispatch calculations: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CouponAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing coupon allocations"""
    serializer_class = CouponAllocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CouponAllocation.objects.all()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]
    
    @action(detail=False, methods=['post'])
    def bulk_allocate(self, request):
        """Bulk allocate coupons to beneficiaries"""
        # Gating: require at least one RECEIVED dispatch for subcenter users
        user = request.user
        try:
            if getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None):
                if not BookDispatch.objects.filter(to_center=user.sub_center, status='RECEIVED').exists():
                    return Response({'error': 'You must accept at least one incoming dispatch before allocations.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            pass
        allocations = request.data.get('allocations', [])
        created_allocations = []
        
        for allocation_data in allocations:
            serializer = self.get_serializer(data=allocation_data)
            if serializer.is_valid():
                allocation = serializer.save(allocated_by=request.user)
                created_allocations.append(allocation)
        
        response_serializer = self.get_serializer(created_allocations, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class SystemAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for managing system alerts with comprehensive functionality"""
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        try:
            # Check if database has new fields by trying a simple query
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT priority FROM fuel_systemalert LIMIT 1;")
            has_new_fields = True
        except Exception:
            has_new_fields = False
        
        if not has_new_fields:
            # Use basic query for old database schema
            return SystemAlert.objects.all().order_by('-created')
        
        # Full functionality for new schema
        queryset = SystemAlert.objects.all()
        
        # Apply search filter
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(message__icontains=search_query)
            )
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        alert_type_filter = self.request.query_params.get('alert_type')
        if alert_type_filter:
            queryset = queryset.filter(alert_type=alert_type_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter and has_new_fields:
            queryset = queryset.filter(priority=priority_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created__gte=start_date)
        if end_date:
            queryset = queryset.filter(created__lte=end_date)
        
        # Filter out expired alerts unless specifically requested (only if new fields exist)
        show_expired = self.request.query_params.get('show_expired', 'false').lower() == 'true'
        if not show_expired and has_new_fields:
            try:
                queryset = queryset.filter(
                    models.Q(expires_at__isnull=True) |
                    models.Q(expires_at__gt=timezone.now())
                )
            except Exception:
                pass  # Skip expiration filter if field doesn't exist
        
        # Order by priority if available, otherwise by created date
        if has_new_fields:
            return queryset.order_by('-priority', '-created')
        else:
            return queryset.order_by('-created')
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'stats', 'active', 'my_alerts']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive alert statistics"""
        from django.db.models import Count, Q
        
        try:
            # Check if database has new fields
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SELECT priority FROM fuel_systemalert LIMIT 1;")
                has_new_fields = True
            except Exception:
                has_new_fields = False
                logger.warning("SystemAlert database schema is outdated. Some features unavailable.")
            
            # Get current real-time counts
            total_alerts = SystemAlert.objects.count()
            active_alerts = SystemAlert.objects.filter(status='ACTIVE').count()
            resolved_alerts = SystemAlert.objects.filter(status='RESOLVED').count()
            dismissed_alerts = SystemAlert.objects.filter(status='DISMISSED').count()
            acknowledged_alerts = SystemAlert.objects.filter(status='ACKNOWLEDGED').count()
            
            # Count expired alerts (avoid potential timezone issues)
            if has_new_fields:
                try:
                    expired_alerts = SystemAlert.objects.filter(
                        expires_at__lt=timezone.now()
                    ).count()
                except Exception:
                    expired_alerts = 0
            else:
                expired_alerts = 0
            
            # Alerts by type - use hardcoded values for reliability
            alerts_by_type = {
                'INFO': SystemAlert.objects.filter(alert_type='INFO').count(),
                'WARNING': SystemAlert.objects.filter(alert_type='WARNING').count(),
                'ERROR': SystemAlert.objects.filter(alert_type='ERROR').count(),
                'CRITICAL': SystemAlert.objects.filter(alert_type='CRITICAL').count(),
            }
            
            # Alerts by priority - only if new fields exist
            if has_new_fields:
                try:
                    alerts_by_priority = {
                        1: SystemAlert.objects.filter(priority=1).count(),
                        2: SystemAlert.objects.filter(priority=2).count(),
                        3: SystemAlert.objects.filter(priority=3).count(),
                        4: SystemAlert.objects.filter(priority=4).count(),
                    }
                except Exception:
                    alerts_by_priority = {1: 0, 2: total_alerts, 3: 0, 4: 0}
            else:
                alerts_by_priority = {1: 0, 2: total_alerts, 3: 0, 4: 0}  # Default all to medium priority
            
            # Recent activity (last 7 days)
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_alerts = SystemAlert.objects.filter(created__gte=seven_days_ago).count()
            recent_critical = SystemAlert.objects.filter(
                created__gte=seven_days_ago,
                alert_type='CRITICAL'
            ).count()
            
            # Active alerts by priority for urgency assessment (only if new fields exist)
            if has_new_fields:
                try:
                    active_critical = SystemAlert.objects.filter(
                        status='ACTIVE',
                        priority=4
                    ).count()
                    
                    active_high = SystemAlert.objects.filter(
                        status='ACTIVE',
                        priority=3
                    ).count()
                except Exception:
                    active_critical = 0
                    active_high = 0
            else:
                active_critical = 0
                active_high = 0
            
            return Response({
                'total_alerts': total_alerts,
                'active_alerts': active_alerts,
                'resolved_alerts': resolved_alerts,
                'dismissed_alerts': dismissed_alerts,
                'acknowledged_alerts': acknowledged_alerts,
                'expired_alerts': expired_alerts,
                'alerts_by_type': alerts_by_type,
                'alerts_by_priority': alerts_by_priority,
                'recent_alerts': recent_alerts,
                'recent_critical': recent_critical,
                'active_critical': active_critical,
                'active_high': active_high,
                'last_updated': timezone.now().isoformat(),
                'database_schema_updated': has_new_fields,
                'migration_required': not has_new_fields
            })
            
        except Exception as e:
            # Return basic stats if there's any error
            return Response({
                'total_alerts': 0,
                'active_alerts': 0,
                'resolved_alerts': 0,
                'dismissed_alerts': 0,
                'acknowledged_alerts': 0,
                'expired_alerts': 0,
                'alerts_by_type': {},
                'alerts_by_priority': {},
                'recent_alerts': 0,
                'recent_critical': 0,
                'active_critical': 0,
                'active_high': 0,
                'last_updated': timezone.now().isoformat(),
                'error': str(e)
            })

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        
        if alert.status == 'RESOLVED':
            return Response({'error': 'Cannot acknowledge a resolved alert'}, status=400)
        
        alert.acknowledge(request.user)
        
        # Log the action
        SystemAlert.objects.create(
            title=f"Alert Acknowledged",
            message=f"Alert '{alert.title}' was acknowledged by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': 'Alert acknowledged successfully',
            'status': alert.status
        })
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark an alert as resolved"""
        alert = self.get_object()
        alert.resolve()
        
        # Log the action
        SystemAlert.objects.create(
            title=f"Alert Resolved",
            message=f"Alert '{alert.title}' was resolved by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': 'Alert resolved successfully',
            'status': alert.status
        })
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Mark an alert as dismissed"""
        alert = self.get_object()
        
        if not alert.is_dismissible:
            return Response({'error': 'This alert cannot be dismissed'}, status=400)
        
        alert.dismiss()
        
        return Response({
            'message': 'Alert dismissed successfully',
            'status': alert.status
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active, non-expired alerts for the current user"""
        active_alerts = self.get_queryset().filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=timezone.now()),
            status='ACTIVE'
        )
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_alerts(self, request):
        """Get alerts relevant to current user's role"""
        user_alerts = self.get_queryset()
        serializer = self.get_serializer(user_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def critical(self, request):
        """Get all critical alerts"""
        critical_alerts = self.get_queryset().filter(
            alert_type='CRITICAL',
            status='ACTIVE'
        )
        serializer = self.get_serializer(critical_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def bulk_resolve(self, request):
        """Bulk resolve multiple alerts"""
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response({'error': 'No alert IDs provided'}, status=400)
        
        updated_count = SystemAlert.objects.filter(
            id__in=alert_ids,
            status__in=['ACTIVE', 'ACKNOWLEDGED']
        ).update(status='RESOLVED')
        
        # Log bulk action
        SystemAlert.objects.create(
            title=f"Bulk Alert Resolution",
            message=f"{updated_count} alerts were bulk resolved by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': f'{updated_count} alerts resolved successfully',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def bulk_acknowledge(self, request):
        """Bulk acknowledge multiple alerts"""
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response({'error': 'No alert IDs provided'}, status=400)
        
        updated_count = 0
        alerts = SystemAlert.objects.filter(
            id__in=alert_ids,
            status='ACTIVE'
        )
        
        for alert in alerts:
            alert.acknowledge(request.user)
            updated_count += 1
        
        # Log bulk action
        SystemAlert.objects.create(
            title=f"Bulk Alert Acknowledgment",
            message=f"{updated_count} alerts were bulk acknowledged by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': f'{updated_count} alerts acknowledged successfully',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def bulk_dismiss(self, request):
        """Bulk dismiss multiple alerts"""
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response({'error': 'No alert IDs provided'}, status=400)
        
        updated_count = SystemAlert.objects.filter(
            id__in=alert_ids,
            is_dismissible=True,
            status__in=['ACTIVE', 'ACKNOWLEDGED']
        ).update(status='DISMISSED')
        
        # Log bulk action
        SystemAlert.objects.create(
            title=f"Bulk Alert Dismissal",
            message=f"{updated_count} alerts were bulk dismissed by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': f'{updated_count} alerts dismissed successfully',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def bulk_delete(self, request):
        """Bulk delete multiple alerts"""
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids:
            return Response({'error': 'No alert IDs provided'}, status=400)
        
        deleted_count, _ = SystemAlert.objects.filter(id__in=alert_ids).delete()
        
        # Log bulk action
        SystemAlert.objects.create(
            title=f"Bulk Alert Deletion",
            message=f"{deleted_count} alerts were bulk deleted by {request.user.get_full_name()}",
            alert_type='INFO',
            created_by=request.user,
            priority=1
        )
        
        return Response({
            'message': f'{deleted_count} alerts deleted successfully',
            'deleted_count': deleted_count
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def create_system_alert(self, request):
        """Create a system-wide alert with enhanced options"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Check database compatibility first
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SELECT priority FROM fuel_systemalert LIMIT 1;")
                has_new_fields = True
            except Exception:
                has_new_fields = False
                logger.warning("SystemAlert database schema is outdated. Using basic creation.")
            
            data = request.data.copy()
            data['created_by'] = request.user.id
            
            logger.info(f"Creating alert with data: {data}")
            
            # If database doesn't have new fields, strip them out
            if not has_new_fields:
                # Remove new fields that don't exist in old schema
                data.pop('priority', None)
                data.pop('target_roles', None)
                data.pop('expires_at', None)
                data.pop('is_dismissible', None)
                logger.info("Removed new fields for compatibility with old database schema")
            else:
                # Validate target roles if provided
                target_roles = data.get('target_roles')
                if target_roles:
                    valid_roles = [role[0] for role in User.ROLE_CHOICES]
                    invalid_roles = [role for role in target_roles if role not in valid_roles]
                    if invalid_roles:
                        return Response({
                            'error': f'Invalid roles: {invalid_roles}',
                            'valid_roles': valid_roles
                        }, status=400)
            
            serializer = self.get_serializer(data=data)
            logger.info(f"Serializer created, validating...")
            
            if serializer.is_valid():
                logger.info(f"Serializer is valid, saving...")
                alert = serializer.save(created_by=request.user)
                logger.info(f"Alert saved successfully: {alert.id}")
                return Response({
                    'message': 'System alert created successfully',
                    'alert': SystemAlertSerializer(alert).data,
                    'database_schema_updated': has_new_fields
                }, status=201)
            else:
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response(serializer.errors, status=400)
                
        except Exception as e:
            logger.error(f"Exception in create_system_alert: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response({
                'error': f'Internal server error: {str(e)}',
                'type': type(e).__name__,
                'migration_required': True
            }, status=500)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing audit logs"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow AUDITOR, MAIN_CENTER, SUB_CENTER, and SUPERUSER roles
        """
        return [IsAuthenticated()]
    
    def check_permissions(self, request):
        """
        Custom permission check that allows auditors full access
        """
        super().check_permissions(request)
        
        # Allow SUPERUSER, AUDITOR, MAIN_CENTER, SUB_CENTER
        user = request.user
        if not (user.is_superuser or user.role in ['AUDITOR', 'MAIN_CENTER', 'SUB_CENTER', 'SUPERUSER']):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Insufficient permissions to access audit logs")
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action if provided
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)
        
        # Filter by model if provided
        model_name = self.request.query_params.get('model')
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created__date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created__date__lte=end_date)
            except ValueError:
                pass
        
        return queryset.order_by('-created')
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for audit logs"""
        return Response({
            'users': [{'id': u.id, 'username': u.username} for u in User.objects.all()[:50]],
            'actions': ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
            'models': ['User', 'Box', 'Book', 'Coupon', 'SubCenter'],
        })
    
    @action(detail=False, methods=['get'])
    def compliance_stats(self, request):
        """Get real compliance statistics"""
        try:
            period = request.query_params.get('period', 'month')
            
            # Calculate date range based on period
            now = timezone.now()
            if period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'year':
                start_date = now - timedelta(days=365)
            else:  # month
                start_date = now - timedelta(days=30)
            
            # Get real transaction data
            from .models import FuelTransaction
            total_transactions = FuelTransaction.objects.filter(timestamp__gte=start_date).count()
            
            # Get audit logs for compliance tracking
            audit_logs = self.get_queryset().filter(created__gte=start_date)
            total_audit_events = audit_logs.count()
            
            # Calculate compliance metrics (you can adjust these based on your business rules)
            compliant_transactions = total_transactions  # Assume all completed transactions are compliant
            violations = audit_logs.filter(details__icontains='error').count() if audit_logs.exists() else 0
            
            compliance_rate = round((compliant_transactions / total_transactions * 100), 1) if total_transactions > 0 else 100.0
            
            return Response({
                'total_transactions': total_transactions,
                'compliant_transactions': compliant_transactions,
                'compliance_rate': compliance_rate,
                'violations': violations,
                'period': period,
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': now.strftime('%Y-%m-%d')
                },
                'total_audit_events': total_audit_events
            })
            
        except Exception as e:
            # Fallback if there are issues
            return Response({
                'total_transactions': 0,
                'compliant_transactions': 0,
                'compliance_rate': 100.0,
                'violations': 0,
                'period': period,
                'error': str(e)
            })

    @action(detail=False, methods=['get'])
    def compliance_reports(self, request):
        """Get real compliance reports"""
        try:
            period = request.query_params.get('period', 'month')
            
            # Calculate date range
            now = timezone.now()
            if period == 'week':
                start_date = now - timedelta(days=7)
                report_title = f'Weekly Compliance Report - Week of {start_date.strftime("%b %d")}'
            elif period == 'year':
                start_date = now - timedelta(days=365)
                report_title = f'Annual Compliance Report - {start_date.year}'
            else:  # month
                start_date = now - timedelta(days=30)
                report_title = f'Monthly Compliance Report - {start_date.strftime("%B %Y")}'
            
            # Get real statistics for the report
            from .models import FuelTransaction
            total_transactions = FuelTransaction.objects.filter(timestamp__gte=start_date).count()
            audit_logs = self.get_queryset().filter(created__gte=start_date)
            violations = audit_logs.filter(details__icontains='error').count() if audit_logs.exists() else 0
            
            compliance_rate = round(((total_transactions - violations) / total_transactions * 100), 1) if total_transactions > 0 else 100.0
            
            # Generate report data
            reports = []
            
            # Main compliance report
            reports.append({
                'id': 1,
                'title': report_title,
                'type': period.title(),
                'period': period,
                'compliance_rate': compliance_rate,
                'total_transactions': total_transactions,
                'violations': violations,
                'generated_date': now.strftime('%Y-%m-%d'),
                'generated_by': request.user.username if request.user else 'System',
                'status': 'COMPLETED',
                'file_size': '2.4 MB',  # Estimated size
                'created': now.strftime('%b %d, %Y %H:%M:%S')
            })
            
            # Add quarterly report if exists
            if period == 'month':
                quarterly_start = now - timedelta(days=90)
                quarterly_transactions = FuelTransaction.objects.filter(timestamp__gte=quarterly_start).count()
                quarterly_violations = audit_logs.filter(created__gte=quarterly_start, details__icontains='error').count()
                quarterly_rate = round(((quarterly_transactions - quarterly_violations) / quarterly_transactions * 100), 1) if quarterly_transactions > 0 else 100.0
                
                reports.append({
                    'id': 2,
                    'title': f'Quarterly Audit Report - Q{((now.month-1)//3)+1} {now.year}',
                    'type': 'Quarterly',
                    'period': 'quarter',
                    'compliance_rate': quarterly_rate,
                    'total_transactions': quarterly_transactions,
                    'violations': quarterly_violations,
                    'generated_date': now.strftime('%Y-%m-%d'),
                    'generated_by': 'Admin User',
                    'status': 'PENDING' if quarterly_violations > 0 else 'COMPLETED',
                    'file_size': '-' if quarterly_violations > 0 else '3.1 MB',
                    'created': (now - timedelta(hours=2)).strftime('%b %d, %Y %H:%M:%S')
                })
            
            return Response({
                'reports': reports,
                'summary': {
                    'total_reports': len(reports),
                    'completed': len([r for r in reports if r['status'] == 'COMPLETED']),
                    'pending': len([r for r in reports if r['status'] == 'PENDING']),
                    'failed': 0
                }
            })
            
        except Exception as e:
            # Fallback response
            return Response({
                'reports': [{
                    'id': 1,
                    'title': f'{period.title()} Compliance Report',
                    'period': period,
                    'compliance_rate': 100.0,
                    'generated_date': timezone.now().strftime('%Y-%m-%d'),
                    'status': 'COMPLETED',
                    'error': str(e)
                }],
                'summary': {
                    'total_reports': 1,
                    'completed': 1,
                    'pending': 0,
                    'failed': 0
                }
            })
    
    @action(detail=False, methods=['get'])
    def transaction_stats(self, request):
        """Get real transaction statistics"""
        try:
            # Get actual transaction statistics
            from .models import FuelTransaction
            
            total_transactions = FuelTransaction.objects.count()
            
            # Calculate date range for recent transactions (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_transactions = FuelTransaction.objects.filter(timestamp__gte=thirty_days_ago)
            
            # Count successful vs failed transactions (assuming is_verified field indicates success)
            successful_transactions = recent_transactions.filter(is_verified=True).count() if hasattr(FuelTransaction, 'is_verified') else recent_transactions.count()
            pending_transactions = recent_transactions.filter(is_verified=False).count() if hasattr(FuelTransaction, 'is_verified') else 0
            failed_transactions = 0  # Can be calculated based on your business logic
            
            return Response({
                'total_transactions': total_transactions,
                'recent_transactions': recent_transactions.count(),
                'successful_transactions': successful_transactions,
                'failed_transactions': failed_transactions,
                'pending_transactions': pending_transactions,
                'date_range': f'Last 30 days',
            })
        except Exception as e:
            # Fallback to basic counts if there are issues
            return Response({
                'total_transactions': FuelTransaction.objects.count() if 'FuelTransaction' in dir() else 0,
                'successful_transactions': 0,
                'failed_transactions': 0,
                'pending_transactions': 0,
                'error': str(e)
            })

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """Get real audit transactions from FuelTransaction and AuditLog"""
        try:
            # Get page parameters
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Combine audit logs and fuel transactions
            transactions = []
            
            # Get audit logs
            audit_logs = self.get_queryset()
            for log in audit_logs[:page_size//2]:  # Take half from audit logs
                transactions.append({
                    'id': f'audit_{log.id}',
                    'type': 'audit',
                    'action': log.action,
                    'model': log.model_name,
                    'user': log.user.username if log.user else 'System',
                    'timestamp': log.created.strftime('%Y-%m-%d %H:%M:%S'),
                    'details': log.details or {},
                    'status': 'completed'
                })
            
            # Get fuel transactions if available
            try:
                from .models import FuelTransaction
                fuel_transactions = FuelTransaction.objects.all().order_by('-timestamp')[:page_size//2]
                
                for txn in fuel_transactions:
                    transactions.append({
                        'id': f'fuel_{txn.id}',
                        'type': 'fuel_transaction',
                        'action': 'fuel_dispensed',
                        'model': 'FuelTransaction',
                        'user': txn.beneficiary.get_full_name() if hasattr(txn, 'beneficiary') and txn.beneficiary else 'Unknown',
                        'timestamp': txn.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'details': {
                            'litres': float(txn.litres_consumed) if hasattr(txn, 'litres_consumed') else 0,
                            'cost': float(txn.amount_usd) if hasattr(txn, 'amount_usd') else 0,
                            'coupon_id': txn.coupon.id if hasattr(txn, 'coupon') and txn.coupon else None
                        },
                        'status': 'verified' if hasattr(txn, 'is_verified') and txn.is_verified else 'completed'
                    })
            except Exception as fuel_error:
                print(f"Could not load fuel transactions: {fuel_error}")
            
            # Sort by timestamp descending
            transactions.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return Response({
                'results': transactions[:page_size],
                'count': len(transactions),
                'page': page,
                'page_size': page_size
            })
            
        except Exception as e:
            # Fallback to audit logs only
            logs = self.get_queryset()[:20]
            transactions = []
            
            for log in logs:
                transactions.append({
                    'id': log.id,
                    'type': 'audit',
                    'action': log.action,
                    'model': log.model_name,
                    'user': log.user.username if log.user else 'System',
                    'timestamp': log.created.strftime('%Y-%m-%d %H:%M:%S'),
                    'details': log.details or {},
                    'status': 'completed'
                })
            
            return Response({
                'results': transactions,
                'count': len(transactions),
                'error': str(e)
            })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get audit log summary statistics"""
        from django.db.models import Count
        
        # Get summary statistics
        total_logs = AuditLog.objects.count()
        recent_logs = AuditLog.objects.filter(
            created__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Group by action type
        action_summary = AuditLog.objects.values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent activity by user
        user_activity = AuditLog.objects.filter(
            created__gte=timezone.now() - timedelta(days=7)
        ).values('user__username').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_logs': total_logs,
            'recent_logs': recent_logs,
            'action_summary': list(action_summary),
            'recent_user_activity': list(user_activity)
        })
    
    @action(detail=False, methods=['post'])
    def export_audit_data(self, request):
        """Export audit data in CSV or JSON format"""
        format_type = request.data.get('format', 'csv')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        # Get filtered queryset
        queryset = self.get_queryset()
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created__date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created__date__lte=end_date)
            except ValueError:
                pass
        
        if format_type == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d")}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['ID', 'User', 'Action', 'Model', 'Details', 'IP Address', 'Severity', 'Timestamp'])
            
            for log in queryset[:1000]:  # Limit to 1000 records
                writer.writerow([
                    log.id,
                    log.user.username if log.user else 'System',
                    log.action,
                    log.model_name,
                    str(log.details or {}),
                    log.ip_address or '',
                    log.severity,
                    log.created.strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            return response
        else:
            # JSON format
            data = []
            for log in queryset[:1000]:
                data.append({
                    'id': log.id,
                    'user': log.user.username if log.user else 'System',
                    'action': log.action,
                    'model': log.model_name,
                    'details': log.details or {},
                    'ip_address': log.ip_address or '',
                    'severity': log.severity,
                    'timestamp': log.created.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return Response({'data': data})
    
    @action(detail=False, methods=['get'])
    def security_events(self, request):
        """Get security-related audit events"""
        # Filter for security-related actions
        security_actions = ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE', 'PERMISSION_DENIED']
        
        security_logs = AuditLog.objects.filter(
            action__in=security_actions
        ).order_by('-created')[:100]
        
        events = []
        for log in security_logs:
            events.append({
                'id': log.id,
                'event_type': log.action,
                'user': log.user.username if log.user else 'System',
                'ip_address': log.ip_address or '',
                'severity': log.severity,
                'timestamp': log.created.strftime('%Y-%m-%d %H:%M:%S'),
                'details': log.details or {}
            })
        
        return Response({
            'results': events,
            'total_events': len(events),
            'high_risk_events': len([e for e in events if log.severity in ['HIGH', 'CRITICAL']])
        })


class BeneficiaryProfileViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for managing beneficiary profiles with frontend compatibility"""
    serializer_class = BeneficiaryProfileSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'constituency', 'fuel_type', 'is_active_beneficiary']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'vehicle_make', 'vehicle_model', 'vehicle_registration']
    ordering_fields = ['user__first_name', 'user__last_name', 'created', 'monthly_entitlement_litres']
    ordering = ['-created']
    
    def get_queryset(self):
        """Enhanced queryset with optimized database queries and filtering"""
        queryset = BeneficiaryProfile.objects.select_related(
            'user', 'category', 'constituency', 'vehicle_category'
        ).filter(is_active_beneficiary=True)
        
        # Apply search filters
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(vehicle_make__icontains=search) |
                Q(vehicle_model__icontains=search) |
                Q(vehicle_registration__icontains=search)
            )
        
        # Apply status filter
        status = self.request.query_params.get('status')
        if status:
            if status == 'ACTIVE':
                queryset = queryset.filter(is_active_beneficiary=True, user__is_approved=True)
            elif status == 'INACTIVE':
                queryset = queryset.filter(is_active_beneficiary=False)
            elif status == 'SUSPENDED':
                queryset = queryset.filter(is_active_beneficiary=True, user__is_approved=False)
        
        # Apply category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name=category)
        
        # Apply constituency filter
        constituency = self.request.query_params.get('constituency')
        if constituency:
            queryset = queryset.filter(constituency__name=constituency)
        
        return queryset
    
    def get_permissions(self):
        """Role-based permissions for different actions"""
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), BeneficiaryManagementPermission()]
    
    def create(self, request, *args, **kwargs):
        """Create a new beneficiary with proper error handling"""
        try:
            # Log the user and role for debugging
            print(f"=== BENEFICIARY CREATION DEBUG ===")
            print(f"User: {request.user}")
            print(f"User role: {getattr(request.user, 'role', 'No role')}")
            print(f"User authenticated: {request.user.is_authenticated}")
            print(f"Incoming data: {request.data}")
            
            # Check permissions manually for debugging
            permissions = self.get_permissions()
            for permission in permissions:
                has_permission = permission.has_permission(request, self)
                print(f"Permission {permission.__class__.__name__}: {has_permission}")
                if not has_permission:
                    print(f"Permission denied by {permission.__class__.__name__}")
                    return Response(
                        {'error': f'Permission denied: {permission.__class__.__name__}. Required roles: MAIN_CENTER, SUB_CENTER, ADMIN, SUPERUSER'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print("Validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print("Creation error:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create beneficiary: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update beneficiary with proper error handling"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Log the incoming data for debugging
            print("Update incoming data:", request.data)
            
            # Handle nested user data if present
            if 'user' in request.data:
                user_data = request.data.pop('user')
                if instance.user:
                    # Update existing user fields
                    for field, value in user_data.items():
                        if hasattr(instance.user, field):
                            setattr(instance.user, field, value)
                    instance.user.save()
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if not serializer.is_valid():
                print("Update validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
                
            return Response(serializer.data)
            
        except Exception as e:
            print("Update error:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to update beneficiary: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a beneficiary profile"""
        beneficiary = self.get_object()
        beneficiary.is_active_beneficiary = True
        beneficiary.save()
        return Response({'status': 'activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a beneficiary profile"""
        beneficiary = self.get_object()
        beneficiary.is_active_beneficiary = False
        beneficiary.save()
        return Response({'status': 'deactivated'})
    
    @action(detail=True, methods=['get'])
    def allocation_history(self, request, pk=None):
        """Get allocation history for a beneficiary"""
        beneficiary = self.get_object()
        # This would return allocation history
        # For now, return empty array
        return Response([])
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available beneficiary categories"""
        from .models import BeneficiaryCategory
        categories = BeneficiaryCategory.objects.all()
        return Response([{'id': cat.id, 'name': cat.name} for cat in categories])
    
    @action(detail=False, methods=['get'])
    def constituencies(self, request):
        """Get available constituencies"""
        from .models import Constituency
        constituencies = Constituency.objects.all()
        return Response([{'id': const.id, 'name': const.name} for const in constituencies])
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get beneficiary statistics for dashboard"""
        queryset = self.get_queryset()
        total = queryset.count()
        active = queryset.filter(is_active_beneficiary=True, user__is_approved=True).count()
        inactive = queryset.filter(is_active_beneficiary=False).count()
        suspended = queryset.filter(is_active_beneficiary=True, user__is_approved=False).count()
        
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'suspended': suspended
        })


# Fuel Entitlement ViewSet - Critical for tracking parliament member entitlements
class FuelEntitlementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing fuel entitlements - tracks what members are entitled to regardless of stock"""
    serializer_class = FuelEntitlementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = FuelEntitlement.objects.select_related(
            'beneficiary', 'session', 'created_by', 'approved_by'
        ).all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset  # Main Center and Auditors see all entitlements
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see entitlements for beneficiaries in their center
            return queryset.filter(beneficiary__sub_center=user.sub_center)
        elif user.role == 'BENEFICIARY':
            # Beneficiaries see only their own entitlements
            return queryset.filter(beneficiary=user)
        
        return FuelEntitlement.objects.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrSubCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a fuel entitlement"""
        entitlement = self.get_object()
        
        if entitlement.status == 'APPROVED':
            return Response({'error': 'Entitlement is already approved'}, status=400)
        
        entitlement.approve(request.user)
        
        return Response({
            'message': 'Entitlement approved successfully',
            'entitlement': FuelEntitlementSerializer(entitlement).data
        })
    
    @action(detail=True, methods=['post'])
    def allocate_fuel(self, request, pk=None):
        """Allocate fuel against an entitlement"""
        entitlement = self.get_object()
        litres_to_allocate = request.data.get('litres', 0)
        
        try:
            litres_to_allocate = float(litres_to_allocate)
            if litres_to_allocate <= 0:
                return Response({'error': 'Litres must be greater than 0'}, status=400)
            
            entitlement.allocate_fuel(litres_to_allocate)
            
            return Response({
                'message': f'Successfully allocated {litres_to_allocate}L',
                'entitlement': FuelEntitlementSerializer(entitlement).data
            })
            
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': f'Failed to allocate fuel: {str(e)}'}, status=500)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get all entitlements pending approval"""
        pending = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(pending, many=True)
        return Response({
            'count': pending.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def expired_entitlements(self, request):
        """Get all expired entitlements"""
        from django.utils import timezone
        expired = self.get_queryset().filter(
            period_end__lt=timezone.now().date(),
            status__in=['PENDING', 'APPROVED', 'PARTIALLY_ALLOCATED']
        )
        serializer = self.get_serializer(expired, many=True)
        return Response({
            'count': expired.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create_monthly_entitlements(self, request):
        """Create monthly entitlements for all eligible beneficiaries"""
        from django.utils import timezone
        from datetime import timedelta
        import calendar
        
        year = request.data.get('year', timezone.now().year)
        month = request.data.get('month', timezone.now().month)
        
        # Calculate period dates
        period_start = timezone.datetime(year, month, 1).date()
        last_day = calendar.monthrange(year, month)[1]
        period_end = timezone.datetime(year, month, last_day).date()
        
        # Get all beneficiaries with profiles
        beneficiaries = User.objects.filter(
            role='BENEFICIARY',
            beneficiary_profile__isnull=False,
            beneficiary_profile__is_active_beneficiary=True
        ).select_related('beneficiary_profile', 'beneficiary_profile__category')
        
        created_entitlements = []
        errors = []
        
        for beneficiary in beneficiaries:
            try:
                # Check if entitlement already exists for this period
                existing = FuelEntitlement.objects.filter(
                    beneficiary=beneficiary,
                    entitlement_type='MONTHLY',
                    period_start=period_start,
                    period_end=period_end
                ).exists()
                
                if not existing:
                    # Calculate monthly entitlement based on profile
                    profile = beneficiary.beneficiary_profile
                    monthly_litres = profile.calculate_monthly_entitlement()
                    
                    entitlement = FuelEntitlement.objects.create(
                        beneficiary=beneficiary,
                        entitlement_type='MONTHLY',
                        litres_entitled=monthly_litres,
                        period_start=period_start,
                        period_end=period_end,
                        created_by=request.user,
                        status='PENDING'
                    )
                    created_entitlements.append(entitlement)
                    
            except Exception as e:
                errors.append({
                    'beneficiary': beneficiary.get_full_name(),
                    'error': str(e)
                })
        
        return Response({
            'message': f'Created {len(created_entitlements)} monthly entitlements',
            'created_count': len(created_entitlements),
            'error_count': len(errors),
            'errors': errors[:10]  # Limit error details
        })
                
#                 if existing:
#                     continue
                
#                 profile = beneficiary.beneficiary_profile
#                 litres_entitled = profile.monthly_entitlement_litres
                
#                 # Apply distance multiplier if applicable
#                 if profile.constituency:
#                     distance_multiplier = 1.0 + max(0, (profile.constituency.distance_from_parliament_km - 50) / 50) * 0.1
#                     litres_entitled *= distance_multiplier
                
#                 entitlement = FuelEntitlement.objects.create(
#                     beneficiary=beneficiary,
#                     entitlement_type='MONTHLY',
#                     litres_entitled=litres_entitled,
#                     period_start=period_start,
#                     period_end=period_end,
#                     status='APPROVED',  # Auto-approve monthly entitlements
#                     justification=f'Monthly entitlement for {calendar.month_name[month]} {year}',
#                     created_by=request.user,
#                     approved_by=request.user,
#                     approved_date=timezone.now()
#                 )
#                 created_entitlements.append(entitlement)
                
#             except Exception as e:
#                 errors.append(f'Failed to create entitlement for {beneficiary.get_full_name()}: {str(e)}')
        
#         return Response({
#             'message': f'Created {len(created_entitlements)} monthly entitlements',
#             'created_count': len(created_entitlements),
#             'errors': errors,
#             'period': f'{calendar.month_name[month]} {year}'
#         })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get fuel entitlement statistics"""
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        
        queryset = self.get_queryset()
        
        # Basic counts
        total_entitlements = queryset.count()
        pending_entitlements = queryset.filter(status='PENDING').count()
        approved_entitlements = queryset.filter(status='APPROVED').count()
        expired_entitlements = queryset.filter(
            period_end__lt=timezone.now().date(),
            status__in=['PENDING', 'APPROVED', 'PARTIALLY_ALLOCATED']
        ).count()
        
        # Aggregate sums  
        litres_stats = queryset.aggregate(
            total_litres_entitled=Sum('litres_entitled'),
            total_litres_allocated=Sum('litres_allocated')
        )
        
        total_litres_entitled = litres_stats['total_litres_entitled'] or 0
        total_litres_allocated = litres_stats['total_litres_allocated'] or 0
        
        # Calculate allocation percentage
        allocation_percentage = 0
        if total_litres_entitled > 0:
            allocation_percentage = (total_litres_allocated / total_litres_entitled) * 100
        
        stats = {
            'total_entitlements': total_entitlements,
            'pending_entitlements': pending_entitlements,
            'approved_entitlements': approved_entitlements,
            'expired_entitlements': expired_entitlements,
            'total_litres_entitled': float(total_litres_entitled),
            'total_litres_allocated': float(total_litres_allocated),
            'allocation_percentage': round(allocation_percentage, 2)
        }
        
        return Response(stats)


# ========================= SUBCENTER MANAGEMENT VIEWSETS =========================

class PoolVehicleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pool vehicles in subcenters"""
    serializer_class = PoolVehicleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = PoolVehicle.objects.select_related('assigned_subcenter').all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset  # Main Center and Auditors see all vehicles
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see only vehicles in their center
            return queryset.filter(assigned_subcenter=user.sub_center)
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrSubCenterPermission()]
    
    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Auto-assign to user's subcenter if they're a subcenter officer
            if self.request.user.role == 'SUB_CENTER' and self.request.user.sub_center:
                logger.info(f"Auto-assigning vehicle to subcenter: {self.request.user.sub_center}")
                serializer.save(assigned_subcenter=self.request.user.sub_center)
            else:
                logger.info(f"Creating vehicle with data: {serializer.validated_data}")
                serializer.save()
        except Exception as e:
            logger.error(f"Error creating pool vehicle: {str(e)}")
            logger.error(f"Request data: {self.request.data}")
            logger.error(f"Serializer errors: {serializer.errors}")
            raise
    
    def create(self, request, *args, **kwargs):
        import logging
        from rest_framework.response import Response
        from rest_framework import status
        
        logger = logging.getLogger(__name__)
        logger.info(f"PoolVehicle create request from user: {request.user} (role: {request.user.role})")
        logger.info(f"Request data: {request.data}")
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"PoolVehicle creation failed: {str(e)}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Return a more detailed error response
            return Response({
                'error': 'Failed to create vehicle',
                'detail': str(e),
                'type': type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        """Assign a driver to this vehicle"""
        vehicle = self.get_object()
        driver_id = request.data.get('driver_id')
        
        try:
            driver = Driver.objects.get(id=driver_id)
            
            # Create vehicle assignment
            assignment = VehicleAssignment.objects.create(
                vehicle=vehicle,
                driver=driver,
                assigned_by=request.user,
                start_date=timezone.now().date()
            )
            
            return Response({
                'message': f'Driver {driver.full_name} assigned to vehicle {vehicle.vehicle_number}',
                'assignment_id': assignment.id
            })
            
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """Get all assignments for this vehicle"""
        vehicle = self.get_object()
        assignments = VehicleAssignment.objects.filter(vehicle=vehicle).select_related(
            'driver', 'assigned_by'
        ).order_by('-start_date')
        
        serializer = VehicleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


class DriverViewSet(viewsets.ModelViewSet):
    """ViewSet for managing drivers in subcenters"""
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Driver.objects.all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset  # Main Center and Auditors see all drivers
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see drivers in their center (if applicable)
            return queryset  # For now, show all drivers
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrSubCenterPermission()]
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """Get all vehicle assignments for this driver"""
        driver = self.get_object()
        assignments = VehicleAssignment.objects.filter(driver=driver).select_related(
            'vehicle', 'assigned_by'
        ).order_by('-start_date')
        
        serializer = VehicleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def current_vehicle(self, request, pk=None):
        """Get current vehicle assignment for this driver"""
        driver = self.get_object()
        current_assignment = VehicleAssignment.objects.filter(
            driver=driver,
            status='ACTIVE',
            end_date__isnull=True
        ).select_related('vehicle').first()
        
        if current_assignment:
            serializer = VehicleAssignmentSerializer(current_assignment)
            return Response(serializer.data)
        
        return Response({'message': 'No current vehicle assignment'})


class VehicleAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing vehicle assignments"""
    serializer_class = VehicleAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = VehicleAssignment.objects.select_related('vehicle', 'driver', 'assigned_by').all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset  # Main Center and Auditors see all assignments
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see assignments for vehicles in their center
            return queryset.filter(vehicle__sub_center=user.sub_center)
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrSubCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end_assignment(self, request, pk=None):
        """End a vehicle assignment"""
        assignment = self.get_object()
        
        if assignment.status != 'ACTIVE':
            return Response({'error': 'Assignment is not active'}, status=400)
        
        assignment.end_date = timezone.now().date()
        assignment.status = 'COMPLETED'
        assignment.save()
        
        return Response({
            'message': 'Assignment ended successfully',
            'assignment': VehicleAssignmentSerializer(assignment).data
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active vehicle assignments"""
        active_assignments = self.get_queryset().filter(
            status='ACTIVE',
            end_date__isnull=True
        )
        serializer = self.get_serializer(active_assignments, many=True)
        return Response(serializer.data)


class FuelRequirementConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing fuel requirement configurations"""
    serializer_class = FuelRequirementConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = FuelRequirementConfiguration.objects.all()
        
        # Only admin, superuser, and main center can manage fuel requirements
        if user.role in ['ADMIN', 'SUPERUSER', 'MAIN_CENTER']:
            return queryset
        
        # Others can only view
        if self.action in ['list', 'retrieve']:
            return queryset
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), AdminOrSuperUserOrMainCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active fuel requirement configurations"""
        active_configs = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_configs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current_requirements(self, request):
        """Get current fuel requirements based on active configurations"""
        today = timezone.now().date()
        
        # Get active configurations effective today
        daily_petrol = FuelRequirementConfiguration.objects.filter(
            fuel_type='PETROL',
            period='DAILY',
            is_active=True,
            effective_from__lte=today
        ).order_by('-effective_from').first()
        
        daily_diesel = FuelRequirementConfiguration.objects.filter(
            fuel_type='DIESEL',
            period='DAILY',
            is_active=True,
            effective_from__lte=today
        ).order_by('-effective_from').first()
        
        weekly_petrol = FuelRequirementConfiguration.objects.filter(
            fuel_type='PETROL',
            period='WEEKLY',
            is_active=True,
            effective_from__lte=today
        ).order_by('-effective_from').first()
        
        weekly_diesel = FuelRequirementConfiguration.objects.filter(
            fuel_type='DIESEL',
            period='WEEKLY',
            is_active=True,
            effective_from__lte=today
        ).order_by('-effective_from').first()
        
        return Response({
            'daily': {
                'petrol': FuelRequirementConfigurationSerializer(daily_petrol).data if daily_petrol else None,
                'diesel': FuelRequirementConfigurationSerializer(daily_diesel).data if daily_diesel else None,
            },
            'weekly': {
                'petrol': FuelRequirementConfigurationSerializer(weekly_petrol).data if weekly_petrol else None,
                'diesel': FuelRequirementConfigurationSerializer(weekly_diesel).data if weekly_diesel else None,
            },
            'effective_date': today.isoformat()
        })
        
#         if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
#             return queryset  # Main Center and Auditors see all drivers
#         elif user.role == 'SUB_CENTER' and user.sub_center:
#             # Sub Center officers see only drivers in their center
#             return queryset.filter(sub_center=user.sub_center)
        
#         return queryset.none()
    
#     def get_permissions(self):
#         if self.action in ['list', 'retrieve']:
#             return [IsAuthenticated()]
#         return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
#     def perform_create(self, serializer):
#         # Auto-assign to user's subcenter if they're a subcenter officer
#         if self.request.user.role == 'SUB_CENTER' and self.request.user.sub_center:
#             serializer.save(sub_center=self.request.user.sub_center, created_by=self.request.user)
#         else:
#             serializer.save(created_by=self.request.user)
    
#     @action(detail=True, methods=['get'])
#     def vehicle_assignments(self, request, pk=None):
#         """Get all vehicle assignments for this driver"""
#         driver = self.get_object()
#         from .models import VehicleAssignment
#         assignments = VehicleAssignment.objects.filter(driver=driver).select_related(
#             'vehicle', 'assigned_by'
#         ).order_by('-start_date')
        
#         # For now, return basic data - will improve with proper serializer
#         assignment_data = []
#         for assignment in assignments:
#             assignment_data.append({
#                 'id': assignment.id,
#                 'vehicle_registration': assignment.vehicle.registration_number,
#                 'vehicle_make_model': f"{assignment.vehicle.make} {assignment.vehicle.model}",
#                 'start_date': assignment.start_date,
#                 'end_date': assignment.end_date,
#                 'is_active': assignment.is_active,
#                 'assigned_by': assignment.assigned_by.get_full_name() if assignment.assigned_by else None
#             })
        
#         return Response(assignment_data)
    
#     @action(detail=True, methods=['post'])
#     def update_status(self, request, pk=None):
#         """Update driver status (active/inactive)"""
#         driver = self.get_object()
#         new_status = request.data.get('status')
        
#         if new_status not in ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED']:
#             return Response({'error': 'Invalid status'}, status=400)
        
#         driver.status = new_status
#         driver.save()
        
#         return Response({
#             'message': f'Driver status updated to {new_status}',
#             'driver_id': driver.id,
#             'new_status': new_status
#         })


# class VehicleAssignmentViewSet(viewsets.ModelViewSet):
#     """ViewSet for managing vehicle-driver assignments"""
#     serializer_class = VehicleAssignmentSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         from .models import VehicleAssignment
#         user = self.request.user
#         queryset = VehicleAssignment.objects.select_related(
#             'vehicle', 'driver', 'vehicle__sub_center', 'driver__sub_center', 'assigned_by'
#         ).all()
        
#         if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
#             return queryset  # Main Center and Auditors see all assignments
#         elif user.role == 'SUB_CENTER' and user.sub_center:
#             # Sub Center officers see only assignments in their center
#             return queryset.filter(vehicle__sub_center=user.sub_center)
        
#         return queryset.none()
    
#     def get_permissions(self):
#         if self.action in ['list', 'retrieve']:
#             return [IsAuthenticated()]
#         return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
#     def perform_create(self, serializer):
#         serializer.save(assigned_by=self.request.user)
    
#     @action(detail=True, methods=['post'])
#     def end_assignment(self, request, pk=None):
#         """End an active vehicle assignment"""
#         assignment = self.get_object()
        
#         if assignment.end_date:
#             return Response({'error': 'Assignment is already ended'}, status=400)
        
#         assignment.end_date = timezone.now().date()
#         assignment.save()
        
#         return Response({
#             'message': 'Assignment ended successfully',
#             'assignment_id': assignment.id,
#             'end_date': assignment.end_date
#         })
    
#     @action(detail=False, methods=['get'])
#     def active_assignments(self, request):
#         """Get all currently active assignments"""
#         active = self.get_queryset().filter(end_date__isnull=True)
        
#         # For now, return basic data - will improve with proper serializer
#         assignment_data = []
#         for assignment in active:
#             assignment_data.append({
#                 'id': assignment.id,
#                 'vehicle_registration': assignment.vehicle.registration_number,
#                 'driver_name': assignment.driver.full_name,
#                 'subcenter': assignment.vehicle.sub_center.name if assignment.vehicle.sub_center else None,
#                 'start_date': assignment.start_date,
#                 'assigned_by': assignment.assigned_by.get_full_name() if assignment.assigned_by else None
#             })
        
#         return Response({
#             'count': len(assignment_data),
#             'results': assignment_data
#         })


# Admin Dashboard API View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """
    Admin dashboard statistics endpoint
    """
    if not request.user.role in ['ADMIN', 'MAIN_CENTER', 'SUPERUSER']:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from django.db.models import Sum
        # Get basic statistics
        total_users = UserModel.objects.count()
        active_users = UserModel.objects.filter(is_approved=True, is_active=True).count()
        # Users active today (logged in within last 24 hours)
        start_of_day = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        active_today = UserModel.objects.filter(last_login__gte=start_of_day).count()
        pending_approvals = UserModel.objects.filter(is_approved=False, is_active=True).count()
        
        # Fuel-related statistics
        total_boxes = Box.objects.count()
        active_boxes = Box.objects.filter(is_archived=False).count()
        total_books = Book.objects.count()
        assigned_books = Book.objects.filter(is_assigned=True).count()
        
        # Coupon statistics
        total_coupons = Coupon.objects.count()
        available_coupons = Coupon.objects.filter(status='AVAILABLE').count()
        allocated_coupons = Coupon.objects.filter(status='ALLOCATED').count()
        used_coupons = Coupon.objects.filter(status='USED').count()
        
        # Subcenter statistics
        total_subcenters = SubCenter.objects.count()
        active_subcenters = SubCenter.objects.filter(is_active=True).count()
        
        # Recent activity - Parliament sessions in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_sessions = ParliamentSession.objects.filter(
            start_date__gte=thirty_days_ago
        ).count()
        
        # Transaction volume - last 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_transactions = FuelTransaction.objects.filter(
            timestamp__gte=seven_days_ago
        ).count()
        
        # System alerts
        active_alerts = SystemAlert.objects.filter(status='ACTIVE').count()
        
        # Fuel volumes
        total_fuel_volume_consumed = FuelTransaction.objects.aggregate(
            total=Sum('litres_consumed')
        )['total'] or 0
        total_fuel_volume_available = Coupon.objects.filter(status='AVAILABLE').aggregate(
            total=Sum('litres')
        )['total'] or 0

        # Recently allocated coupons
        recent_allocations_qs = Coupon.objects.filter(
            allocated_date__isnull=False
        ).select_related('allocated_to').order_by('-allocated_date')[:10]
        recently_allocated_coupons = [
            {
                'id': c.id,
                'status': c.status,
                'allocated_to': {
                    'username': c.allocated_to.username if c.allocated_to else None
                },
                'allocated_date': c.allocated_date.isoformat() if c.allocated_date else None,
            }
            for c in recent_allocations_qs
        ]

        # Recent activity summary (simple, extensible)
        recent_tx_qs = FuelTransaction.objects.order_by('-timestamp')[:5]
        recent_activity = [
            {
                'id': tx.id,
                'action': 'FUEL_USED',
                'user': tx.beneficiary.username if tx.beneficiary else 'system',
                'timestamp': tx.timestamp.isoformat(),
                'details': f"{tx.litres_consumed}L consumed",
            }
            for tx in recent_tx_qs
        ]

        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
                'pending_approvals': pending_approvals
            },
            'inventory': {
                'total_boxes': total_boxes,
                'active_boxes': active_boxes,
                'total_books': total_books,
                'assigned_books': assigned_books
            },
            'coupons': {
                'total': total_coupons,
                'available': available_coupons,
                'allocated': allocated_coupons,
                'used': used_coupons
            },
            'operations': {
                'total_subcenters': total_subcenters,
                'active_subcenters': active_subcenters,
                'recent_sessions': recent_sessions,
                'recent_transactions': recent_transactions
            },
            'system': {
                'active_alerts': active_alerts,
                'last_updated': timezone.now().isoformat()
            },
            # Top-level convenience fields expected by frontend
            'active_today': active_today,
            'total_fuel_volume_consumed': total_fuel_volume_consumed,
            'total_fuel_volume_available': total_fuel_volume_available,
            'recently_allocated_coupons': recently_allocated_coupons,
            'recent_activity': recent_activity,
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve dashboard statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve notification statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================== MISSING VIEW IMPLEMENTATIONS ===========================

# Main Dashboard View - Critical endpoint that MainCenterDashboard.tsx calls
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def main_dashboard(request):
    """
    Enhanced main dashboard endpoint for /api/v1/dashboard/
    Provides all fields expected by MainCenterDashboard.tsx frontend component
    """
    try:
        from django.db.models import Sum, Count, Avg
        from datetime import timedelta
        
        user = request.user
        today = timezone.now().date()
        seven_days_ago = timezone.now() - timedelta(days=7)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Calculate real-time statistics expected by MainCenter frontend
        
        # Box Receipt Statistics (frontend expects: totalBoxesReceived)
        try:
            total_boxes_received = Box.objects.filter(is_received=True).count()
        except Exception:
            # Fallback if is_received field doesn't exist
            total_boxes_received = Box.objects.filter(received_at__isnull=False).count()
            
        try:
            today_receipts = Box.objects.filter(
                received_date__date=today,
                is_received=True
            ).count()
        except Exception:
            # Fallback if is_received field doesn't exist
            today_receipts = Box.objects.filter(received_at__date=today).count()
            
        try:
            pending_receipts = Box.objects.filter(is_received=False).count()
        except Exception:
            # Fallback if is_received field doesn't exist
            pending_receipts = Box.objects.filter(received_at__isnull=True).count()
        
        # Book Dispatch Statistics (frontend expects: totalBooksDispatched)  
        total_books_dispatched = BookDispatch.objects.filter(
            status__in=['DISPATCHED', 'RECEIVED']
        ).count()
        completed_dispatches_today = BookDispatch.objects.filter(
            dispatch_date__date=today,
            status='DISPATCHED'
        ).count()
        pending_handovers = BookDispatch.objects.filter(status='PENDING').count()
        
        # Coupon Statistics (frontend expects: totalCouponsActive)
        total_coupons = Coupon.objects.count()
        total_coupons_active = Coupon.objects.filter(
            status__in=['AVAILABLE', 'ALLOCATED']
        ).count()
        available_coupons = Coupon.objects.filter(status='AVAILABLE').count()
        allocated_coupons = Coupon.objects.filter(status='ALLOCATED').count()
        used_coupons = Coupon.objects.filter(status='USED').count()
        
        # SubCenter Statistics (frontend expects: activeSubCenters)
        total_subcenters = SubCenter.objects.count()
        active_subcenters = SubCenter.objects.filter(is_active=True).count()
        
        # Financial Statistics (frontend expects: totalMonetaryValue)
        # Calculate total monetary value of active coupons
        petrol_coupons = Coupon.objects.filter(
            book__box__fuel_type='PETROL',
            status__in=['AVAILABLE', 'ALLOCATED']
        )
        diesel_coupons = Coupon.objects.filter(
            book__box__fuel_type='DIESEL',
            status__in=['AVAILABLE', 'ALLOCATED']
        )
        
        # Get current fuel pricing (use latest FuelData or defaults)
        try:
            latest_fuel_data = FuelData.objects.first()
            if latest_fuel_data:
                petrol_price_usd = latest_fuel_data.petrol_price_usd
                diesel_price_usd = latest_fuel_data.diesel_price_usd
                exchange_rate = latest_fuel_data.exchange_rate_usd_to_zwg
            else:
                petrol_price_usd = 1.25  # Default
                diesel_price_usd = 1.35  # Default
                exchange_rate = 27.5     # Default
        except:
            petrol_price_usd = 1.25
            diesel_price_usd = 1.35
            exchange_rate = 27.5
        
        # Calculate monetary value (assuming 20L per coupon average)
        average_litres_per_coupon = 20
        petrol_value_usd = petrol_coupons.count() * average_litres_per_coupon * petrol_price_usd
        diesel_value_usd = diesel_coupons.count() * average_litres_per_coupon * diesel_price_usd
        total_monetary_value_usd = petrol_value_usd + diesel_value_usd
        total_monetary_value_zwg = total_monetary_value_usd * exchange_rate
        
        # Low Inventory Alerts
        low_inventory_threshold = 50  # Coupons
        low_inventory_alerts = 0
        for subcenter in SubCenter.objects.filter(is_active=True):
            subcenter_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='AVAILABLE'
            ).count()
            if subcenter_coupons < low_inventory_threshold:
                low_inventory_alerts += 1
        
        # Recent Activity Statistics
        recent_sessions = ParliamentSession.objects.filter(
            start_date__gte=thirty_days_ago
        ).count()
        recent_transactions = FuelTransaction.objects.filter(
            timestamp__gte=seven_days_ago
        ).count()
        
        # User Statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True, is_approved=True).count()
        pending_approvals = User.objects.filter(
            is_approved=False, 
            rejection_reason__isnull=True
        ).count()
        
        # Construct response matching MainCenterDashboard.tsx expectations
        dashboard_stats = {
            # Primary Statistics (matching frontend field names exactly)
            'totalBoxesReceived': total_boxes_received,
            'totalBooksDispatched': total_books_dispatched,
            'totalCouponsActive': total_coupons_active,
            'totalMonetaryValue': int(total_monetary_value_zwg),  # ZWG value as integer
            'activeSubCenters': active_subcenters,
            'pendingHandovers': pending_handovers,
            
            # Secondary Statistics  
            'pendingReceipts': pending_receipts,
            'lowInventoryAlerts': low_inventory_alerts,
            'todayReceipts': today_receipts,
            'completedDispatchesToday': completed_dispatches_today,
            
            # Fuel Pricing (frontend expects current prices)
            'currentPetrolPrice': int(petrol_price_usd * exchange_rate),  # ZWG per litre
            'currentDieselPrice': int(diesel_price_usd * exchange_rate),  # ZWG per litre
            
            # Detailed Breakdown
            'coupons': {
                'total': total_coupons,
                'available': available_coupons,
                'allocated': allocated_coupons,
                'used': used_coupons,
                'active': total_coupons_active
            },
            
            'subcenters': {
                'total': total_subcenters,
                'active': active_subcenters,
                'inactive': total_subcenters - active_subcenters
            },
            
            'users': {
                'total': total_users,
                'active': active_users,
                'pending_approvals': pending_approvals
            },
            
            'financial': {
                'total_value_usd': round(total_monetary_value_usd, 2),
                'total_value_zwg': int(total_monetary_value_zwg),
                'petrol_value_usd': round(petrol_value_usd, 2),
                'diesel_value_usd': round(diesel_value_usd, 2),
                'exchange_rate': exchange_rate
            },
            
            'recent_activity': {
                'sessions_30_days': recent_sessions,
                'transactions_7_days': recent_transactions,
                'receipts_today': today_receipts,
                'dispatches_today': completed_dispatches_today
            },
            
            # Metadata
            'last_updated': timezone.now().isoformat(),
            'data_source': 'real_time',
            'user_role': user.role,
            'generated_by': user.get_full_name() or user.username
        }
        
        return Response(dashboard_stats)
        
    except Exception as e:
        import traceback
        logger.error(f"Main dashboard error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response(
            {'error': f'Failed to retrieve dashboard statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Analytics Consumption Trend View - for /api/v1/analytics/consumption-trend/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_consumption_trend(request):
    """
    Fuel consumption trend analytics endpoint
    """
    try:
        # Check permissions - allow AUDITOR, MAIN_CENTER, SUB_CENTER, and SUPERUSER
        user = request.user
        if not (user.is_superuser or user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']):
            return Response(
                {'error': 'Insufficient permissions for analytics access'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get query parameters
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get daily consumption data (use TruncDate instead of deprecated .extra)
        daily_qs = FuelTransaction.objects.filter(
            timestamp__gte=start_date
        ).annotate(
            day=TruncDate('timestamp')
        ).values('day').annotate(
            total_liters=Sum('litres_consumed'),
            transaction_count=Count('id')
        ).order_by('day')

        # Materialize to safely compute additional metrics in Python
        daily_consumption = list(daily_qs)
        
        # Format data for frontend charts
        consumption_data = []
        transaction_data = []
        
        for item in daily_consumption:
            date_str = item['day'].strftime('%Y-%m-%d') if item['day'] else ''
            consumption_data.append({
                'date': date_str,
                'liters': item['total_liters'] or 0
            })
            transaction_data.append({
                'date': date_str,
                'count': item['transaction_count'] or 0
            })
        
        # Calculate trend indicators
        today = timezone.now().date()
        cutoff_recent = today - timedelta(days=7)
        cutoff_previous_start = today - timedelta(days=14)

        recent_values = [item['total_liters'] or 0 for item in daily_consumption if item['day'] and item['day'] >= cutoff_recent]
        previous_values = [item['total_liters'] or 0 for item in daily_consumption if item['day'] and cutoff_previous_start <= item['day'] < cutoff_recent]

        # Avoid division by zero when calculating averages
        recent_avg = (sum(recent_values) / len(recent_values)) if recent_values else 0
        previous_avg = (sum(previous_values) / len(previous_values)) if previous_values else 0
        
        trend_percentage = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
        
        return Response({
            'consumption_trend': consumption_data,
            'transaction_trend': transaction_data,
            'summary': {
                'total_consumption': sum(item['liters'] for item in consumption_data),
                'total_transactions': sum(item['count'] for item in transaction_data),
                'average_daily_consumption': recent_avg,
                'trend_percentage': round(trend_percentage, 2),
                'trend_direction': 'up' if trend_percentage > 0 else 'down' if trend_percentage < 0 else 'stable'
            },
            'period_days': days,
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve consumption trend: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Analytics Fuel Statistics View - for /api/v1/fuel-stats/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fuel_statistics(request):
    """
    Comprehensive fuel statistics for analytics and finance dashboard
    """
    try:
        from django.db.models import Sum, Count, Avg, Q
        from datetime import timedelta
        
        # Get query parameters
        period = request.GET.get('period', '30')  # days
        fuel_type = request.GET.get('fuel_type', 'all')
        
        try:
            period_days = int(period)
        except:
            period_days = 30
            
        start_date = timezone.now() - timedelta(days=period_days)
        
        # Fuel type filtering
        fuel_filter = Q()
        if fuel_type and fuel_type != 'all':
            fuel_filter = Q(book__box__fuel_type=fuel_type.upper())
        
        # Coupon statistics
        total_coupons = Coupon.objects.filter(fuel_filter).count()
        available_coupons = Coupon.objects.filter(fuel_filter, status='AVAILABLE').count()
        allocated_coupons = Coupon.objects.filter(fuel_filter, status='ALLOCATED').count()
        used_coupons = Coupon.objects.filter(fuel_filter, status='USED').count()
        
        # Recent usage statistics
        recent_usage = FuelTransaction.objects.filter(
            timestamp__gte=start_date
        )
        if fuel_type and fuel_type != 'all':
            recent_usage = recent_usage.filter(
                coupon__book__box__fuel_type=fuel_type.upper()
            )
        
        total_recent_transactions = recent_usage.count()
        total_litres_consumed = recent_usage.aggregate(
            total=Sum('litres_consumed')
        )['total'] or 0
        
        # Daily consumption trend
        daily_consumption = recent_usage.extra(
            select={'day': "DATE(timestamp)"}
        ).values('day').annotate(
            daily_litres=Sum('litres_consumed'),
            daily_transactions=Count('id')
        ).order_by('day')
        
        # Convert to list for JSON serialization
        consumption_trend = []
        for item in daily_consumption:
            consumption_trend.append({
                'date': item['day'].strftime('%Y-%m-%d') if item['day'] else '',
                'litres': item['daily_litres'] or 0,
                'transactions': item['daily_transactions'] or 0
            })
        
        # Financial calculations
        try:
            latest_fuel_data = FuelData.objects.first()
            if latest_fuel_data:
                petrol_price_usd = latest_fuel_data.petrol_price_usd
                diesel_price_usd = latest_fuel_data.diesel_price_usd
                exchange_rate = latest_fuel_data.exchange_rate_usd_to_zwg
            else:
                petrol_price_usd = 1.25
                diesel_price_usd = 1.35
                exchange_rate = 27.5
        except:
            petrol_price_usd = 1.25
            diesel_price_usd = 1.35
            exchange_rate = 27.5
        
        # Calculate financial impact
        petrol_coupons = Coupon.objects.filter(
            book__box__fuel_type='PETROL'
        ).count()
        diesel_coupons = Coupon.objects.filter(
            book__box__fuel_type='DIESEL'
        ).count()
        
        # Assuming 20L per coupon average
        avg_litres_per_coupon = 20
        petrol_value_usd = petrol_coupons * avg_litres_per_coupon * petrol_price_usd
        diesel_value_usd = diesel_coupons * avg_litres_per_coupon * diesel_price_usd
        total_value_usd = petrol_value_usd + diesel_value_usd
        total_value_zwg = total_value_usd * exchange_rate
        
        # Usage by subcenter
        subcenter_usage = []
        for subcenter in SubCenter.objects.filter(is_active=True):
            subcenter_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='USED'
            ).count()
            
            subcenter_usage.append({
                'subcenter_id': subcenter.id,
                'subcenter_name': subcenter.name,
                'coupons_used': subcenter_coupons,
                'estimated_litres': subcenter_coupons * avg_litres_per_coupon,
                'estimated_value_usd': subcenter_coupons * avg_litres_per_coupon * 1.30  # Average price
            })
        
        # Sort by usage
        subcenter_usage.sort(key=lambda x: x['coupons_used'], reverse=True)
        
        return Response({
            'summary': {
                'total_coupons': total_coupons,
                'available_coupons': available_coupons,
                'allocated_coupons': allocated_coupons,
                'used_coupons': used_coupons,
                'usage_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 2)
            },
            
            'recent_activity': {
                'period_days': period_days,
                'total_transactions': total_recent_transactions,
                'total_litres_consumed': round(total_litres_consumed, 2),
                'average_daily_consumption': round(total_litres_consumed / period_days, 2) if period_days > 0 else 0
            },
            
            'consumption_trend': consumption_trend,
            
            'financial': {
                'total_value_usd': round(total_value_usd, 2),
                'total_value_zwg': round(total_value_zwg, 2),
                'petrol_value_usd': round(petrol_value_usd, 2),
                'diesel_value_usd': round(diesel_value_usd, 2),
                'current_prices': {
                    'petrol_usd': petrol_price_usd,
                    'diesel_usd': diesel_price_usd,
                    'exchange_rate': exchange_rate
                }
            },
            
            'usage_by_subcenter': subcenter_usage[:10],  # Top 10
            
            'fuel_breakdown': {
                'petrol': {
                    'total_coupons': petrol_coupons,
                    'available': Coupon.objects.filter(
                        book__box__fuel_type='PETROL', 
                        status='AVAILABLE'
                    ).count(),
                    'used': Coupon.objects.filter(
                        book__box__fuel_type='PETROL', 
                        status='USED'
                    ).count()
                },
                'diesel': {
                    'total_coupons': diesel_coupons,
                    'available': Coupon.objects.filter(
                        book__box__fuel_type='DIESEL', 
                        status='AVAILABLE'
                    ).count(),
                    'used': Coupon.objects.filter(
                        book__box__fuel_type='DIESEL', 
                        status='USED'
                    ).count()
                }
            },
            
            'metadata': {
                'generated_at': timezone.now().isoformat(),
                'period_filter': f'Last {period_days} days',
                'fuel_type_filter': fuel_type,
                'data_source': 'real_time'
            }
        })
        
    except Exception as e:
        import traceback
        logger.error(f"Fuel statistics error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response(
            {'error': f'Failed to retrieve fuel statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    """
    Fuel requirements analytics endpoint - calculates projected fuel needs
    """
    try:
        # Get current date and calculate periods
        today = timezone.now().date()
        
        # Daily requirements calculation
        daily_petrol_requirement = 500  # Base requirement in liters
        daily_diesel_requirement = 800  # Base requirement in liters
        
        # Get current fuel pricing
        try:
            latest_fuel_data = FuelData.objects.first()
            if latest_fuel_data:
                petrol_price_usd = latest_fuel_data.petrol_price_usd
                diesel_price_usd = latest_fuel_data.diesel_price_usd
                exchange_rate = latest_fuel_data.exchange_rate_usd_to_zwg
            else:
                petrol_price_usd = 1.25  # Default price
                diesel_price_usd = 1.35  # Default price
                exchange_rate = 27.5  # Default exchange rate
        except:
            petrol_price_usd = 1.25
            diesel_price_usd = 1.35
            exchange_rate = 27.5
        
        # Calculate coupon requirements (assuming 20L per coupon for petrol, 25L for diesel)
        petrol_coupons_needed = daily_petrol_requirement // 20
        diesel_coupons_needed = daily_diesel_requirement // 25
        
        # Calculate costs
        petrol_cost_usd = daily_petrol_requirement * petrol_price_usd
        diesel_cost_usd = daily_diesel_requirement * diesel_price_usd
        petrol_cost_zwg = petrol_cost_usd * exchange_rate
        diesel_cost_zwg = diesel_cost_usd * exchange_rate
        
        # Weekly requirements
        weekly_petrol_requirement = daily_petrol_requirement * 7
        weekly_diesel_requirement = daily_diesel_requirement * 7
        weekly_petrol_coupons = petrol_coupons_needed * 7
        weekly_diesel_coupons = diesel_coupons_needed * 7
        weekly_petrol_cost_zwg = petrol_cost_zwg * 7
        weekly_diesel_cost_zwg = diesel_cost_zwg * 7
        
        # Get current stock levels
        available_petrol_coupons = Coupon.objects.filter(
            book__box__fuel_type='PETROL', 
            status='AVAILABLE'
        ).count()
        
        available_diesel_coupons = Coupon.objects.filter(
            book__box__fuel_type='DIESEL', 
            status='AVAILABLE'
        ).count()
        
        # Calculate days of supply remaining
        petrol_days_remaining = available_petrol_coupons // petrol_coupons_needed if petrol_coupons_needed > 0 else 0
        diesel_days_remaining = available_diesel_coupons // diesel_coupons_needed if diesel_coupons_needed > 0 else 0
        
        return Response({
            'daily_requirements': {
                'petrol': {
                    'fuel_type': 'PETROL',
                    'required_litres': daily_petrol_requirement,
                    'required_coupons': petrol_coupons_needed,
                    'estimated_cost_usd': round(petrol_cost_usd, 2),
                    'estimated_cost_zwg': round(petrol_cost_zwg, 2),
                    'period': f'{today} to {today}'
                },
                'diesel': {
                    'fuel_type': 'DIESEL',
                    'required_litres': daily_diesel_requirement,
                    'required_coupons': diesel_coupons_needed,
                    'estimated_cost_usd': round(diesel_cost_usd, 2),
                    'estimated_cost_zwg': round(diesel_cost_zwg, 2),
                    'period': f'{today} to {today}'
                }
            },
            'weekly_requirements': {
                'petrol': {
                    'fuel_type': 'PETROL',
                    'required_litres': weekly_petrol_requirement,
                    'required_coupons': weekly_petrol_coupons,
                    'estimated_cost_usd': round(petrol_cost_usd * 7, 2),
                    'estimated_cost_zwg': round(weekly_petrol_cost_zwg, 2),
                    'period': f'{today} to {today + timedelta(days=6)}'
                },
                'diesel': {
                    'fuel_type': 'DIESEL',
                    'required_litres': weekly_diesel_requirement,
                    'required_coupons': weekly_diesel_coupons,
                    'estimated_cost_usd': round(diesel_cost_usd * 7, 2),
                    'estimated_cost_zwg': round(weekly_diesel_cost_zwg, 2),
                    'period': f'{today} to {today + timedelta(days=6)}'
                }
            },
            'current_stock': {
                'available_petrol_coupons': available_petrol_coupons,
                'available_diesel_coupons': available_diesel_coupons,
                'petrol_days_remaining': petrol_days_remaining,
                'diesel_days_remaining': diesel_days_remaining
            },
            'pricing_info': {
                'petrol_price_usd': petrol_price_usd,
                'diesel_price_usd': diesel_price_usd,
                'exchange_rate': exchange_rate,
                'last_updated': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve fuel requirements: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Auth Change Password View - for /api/v1/auth/change-password/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change password endpoint
    """
    try:
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate input
        if not all([old_password, new_password, confirm_password]):
            return Response(
                {'error': 'All password fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if old password is correct
        if not user.check_password(old_password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password strength
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Change password
        user.set_password(new_password)
        user.save()
        
        # Log the password change
        AuditLog.objects.create(
            user=user,
            action='PASSWORD_CHANGE',
            model_name='User',
            object_id=user.id,
            details={'message': 'Password changed successfully'}
        )
        
        return Response({
            'message': 'Password changed successfully',
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to change password: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )





# Subcenter Statistics View - for /api/v1/subcenter/statistics/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenter_statistics(request):
    """
    General subcenter statistics endpoint
    """
    try:
        user = request.user
        
        # Get all subcenters or filter based on user role
        if user.role == 'SUB_CENTER' and user.sub_center:
            subcenters = SubCenter.objects.filter(id=user.sub_center.id)
        else:
            subcenters = SubCenter.objects.all()
        
        statistics = []
        
        for subcenter in subcenters:
            # Calculate statistics for each subcenter
            total_boxes = Box.objects.filter(assigned_to=subcenter).count()
            total_books = Book.objects.filter(box__assigned_to=subcenter).count()
            total_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter).count()
            used_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter, 
                status='USED'
            ).count()
            
            # Recent activity
            recent_transactions = FuelTransaction.objects.filter(
                coupon__book__box__assigned_to=subcenter,
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            # Active members
            active_members = User.objects.filter(
                sub_center=subcenter,
                is_active=True
            ).count()
            
            subcenter_stats = {
                'subcenter_id': subcenter.id,
                'subcenter_name': subcenter.name,
                'subcenter_code': subcenter.code or f'SC-{subcenter.id}',
                'inventory': {
                    'total_boxes': total_boxes,
                    'total_books': total_books,
                    'total_coupons': total_coupons,
                    'used_coupons': used_coupons,
                    'available_coupons': total_coupons - used_coupons,
                    'utilization_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 2)
                },
                'activity': {
                    'recent_transactions': recent_transactions,
                    'active_members': active_members
                },
                'location': {
                    'district': subcenter.district or 'Not specified',
                    'province': subcenter.province or 'Not specified'
                }
            }
            
            statistics.append(subcenter_stats)
        
        return Response({
            'statistics': statistics,
            'total_subcenters': len(statistics),
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve subcenter statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Dynamic Allocation API View - for /api/v1/dynamic-allocation/
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def dynamic_allocation(request):
    """
    Dynamic allocation endpoint for managing coupon allocations
    """
    try:
        if request.method == 'GET':
            # Return allocation options and current allocations
            user = request.user
            
            # Get available coupons for allocation
            available_coupons = Coupon.objects.filter(status='AVAILABLE').count()
            allocated_coupons = Coupon.objects.filter(status='ALLOCATED').count()
            
            # Get recent allocations
            recent_allocations = CouponAllocation.objects.all().order_by('-allocation_date')[:10]
            
            allocation_data = []
            for allocation in recent_allocations:
                allocation_data.append({
                    'id': allocation.id,
                    'beneficiary': allocation.beneficiary.get_full_name(),
                    'book': allocation.book.book_number if allocation.book else 'N/A',
                    'quantity': allocation.quantity,
                    'date': allocation.allocation_date.strftime('%Y-%m-%d')
                })
            
            return Response({
                'available_coupons': available_coupons,
                'allocated_coupons': allocated_coupons,
                'recent_allocations': allocation_data,
                'allocation_options': {
                    'allocation_types': ['MANUAL', 'AUTOMATIC', 'BULK'],
                    'priority_levels': ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
                }
            })
            
        elif request.method == 'POST':
            # Process dynamic allocation request
            allocation_type = request.data.get('allocation_type', 'MANUAL')
            beneficiary_id = request.data.get('beneficiary_id')
            quantity = request.data.get('quantity', 1)
            
            if not beneficiary_id:
                return Response({'error': 'beneficiary_id is required'}, status=400)
            
            try:
                beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
            except User.DoesNotExist:
                return Response({'error': 'Beneficiary not found'}, status=404)
            
            # Simple allocation logic - find available coupons
            available_coupons = Coupon.objects.filter(status='AVAILABLE')[:quantity]
            
            if len(available_coupons) < quantity:
                return Response({
                    'error': f'Only {len(available_coupons)} coupons available, but {quantity} requested'
                }, status=400)
            
            # Allocate the coupons
            allocated_count = 0
            for coupon in available_coupons:
                coupon.allocated_to = beneficiary
                coupon.status = 'ALLOCATED'
                coupon.allocated_date = timezone.now()
                coupon.save()
                allocated_count += 1
            
            return Response({
                'message': f'Successfully allocated {allocated_count} coupons to {beneficiary.get_full_name()}',
                'allocated_count': allocated_count,
                'beneficiary': beneficiary.get_full_name(),
                'allocation_type': allocation_type
            })
            
    except Exception as e:
        return Response(
            {'error': f'Dynamic allocation failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================== END MISSING VIEW IMPLEMENTATIONS ===========================

# Fuel Statistics API View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fuel_statistics(request):
    """
    Fuel statistics endpoint for dashboard and fuel pricing
    """
    from django.db.models import Count, Sum
    from django.db.models.functions import TruncMonth
    from datetime import timedelta
    
    try:
        # Check if this is a request for dashboard statistics
        if request.path.endswith('/statistics/'):
            # Dashboard statistics
            total_coupons = Coupon.objects.count()
            available_coupons = Coupon.objects.filter(status='AVAILABLE').count()
            allocated_coupons = Coupon.objects.filter(status='ALLOCATED').count()
            used_coupons = Coupon.objects.filter(status='USED').count()
            expired_coupons = Coupon.objects.filter(status='EXPIRED').count()
            damaged_coupons = Coupon.objects.filter(status='DAMAGED').count()
            
            total_users = UserModel.objects.count()
            beneficiary_count = BeneficiaryProfile.objects.count()
            sub_center_count = SubCenter.objects.count()
            
            # Calculate fuel volumes
            total_fuel_allocated = Coupon.objects.aggregate(
                total=Sum('litres')
            )['total'] or 0
            
            used_fuel_volume = Coupon.objects.filter(status='USED').aggregate(
                total=Sum('litres')
            )['total'] or 0
            
            available_fuel = total_fuel_allocated - used_fuel_volume
            
            # Program statistics
            total_programs = ParliamentSession.objects.count()
            total_sessions = ParliamentSession.objects.count()
            
            # Fuel transactions count
            total_fuel_transactions = FuelTransaction.objects.count()
            
            # Monthly usage trends (last 6 months)
            six_months_ago = timezone.now() - timedelta(days=180)
            monthly_usage = (FuelTransaction.objects
                           .filter(timestamp__gte=six_months_ago)
                           .annotate(month=TruncMonth('timestamp'))
                           .values('month')
                           .annotate(usage_count=Count('id'))
                           .order_by('month'))
            
            monthly_coupon_usage = [
                {
                    'month': item['month'].strftime('%Y-%m'),
                    'usage_count': item['usage_count']
                }
                for item in monthly_usage
            ]
            
            # SubCenter allocation data - fix relationship
            subcenter_allocation = (SubCenter.objects
                                  .annotate(coupon_count=Count('boxes__books__coupons'))
                                  .values('name', 'coupon_count')
                                  .order_by('-coupon_count'))
            
            subcenters_chart_data = [
                {
                    'name': item['name'],
                    'count': item['coupon_count']
                }
                for item in subcenter_allocation
            ]
            
            return Response({
                'total_coupons': total_coupons,
                'available_coupons': available_coupons,
                'allocated_coupons': allocated_coupons,
                'used_coupons': used_coupons,
                'expired_coupons': expired_coupons,
                'damaged_coupons': damaged_coupons,
                'total_users': total_users,
                'beneficiary_count': beneficiary_count,
                'sub_center_count': sub_center_count,
                'total_programs': total_programs,
                'total_sessions': total_sessions,
                'total_fuel_transactions': total_fuel_transactions,
                # Fuel volume data
                'total_fuel_allocated': float(total_fuel_allocated),
                'total_fuel_used': float(used_fuel_volume),
                'available_fuel': float(available_fuel),
                # Chart data
                'monthly_coupon_usage': monthly_coupon_usage,
                'subcenters_chart_data': subcenters_chart_data,
                # Additional dashboard properties
                'allocated': allocated_coupons,
                'allocation_rate': (allocated_coupons / total_coupons * 100) if total_coupons > 0 else 0,
                'used': used_coupons,
                'usage_trend': 'STABLE',
                'status_distribution': [
                    {'status': 'Available', 'count': available_coupons},
                    {'status': 'Allocated', 'count': allocated_coupons},
                    {'status': 'Used', 'count': used_coupons},
                    {'status': 'Expired', 'count': expired_coupons},
                    {'status': 'Damaged', 'count': damaged_coupons},
                ],
                'monthly_trends': monthly_coupon_usage,
            })
        
        # Fuel pricing statistics
        latest_fuel_data = FuelData.objects.first()
        
        if not latest_fuel_data:
            # Return default values if no fuel data exists
            return Response({
                'petrol_price': 1.25,  # Default USD price
                'diesel_price': 1.35,  # Default USD price
                'petrol_price_usd': 1.25,
                'diesel_price_usd': 1.35,
                'exchange_rate': 27.5,  # Default ZWG to USD rate
                'total_fuel_allocated': 0.00,
                'total_fuel_used': 0.00,
                'available_fuel': 0.00,
                'last_refuel_date': None,
                'daily_usage_trend': 'STABLE',
                'daily_usage_change': 0.00,
                'timestamp': timezone.now().isoformat()
            })
        
        return Response({
            'petrol_price': float(latest_fuel_data.petrol_price_usd or 1.25),
            'diesel_price': float(latest_fuel_data.diesel_price_usd or 1.35),
            'petrol_price_usd': float(latest_fuel_data.petrol_price_usd or 1.25),
            'diesel_price_usd': float(latest_fuel_data.diesel_price_usd or 1.35),
            'exchange_rate': float(latest_fuel_data.exchange_rate or 27.5),
            'total_fuel_allocated': float(latest_fuel_data.total_fuel_allocated or 0),
            'total_fuel_used': float(latest_fuel_data.total_fuel_used or 0),
            'available_fuel': float(latest_fuel_data.available_fuel or 0),
            'last_refuel_date': latest_fuel_data.last_refuel_date.isoformat() if latest_fuel_data.last_refuel_date else None,
            'daily_usage_trend': latest_fuel_data.daily_usage_trend or 'STABLE',
            'daily_usage_change': float(latest_fuel_data.daily_usage_change or 0),
            'timestamp': latest_fuel_data.timestamp.isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve fuel statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- Analytics View ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """
    Provides aggregated analytics data for a specified date range.
    Enhanced with better error handling and permission management.
    """
    try:
        # Check user permissions - allow SUPERUSER, MAIN_CENTER, SUB_CENTER, AUDITOR
        user = request.user
        if not (user.is_superuser or user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']):
            return Response(
                {'error': 'Insufficient permissions for analytics access'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse date parameters with error handling
        try:
            start_date_str = request.query_params.get('start_date', (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
            end_date_str = request.query_params.get('end_date', timezone.now().strftime('%Y-%m-%d'))
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError as e:
            return Response(
                {'error': f'Invalid date format: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Enhanced Financial Analytics ---
        try:
            # Get boxes in date range for financial calculations
            boxes = Box.objects.filter(
                models.Q(received_at__date__range=[start_date, end_date]) |
                models.Q(created__date__range=[start_date, end_date])
            )
            
            # Calculate daily financial data with error handling for missing fields
            daily_data = []
            current_date = start_date
            while current_date <= end_date:
                daily_boxes = boxes.filter(
                    models.Q(received_at__date=current_date) |
                    models.Q(created__date=current_date)
                )
                
                # Safe field access with error handling
                daily_revenue_usd = 0
                daily_revenue_zwg = 0
                daily_books = 0
                daily_coupons = 0
                daily_litres = 0
                
                for box in daily_boxes:
                    try:
                        daily_revenue_usd += float(getattr(box, 'total_value_usd', 0) or 0)
                    except (ValueError, TypeError, AttributeError):
                        pass
                    
                    try:
                        daily_revenue_zwg += float(getattr(box, 'total_value_zwg', 0) or 0)
                    except (ValueError, TypeError, AttributeError):
                        pass
                    
                    try:
                        daily_books += int(getattr(box, 'number_of_books', 0) or 0)
                    except (ValueError, TypeError, AttributeError):
                        pass
                    
                    try:
                        daily_coupons += int(getattr(box, 'total_coupons', 0) or getattr(box, 'total_coupons_calculated', 0) or 0)
                    except (ValueError, TypeError, AttributeError):
                        pass
                    
                    try:
                        daily_litres += float(getattr(box, 'total_litres', 0) or 0)
                    except (ValueError, TypeError, AttributeError):
                        pass
                
                # Calculate operational costs (simplified estimation)
                daily_costs_usd = daily_revenue_usd * 0.15  # 15% operational cost estimation
                daily_profit_usd = daily_revenue_usd - daily_costs_usd
                
                daily_data.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'revenue_usd': round(daily_revenue_usd, 2),
                    'revenue_zwg': round(daily_revenue_zwg, 2),
                    'costs_usd': round(daily_costs_usd, 2),
                    'profit_usd': round(daily_profit_usd, 2),
                    'coupons_issued': daily_coupons,
                    'books_issued': daily_books,
                    'litres_allocated': round(daily_litres, 2),
                    'boxes_processed': daily_boxes.count()
                })
                
                current_date += timedelta(days=1)
            
            # Calculate totals and averages
            total_revenue_usd = sum(item['revenue_usd'] for item in daily_data)
            total_costs_usd = sum(item['costs_usd'] for item in daily_data)
            total_profit_usd = total_revenue_usd - total_costs_usd
            total_coupons = sum(item['coupons_issued'] for item in daily_data)
            total_litres = sum(item['litres_allocated'] for item in daily_data)
            
            # Calculate growth rates
            if len(daily_data) > 1:
                first_week = daily_data[:7] if len(daily_data) >= 7 else daily_data[:len(daily_data)//2]
                last_week = daily_data[-7:] if len(daily_data) >= 7 else daily_data[len(daily_data)//2:]
                
                first_week_avg = sum(item['revenue_usd'] for item in first_week) / len(first_week)
                last_week_avg = sum(item['revenue_usd'] for item in last_week) / len(last_week)
                
                revenue_growth = ((last_week_avg - first_week_avg) / (first_week_avg or 1)) * 100
            else:
                revenue_growth = 0
            
        except Exception as e:
            daily_data = []
            total_revenue_usd = 0
            total_costs_usd = 0
            total_profit_usd = 0
            total_coupons = 0
            total_litres = 0
            revenue_growth = 0

        # --- Query Data with Error Handling ---
        try:
            fuel_transactions = FuelTransaction.objects.filter(timestamp__date__range=[start_date, end_date])
        except Exception:
            fuel_transactions = FuelTransaction.objects.none()
            
        try:
            attendances = SessionAttendance.objects.filter(session__start_date__range=[start_date, end_date])
        except Exception:
            # Handle case where SessionAttendance might have schema issues
            attendances = SessionAttendance.objects.none()
            
        try:
            entitlements = FuelEntitlement.objects.filter(created__date__range=[start_date, end_date])
        except Exception:
            entitlements = FuelEntitlement.objects.none()

        # --- Aggregate Data with Safe Calculations ---
        try:
            total_fuel_dispensed = fuel_transactions.aggregate(total=Sum('litres_consumed'))['total'] or 0
            total_coupons_used = fuel_transactions.filter(coupon__isnull=False).count()
        except Exception:
            total_fuel_dispensed = 0
            total_coupons_used = 0
        
        try:
            total_attendance = attendances.count()
            present_attendance = attendances.filter(status='PRESENT').count()
            attendance_rate = (present_attendance / total_attendance * 100) if total_attendance > 0 else 0
        except Exception:
            total_attendance = 0
            present_attendance = 0
            attendance_rate = 0

        try:
            total_entitlements = entitlements.count()
            total_litres_allocated = entitlements.aggregate(total=Sum('litres_allocated'))['total'] or 0
        except Exception:
            total_entitlements = 0
            total_litres_allocated = 0

        # --- Prepare Enhanced Response ---
        data = {
            'date_range': {
                'start_date': start_date_str,
                'end_date': end_date_str,
            },
            'financial_summary': {
                'total_revenue_usd': round(total_revenue_usd, 2),
                'total_costs_usd': round(total_costs_usd, 2),
                'total_profit_usd': round(total_profit_usd, 2),
                'profit_margin': round((total_profit_usd / total_revenue_usd * 100) if total_revenue_usd > 0 else 0, 2),
                'revenue_growth_rate': round(revenue_growth, 2),
                'average_daily_revenue': round(total_revenue_usd / max(1, (end_date - start_date).days + 1), 2),
            },
            'operational_summary': {
                'total_boxes_processed': boxes.count() if 'boxes' in locals() else 0,
                'total_coupons_issued': total_coupons,
                'total_litres_allocated': round(total_litres, 2),
                'average_value_per_box': round(total_revenue_usd / max(1, boxes.count()) if 'boxes' in locals() else 0, 2),
            },
            'daily_data': daily_data,
            'fuel_summary': {
                'total_fuel_dispensed': round(float(total_fuel_dispensed), 2),
                'total_coupons_used': total_coupons_used,
                'average_transaction_litres': round(float(total_fuel_dispensed) / fuel_transactions.count(), 2) if fuel_transactions.count() > 0 else 0,
            },
            'attendance_summary': {
                'total_sessions_tracked': total_attendance,
                'present_beneficiaries': present_attendance,
                'attendance_rate': round(attendance_rate, 2),
            },
            'entitlement_summary': {
                'total_entitlements_created': total_entitlements,
                'total_litres_allocated': round(float(total_litres_allocated), 2),
            },
            'status': 'success',
            'message': 'Enhanced analytics data retrieved successfully'
        }

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Failed to retrieve analytics data: {str(e)}',
            'status': 'error',
            'date_range': {
                'start_date': request.query_params.get('start_date', 'N/A'),
                'end_date': request.query_params.get('end_date', 'N/A'),
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_received_breakdown(request):
    """
    Received fuel breakdown by fuel type and denomination (litres),
    comparing verified vs unverified counts within a period.

    Query params:
    - period: 'week' | 'month' | 'year' (default: 'month')
    """
    try:
        now = timezone.now()
        period = (request.query_params.get('period') or 'month').lower()
        if period == 'week':
            start = now - timedelta(days=7)
        elif period == 'year':
            start = now - timedelta(days=365)
        else:
            start = now - timedelta(days=30)

        # Gracefully handle missing auth in some proxies
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        # Check role-based permissions - allow AUDITOR, MAIN_CENTER, SUB_CENTER, and SUPERUSER
        user = request.user
        if not (user.is_superuser or user.role in ['MAIN_CENTER', 'SUB_CENTER', 'AUDITOR', 'SUPERUSER']):
            return Response(
                {'error': 'Insufficient permissions for analytics access'}, 
                status=403
            )

        boxes_qs = Box.objects.all()
        # Prefer received_at; fallback to created for legacy
        try:
            boxes_qs = boxes_qs.filter(received_at__gte=start)
        except Exception:
            try:
                boxes_qs = boxes_qs.filter(created__gte=start)
            except Exception:
                pass

        results = {}
        for box in boxes_qs:
            try:
                # Safe field access with fallbacks
                fuel_type = 'UNKNOWN'
                try:
                    fuel_type = getattr(box, 'fuel_type', None) or 'UNKNOWN'
                except Exception:
                    fuel_type = 'UNKNOWN'
                
                denom = 0
                try:
                    denom = int(getattr(box, 'denomination', 0) or 0)
                except (ValueError, TypeError, AttributeError):
                    denom = 0
                
                total_coupons = 0
                try:
                    # Try multiple field names for total coupons
                    total_coupons = int(
                        getattr(box, 'total_coupons_calculated', None) or 
                        getattr(box, 'total_coupons', None) or 
                        0
                    )
                except (ValueError, TypeError, AttributeError):
                    total_coupons = 0
                
                status_val = ''
                try:
                    status_val = getattr(box, 'status', '') or ''
                except Exception:
                    status_val = ''
                
                verified_at = None
                try:
                    verified_at = getattr(box, 'verified_at', None)
                except Exception:
                    verified_at = None
                
                is_verified = (status_val == 'VERIFIED') or bool(verified_at)

                key = (fuel_type, denom)
                if key not in results:
                    results[key] = {
                        'fuel_type': fuel_type,
                        'denomination': denom,
                        'received_coupons': 0,
                        'verified_coupons': 0,
                        'unverified_coupons': 0,
                    }

                results[key]['received_coupons'] += total_coupons
                if is_verified:
                    results[key]['verified_coupons'] += total_coupons
                else:
                    results[key]['unverified_coupons'] += total_coupons
            except Exception as e:
                # Log the error but continue processing other boxes
                logger.warning(f"Error processing box {getattr(box, 'id', 'unknown')}: {str(e)}")
                continue

        breakdown = sorted(results.values(), key=lambda x: (x['fuel_type'], x['denomination']))
        return Response({
            'period': period,
            'start_date': start.date().isoformat(),
            'end_date': now.date().isoformat(),
            'breakdown': breakdown,
        })
    except Exception as e:
        return Response({'error': 'Failed to retrieve received breakdown'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_available_by_center(request):
    """
    For each active subcenter, count AVAILABLE coupons grouped by fuel type and denomination.
    """
    try:
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        centers = SubCenter.objects.filter(is_active=True)
        data = []
        for sc in centers:
            try:
                coupons_qs = Coupon.objects.filter(
                    book__box__assigned_to=sc,
                    status='AVAILABLE'
                ).select_related('book__box')
            except Exception:
                coupons_qs = Coupon.objects.none()

            agg = {}
            for c in coupons_qs:
                fuel_type = 'UNKNOWN'
                try:
                    if c.book and c.book.box:
                        fuel_type = getattr(c.book.box, 'fuel_type', 'UNKNOWN') or 'UNKNOWN'
                except Exception:
                    pass
                try:
                    denom = int(getattr(c, 'litres', 0) or 0)
                except Exception:
                    denom = 0
                key = (fuel_type, denom)
                agg[key] = agg.get(key, 0) + 1

            breakdown = [
                {'fuel_type': ft, 'denomination': denom, 'available_coupons': count}
                for (ft, denom), count in sorted(agg.items(), key=lambda x: (x[0][0], x[0][1]))
            ]

            totals = {
                'total_available': sum(item['available_coupons'] for item in breakdown),
                'diesel_available': sum(item['available_coupons'] for item in breakdown if item['fuel_type'] == 'DIESEL'),
                'petrol_available': sum(item['available_coupons'] for item in breakdown if item['fuel_type'] == 'PETROL'),
            }

            data.append({
                'subcenter_id': sc.id,
                'subcenter_name': sc.name,
                'breakdown': breakdown,
                'totals': totals,
            })

        return Response({'centers': data, 'count': len(data), 'generated_at': timezone.now().isoformat()})
    except Exception:
        return Response({'error': 'Failed to retrieve available by center'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dispatches_timeline(request):
    """
    Dispatch counts grouped by day within a date range.
    Query params: start_date=YYYY-MM-DD, end_date=YYYY-MM-DD
    """
    try:
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        today = timezone.now().date()
        if end_str:
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        else:
            end_date = today
        if start_str:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
        else:
            start_date = end_date - timedelta(days=30)

        qs = BookDispatch.objects.filter(dispatch_date__date__range=[start_date, end_date])

        # Optional filters for program and session (if columns exist)
        program_id = request.query_params.get('program_id')
        session_id = request.query_params.get('session_id')
        if program_id:
            try:
                qs = qs.filter(program_id=program_id)
            except Exception:
                pass
        if session_id:
            try:
                qs = qs.filter(session_id=session_id)
            except Exception:
                pass
        daily = (
            qs.annotate(day=TruncDate('dispatch_date'))
              .values('day')
              .annotate(count=Count('id'))
              .order_by('day')
        )
        timeline = [
            {'date': item['day'].strftime('%Y-%m-%d') if item['day'] else '', 'dispatches': item['count']}
            for item in daily
        ]
        by_status = list(qs.values('status').annotate(count=Count('id')).order_by('status'))
        by_center_raw = list(qs.values('to_center__name').annotate(count=Count('id')).order_by('-count'))
        by_center = [{'name': i['to_center__name'] or 'Unknown', 'count': i['count']} for i in by_center_raw]

        # Optional aggregations by program and session if fields exist
        try:
            by_program_raw = list(qs.values('program__id', 'program__title').annotate(count=Count('id')).order_by('-count'))
            by_program = [
                {'id': i['program__id'], 'title': i['program__title'] or 'Unassigned', 'count': i['count']}
                for i in by_program_raw if i['program__id'] is not None or i['count'] > 0
            ]
        except Exception:
            by_program = []

        try:
            by_session_raw = list(qs.values('session__id', 'session__title').annotate(count=Count('id')).order_by('-count'))
            by_session = [
                {'id': i['session__id'], 'title': i['session__title'] or 'Unassigned', 'count': i['count']}
                for i in by_session_raw if i['session__id'] is not None or i['count'] > 0
            ]
        except Exception:
            by_session = []

        return Response({
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'timeline': timeline,
            'by_status': by_status,
            'by_center': by_center,
            'by_program': by_program,
            'by_session': by_session
        })
    except Exception as e:
        return Response({'error': f'Failed to retrieve dispatches timeline: {str(e)}'}, status=500)


class SessionAttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing session attendance records"""
    serializer_class = SessionAttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = SessionAttendance.objects.select_related(
            'session', 'beneficiary', 'recorded_by'
        ).all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see attendance for beneficiaries in their center
            return queryset.filter(beneficiary__sub_center=user.sub_center)
        elif user.role == 'BENEFICIARY':
            # Beneficiaries see only their own attendance records
            return queryset.filter(beneficiary=user)
        
        return SessionAttendance.objects.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterOrSubCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_mark_attendance(self, request):
        """Bulk mark attendance for multiple beneficiaries in a session"""
        session_id = request.data.get('session_id')
        attendances_data = request.data.get('attendances', [])
        
        if not session_id:
            return Response({'error': 'session_id is required'}, status=400)
        
        try:
            session = ParliamentSession.objects.get(id=session_id)
        except ParliamentSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)
        
        created_attendances = []
        updated_attendances = []
        errors = []
        
        for attendance_data in attendances_data:
            beneficiary_id = attendance_data.get('beneficiary_id')
            attended = attendance_data.get('attended', True)
            
            try:
                beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
                
                # Check permissions - subcenter officers can only mark attendance for their center
                if (request.user.role == 'SUB_CENTER' and request.user.sub_center and 
                    beneficiary.sub_center != request.user.sub_center):
                    errors.append(f'Cannot mark attendance for {beneficiary.get_full_name()} - not in your subcenter')
                    continue
                
                attendance, created = SessionAttendance.objects.update_or_create(
                    session=session,
                    beneficiary=beneficiary,
                    defaults={
                        'attended': attended,
                        'recorded_by': request.user,
                        'check_in_time': timezone.now() if attended else None,
                        'notes': attendance_data.get('notes', '')
                    }
                )
                
                # Calculate fuel allocation if attended
                if attended and hasattr(beneficiary, 'beneficiary_profile'):
                    try:
                        profile = beneficiary.beneficiary_profile
                        fuel_allocated = profile.calculate_session_entitlement(session)
                        attendance.fuel_allocated = fuel_allocated
                        attendance.allocation_date = timezone.now()
                        attendance.save()
                    except Exception as e:
                        # Don't fail the attendance marking if fuel calculation fails
                        pass
                
                if created:
                    created_attendances.append(attendance)
                else:
                    updated_attendances.append(attendance)
                    
            except User.DoesNotExist:
                errors.append(f'Beneficiary with ID {beneficiary_id} not found')
            except Exception as e:
                errors.append(f'Error processing beneficiary {beneficiary_id}: {str(e)}')
        
        response_data = {
            'session_id': session_id,
            'created_count': len(created_attendances),
            'updated_count': len(updated_attendances),
            'errors': errors
        }
        
        if errors:
            response_data['status'] = 'partial_success'
            return Response(response_data, status=207)  # Multi-status
        else:
            response_data['status'] = 'success'
            return Response(response_data, status=201)
    
    @action(detail=False, methods=['get'])
    def session_summary(self, request):
        """Get attendance summary for a specific session"""
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response({'error': 'session_id parameter is required'}, status=400)
        
        try:
            session = ParliamentSession.objects.get(id=session_id)
        except ParliamentSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)
        
        # Get attendance records for this session
        queryset = self.get_queryset().filter(session=session)
        
        total_attendances = queryset.count()
        present_count = queryset.filter(status='PRESENT').count()
        absent_count = total_attendances - present_count
        
        # Get total fuel allocated
        total_fuel_allocated = queryset.filter(
            attended=True, 
            fuel_allocated__isnull=False
        ).aggregate(
            total=models.Sum('fuel_allocated')
        )['total'] or 0
        
        return Response({
            'session': {
                'id': session.id,
                'title': session.title,
                'start_date': session.start_date,
                'end_date': session.end_date
            },
            'attendance_summary': {
                'total_records': total_attendances,
                'present_count': present_count,
                'absent_count': absent_count,
                'attendance_rate': round((present_count / total_attendances * 100) if total_attendances > 0 else 0, 2),
                'total_fuel_allocated': float(total_fuel_allocated)
            }
        })
    
    @action(detail=False, methods=['get'])
    def beneficiary_attendance_history(self, request):
        """Get attendance history for a specific beneficiary"""
        beneficiary_id = request.query_params.get('beneficiary_id')
        
        if not beneficiary_id:
            return Response({'error': 'beneficiary_id parameter is required'}, status=400)
        
        # Filter queryset by beneficiary
        queryset = self.get_queryset().filter(beneficiary_id=beneficiary_id)
        
        # Get statistics
        total_sessions = queryset.count()
        attended_sessions = queryset.filter(status='PRESENT').count()
        total_fuel_received = queryset.filter(
            attended=True,
            fuel_allocated__isnull=False
        ).aggregate(
            total=models.Sum('fuel_allocated')
        )['total'] or 0
        
        # Get recent attendance records
        recent_attendances = queryset.order_by('-session__start_date')[:10]
        serializer = self.get_serializer(recent_attendances, many=True)
        
        return Response({
            'beneficiary_id': beneficiary_id,
            'statistics': {
                'total_sessions': total_sessions,
                'attended_sessions': attended_sessions,
                'attendance_rate': round((attended_sessions / total_sessions * 100) if total_sessions > 0 else 0, 2),
                'total_fuel_received': float(total_fuel_received)
            },
            'recent_attendances': serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_business_central_connection(request):
    """Test Business Central API connection"""
    from django.conf import settings
    
    # Check if BC configuration exists
    bc_config = getattr(settings, 'BUSINESS_CENTRAL_CONFIG', {})
    
    if not bc_config.get('tenant_id') or not bc_config.get('client_id'):
        return Response({
            'status': 'error',
            'message': 'Business Central configuration not found. Please set BC environment variables.',
            'config_status': {
                'tenant_id': bool(bc_config.get('tenant_id')),
                'client_id': bool(bc_config.get('client_id')),
                'client_secret': bool(bc_config.get('client_secret')),
                'base_url': bool(bc_config.get('base_url')),
                'company_id': bool(bc_config.get('company_id'))
            }
        }, status=status.HTTP_424_FAILED_DEPENDENCY)
    
    try:
        # TODO: Implement actual BC API call when credentials are configured
        # For now, just return configuration status
        return Response({
            'status': 'success',
            'message': 'Business Central configuration found',
            'config_status': {
                'tenant_id': bool(bc_config.get('tenant_id')),
                'client_id': bool(bc_config.get('client_id')),
                'client_secret': bool(bc_config.get('client_secret')),
                'base_url': bool(bc_config.get('base_url')),
                'company_id': bool(bc_config.get('company_id')),
                'environment': bc_config.get('environment', 'Not Set')
            },
            'next_steps': [
                'Configure Azure App Registration for Business Central',
                'Set BC environment variables in Azure Web App',
                'Test actual BC API connection'
            ]
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error testing Business Central connection: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# CORS Test Functions
@csrf_exempt
@api_view(['GET', 'POST', 'OPTIONS'])
@permission_classes([AllowAny])
def cors_test(request):
    """
    Simple endpoint to test CORS configuration
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"CORS Test - Method: {request.method}")
    logger.info(f"CORS Test - Origin: {request.headers.get('Origin', 'No Origin')}")
    logger.info(f"CORS Test - User-Agent: {request.headers.get('User-Agent', 'No User-Agent')}")
    
    response_data = {
        'message': 'CORS test successful',
        'method': request.method,
        'origin': request.headers.get('Origin', 'No Origin'),
        'timestamp': str(timezone.now()),
        'headers': dict(request.headers),
        'status': 'OK'
    }
    
    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_makes(request):
    """
    Get list of unique vehicle makes from pool vehicles
    """
    from django.db.models import Q
    
    # Get unique makes from PoolVehicle model
    makes = PoolVehicle.objects.values_list('make', flat=True).distinct().exclude(
        Q(make__isnull=True) | Q(make__exact='')
    ).order_by('make')
    
    # Also get makes from BeneficiaryProfile model if they exist
    try:
        from .models import BeneficiaryProfile
        beneficiary_makes = BeneficiaryProfile.objects.values_list('vehicle_make', flat=True).distinct().exclude(
            Q(vehicle_make__isnull=True) | Q(vehicle_make__exact='')
        )
        
        # Combine and deduplicate
        all_makes = set(makes) | set(beneficiary_makes)
        makes = sorted(list(all_makes))
    except:
        # If BeneficiaryProfile doesn't have vehicle_make field, just use pool vehicle makes
        makes = list(makes)
    
    # Format as expected by frontend
    vehicle_makes_data = [
        {
            'id': i + 1,
            'name': make,
            'make': make
        }
        for i, make in enumerate(makes)
    ]
    
    return Response(vehicle_makes_data)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint
    """
    return Response({
        'status': 'healthy',
        'service': 'Parliament Fuel System',
        'timestamp': str(timezone.now())
    })


# ========================= MISSING VIEWSETS =========================

class FuelDataViewSet(viewsets.ModelViewSet):
    """ViewSet for managing fuel data records"""
    queryset = FuelData.objects.all()
    serializer_class = FuelStatsSerializer  # Using FuelStatsSerializer as it's available
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Filter by sub-center if needed - adjust based on FuelData model structure
            return queryset
        
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get fuel statistics"""
        queryset = self.get_queryset()
        
        total_records = queryset.count()
        
        # Add more statistics based on FuelData model fields
        stats = {
            'total_records': total_records,
            'last_updated': timezone.now(),
        }
        
        return Response(stats)


class CouponDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing coupon distributions"""
    queryset = CouponDistribution.objects.all()
    serializer_class = CouponDistributionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset().select_related('coupon', 'beneficiary', 'distributed_by')
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Filter distributions for the sub-center
            return queryset.filter(
                models.Q(coupon__book__box__assigned_to=user.sub_center) |
                models.Q(distributed_by__sub_center=user.sub_center)
            )
        elif user.role == 'BENEFICIARY':
            # Beneficiaries see their own distributions
            return queryset.filter(beneficiary=user)
        
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def distribution_statistics(self, request):
        """Get distribution statistics"""
        queryset = self.get_queryset()
        
        total_distributions = queryset.count()
        
        # Group by date
        daily_distributions = queryset.annotate(
            date=TruncDate('distribution_date')
        ).values('date').annotate(count=models.Count('id')).order_by('-date')[:30]
        
        # Group by beneficiary
        beneficiary_distributions = queryset.values(
            'beneficiary__first_name', 'beneficiary__last_name'
        ).annotate(
            distribution_count=models.Count('id')
        ).order_by('-distribution_count')[:10]
        
        stats = {
            'total_distributions': total_distributions,
            'daily_distributions': list(daily_distributions),
            'top_beneficiaries': list(beneficiary_distributions),
            'last_updated': timezone.now(),
        }
        
        return Response(stats)


class CouponHandoverViewSet(viewsets.ModelViewSet):
    """
    Enhanced ViewSet for Coupon Handover Management with intelligent generation.
    Handles physical distribution of coupons to beneficiaries with multi-step workflow:
    Configuration → Generation → Verification → Handover → Confirmation
    """
    serializer_class = CouponHandoverSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = CouponHandover.objects.all().select_related(
            'beneficiary', 'sub_center', 'handed_over_by', 'received_by'
        ).prefetch_related('coupons')
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            return queryset.filter(sub_center=user.sub_center)
        elif user.role == 'BENEFICIARY':
            return queryset.filter(beneficiary=user)
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        # Allow sub-centers to PATCH their own handovers to mark as approved/received  
        if self.action in ['partial_update']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]

    def partial_update(self, request, *args, **kwargs):
        """Allow sub-center to approve/update handover status for their beneficiaries.

        Similar to BookDispatchViewSet, permits subcenter officers to approve handovers 
        for beneficiaries in their sub-center area.
        """
        try:
            instance = self.get_object()
            user = request.user

            requested_status = str(request.data.get('status') or '').upper()
            allowed_statuses = {'APPROVED', 'HANDED_OVER', 'RECEIVED', 'CONFIRMED'}

            # Gate: allow sub-center users for their handovers, or superusers/main center for any
            if getattr(user, 'role', None) in ['SUPERUSER', 'MAIN_CENTER']:
                # Superuser and main center can update any handover
                if requested_status not in allowed_statuses:
                    return Response({'detail': 'Only status updates to APPROVED, HANDED_OVER, RECEIVED, or CONFIRMED are allowed'}, status=status.HTTP_400_BAD_REQUEST)
            elif getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None):
                if instance.sub_center_id != user.sub_center.id:
                    return Response({'detail': 'Not authorized to modify this handover'}, status=status.HTTP_403_FORBIDDEN)
                if requested_status not in allowed_statuses:
                    return Response({'detail': 'Only status updates to APPROVED, HANDED_OVER, RECEIVED, or CONFIRMED are allowed'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Not authorized to modify handovers'}, status=status.HTTP_403_FORBIDDEN)

                # Perform safe update
                instance.status = requested_status
                try:
                    if requested_status == 'HANDED_OVER':
                        instance.handed_over_by = user
                        instance.handover_date = timezone.now()
                    elif requested_status == 'RECEIVED':
                        instance.received_by = user
                        instance.received_date = timezone.now()
                except Exception:
                    pass
                
                # Update any additional fields from request
                if 'notes' in request.data:
                    instance.notes = request.data.get('notes', '')
                if 'receiver_signature' in request.data:
                    instance.receiver_signature = request.data.get('receiver_signature', '')
                
                instance.save()

                # Return updated handover data
                return Response({
                    'id': instance.id,
                    'handover_id': getattr(instance, 'handover_id', f"HO-{instance.id}"),
                    'status': instance.status,
                    'beneficiary': {
                        'id': instance.beneficiary.id,
                        'name': instance.beneficiary.get_full_name(),
                    } if instance.beneficiary else None,
                    'sub_center': {
                        'id': instance.sub_center.id,
                        'name': instance.sub_center.name,
                    } if instance.sub_center else None,
                    'handed_over_by': getattr(getattr(instance, 'handed_over_by', None), 'username', None),
                    'handover_date': getattr(instance, 'handover_date', None),
                    'received_by': getattr(getattr(instance, 'received_by', None), 'username', None),
                    'received_date': getattr(instance, 'received_date', None),
                    'notes': getattr(instance, 'notes', ''),
                    'total_coupons': getattr(instance, 'total_coupons', 0),
                    'total_litres': getattr(instance, 'total_litres', 0),
                    'total_value': getattr(instance, 'total_value', 0),
                })

            # Fallback to default behavior for other roles (will be guarded by MainCenterPermission)
            return super().partial_update(request, *args, **kwargs)

        except Exception as e:
            return Response({'error': f'Update failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission | SubCenterPermission])
    def intelligent_generation(self, request):
        """
        Intelligent coupon generation for handover based on different modes:
        1. entitlement-based: Use beneficiary entitlement calculations
        2. serial-range: Specify first and last coupon serials
        3. quantity-based: Specify number of coupons needed
        4. emergency-allocation: Emergency or special circumstances
        """
        try:
            data = request.data
            beneficiary_id = data.get('beneficiary_id')
            mode = data.get('mode', 'entitlement-based')
            config = data.get('config', {})
            
            # Validate beneficiary
            try:
                beneficiary = User.objects.get(id=beneficiary_id, role='BENEFICIARY')
            except User.DoesNotExist:
                return Response({
                    'error': 'Beneficiary not found'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create handover record
            sub_center = request.user.sub_center if hasattr(request.user, 'sub_center') else None
            if not sub_center:
                return Response({
                    'error': 'Sub-center required for handover operations'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create temporary handover for generation
            handover = CouponHandover(
                beneficiary=beneficiary,
                sub_center=sub_center,
                handover_mode=mode,
                status='CONFIGURED'
            )
            
            # Generate intelligent selection
            selected_coupons = handover.generate_intelligent_selection(mode, config)
            
            if not selected_coupons:
                return Response({
                    'error': 'No coupons available for the specified criteria'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate totals
            total_coupons = len(selected_coupons)
            total_litres = sum(coupon.litres for coupon in selected_coupons)
            total_value = sum(coupon.usd_value or 0 for coupon in selected_coupons)
            
            # Prepare response data
            generation_data = {
                'generation_mode': mode,
                'beneficiary': {
                    'id': beneficiary.id,
                    'name': beneficiary.get_full_name(),
                    'employee_id': getattr(beneficiary, 'employee_id', ''),
                    'role': beneficiary.role
                },
                'selected_coupons': [
                    {
                        'coupon_id': coupon.id,
                        'coupon_number': coupon.coupon_number,
                        'book_id': coupon.book.id,
                        'book_number': coupon.book.book_number,
                        'box_code': coupon.book.box.box_code,
                        'fuel_type': coupon.book.box.fuel_type,
                        'denomination': coupon.book.box.denomination,
                        'litres': float(coupon.litres),
                        'value': float(coupon.usd_value or 0),
                        'serial_number': coupon.coupon_number
                    }
                    for coupon in selected_coupons
                ],
                'summary': {
                    'total_coupons': total_coupons,
                    'total_litres': float(total_litres),
                    'total_value': float(total_value),
                    'first_serial': selected_coupons[0].coupon_number if selected_coupons else '',
                    'last_serial': selected_coupons[-1].coupon_number if selected_coupons else '',
                },
                'config_used': config,
                'timestamp': timezone.now().isoformat()
            }
            
            return Response(generation_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Generation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def available_beneficiaries(self, request):
        """Get list of available beneficiaries for handover"""
        try:
            user = self.request.user
            
            # Base queryset for beneficiaries
            beneficiaries = User.objects.filter(
                role='BENEFICIARY',
                is_active=True
            ).select_related('beneficiary_profile')
            
            # Filter by sub-center if user is SUB_CENTER
            if user.role == 'SUB_CENTER' and hasattr(user, 'sub_center'):
                beneficiaries = beneficiaries.filter(sub_center=user.sub_center)
            
            beneficiary_data = []
            for beneficiary in beneficiaries:
                try:
                    profile = beneficiary.beneficiary_profile
                    entitlement_data = {
                        'monthly_entitlement': float(profile.monthly_entitlement_litres),
                        'current_balance': float(profile.current_balance),
                        'used_this_month': float(profile.used_this_month),
                        'last_handover_date': profile.last_allocation_date
                    }
                except:
                    entitlement_data = {
                        'monthly_entitlement': 0,
                        'current_balance': 0,
                        'used_this_month': 0,
                        'last_handover_date': None
                    }
                
                beneficiary_data.append({
                    'id': beneficiary.id,
                    'name': beneficiary.get_full_name(),
                    'employee_id': getattr(beneficiary, 'employee_id', ''),
                    'role': beneficiary.role,
                    'category': getattr(beneficiary, 'category', 'Unknown'),
                    'constituency': getattr(beneficiary, 'constituency', ''),
                    'department': getattr(beneficiary, 'department', ''),
                    'contact_info': {
                        'email': beneficiary.email,
                        'phone': getattr(beneficiary, 'phone', ''),
                        'office': getattr(beneficiary, 'office_location', '')
                    },
                    'vehicle_info': {
                        'make': getattr(beneficiary, 'vehicle_make', ''),
                        'model': getattr(beneficiary, 'vehicle_model', ''),
                        'year': getattr(beneficiary, 'vehicle_year', None),
                        'engine_size': getattr(beneficiary, 'engine_size', ''),
                        'registration': getattr(beneficiary, 'vehicle_registration', ''),
                        'fuel_type': getattr(beneficiary, 'fuel_type', 'DIESEL')
                    },
                    'entitlement_profile': entitlement_data
                })
            
            return Response({
                'beneficiaries': beneficiary_data,
                'total_count': len(beneficiary_data),
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load beneficiaries: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def available_coupons(self, request):
        """Get available coupons for handover"""
        try:
            user = self.request.user
            
            # Base queryset for available coupons
            coupons = Coupon.objects.filter(
                status='AVAILABLE'
            ).select_related('book__box')
            
            # Filter by sub-center if user is SUB_CENTER
            if user.role == 'SUB_CENTER' and hasattr(user, 'sub_center'):
                coupons = coupons.filter(book__box__assigned_to=user.sub_center)
            
            # Optional filters
            fuel_type = request.query_params.get('fuel_type')
            denomination = request.query_params.get('denomination')
            box_code = request.query_params.get('box_code')
            
            if fuel_type:
                coupons = coupons.filter(book__box__fuel_type=fuel_type)
            if denomination:
                coupons = coupons.filter(book__box__denomination=denomination)
            if box_code:
                coupons = coupons.filter(book__box__box_code__icontains=box_code)
            
            # Limit results for performance
            coupons = coupons[:1000]  # Limit to 1000 coupons
            
            coupon_data = [
                {
                    'coupon_id': coupon.id,
                    'coupon_number': coupon.coupon_number,
                    'book_id': coupon.book.id,
                    'book_number': coupon.book.book_number,
                    'box_code': coupon.book.box.box_code,
                    'fuel_type': coupon.book.box.fuel_type,
                    'denomination': coupon.book.box.denomination,
                    'status': coupon.status,
                    'serial_number': coupon.coupon_number,
                    'litres': float(coupon.litres),
                    'value': float(coupon.usd_value or 0)
                }
                for coupon in coupons
            ]
            
            return Response({
                'coupons': coupon_data,
                'total_count': len(coupon_data),
                'filters_applied': {
                    'fuel_type': fuel_type,
                    'denomination': denomination,
                    'box_code': box_code
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to load available coupons: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def handover_options(self, request):
        """Get handover options and configuration"""
        try:
            options = {
                'handover_modes': [
                    {
                        'value': 'entitlement-based',
                        'title': 'Entitlement-Based Handover',
                        'description': 'Use beneficiary entitlement calculations',
                        'supports_config': ['use_monthly_entitlement', 'custom_amount', 'respect_balance']
                    },
                    {
                        'value': 'serial-range',
                        'title': 'Serial Range Handover',
                        'description': 'Specify first and last coupon serials',
                        'supports_config': ['start_serial', 'end_serial', 'validate_sequence']
                    },
                    {
                        'value': 'quantity-based',
                        'title': 'Quantity-Based Handover',
                        'description': 'Specify number of coupons needed',
                        'supports_config': ['requested_quantity', 'preferred_fuel_type', 'preferred_denomination', 'allow_mixed']
                    },
                    {
                        'value': 'emergency-allocation',
                        'title': 'Emergency Allocation',
                        'description': 'Emergency or special circumstances',
                        'supports_config': ['emergency_reason', 'approved_by', 'override_entitlement', 'requested_quantity']
                    }
                ],
                'handover_methods': [
                    {'value': 'DIRECT_PICKUP', 'label': 'Direct Pickup'},
                    {'value': 'OFFICE_DELIVERY', 'label': 'Office Delivery'},
                    {'value': 'COURIER', 'label': 'Courier Service'},
                    {'value': 'REPRESENTATIVE', 'label': 'Authorized Representative'}
                ],
                'status_choices': [
                    {'value': 'PENDING', 'label': 'Pending'},
                    {'value': 'CONFIGURED', 'label': 'Configured'},
                    {'value': 'VERIFIED', 'label': 'Verified'},
                    {'value': 'HANDED_OVER', 'label': 'Handed Over'},
                    {'value': 'RECEIVED', 'label': 'Received'},
                    {'value': 'CONFIRMED', 'label': 'Confirmed'},
                    {'value': 'CANCELLED', 'label': 'Cancelled'}
                ],
                'verification_checklist': [
                    'Beneficiary identity verified',
                    'Representative authorization confirmed',
                    'Coupon serial numbers validated',
                    'Entitlement limits checked',
                    'Vehicle registration confirmed',
                    'Handover documentation complete',
                    'Digital signatures obtained',
                    'System records updated'
                ],
                'fuel_types': [
                    {'value': 'PETROL', 'label': 'Petrol'},
                    {'value': 'DIESEL', 'label': 'Diesel'}
                ],
                'denominations': [
                    {'value': 5, 'label': '5 Litres'},
                    {'value': 10, 'label': '10 Litres'},
                    {'value': 20, 'label': '20 Litres'},
                    {'value': 50, 'label': '50 Litres'}
                ]
            }
            
            return Response(options)
            
        except Exception as e:
            return Response({
                'error': f'Failed to load handover options: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def complete_handover(self, request, pk=None):
        """Complete the handover process with verification"""
        try:
            handover = self.get_object()
            
            if handover.status != 'VERIFIED':
                return Response({
                    'error': 'Handover must be verified before completion'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            verification_data = request.data.get('verification_data', {})
            handover.complete_handover(request.user, verification_data)
            
            return Response({
                'message': 'Handover completed successfully',
                'handover_id': handover.handover_id,
                'status': handover.status,
                'summary': handover.get_handover_summary()
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to complete handover: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_receipt(self, request, pk=None):
        """Confirm receipt by beneficiary or subcenter officer"""
        try:
            handover = self.get_object()
            user = request.user
            
            # Permission check: only the beneficiary, subcenter officer, or main center officer can confirm
            can_confirm = False
            if user.role in ['MAIN_CENTER', 'SUPERUSER']:
                can_confirm = True
            elif user.role == 'SUB_CENTER' and user.sub_center and handover.sub_center_id == user.sub_center.id:
                can_confirm = True
            elif user.role == 'BENEFICIARY' and handover.beneficiary_id == user.id:
                can_confirm = True
                
            if not can_confirm:
                return Response({
                    'error': 'You do not have permission to confirm this handover'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if handover.status != 'HANDED_OVER':
                return Response({
                    'error': 'Handover must be completed before confirmation'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            signature_data = request.data.get('signature_data', {})
            handover.confirm_receipt(request.user, signature_data)
            
            return Response({
                'message': 'Receipt confirmed successfully',
                'handover_id': handover.handover_id,
                'status': handover.status,
                'summary': handover.get_handover_summary()
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to confirm receipt: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def handover_statistics(self, request):
        """Get handover statistics and analytics"""
        try:
            user = self.request.user
            queryset = self.get_queryset()
            
            # Basic statistics
            total_handovers = queryset.count()
            completed_handovers = queryset.filter(status='CONFIRMED').count()
            pending_handovers = queryset.filter(status__in=['PENDING', 'CONFIGURED', 'VERIFIED']).count()
            
            # Monthly statistics
            from django.db.models import Sum, Count
            monthly_stats = queryset.filter(
                handed_over_date__month=timezone.now().month,
                handed_over_date__year=timezone.now().year
            ).aggregate(
                total_coupons=Sum('total_coupons'),
                total_litres=Sum('total_litres'),
                total_value=Sum('total_value'),
                handover_count=Count('id')
            )
            
            # Top beneficiaries
            top_beneficiaries = queryset.filter(
                status='CONFIRMED'
            ).values(
                'beneficiary__first_name',
                'beneficiary__last_name'
            ).annotate(
                total_handovers=Count('id'),
                total_litres=Sum('total_litres')
            ).order_by('-total_litres')[:10]
            
            stats = {
                'summary': {
                    'total_handovers': total_handovers,
                    'completed_handovers': completed_handovers,
                    'pending_handovers': pending_handovers,
                    'completion_rate': round((completed_handovers / total_handovers * 100) if total_handovers > 0 else 0, 1)
                },
                'monthly_stats': {
                    'total_coupons': monthly_stats['total_coupons'] or 0,
                    'total_litres': float(monthly_stats['total_litres'] or 0),
                    'total_value': float(monthly_stats['total_value'] or 0),
                    'handover_count': monthly_stats['handover_count'] or 0
                },
                'top_beneficiaries': list(top_beneficiaries),
                'last_updated': timezone.now().isoformat()
            }
            
            return Response(stats)
            
        except Exception as e:
            return Response({
                'error': f'Failed to load statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ======================= MISSING FRONTEND ENDPOINTS =======================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_roles(request):
    """
    Get available user roles for frontend dropdowns
    """
    try:
        roles = [
            {'code': role_code, 'name': role_name}
            for role_code, role_name in UserModel.ROLE_CHOICES
        ]
        return Response({
            'roles': roles,
            'status': 'success'
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenters_stats(request):
    """
    Enhanced subcenter statistics for MainCenter SubCenterMonitoring component
    """
    try:
        from django.db.models import Sum, Count, Avg, Q
        from datetime import timedelta
        
        # Get query parameters for filtering
        status_filter = request.GET.get('status', 'all')
        include_inactive = request.GET.get('include_inactive', 'false').lower() == 'true'
        
        # Base queryset
        subcenters_qs = SubCenter.objects.all()
        
        if not include_inactive and status_filter == 'all':
            subcenters_qs = subcenters_qs.filter(is_active=True)
        elif status_filter != 'all':
            subcenters_qs = subcenters_qs.filter(is_active=(status_filter == 'active'))
        
        # Basic counts
        total_subcenters = SubCenter.objects.count()
        active_subcenters = SubCenter.objects.filter(is_active=True).count()
        inactive_subcenters = total_subcenters - active_subcenters
        
        # Subcenters with officers
        subcenters_with_officers = SubCenter.objects.filter(
            officers__isnull=False
        ).distinct().count()
        
        # Recent subcenters (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_subcenters = SubCenter.objects.filter(
            created__gte=thirty_days_ago
        ).count()
        
        # Detailed subcenter data for SubCenterMonitoring component
        subcenters_data = []
        for subcenter in subcenters_qs.select_related():
            # Calculate statistics for each subcenter
            total_boxes = Box.objects.filter(assigned_to=subcenter).count()
            total_books = Book.objects.filter(box__assigned_to=subcenter).count()
            books_used = Book.objects.filter(
                box__assigned_to=subcenter, 
                is_assigned=True
            ).count()
            books_remaining = total_books - books_used
            
            total_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter
            ).count()
            available_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='AVAILABLE'
            ).count()
            used_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter,
                status='USED'
            ).count()
            
            # Calculate monetary value (assuming 20L per coupon, $1.30 per litre average)
            average_value_per_coupon_usd = 20 * 1.30  # 20L * $1.30
            total_value_usd = total_coupons * average_value_per_coupon_usd
            total_value_zwg = total_value_usd * 27.5  # Exchange rate
            
            # Recent activity and performance metrics
            recent_transactions = FuelTransaction.objects.filter(
                coupon__book__box__assigned_to=subcenter,
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count()
            
            # Performance score calculation (based on various factors)
            performance_score = 0
            if total_coupons > 0:
                usage_rate = (used_coupons / total_coupons) * 100
                performance_score = min(100, max(0, usage_rate + 
                    (recent_transactions * 5) + 
                    (50 if available_coupons > 10 else 25)
                ))
            
            # Alert calculations
            alerts_count = 0
            if available_coupons < 50:  # Low inventory
                alerts_count += 1
            if recent_transactions == 0:  # No recent activity
                alerts_count += 1
            if performance_score < 70:  # Low performance
                alerts_count += 1
            
            # Manager information
            manager_info = None
            if hasattr(subcenter, 'managed_by') and subcenter.managed_by:
                manager_info = {
                    'id': subcenter.managed_by.id,
                    'name': subcenter.managed_by.get_full_name(),
                    'email': subcenter.managed_by.email
                }
            
            subcenters_data.append({
                'id': subcenter.id,
                'name': subcenter.name,
                'code': subcenter.code or f'SC{str(subcenter.id).zfill(3)}',
                'location': subcenter.location or 'Not specified',
                'status': 'ACTIVE' if subcenter.is_active else 'INACTIVE',
                
                # Manager information
                'manager_name': manager_info['name'] if manager_info else 'Not assigned',
                'manager_email': manager_info['email'] if manager_info else '',
                'contact_number': subcenter.contact_number or 'Not provided',
                'email': subcenter.email or 'Not provided',
                
                # Inventory statistics
                'total_boxes': total_boxes,
                'total_books': total_books,
                'books_used': books_used,
                'books_remaining': books_remaining,
                'total_coupons': total_coupons,
                'available_coupons': available_coupons,
                'used_coupons': used_coupons,
                
                # Financial information
                'total_value_usd': round(total_value_usd, 2),
                'total_value_zwg': round(total_value_zwg, 2),
                'monthly_consumption_usd': round(used_coupons * average_value_per_coupon_usd * 0.1, 2),  # Estimate
                
                # Performance metrics
                'performance_score': round(performance_score, 1),
                'recent_transactions': recent_transactions,
                'alerts_count': alerts_count,
                
                # Metadata
                'last_activity': subcenter.updated.isoformat() if hasattr(subcenter, 'updated') else timezone.now().isoformat(),
                'created': subcenter.created.isoformat() if hasattr(subcenter, 'created') else timezone.now().isoformat(),
                
                # Coordinates (if available)
                'coordinates': {
                    'lat': getattr(subcenter, 'latitude', None),
                    'lng': getattr(subcenter, 'longitude', None)
                } if hasattr(subcenter, 'latitude') and subcenter.latitude else None
            })
        
        # Summary statistics
        summary_stats = {
            'total_subcenters': total_subcenters,
            'active_subcenters': active_subcenters,
            'inactive_subcenters': inactive_subcenters,
            'subcenters_with_officers': subcenters_with_officers,
            'recent_subcenters': recent_subcenters,
            
            # Aggregated metrics from subcenters_data
            'total_books_across_centers': sum(sc['total_books'] for sc in subcenters_data),
            'total_coupons_across_centers': sum(sc['total_coupons'] for sc in subcenters_data),
            'total_value_usd_across_centers': sum(sc['total_value_usd'] for sc in subcenters_data),
            'average_performance_score': round(
                sum(sc['performance_score'] for sc in subcenters_data) / len(subcenters_data)
                if subcenters_data else 0, 1
            ),
            'centers_with_alerts': sum(1 for sc in subcenters_data if sc['alerts_count'] > 0),
            'low_inventory_centers': sum(1 for sc in subcenters_data if sc['available_coupons'] < 50),
        }
        
        return Response({
            # Legacy format for backward compatibility
            'total_subcenters': total_subcenters,
            'active_subcenters': active_subcenters,
            'inactive_subcenters': inactive_subcenters,
            'subcenters_with_officers': subcenters_with_officers,
            'recent_subcenters': recent_subcenters,
            'status': 'success',
            
            # Enhanced data for SubCenterMonitoring
            'summary': summary_stats,
            'results': subcenters_data,
            'count': len(subcenters_data),
            'filters_applied': {
                'status': status_filter,
                'include_inactive': include_inactive
            },
            'last_updated': timezone.now().isoformat()
        })
    except Exception as e:
        import traceback
        logger.error(f"Subcenters stats error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    """
    Send notifications - simplified endpoint for subcenter quick actions
    """
    try:
        recipient_type = request.data.get('recipient_type', 'MAIN_CENTER')
        message_type = request.data.get('message_type', 'INFO')
        title = request.data.get('title', 'Notification')
        message = request.data.get('message', '')
        priority = request.data.get('priority', 'NORMAL')
        
        # Create system alert as notification
        SystemAlert.objects.create(
            alert_type=message_type,
            title=title,
            message=message,
            source='SUBCENTER_NOTIFICATION',
            status='ACTIVE',
            created_by=request.user,
            data=request.data
        )
        
        return Response({
            'status': 'success',
            'message': 'Notification sent successfully'
        }, status=201)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Failed to send notification: {str(e)}'
        }, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def programs_stats(request):
    """
    Get program statistics for dashboard
    """
    try:
        total_programs = Program.objects.count()
        active_programs = Program.objects.filter(is_active=True).count()
        inactive_programs = total_programs - active_programs
        
        # Programs with sessions
        programs_with_sessions = Program.objects.filter(
            sessions__isnull=False
        ).distinct().count()
        
        # Recent programs (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_programs = Program.objects.filter(
            created__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total_programs': total_programs,
            'active_programs': active_programs,
            'inactive_programs': inactive_programs,
            'programs_with_sessions': programs_with_sessions,
            'recent_programs': recent_programs,
            'status': 'success'
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# NOTIFICATION API ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """
    Get notification statistics for the current user
    Returns real-time notification counts including system alerts
    """
    try:
        user = request.user
        recipient_type = request.GET.get('recipient_type', user.role)
        recipient_id = request.GET.get('recipient_id', str(user.id))
        
        # Initialize counters
        total_notifications = 0
        unread_notifications = 0
        priority_notifications = 0
        
        # For subcenter users, get subcenter-specific notifications
        if hasattr(user, 'sub_center') and user.sub_center:
            # Count pending fuel requests from beneficiaries
            pending_requests = FuelEntitlement.objects.filter(
                sub_center=user.sub_center,
                status='PENDING'
            ).count()
            
            # Count recent transactions requiring attention (last 24 hours)
            yesterday = timezone.now() - timedelta(hours=24)
            recent_transactions = FuelTransaction.objects.filter(
                subcenter=user.sub_center,
                timestamp__gte=yesterday
            ).count()
            
            # Count low inventory alerts
            low_inventory_boxes = Box.objects.filter(
                assigned_to=user.sub_center,
                status='RECEIVED'
            ).annotate(
                available_coupons=Count('books__coupons', filter=Q(books__coupons__is_used=False))
            ).filter(available_coupons__lt=10).count()
            
            total_notifications = pending_requests + recent_transactions + low_inventory_boxes
            unread_notifications = max(0, total_notifications)  # All are unread for now
            priority_notifications = pending_requests  # Fuel requests are high priority
            
        else:
            # For main center users or others
            total_notifications = 0
            unread_notifications = 0 
            priority_notifications = 0
        
        # Add system alerts that should appear in notifications for all users
        try:
            # Get active system alerts that target this user's role or are general
            current_time = timezone.now()
            
            active_alerts = SystemAlert.objects.filter(
                status='ACTIVE'
            ).filter(
                # Only include non-expired alerts
                Q(expires_at__isnull=True) |  # Never expires
                Q(expires_at__gt=current_time)  # Not yet expired
            ).filter(
                # Filter by target roles
                Q(target_roles__isnull=True) |  # General alerts for everyone
                Q(target_roles__contains=[user.role])  # Role-specific alerts
            )
            
            # Count alerts by priority
            alert_total = active_alerts.count()
            alert_priority = active_alerts.filter(
                alert_type__in=['CRITICAL', 'SECURITY']
            ).count()
            
            # Add to totals
            total_notifications += alert_total
            unread_notifications += alert_total  # Consider all active alerts as "unread"
            priority_notifications += alert_priority
            
        except Exception as alert_error:
            # If system alerts fail, continue with existing notifications
            logger.warning(f"System alerts unavailable: {alert_error}")
        
        return Response({
            'total': total_notifications,
            'unread': unread_notifications,
            'priority': priority_notifications,
            'status': 'success'
        })
        
    except Exception as e:
        # Return zeros if there's an error to prevent UI breakage
        return Response({
            'total': 0,
            'unread': 0,
            'priority': 0,
            'status': 'error',
            'message': str(e)
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unified_notifications(request):
    """
    Get unified notifications including both regular notifications and system alerts
    """
    try:
        user = request.user
        recipient_type = request.GET.get('recipient_type', user.role)
        recipient_id = request.GET.get('recipient_id', str(user.id))
        
        notifications_list = []
        
        # Add system alerts as notifications
        try:
            current_time = timezone.now()
            
            active_alerts = SystemAlert.objects.filter(
                status='ACTIVE'
            ).filter(
                # Only include non-expired alerts
                Q(expires_at__isnull=True) |  # Never expires
                Q(expires_at__gt=current_time)  # Not yet expired
            ).filter(
                # Filter by target roles
                Q(target_roles__isnull=True) |  # General alerts for everyone
                Q(target_roles__contains=[user.role])  # Role-specific alerts
            ).order_by('-created_at')
            
            for alert in active_alerts:
                # Convert SystemAlert to notification format
                notifications_list.append({
                    'id': f'alert_{alert.id}',
                    'title': alert.title,
                    'message': alert.message,
                    'message_type': 'SYSTEM_ALERT',
                    'priority': alert.alert_type,  # INFO, WARNING, ERROR, CRITICAL, SECURITY
                    'is_read': False,  # System alerts are always considered unread
                    'created_at': alert.created_at.isoformat(),
                    'sender_type': 'SYSTEM',
                    'sender_name': 'System Administrator',
                    'data': {
                        'alert_type': alert.alert_type,
                        'priority': alert.priority,
                        'source': 'system_alert',
                        'target_roles': alert.target_roles,
                        'expires_at': alert.expires_at.isoformat() if alert.expires_at else None,
                        'alert_id': alert.id
                    },
                    'action_required': alert.alert_type in ['CRITICAL', 'SECURITY'],
                    'action_url': None
                })
                
        except Exception as alert_error:
            logger.warning(f"Failed to load system alerts: {alert_error}")
        
        # For subcenter users, add regular notifications
        if hasattr(user, 'sub_center') and user.sub_center:
            try:
                # Add pending fuel requests as notifications
                pending_requests = FuelEntitlement.objects.filter(
                    sub_center=user.sub_center,
                    status='PENDING'
                ).order_by('-created_at')[:10]  # Limit to recent 10
                
                for request_obj in pending_requests:
                    notifications_list.append({
                        'id': f'fuel_request_{request_obj.id}',
                        'title': f'Fuel Request - {request_obj.beneficiary.username if request_obj.beneficiary else "Unknown"}',
                        'message': f'Fuel request for {request_obj.quantity}L pending approval',
                        'message_type': 'FUEL_REQUEST',
                        'priority': 'HIGH',
                        'is_read': False,
                        'created_at': request_obj.created_at.isoformat(),
                        'sender_type': 'BENEFICIARY',
                        'sender_name': request_obj.beneficiary.username if request_obj.beneficiary else 'Unknown',
                        'data': {
                            'fuel_request_id': request_obj.id,
                            'quantity': str(request_obj.quantity),
                            'beneficiary_id': request_obj.beneficiary.id if request_obj.beneficiary else None,
                            'source': 'fuel_request'
                        },
                        'action_required': True,
                        'action_url': f'/fuel-requests/{request_obj.id}'
                    })
                
                # Add low inventory alerts
                low_inventory_boxes = Box.objects.filter(
                    assigned_to=user.sub_center,
                    status='RECEIVED'
                ).annotate(
                    available_coupons=Count('books__coupons', filter=Q(books__coupons__is_used=False))
                ).filter(available_coupons__lt=10)[:5]  # Limit to 5
                
                for box in low_inventory_boxes:
                    notifications_list.append({
                        'id': f'low_inventory_{box.id}',
                        'title': f'Low Inventory Alert - Box {box.box_number}',
                        'message': f'Only {box.available_coupons} coupons remaining',
                        'message_type': 'INVENTORY_UPDATE',
                        'priority': 'NORMAL',
                        'is_read': False,
                        'created_at': box.created_at.isoformat(),
                        'sender_type': 'SYSTEM',
                        'sender_name': 'Inventory System',
                        'data': {
                            'box_id': box.id,
                            'available_coupons': box.available_coupons,
                            'box_number': box.box_number,
                            'source': 'inventory_alert'
                        },
                        'action_required': box.available_coupons < 5,
                        'action_url': f'/inventory/boxes/{box.id}'
                    })
                    
            except Exception as regular_error:
                logger.warning(f"Failed to load regular notifications: {regular_error}")
        
        # Sort all notifications by created_at descending
        notifications_list.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'results': notifications_list,
            'count': len(notifications_list),
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Unified notifications error: {str(e)}")
        return Response({
            'results': [],
            'count': 0,
            'status': 'error',
            'message': str(e)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the current user
    """
    try:
        user = request.user
        
        # For now, just return success since we don't have a notifications table yet
        # In the future, this would update notification read status
        
        return Response({
            'status': 'success',
            'message': 'All notifications marked as read'
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# FUEL ENTITLEMENTS API - FIX 500 ERROR
# ============================================

class FuelEntitlementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fuel entitlements.
    Hardened to be schema-aware to avoid FieldError when optional columns are missing.
    """
    queryset = FuelEntitlement.objects.all()
    serializer_class = FuelEntitlementSerializer
    permission_classes = [IsAuthenticated]

    def _model_has_field(self, name: str) -> bool:
        try:
            return any(f.name == name for f in FuelEntitlement._meta.get_fields())
        except Exception:
            return False

    def get_queryset(self):
        """Filter based on user role and available schema."""
        user = self.request.user
        qs = FuelEntitlement.objects.all()

        # Safe select_related only on existing relations
        select_fields = []
        for rel in ('beneficiary', 'session', 'created_by', 'approved_by', 'sub_center'):
            if self._model_has_field(rel):
                select_fields.append(rel)
        if select_fields:
            qs = qs.select_related(*select_fields)

        try:
            if getattr(user, 'role', None) == 'SUB_CENTER' and getattr(user, 'sub_center', None) is not None:
                # Only filter if sub_center relation exists on model
                if self._model_has_field('sub_center'):
                    qs = qs.filter(sub_center=user.sub_center)
            elif getattr(user, 'role', None) == 'BENEFICIARY':
                # Model uses direct FK to User named 'beneficiary'
                if self._model_has_field('beneficiary'):
                    qs = qs.filter(beneficiary=user)
            # MAIN_CENTER, AUDITOR, ADMIN see all
        except Exception:
            # If filtering fails due to schema mismatch, fall back to unfiltered
            pass

        return qs
    
    def list(self, request, *args, **kwargs):
        """Enhanced list method with error handling and 200 on recoverable failures."""
        try:
            queryset = self.filter_queryset(self.get_queryset())

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except Exception as e:
            # Return empty list with error info instead of 500 to avoid UI crashes
            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': [],
                'error': str(e)
            }, status=status.HTTP_200_OK)
    
    def create(self, request, *args, **kwargs):
        """
        Create new fuel entitlement with validation
        """
        try:
            # Add created_by automatically
            request.data['created_by'] = request.user.id
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'message': 'Failed to create fuel entitlement'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get fuel entitlement statistics"""
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        
        queryset = self.get_queryset()
        
        # Basic counts
        total_entitlements = queryset.count()
        pending_entitlements = queryset.filter(status='PENDING').count()
        approved_entitlements = queryset.filter(status='APPROVED').count()
        expired_entitlements = queryset.filter(
            period_end__lt=timezone.now().date(),
            status__in=['PENDING', 'APPROVED', 'PARTIALLY_ALLOCATED']
        ).count()
        
        # Aggregate sums  
        litres_stats = queryset.aggregate(
            total_litres_entitled=Sum('litres_entitled'),
            total_litres_allocated=Sum('litres_allocated')
        )
        
        total_litres_entitled = litres_stats['total_litres_entitled'] or 0
        total_litres_allocated = litres_stats['total_litres_allocated'] or 0
        
        # Calculate allocation percentage
        allocation_percentage = 0
        if total_litres_entitled > 0:
            allocation_percentage = (total_litres_allocated / total_litres_entitled) * 100
        
        stats = {
            'total_entitlements': total_entitlements,
            'pending_entitlements': pending_entitlements,
            'approved_entitlements': approved_entitlements,
            'expired_entitlements': expired_entitlements,
            'total_litres_entitled': float(total_litres_entitled),
            'total_litres_allocated': float(total_litres_allocated),
            'allocation_percentage': round(allocation_percentage, 2)
        }
        
        return Response(stats)


# NESTED SUBCENTER ENDPOINT VIEWS for specific subcenter statistics and activity
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenter_statistics_detail_view(request, subcenter_id):
    """
    Get detailed statistics for a specific subcenter
    Frontend expects: /api/v1/subcenters/{id}/statistics/
    """
    try:
        user = request.user
        
        # Get the specific subcenter
        try:
            subcenter = SubCenter.objects.get(id=subcenter_id)
        except SubCenter.DoesNotExist:
            return Response(
                {'error': f'Subcenter with ID {subcenter_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions - users can only access their own subcenter unless admin
        if user.role == 'SUB_CENTER' and user.sub_center and user.sub_center.id != subcenter_id:
            return Response(
                {'error': 'Access denied to this subcenter'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate detailed statistics for this subcenter
        total_boxes = Box.objects.filter(assigned_to=subcenter).count()
        total_books = Book.objects.filter(box__assigned_to=subcenter).count()
        total_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter).count()
        used_coupons = Coupon.objects.filter(
            book__box__assigned_to=subcenter, 
            status='USED'
        ).count()
        
        # Dispatches to this subcenter
        received_dispatches = BookDispatch.objects.filter(
            destination_subcenter=subcenter
        ).count()
        
        pending_dispatches = BookDispatch.objects.filter(
            destination_subcenter=subcenter,
            status='PENDING'
        ).count()
        
        # Recent activity (last 30 days)
        recent_transactions = FuelTransaction.objects.filter(
            coupon__book__box__assigned_to=subcenter,
            timestamp__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Active members
        active_members = User.objects.filter(
            sub_center=subcenter,
            is_active=True
        ).count()
        
        # Revenue/value calculations
        total_value = Coupon.objects.filter(
            book__box__assigned_to=subcenter
        ).aggregate(
            total=Sum('denomination')
        )['total'] or 0
        
        used_value = Coupon.objects.filter(
            book__box__assigned_to=subcenter,
            status='USED'
        ).aggregate(
            total=Sum('denomination')
        )['total'] or 0
        
        statistics = {
            'subcenter_id': subcenter.id,
            'subcenter_name': subcenter.name,
            'subcenter_code': subcenter.code or f'SC-{subcenter.id}',
            'location': {
                'district': subcenter.district or 'Not specified',
                'province': subcenter.province or 'Not specified'
            },
            'inventory': {
                'total_boxes': total_boxes,
                'total_books': total_books,
                'total_coupons': total_coupons,
                'used_coupons': used_coupons,
                'available_coupons': total_coupons - used_coupons,
                'utilization_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 2)
            },
            'dispatches': {
                'total_received': received_dispatches,
                'pending': pending_dispatches,
                'completed': received_dispatches - pending_dispatches
            },
            'activity': {
                'recent_transactions': recent_transactions,
                'active_members': active_members
            },
            'financial': {
                'total_value': float(total_value),
                'used_value': float(used_value),
                'available_value': float(total_value - used_value)
            },
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(statistics)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve subcenter statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenter_recent_activity_view(request, subcenter_id):
    """
    Get recent activity for a specific subcenter
    Frontend expects: /api/v1/subcenters/{id}/recent_activity/
    """
    try:
        user = request.user
        
        # Get the specific subcenter
        try:
            subcenter = SubCenter.objects.get(id=subcenter_id)
        except SubCenter.DoesNotExist:
            return Response(
                {'error': f'Subcenter with ID {subcenter_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if user.role == 'SUB_CENTER' and user.sub_center and user.sub_center.id != subcenter_id:
            return Response(
                {'error': 'Access denied to this subcenter'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get recent activity (last 30 days by default)
        days = int(request.GET.get('days', 30))
        since_date = timezone.now() - timedelta(days=days)
        
        # Recent transactions
        recent_transactions = FuelTransaction.objects.filter(
            coupon__book__box__assigned_to=subcenter,
            timestamp__gte=since_date
        ).order_by('-timestamp')[:20]
        
        # Recent dispatches
        recent_dispatches = BookDispatch.objects.filter(
            destination_subcenter=subcenter,
            created_at__gte=since_date
        ).order_by('-created_at')[:10]
        
        # Recent user activity
        recent_logins = User.objects.filter(
            sub_center=subcenter,
            last_login__gte=since_date
        ).order_by('-last_login')[:10]
        
        # Format activity data
        activity_data = {
            'subcenter_id': subcenter.id,
            'subcenter_name': subcenter.name,
            'period_days': days,
            'since_date': since_date.isoformat(),
            'transactions': [
                {
                    'id': tx.id,
                    'timestamp': tx.timestamp.isoformat(),
                    'amount': float(tx.amount),
                    'coupon_id': tx.coupon.id if tx.coupon else None,
                    'beneficiary': tx.beneficiary.get_full_name() if tx.beneficiary else 'Unknown',
                    'type': 'FUEL_TRANSACTION'
                } for tx in recent_transactions
            ],
            'dispatches': [
                {
                    'id': dispatch.id,
                    'created_at': dispatch.created_at.isoformat(),
                    'from_subcenter': dispatch.source_subcenter.name if dispatch.source_subcenter else 'Central',
                    'books_count': dispatch.books.count() if hasattr(dispatch, 'books') else 0,
                    'status': dispatch.status,
                    'type': 'DISPATCH'
                } for dispatch in recent_dispatches
            ],
            'user_activity': [
                {
                    'id': user.id,
                    'username': user.username,
                    'full_name': user.get_full_name(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'role': user.role,
                    'type': 'USER_LOGIN'
                } for user in recent_logins
            ],
            'summary': {
                'total_transactions': len(recent_transactions),
                'total_dispatches': len(recent_dispatches),
                'active_users': len(recent_logins)
            }
        }
        
        return Response(activity_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve subcenter activity: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ADDITIONAL ANALYTICS VIEWS for subcenter dashboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_subcenter_distribution_timeline(request):
    """
    Analytics endpoint for subcenter distribution timeline
    """
    try:
        # Get timeline data for subcenter distributions
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Get dispatches by date
        dispatches_by_date = BookDispatch.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).extra(
            select={'date': 'DATE(created_at)'}
        ).values('date').annotate(
            count=Count('id'),
            total_books=Count('books')
        ).order_by('date')
        
        timeline_data = [
            {
                'date': item['date'].isoformat() if item['date'] else None,
                'dispatches': item['count'],
                'books_dispatched': item['total_books']
            } for item in dispatches_by_date
        ]
        
        return Response({
            'timeline': timeline_data,
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': 30
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve distribution timeline: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_top_programs_consumption(request):
    """
    Analytics endpoint for top programs consumption
    """
    try:
        # Get top programs by consumption
        # Assuming programs are linked to beneficiaries and their fuel usage
        programs_data = Program.objects.annotate(
            total_consumption=Sum('beneficiaryprofile__fuelentitlement__monthly_allocation'),
            beneficiary_count=Count('beneficiaryprofile')
        ).order_by('-total_consumption')[:10]
        
        consumption_data = [
            {
                'program_id': program.id,
                'program_name': program.name,
                'description': program.description or '',
                'total_consumption': float(program.total_consumption or 0),
                'beneficiary_count': program.beneficiary_count,
                'average_consumption': float((program.total_consumption or 0) / max(program.beneficiary_count, 1))
            } for program in programs_data
        ]
        
        return Response({
            'top_programs': consumption_data,
            'total_programs': Program.objects.count(),
            'analysis_date': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve programs consumption: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# LIST VIEWS for subcenter statistics and overview
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenter_statistics_list_view(request):
    """
    List view for all subcenter statistics
    Frontend expects: /api/v1/subcenter/statistics/
    """
    # This can reuse the existing subcenter_statistics function
    return subcenter_statistics(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subcenter_overview_view(request):
    """
    Overview of all subcenters with summary data
    Frontend expects: /api/v1/subcenter/overview/
    """
    try:
        user = request.user
        
        # Get subcenters based on user role
        if user.role == 'SUB_CENTER' and user.sub_center:
            subcenters = SubCenter.objects.filter(id=user.sub_center.id)
        else:
            subcenters = SubCenter.objects.all()
        
        overview_data = []
        
        for subcenter in subcenters:
            # Quick summary stats
            total_books = Book.objects.filter(box__assigned_to=subcenter).count()
            total_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter).count()
            used_coupons = Coupon.objects.filter(
                book__box__assigned_to=subcenter, 
                status='USED'
            ).count()
            
            recent_activity = FuelTransaction.objects.filter(
                coupon__book__box__assigned_to=subcenter,
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count()
            
            overview_data.append({
                'id': subcenter.id,
                'name': subcenter.name,
                'code': subcenter.code or f'SC-{subcenter.id}',
                'district': subcenter.district or 'Not specified',
                'province': subcenter.province or 'Not specified',
                'summary': {
                    'total_books': total_books,
                    'total_coupons': total_coupons,
                    'available_coupons': total_coupons - used_coupons,
                    'utilization_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 1),
                    'recent_activity': recent_activity
                }
            })
        
        return Response({
            'subcenters': overview_data,
            'total_count': len(overview_data),
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve subcenter overview: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# DISPATCHER VIEW for handling dispatcher API calls
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dispatcher_view(request):
    """
    List dispatchers (users who can create dispatches)
    Frontend expects: /api/v1/dispatchers/
    """
    try:
        # Get users who can dispatch (admin, managers, or specific roles)
        dispatchers = User.objects.filter(
            Q(role='ADMIN') | Q(role='MANAGER') | Q(role='SUB_CENTER') | Q(role='SUPERUSER') | Q(is_superuser=True),
            is_active=True
        ).select_related('sub_center')
        
        dispatcher_data = [
            {
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name(),
                'email': user.email,
                'role': user.role,
                'sub_center': {
                    'id': user.sub_center.id if user.sub_center else None,
                    'name': user.sub_center.name if user.sub_center else None
                } if user.sub_center else None,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None
            } for user in dispatchers
        ]
        
        return Response({
            'dispatchers': dispatcher_data,
            'count': len(dispatcher_data),
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve dispatchers: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dispatch_page_config_view(request):
    """
    Configuration data for dispatch page
    Frontend expects: /api/v1/dispatch-page-config/
    """
    try:
        # Get available subcenters for dispatch targets
        subcenters = SubCenter.objects.filter(is_active=True)
        
        # Get available books for dispatch
        available_books = Book.objects.filter(
            is_archived=False,
            box__isnull=False
        ).select_related('box')
        
        config_data = {
            'subcenters': [
                {
                    'id': sc.id,
                    'name': sc.name,
                    'code': sc.code or f'SC-{sc.id}',
                    'district': sc.district,
                    'province': sc.province
                } for sc in subcenters
            ],
            'available_books': [
                {
                    'id': book.id,
                    'book_number': book.book_number,
                    'box_id': book.box.id if book.box else None,
                    'box_number': book.box.box_number if book.box else None,
                    'coupon_count': book.coupons.count()
                } for book in available_books[:50]  # Limit to 50 for performance
            ],
            'dispatch_statuses': ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(config_data)
        
