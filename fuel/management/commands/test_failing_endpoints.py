from django.core.management.base import BaseCommand
from django.test.client import Client
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Test the specific API endpoints that are returning 500 errors'

    def handle(self, *args, **options):
        """
        Test the specific endpoints that are failing:
        1. /api/v1/boxes/
        2. /api/v1/analytics/?start_date=2025-07-19&end_date=2025-08-18
        """
        
        self.stdout.write("🧪 TESTING FAILING API ENDPOINTS")
        self.stdout.write("=" * 50)
        
        # Create a test client
        client = Client()
        
        # Get or create a test user for authentication
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.create_superuser(
                    'testadmin', 'test@example.com', 'testpass'
                )
            client.force_login(user)
            self.stdout.write(f"✅ Authenticated as user: {user.username}")
        except Exception as e:
            self.stdout.write(f"❌ Authentication failed: {str(e)}")
            return

        # Test Boxes API
        self.test_boxes_api(client)
        
        # Test Analytics API
        self.test_analytics_api(client)

    def test_boxes_api(self, client):
        """Test the /api/v1/boxes/ endpoint"""
        self.stdout.write("\n📦 TESTING BOXES API:")
        
        try:
            response = client.get('/api/v1/boxes/')
            self.stdout.write(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.stdout.write("✅ Boxes API working correctly")
                data = response.json()
                self.stdout.write(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}")
            else:
                self.stdout.write(f"❌ Boxes API failed with status {response.status_code}")
                self.stdout.write(f"Response: {response.content.decode()[:500]}")
                
        except Exception as e:
            self.stdout.write(f"❌ Boxes API test failed: {str(e)}")
            import traceback
            self.stdout.write(f"Traceback: {traceback.format_exc()}")

    def test_analytics_api(self, client):
        """Test the /api/v1/analytics/ endpoint"""
        self.stdout.write("\n📊 TESTING ANALYTICS API:")
        
        try:
            url = '/api/v1/analytics/?start_date=2025-07-19&end_date=2025-08-18'
            response = client.get(url)
            self.stdout.write(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.stdout.write("✅ Analytics API working correctly")
                data = response.json()
                self.stdout.write(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}")
            else:
                self.stdout.write(f"❌ Analytics API failed with status {response.status_code}")
                self.stdout.write(f"Response: {response.content.decode()[:500]}")
                
        except Exception as e:
            self.stdout.write(f"❌ Analytics API test failed: {str(e)}")
            import traceback
            self.stdout.write(f"Traceback: {traceback.format_exc()}")

    def test_model_queries_directly(self):
        """Test the model queries directly to identify issues"""
        self.stdout.write("\n🔍 TESTING MODEL QUERIES DIRECTLY:")
        
        try:
            from fuel.models import Box
            
            # Test basic Box query
            boxes = Box.objects.all()[:10]
            self.stdout.write(f"✅ Box.objects.all() returned {len(list(boxes))} items")
            
            # Test Box with select_related
            boxes_with_relations = Box.objects.select_related(
                'assigned_to', 'received_by', 'verified_by'
            )[:5]
            list(boxes_with_relations)
            self.stdout.write("✅ Box select_related query works")
            
        except Exception as e:
            self.stdout.write(f"❌ Box model query failed: {str(e)}")
            import traceback
            self.stdout.write(f"Traceback: {traceback.format_exc()}")

        try:
            from fuel.models import Book, Coupon, Dispatch, Allocation
            
            # Test analytics-related models
            book_count = Book.objects.count()
            coupon_count = Coupon.objects.count() 
            dispatch_count = Dispatch.objects.count()
            allocation_count = Allocation.objects.count()
            
            self.stdout.write(f"✅ Model counts - Books: {book_count}, Coupons: {coupon_count}, Dispatches: {dispatch_count}, Allocations: {allocation_count}")
            
        except Exception as e:
            self.stdout.write(f"❌ Analytics model queries failed: {str(e)}")
            import traceback
            self.stdout.write(f"Traceback: {traceback.format_exc()}")
