#!/usr/bin/env python
"""
Simple test script to run inside Django shell to identify boxes API issue
"""

def test_boxes_api():
    """Test the boxes API components step by step"""
    print("=== Testing Boxes API Components ===\n")
    
    try:
        # Test 1: Import models
        print("1. Testing model imports...")
        from fuel.models import Box, SubCenter, User
        print("   ✓ Models imported successfully")
        
        # Test 2: Test basic Box queryset
        print("\n2. Testing Box.objects.all()...")
        boxes = Box.objects.all()
        box_count = boxes.count()
        print(f"   ✓ Found {box_count} boxes in database")
        
        # Test 3: Test Box queryset with select_related
        print("\n3. Testing Box queryset with select_related...")
        boxes_with_relations = Box.objects.all().select_related('assigned_to', 'received_by')
        print(f"   ✓ Queryset with relations created successfully")
        
        # Test 4: Test iteration through boxes
        print("\n4. Testing iteration through first 3 boxes...")
        for i, box in enumerate(boxes_with_relations[:3]):
            try:
                box_info = {
                    'id': box.id,
                    'box_code': box.box_code,
                    'fuel_type': box.fuel_type,
                    'status': box.status,
                    'assigned_to': str(box.assigned_to) if box.assigned_to else None,
                    'received_by': str(box.received_by) if box.received_by else None,
                }
                print(f"   Box {i+1}: {box_info}")
            except Exception as e:
                print(f"   ✗ Error processing box {i+1}: {e}")
                return False
        
        # Test 5: Test BoxViewSet import
        print("\n5. Testing BoxViewSet import...")
        from fuel.views_main import BoxViewSet
        print("   ✓ BoxViewSet imported successfully")
        
        # Test 6: Test BoxViewSet get_queryset method
        print("\n6. Testing BoxViewSet.get_queryset()...")
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser
        
        # Create mock request
        factory = RequestFactory()
        request = factory.get('/api/v1/boxes/')
        
        # Try to get or create a superuser
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                print("   Creating test superuser...")
                user = User.objects.create_superuser('testadmin', 'test@example.com', 'testpass123')
        except Exception as e:
            print(f"   Warning: Could not create superuser: {e}")
            user = AnonymousUser()
        
        request.user = user
        
        # Test ViewSet
        viewset = BoxViewSet()
        viewset.request = request
        
        try:
            queryset = viewset.get_queryset()
            print(f"   ✓ BoxViewSet queryset created: {queryset.count()} boxes")
        except Exception as e:
            print(f"   ✗ Error in BoxViewSet.get_queryset(): {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # Test 7: Test serialization
        print("\n7. Testing Box serialization...")
        try:
            from fuel.serializers import BoxSerializer
            
            if queryset.exists():
                box = queryset.first()
                serializer = BoxSerializer(box)
                serialized_data = serializer.data
                print(f"   ✓ Box serialized successfully: {len(serialized_data)} fields")
            else:
                print("   ⚠ No boxes to serialize")
        except Exception as e:
            print(f"   ✗ Error in serialization: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        print("\n✓ All tests passed! The boxes API should be working.")
        return True
        
    except Exception as e:
        print(f"\n✗ Critical error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Run the test
if __name__ == "__main__":
    test_boxes_api()