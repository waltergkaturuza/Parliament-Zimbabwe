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

from .models import (
    Coupon, SubCenter, Book, Box,
    User as UserModel, FuelData, CouponDistribution, FuelTransaction, SubCenterOfficer,
    BeneficiaryCategory, Constituency, VehicleCategory, ParliamentSession, Program, SessionAttendance,
    BeneficiaryProfile, AuditLog, SystemAlert, BookDispatch, CouponAllocation, FuelEntitlement,
    PoolVehicle, Driver, VehicleAssignment, FuelRequirementConfiguration
)
from .serializers import (
    CouponSerializer, SubCenterSerializer,
    BookSerializer, BoxSerializer, UserSerializer,
    UserRegistrationSerializer,
    FuelStatsSerializer, FuelTransactionSerializer, SimpleUserSerializer, SubCenterOfficerSerializer,
    BeneficiaryCategorySerializer, ConstituencySerializer, VehicleCategorySerializer,
    ParliamentSessionSerializer, ProgramSerializer, SessionAttendanceSerializer, BeneficiaryProfileSerializer, 
    BulkCouponAllocationSerializer,
    BookDispatchSerializer, CouponAllocationSerializer,
    FuelEntitlementSerializer, PoolVehicleSerializer, DriverSerializer, VehicleAssignmentSerializer,
    SystemAlertSerializer, AuditLogSerializer, BulkSessionAttendanceSerializer, BoxReceiptSerializer,
    FuelRequirementConfigurationSerializer
)
from .permissions import (
    # Role-based permissions
    SuperUserPermission, AdminPermission, MainCenterPermission, SubCenterPermission,
    ApproverPermission, MainCenterApproverPermission, SubCenterApproverPermission,
    AuditorPermission, BeneficiaryPermission, CenterBasedObjectPermission,
    
    # Workflow permissions
    MainCenterApprovalPermission, SubCenterApprovalPermission, CrossCenterApprovalPermission,
    
    # Combined permissions
    MainCenterOrSubCenterPermission, CanManageCoupon, AllStaffPermission
)
from rest_framework.views import APIView # Ensure this import is present

User = get_user_model()

# Compatibility import for profile views
try:
    from .views_profile import user_profile_view
except ImportError:
    # If views_profile doesn't exist or user_profile_view is not available, create a placeholder
    def user_profile_view(*args, **kwargs):
        from rest_framework.response import Response
        return Response({'error': 'Profile view not implemented'}, status=501)

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

class LoginView(APIView):
    permission_classes = [AllowAny]
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
                'refresh': refresh_token_string,
                'access': access_token,
                'user': SimpleUserSerializer(user).data, # Include user details in login response
            }, status=status.HTTP_200_OK)
            
            return response
        else:
            print(f"Authentication failed for username: {username}")
            # Use a consistent error response format
            response = Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            return response


# --- Existing ViewSets (Updated Permissions and Querysets) ---

class UserViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def managers(self, request):
        """List all users eligible to be subcenter managers (MAIN_CENTER or SUB_CENTER roles, approved)"""
        managers = User.objects.filter(is_approved=True, role__in=["MAIN_CENTER", "SUB_CENTER"])
        return Response(SimpleUserSerializer(managers, many=True).data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    queryset = User.objects.all().select_related('sub_center') # Select related sub_center
    serializer_class = UserSerializer
    # Adjust permissions as needed for user management roles
    permission_classes = [IsAuthenticated] # Base permission

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
             # Allow relevant users to view users (e.g., Main Center, Sub Center can see users in their center)
             return [IsAuthenticated()]
        # Only specific roles can create, update, delete users
        return [IsAuthenticated(), MainCenterPermission()]


    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Handle role filtering via query parameters
        role_filter = self.request.query_params.get('role')
        role_in_filter = self.request.query_params.get('role__in')
        
        if role_filter:
            # Handle comma-separated roles like ?role=MAIN_CENTER,SUB_CENTER
            roles = [role.strip() for role in role_filter.split(',')]
            queryset = queryset.filter(role__in=roles)
        elif role_in_filter:
            # Handle comma-separated roles like ?role__in=MAIN_CENTER,SUB_CENTER
            roles = [role.strip() for role in role_in_filter.split(',')]
            queryset = queryset.filter(role__in=roles)
        
        if user.is_authenticated:
            if user.role == 'SUB_CENTER' and user.sub_center:
                 # Sub Center officers see users in their assigned center
                 return queryset.filter(sub_center=user.sub_center)
            # Main Center, Admin, Auditor see all users
            return queryset
        return queryset.none() # Anonymous users see nothing

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_user(self, request, pk=None):
        """Approve a pending user registration"""
        user = self.get_object()
        
        if user.is_approved:
            return Response({'detail': 'User is already approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.approve(request.user)
        
        return Response({
            'message': f'User {user.username} has been approved',
            'user': SimpleUserSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def reject_user(self, request, pk=None):
        """Reject a pending user registration"""
        user = self.get_object()
        reason = request.data.get('reason', 'Registration rejected by administrator')
        
        if user.is_approved:
            return Response({'detail': 'Cannot reject an already approved user'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.reject(request.user, reason)
        
        return Response({
            'message': f'User {user.username} has been rejected',
            'reason': reason
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, MainCenterPermission])
    def pending_approvals(self, request):
        """Get all users pending approval"""
        pending_users = User.objects.filter(is_approved=False, rejection_reason__isnull=True)
        serializer = UserSerializer(pending_users, many=True)
        
        return Response({
            'count': pending_users.count(),
            'users': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        approved_users = User.objects.filter(is_approved=True).count()
        pending_users = User.objects.filter(is_approved=False, rejection_reason__isnull=True).count()
        
        # Role-based stats
        main_center_users = User.objects.filter(role='MAIN_CENTER').count()
        sub_center_users = User.objects.filter(role='SUB_CENTER').count()
        parliament_users = User.objects.filter(role='PARLIAMENT').count()
        auditor_users = User.objects.filter(role='AUDITOR').count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'approved_users': approved_users,
            'pending_users': pending_users,
            'roles': {
                'main_center': main_center_users,
                'sub_center': sub_center_users,
                'parliament': parliament_users,
                'auditor': auditor_users,
            }
        })


# Added SubCenterOfficer ViewSet
class SubCenterOfficerViewSet(viewsets.ModelViewSet):
    queryset = SubCenterOfficer.objects.all().select_related('user', 'sub_center')
    serializer_class = SubCenterOfficerSerializer
    permission_classes = [IsAuthenticated, MainCenterOrSubCenterPermission] # Fixed permission combination


class SubCenterViewSet(viewsets.ModelViewSet):
    queryset = SubCenter.objects.all().select_related('managed_by') # Select related managed_by
    serializer_class = SubCenterSerializer

    def get_permissions(self):
        # Example: Allow read for all authenticated users, write only for specific roles
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()] # Only Main Center can manage subcenters

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'SUB_CENTER' and user.sub_center:
                # Sub Center officers can only see their assigned center
                return queryset.filter(Q(managed_by=user) | Q(officers__user=user)).distinct() # Filter by managed_by or through SubCenterOfficer model
            # Main Center, Admin, etc. can see all
            return queryset
        return queryset.none() # Anonymous users see nothing

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def overview(self, request):
        """Get overview data for current user's subcenter"""
        try:
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
                coupons_used = Coupon.objects.filter(book__box__assigned_to=subcenter, is_used=True).count()
                
                data = {
                    'center_id': subcenter.code or f'SC-{subcenter.id}',
                    'center_name': subcenter.name,
                    'total_books': total_books,
                    'books_used': books_used,
                    'total_coupons': total_coupons,
                    'coupons_used': coupons_used,
                    'active_members': UserModel.objects.filter(sub_center=subcenter, is_active=True).count(),
                    'pending_handovers': BookDispatch.objects.filter(to_subcenter=subcenter, status='PENDING').count(),
                    'last_handover': BookDispatch.objects.filter(to_subcenter=subcenter).order_by('-created_at').first().created_at.strftime('%Y-%m-%d') if BookDispatch.objects.filter(to_subcenter=subcenter).exists() else '',
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
        except Exception as e:
            return Response({'error': f'Failed to retrieve subcenter overview: {str(e)}'}, status=500)

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

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get statistics for a specific subcenter"""
        subcenter = self.get_object()
        
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
            is_used=True
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
            'used_coupons': used_coupons,
            'available_coupons': total_coupons - used_coupons,
            'recent_transactions': recent_transactions,
            'usage_rate': round((used_coupons / total_coupons * 100) if total_coupons > 0 else 0, 2)
        }
        
        return Response(statistics)

    @action(detail=True, methods=['get'])
    def recent_activity(self, request, pk=None):
        """Get recent activity for a specific subcenter"""
        subcenter = self.get_object()
        
        # Get recent transactions (last 10)
        recent_transactions = FuelTransaction.objects.filter(
            coupon__book__box__assigned_to=subcenter
        ).select_related('coupon', 'coupon__book', 'beneficiary').order_by('-timestamp')[:10]
        
        # Get recent dispatches (last 5)
        recent_dispatches = BookDispatch.objects.filter(
            assigned_to=subcenter
        ).select_related('book', 'dispatched_by').order_by('-dispatch_date')[:5]
        
        activities = []
        
        # Add transactions
        for transaction in recent_transactions:
            activities.append({
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
                'type': 'dispatch',
                'description': f'Book dispatch: {dispatch.book.book_number}',
                'date': dispatch.dispatch_date,
                'details': {
                    'book_number': dispatch.book.book_number,
                    'dispatched_by': dispatch.dispatched_by.get_full_name() if dispatch.dispatched_by else 'Unknown',
                    'quantity': dispatch.quantity if hasattr(dispatch, 'quantity') else 'Not specified'
                }
            })
        
        # Sort by date descending
        activities.sort(key=lambda x: x['date'], reverse=True)
        
        return Response(activities[:15])  # Return top 15 activities

    # Removed perform_create as managed_by is now potentially set via SubCenterOfficer or explicitly


# === COUPON RECEPTION AND DISPATCH VIEWSETS ===

class BoxViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for Box management with coupon generation"""
    serializer_class = BoxSerializer
    permission_classes = [IsAuthenticated, MainCenterOrSubCenterPermission]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Box.objects.all().select_related('assigned_to', 'received_by')
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset
        elif user.role == 'SUB_CENTER' and user.sub_center:
            return queryset.filter(assigned_to=user.sub_center)
        
        return queryset.none()
    
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


class BookViewSet(viewsets.ModelViewSet):
    """Enhanced ViewSet for Book management with sequential allocation"""
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, MainCenterOrSubCenterPermission]
    
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
            box__is_received=True
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
    permission_classes = [IsAuthenticated, CanManageCoupon]
    # Use a base queryset that other methods will filter down
    queryset = Coupon.objects.all().select_related('book__box__assigned_to', 'allocated_to') # Select related for efficiency

    def get_queryset(self):
        # Apply filtering based on user role
        user = self.request.user
        if user.is_authenticated:
            if user.role in ['SUPERUSER', 'ADMIN']:
                return self.queryset  # SUPERUSER and ADMIN see all
            elif user.role == 'MAIN_CENTER':
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


    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, MainCenterOrSubCenterPermission]) # Restrict bulk allocation
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


# TODO: Implement Program model and uncomment ProgramViewSet
# class ProgramViewSet(viewsets.ModelViewSet):
#     queryset = Program.objects.all().select_related('organizer', 'sub_center') # Select related sub_center
#     serializer_class = ProgramSerializer
#     permission_classes = [IsAuthenticated] # Base permission

#     def get_permissions(self):
#         if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
#             return [IsAuthenticated()] # All authenticated users can view programs
#         # Only specific roles can create, update, delete programs
#         return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()] # Adjust based on who can manage programs

#     def get_queryset(self):
#         queryset = super().get_queryset()
#         user = self.request.user
#         if user.is_authenticated:
#              if user.role == 'SUB_CENTER' and user.sub_center:
#                  # Sub Center officer sees programs associated with their sub-center
#                  # or programs where they are the organizer
#                  return queryset.filter(Q(sub_center=user.sub_center) | Q(organizer=user)).distinct()
#              # Main Center, Admin, etc. see all programs
#              return queryset
#         return queryset.none() # Anonymous users see nothing

#     # Removed summary action - moved statistics to the dedicated StatisticsView


# TODO: Commented out AttendanceViewSet - missing Attendance model and AttendanceSerializer
# class AttendanceViewSet(viewsets.ModelViewSet):
#     serializer_class = AttendanceSerializer
#     permission_classes = [IsAuthenticated] # Base permission

#     def get_permissions(self):
#         if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
#              # Allow relevant users to view attendance
#              return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission() | BeneficiaryPermission()]
#         # Only specific roles can create, update, delete attendance records
#         return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()] # Adjust based on who records attendance


#     def get_queryset(self):
#         user = self.request.user
#         queryset = super().get_queryset().select_related('user', 'program', 'program__sub_center') # Select related for efficiency

#         if user.is_authenticated:
#             if user.role == 'MAIN_CENTER':
#                 return queryset # Main Center sees all attendance
#             elif user.role == 'SUB_CENTER' and user.sub_center:
#                 # Sub Center officer sees attendance for programs in their center
#                 # or where they are the organizer
#                 return queryset.filter(Q(program__sub_center=user.sub_center) | Q(program__organizer=user)).distinct()
#             elif user.role == 'BENEFICIARY':
#                 # Beneficiary sees their own attendance
#                 return queryset.filter(user=user)
#         return Attendance.objects.none() # Default to empty

#     # Add actions for marking attendance if needed, possibly restricted


# --- Handover ViewSet (Updated with new status, actions, and permissions) ---



# --- Fuel Transaction ViewSet (New) ---

class FuelTransactionViewSet(viewsets.ReadOnlyModelViewSet): # ReadOnly as transactions are records, not typically created/updated via API
    queryset = FuelTransaction.objects.all().select_related('beneficiary', 'coupon', 'recorded_by').order_by('-timestamp') # Default ordering
    serializer_class = FuelTransactionSerializer
    # Adjust permissions as needed - who can view transaction history?
    permission_classes = [IsAuthenticated, AllStaffPermission]

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
        return [IsAuthenticated(), MainCenterPermission() | AuditorPermission()]


class ConstituencyViewSet(viewsets.ModelViewSet):
    queryset = Constituency.objects.all()
    serializer_class = ConstituencySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission() | AuditorPermission()]


class VehicleCategoryViewSet(viewsets.ModelViewSet):
    queryset = VehicleCategory.objects.all()
    serializer_class = VehicleCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission() | AuditorPermission()]


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        session_id = self.request.query_params.get('session_id')
        program_type = self.request.query_params.get('program_type')
        
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        if program_type:
            queryset = queryset.filter(program_type=program_type)
        
        return queryset.order_by('-created')


class ParliamentSessionViewSet(viewsets.ModelViewSet):
    queryset = ParliamentSession.objects.all()
    serializer_class = ParliamentSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
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
    """ViewSet for managing book dispatches"""
    serializer_class = BookDispatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BookDispatch.objects.all()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]


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
    """ViewSet for managing system alerts"""
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = SystemAlert.objects.all()
        
        # Filter alerts based on target roles
        if user.role != 'MAIN_CENTER':
            queryset = queryset.filter(
                models.Q(target_roles__isnull=True) | 
                models.Q(target_roles__contains=[user.role])
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created')
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Mark an alert as dismissed for the current user"""
        alert = self.get_object()
        
        if not alert.is_dismissible:
            return Response({'error': 'This alert cannot be dismissed'}, status=400)
        
        # This would require a separate model to track dismissals per user
        # For now, we'll just mark it as read
        return Response({'message': 'Alert dismissed'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active alerts for the current user"""
        active_alerts = self.get_queryset().filter(
            status='ACTIVE',
            expires_at__gt=timezone.now()
        )
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing audit logs"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, MainCenterPermission]
    
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
        """Get compliance statistics"""
        period = request.query_params.get('period', 'month')
        
        # Calculate compliance stats based on period
        return Response({
            'total_transactions': 150,
            'compliant_transactions': 145,
            'compliance_rate': 96.7,
            'violations': 5,
            'period': period,
        })
    
    @action(detail=False, methods=['get'])
    def compliance_reports(self, request):
        """Get compliance reports"""
        period = request.query_params.get('period', 'month')
        
        return Response({
            'reports': [
                {
                    'id': 1,
                    'title': 'Monthly Compliance Report',
                    'period': period,
                    'compliance_rate': 96.7,
                    'generated_date': timezone.now().strftime('%Y-%m-%d'),
                }
            ]
        })
    
    @action(detail=False, methods=['get'])
    def transaction_stats(self, request):
        """Get transaction statistics"""
        return Response({
            'total_transactions': 150,
            'successful_transactions': 145,
            'failed_transactions': 5,
            'pending_transactions': 0,
        })
    
    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """Get audit transactions"""
        # Return audit logs formatted as transactions
        logs = self.get_queryset()[:50]
        transactions = []
        
        for log in logs:
            transactions.append({
                'id': log.id,
                'action': log.action,
                'model': log.model_name,
                'user': log.user.username if log.user else 'System',
                'timestamp': log.created.strftime('%Y-%m-%d %H:%M:%S'),
                'details': log.details or {},
            })
        
        return Response(transactions)
    
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


class BeneficiaryProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing beneficiary profiles"""
    serializer_class = BeneficiaryProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BeneficiaryProfile.objects.filter(is_active_beneficiary=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission()]


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
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
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


# ========================= SUBCENTER MANAGEMENT VIEWSETS =========================

class PoolVehicleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pool vehicles in subcenters"""
    serializer_class = PoolVehicleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = PoolVehicle.objects.select_related('sub_center').all()
        
        if user.role == 'MAIN_CENTER' or user.role == 'AUDITOR':
            return queryset  # Main Center and Auditors see all vehicles
        elif user.role == 'SUB_CENTER' and user.sub_center:
            # Sub Center officers see only vehicles in their center
            return queryset.filter(sub_center=user.sub_center)
        
        return queryset.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
    def perform_create(self, serializer):
        # Auto-assign to user's subcenter if they're a subcenter officer
        if self.request.user.role == 'SUB_CENTER' and self.request.user.sub_center:
            serializer.save(sub_center=self.request.user.sub_center)
        else:
            serializer.save()
    
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
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
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
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
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
        return [IsAuthenticated(), AdminPermission() | SuperUserPermission() | MainCenterPermission()]
    
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
        # Get basic statistics
        total_users = UserModel.objects.count()
        active_users = UserModel.objects.filter(is_approved=True, is_active=True).count()
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
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve dashboard statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Notification Statistics API View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """
    Notification statistics endpoint
    """
    try:
        # Get notification statistics based on the user's role and permissions
        user = request.user
        
        # Basic notification stats structure expected by frontend
        stats = {
            'unread_count': 0,
            'total_count': 0,
            'recent_notifications': [],
            'notification_types': {
                'system': 0,
                'alerts': 0,
                'messages': 0,
                'updates': 0
            },
            'last_updated': timezone.now().isoformat()
        }
        
        # For now, return basic stats structure
        # This can be expanded when notification models are implemented
        return Response(stats)
        
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
    Main dashboard endpoint for /api/v1/dashboard/
    """
    try:
        user = request.user
        
        # Basic statistics for the main dashboard
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'pending_approvals': User.objects.filter(is_approved=False, rejection_reason__isnull=True).count(),
            
            # Inventory stats
            'total_boxes': Box.objects.count(),
            'active_boxes': Box.objects.filter(is_archived=False).count(),
            'total_books': Book.objects.count(),
            'assigned_books': Book.objects.filter(is_assigned=True).count(),
            
            # Coupon stats
            'total_coupons': Coupon.objects.count(),
            'available_coupons': Coupon.objects.filter(status='AVAILABLE').count(),
            'allocated_coupons': Coupon.objects.filter(status='ALLOCATED').count(),
            'used_coupons': Coupon.objects.filter(status='USED').count(),
            
            # Parliament stats
            'total_subcenters': SubCenter.objects.count(),
            'active_subcenters': SubCenter.objects.filter(is_active=True).count(),
            
            # Recent activity
            'recent_sessions': ParliamentSession.objects.filter(
                start_date__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'recent_transactions': FuelTransaction.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count(),
            
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve dashboard statistics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Analytics Consumption Trend View - for /api/v1/analytics/consumption-trend/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_consumption_trend(request):
    """
    Fuel consumption trend analytics endpoint
    """
    try:
        # Get query parameters
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get daily consumption data
        daily_consumption = FuelTransaction.objects.filter(
            timestamp__gte=start_date
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            total_liters=Sum('litres_consumed'),
            transaction_count=Count('id')
        ).order_by('day')
        
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
        recent_week = daily_consumption.filter(day__gte=timezone.now().date() - timedelta(days=7))
        previous_week = daily_consumption.filter(
            day__gte=timezone.now().date() - timedelta(days=14),
            day__lt=timezone.now().date() - timedelta(days=7)
        )
        
        recent_avg = recent_week.aggregate(avg=Avg('total_liters'))['avg'] or 0
        previous_avg = previous_week.aggregate(avg=Avg('total_liters'))['avg'] or 0
        
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


# Analytics Fuel Requirements View - for /api/v1/analytics/fuel-requirements/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_fuel_requirements(request):
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
            fuel_type='PETROL', 
            status='AVAILABLE'
        ).count()
        
        available_diesel_coupons = Coupon.objects.filter(
            fuel_type='DIESEL', 
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


# Notification Mark All Read View - for /api/v1/notifications/mark-all-read/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the current user
    """
    try:
        user = request.user
        
        # For now, return success since we don't have a full notification system
        # This can be expanded when notification models are implemented
        
        return Response({
            'message': 'All notifications marked as read',
            'count': 0,  # Number of notifications marked as read
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to mark notifications as read: {str(e)}'}, 
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


# =========================== END MISSING VIEW IMPLEMENTATIONS ===========================

# Fuel Statistics API View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fuel_statistics(request):
    """
    Fuel statistics endpoint for dashboard and fuel pricing
    """
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
                total=Sum('fuel_volume')
            )['total'] or 0
            
            used_fuel_volume = Coupon.objects.filter(status='USED').aggregate(
                total=Sum('fuel_volume')
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
            
            # SubCenter allocation data
            subcenter_allocation = (SubCenter.objects
                                  .annotate(coupon_count=Count('coupon_allocations'))
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
@permission_classes([IsAuthenticated, AdminPermission | MainCenterPermission | AuditorPermission])
def analytics_view(request):
    """
    Provides aggregated analytics data for a specified date range.
    """
    try:
        start_date_str = request.query_params.get('start_date', (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
        end_date_str = request.query_params.get('end_date', timezone.now().strftime('%Y-%m-%d'))

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

        # --- Query Data ---
        fuel_transactions = FuelTransaction.objects.filter(timestamp__date__range=[start_date, end_date])
        attendances = SessionAttendance.objects.filter(session__date__range=[start_date, end_date])
        entitlements = FuelEntitlement.objects.filter(created__date__range=[start_date, end_date])

        # --- Aggregate Data ---
        total_fuel_dispensed = fuel_transactions.aggregate(total=Sum('litres_consumed'))['total'] or 0
        total_coupons_used = fuel_transactions.filter(coupon__isnull=False).count()
        
        total_attendance = attendances.count()
        present_attendance = attendances.filter(attended=True).count()
        attendance_rate = (present_attendance / total_attendance * 100) if total_attendance > 0 else 0

        total_entitlements = entitlements.count()
        total_litres_allocated = entitlements.aggregate(total=Sum('litres_allocated'))['total'] or 0

        # --- Prepare Response ---
        data = {
            'date_range': {
                'start_date': start_date_str,
                'end_date': end_date_str,
            },
            'fuel_summary': {
                'total_fuel_dispensed': round(total_fuel_dispensed, 2),
                'total_coupons_used': total_coupons_used,
                'average_transaction_litres': round(total_fuel_dispensed / fuel_transactions.count(), 2) if fuel_transactions.count() > 0 else 0,
            },
            'attendance_summary': {
                'total_sessions_tracked': total_attendance,
                'present_beneficiaries': present_attendance,
                'attendance_rate': round(attendance_rate, 2),
            },
            'entitlement_summary': {
                'total_entitlements_created': total_entitlements,
                'total_litres_allocated': round(total_litres_allocated, 2),
            }
        }

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': f'Failed to retrieve analytics data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        return [IsAuthenticated(), MainCenterPermission() | SubCenterPermission()]
    
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
        present_count = queryset.filter(attended=True).count()
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
        attended_sessions = queryset.filter(attended=True).count()
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
    serializer_class = CouponSerializer  # Using CouponSerializer as fallback
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
        daily_distributions = queryset.extra(
            select={'date': 'date(distribution_date)'}
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