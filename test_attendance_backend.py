#!/usr/bin/env python
"""
Test script for AttendanceTracking backend fixes
Run with: python test_attendance_backend.py
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SessionAttendance, ParliamentSession, User
from fuel.serializers import SessionAttendanceSerializer
from django.utils import timezone
from datetime import datetime, timedelta

def test_serializer_imports():
    """Test that all necessary imports work"""
    print("🔧 Testing imports...")
    try:
        from fuel.models import SessionAttendance
        from fuel.serializers import SessionAttendanceSerializer
        from fuel.views import SessionAttendanceViewSet
        print("✅ All imports successful!")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_serializer_fields():
    """Test that serializer has expected fields"""
    print("\n📋 Testing serializer fields...")
    
    serializer = SessionAttendanceSerializer()
    fields = serializer.get_fields().keys()
    
    expected_fields = [
        'beneficiary', 'session', 'date', 'status', 'status_write',
        'attended', 'check_in_time', 'notes'
    ]
    
    missing_fields = []
    for field in expected_fields:
        if field not in fields:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return False
    else:
        print("✅ All expected fields present!")
        print(f"📝 Available fields: {list(fields)}")
        return True

def test_status_mapping():
    """Test status to attended mapping logic"""
    print("\n🔄 Testing status mapping...")
    
    serializer = SessionAttendanceSerializer()
    
    # Test status determination logic
    class MockAttendance:
        def __init__(self, attended, check_in_time=None, check_out_time=None, notes=""):
            self.attended = attended
            self.check_in_time = check_in_time
            self.check_out_time = check_out_time
            self.notes = notes
            self.session = MockSession()
    
    class MockSession:
        def __init__(self):
            self.start_date = timezone.now()
    
    # Test different scenarios
    test_cases = [
        (MockAttendance(True, timezone.now(), timezone.now()), "present"),
        (MockAttendance(True, timezone.now()), "present"),
        (MockAttendance(False), "absent"),
        (MockAttendance(False, notes="Excused absence"), "excused"),
    ]
    
    for attendance, expected_status in test_cases:
        actual_status = serializer.get_status(attendance)
        if actual_status == expected_status:
            print(f"✅ Status mapping: attended={attendance.attended} -> {actual_status}")
        else:
            print(f"❌ Status mapping error: expected {expected_status}, got {actual_status}")
            return False
    
    return True

def test_model_queries():
    """Test basic model queries"""
    print("\n📊 Testing model queries...")
    
    try:
        # Test basic queryset
        count = SessionAttendance.objects.count()
        print(f"📈 Total attendance records: {count}")
        
        # Test related queries
        sessions_count = ParliamentSession.objects.count()
        print(f"📅 Total parliament sessions: {sessions_count}")
        
        users_count = User.objects.filter(role='BENEFICIARY').count()
        print(f"👥 Total beneficiaries: {users_count}")
        
        print("✅ All queries executed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Query error: {e}")
        return False

def main():
    """Run all tests"""
    print("🎯 AttendanceTracking Backend Test Suite")
    print("=" * 50)
    
    tests = [
        test_serializer_imports,
        test_serializer_fields,
        test_status_mapping,
        test_model_queries
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        else:
            print(f"\n⚠️  Test failed: {test.__name__}")
    
    print("\n" + "=" * 50)
    print(f"🏆 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend fixes are working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
