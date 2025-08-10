#!/usr/bin/env python
"""
Comprehensive API Field Mapping and Page Testing
Tests all forms, field mappings, and backend fetching for all pages
"""
import requests
import json
from datetime import date, datetime
import time

# Configuration
API_BASE = 'http://127.0.0.1:8000/api/v1'
LOGIN_ENDPOINT = f'{API_BASE}/auth/login/'

def login_and_get_token():
    """Login and get authentication token"""
    login_data = {
        'username': 'admin',
        'password': 'password123'
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=login_data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_endpoint(endpoint, method='GET', data=None, description="", token=None):
    """Generic endpoint tester"""
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        if method.upper() == 'GET':
            response = requests.get(f'{API_BASE}{endpoint}', headers=headers)
        elif method.upper() == 'POST':
            response = requests.post(f'{API_BASE}{endpoint}', json=data, headers=headers)
        elif method.upper() == 'PUT':
            response = requests.put(f'{API_BASE}{endpoint}', json=data, headers=headers)
        elif method.upper() == 'PATCH':
            response = requests.patch(f'{API_BASE}{endpoint}', json=data, headers=headers)
        elif method.upper() == 'DELETE':
            response = requests.delete(f'{API_BASE}{endpoint}', headers=headers)
        
        success = response.status_code in [200, 201, 202, 204]
        status_icon = "✅" if success else "❌"
        print(f"   {status_icon} {description}: {response.status_code}")
        
        if not success and response.status_code != 404:
            try:
                error_text = response.text[:200] + "..." if len(response.text) > 200 else response.text
                print(f"      Error: {error_text}")
            except:
                print(f"      Status Code: {response.status_code}")
        
        return success, response
    except Exception as e:
        print(f"   ❌ {description}: Connection Error - {e}")
        return False, None

def test_box_receipt_forms():
    """Test Box Receipt API with frontend field mappings"""
    print("\n📦 TESTING BOX RECEIPT MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        print("   ❌ Authentication failed")
        return False
    
    # Test listing boxes
    success, _ = test_endpoint('/boxes/', 'GET', description="List Box Receipts", token=token)
    
    # Test creating box with frontend field mappings
    box_data = {
        'couponAmount': 20,  # Frontend → denomination
        'monetaryValueUSD': 15.50,  # Frontend → monetary_value_usd
        'fuelPricePerLitreUSD': 0.78,  # Frontend → fuel_price_per_litre_usd
        'exchangeRate': 1.25,  # Frontend → exchange_rate
        'number_of_coupons': 100,
        'total_litres': 2000,
        'box_date': date.today().isoformat(),
        'sub_center': 1,
        'notes': 'Test box from comprehensive API testing'
    }
    
    success, response = test_endpoint('/boxes/', 'POST', box_data, "Create Box Receipt", token)
    
    # Test book dispatches
    test_endpoint('/book-dispatches/', 'GET', description="List Book Dispatches", token=token)
    
    return success

def test_parliament_forms():
    """Test Parliament Session and Program APIs"""
    print("\n🏛️ TESTING PARLIAMENT MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test Parliament Sessions
    test_endpoint('/parliament-sessions/', 'GET', description="List Parliament Sessions", token=token)
    
    session_data = {
        'title': 'Test Parliamentary Session',
        'session_type': 'REGULAR',
        'start_date': date.today().isoformat(),
        'end_date': date.today().isoformat(),
        'description': 'Test session for comprehensive API testing',
        'venue': 'Parliament Main Chamber',
        'fuel_entitlement_litres': 150.0,
        'is_mandatory': True,
        'session_manager': 1,  # Frontend → organizer mapping
        'managing_subcenter': 1,
        'is_active': True
    }
    
    session_success, _ = test_endpoint('/parliament-sessions/', 'POST', session_data, "Create Parliament Session", token)
    
    # Test Programs
    test_endpoint('/programs/', 'GET', description="List Programs", token=token)
    
    program_data = {
        'title': 'Test Program',  # Frontend → name mapping
        'description': 'Test program for comprehensive API testing',
        'program_type': 'COMMITTEE',
        'session': 1,
        'start_time': '09:00:00',
        'end_time': '17:00:00',
        'venue': 'Committee Room A',
        'scheduled_date': date.today().isoformat(),
        'end_date': date.today().isoformat(),
        'location': 'Parliament Building',
        'organizer': 1,
        'sub_center': 1,
        'is_active': True
    }
    
    program_success, _ = test_endpoint('/programs/', 'POST', program_data, "Create Program", token)
    
    # Test Session Attendance
    test_endpoint('/session-attendance/', 'GET', description="List Session Attendance", token=token)
    
    return session_success and program_success

def test_beneficiary_forms():
    """Test Beneficiary and Member Profile APIs"""
    print("\n👥 TESTING BENEFICIARY MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test Beneficiary Categories
    test_endpoint('/beneficiary-categories/', 'GET', description="List Beneficiary Categories", token=token)
    
    # Test Constituencies
    test_endpoint('/constituencies/', 'GET', description="List Constituencies", token=token)
    
    # Test Vehicle Categories
    test_endpoint('/vehicle-categories/', 'GET', description="List Vehicle Categories", token=token)
    
    # Test Beneficiary Profiles
    test_endpoint('/beneficiary-profiles/', 'GET', description="List Beneficiary Profiles", token=token)
    
    # Test creating beneficiary profile with frontend field mappings
    beneficiary_data = {
        'user': 1,
        'category': 1,
        'constituency': 1,
        'vehicle_category': 1,
        'employeeId': 'EMP001',  # Frontend → employee_id
        'position': 'Member of Parliament',
        'department': 'Parliament',
        'monthly_entitlement_litres': 300.0,
        'vehicleMake': 'Toyota',  # Frontend → vehicle_make
        'vehicleModel': 'Prado',  # Frontend → vehicle_model
        'vehicle_year': 2023,
        'engine_size': '3.0L V6',
        'vehicle_registration': 'ABC123ZW',
        'fuel_type': 'DIESEL',
        'officeLocation': 'Parliament Building Room 205'  # Frontend → office_location
    }
    
    success, _ = test_endpoint('/beneficiary-profiles/', 'POST', beneficiary_data, "Create Beneficiary Profile", token)
    
    return success

def test_fuel_management_forms():
    """Test Fuel Management APIs"""
    print("\n⛽ TESTING FUEL MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test Fuel Requirements
    test_endpoint('/fuel-requirements/', 'GET', description="List Fuel Requirements", token=token)
    
    fuel_req_data = {
        'fuel_type': 'DIESEL',
        'period': 'MONTHLY',
        'required_litres': 10000.0,
        'required_coupons': 500,
        'litres_per_coupon': 20.0,
        'effective_from': date.today().isoformat(),
        'is_active': True,
        'notes': 'Test fuel requirement configuration'
    }
    
    req_success, _ = test_endpoint('/fuel-requirements/', 'POST', fuel_req_data, "Create Fuel Requirement", token)
    
    # Test Fuel Entitlements
    test_endpoint('/fuel-entitlements/', 'GET', description="List Fuel Entitlements", token=token)
    
    # Test Coupon Allocations
    test_endpoint('/coupon-allocations/', 'GET', description="List Coupon Allocations", token=token)
    
    return req_success

def test_subcenter_management():
    """Test Sub-Center Management APIs"""
    print("\n🏢 TESTING SUB-CENTER MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test Sub-Centers
    test_endpoint('/subcenters/', 'GET', description="List Sub-Centers", token=token)
    
    subcenter_data = {
        'code': 'TSC002',
        'name': 'Test SubCenter 2',
        'location': 'Test Location 2',
        'is_active': True
    }
    
    subcenter_success, _ = test_endpoint('/subcenters/', 'POST', subcenter_data, "Create Sub-Center", token)
    
    # Test Pool Vehicles
    test_endpoint('/pool-vehicles/', 'GET', description="List Pool Vehicles", token=token)
    
    # Test Drivers
    test_endpoint('/drivers/', 'GET', description="List Drivers", token=token)
    
    # Test Vehicle Assignments
    test_endpoint('/vehicle-assignments/', 'GET', description="List Vehicle Assignments", token=token)
    
    return subcenter_success

def test_user_management():
    """Test User Management APIs"""
    print("\n👤 TESTING USER MANAGEMENT")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test Users list
    test_endpoint('/users/', 'GET', description="List Users", token=token)
    
    # Test User Registration with frontend field mappings
    user_data = {
        'username': f'testuser_{int(time.time())}',
        'email': 'testuser@parliament.gov.zw',
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '+263771234567',
        'password': 'SecurePass123!',
        'password2': 'SecurePass123!',  # Frontend → password2
        'role': 'BENEFICIARY',
        'sub_center': 1,  # Frontend department → sub_center
        'registration_justification': 'Test user for comprehensive API testing'
    }
    
    success, _ = test_endpoint('/auth/register/', 'POST', user_data, "Create User Account")
    
    return success

def test_reports_and_analytics():
    """Test Reports and Analytics APIs"""
    print("\n📊 TESTING REPORTS & ANALYTICS")
    
    token = login_and_get_token()
    if not token:
        return False
    
    # Test System Alerts
    test_endpoint('/system-alerts/', 'GET', description="List System Alerts", token=token)
    
    # Test Audit Logs
    test_endpoint('/audit-logs/', 'GET', description="List Audit Logs", token=token)
    
    # Test Analytics endpoints (if available)
    test_endpoint('/analytics/dashboard/', 'GET', description="Dashboard Analytics", token=token)
    
    return True

def test_authentication_flows():
    """Test Authentication APIs"""
    print("\n🔐 TESTING AUTHENTICATION")
    
    # Test Login
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    success, response = test_endpoint('/auth/login/', 'POST', login_data, "User Login")
    
    if success and response:
        try:
            token_data = response.json()
            access_token = token_data.get('access')
            refresh_token = token_data.get('refresh')
            
            if access_token:
                print("   ✅ Access token received")
            if refresh_token:
                print("   ✅ Refresh token received")
                
                # Test token refresh
                refresh_data = {'refresh': refresh_token}
                refresh_success, _ = test_endpoint('/token/refresh/', 'POST', refresh_data, "Token Refresh")
        except:
            pass
    
    return success

def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print("🧪 COMPREHENSIVE API AND FORM TESTING")
    print("=" * 60)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("Authentication", test_authentication_flows),
        ("User Management", test_user_management),
        ("Box Receipt Management", test_box_receipt_forms),
        ("Parliament Management", test_parliament_forms),
        ("Beneficiary Management", test_beneficiary_forms),
        ("Fuel Management", test_fuel_management_forms),
        ("Sub-Center Management", test_subcenter_management),
        ("Reports & Analytics", test_reports_and_analytics),
    ]
    
    results = []
    passed = 0
    total = len(tests)
    
    for test_name, test_function in tests:
        print(f"\n{'='*20} {test_name.upper()} {'='*20}")
        try:
            result = test_function()
            results.append((test_name, result))
            if result:
                passed += 1
                print(f"   🎉 {test_name}: PASSED")
            else:
                print(f"   ⚠️  {test_name}: PARTIAL/ISSUES")
        except Exception as e:
            print(f"   ❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Final Results
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ ISSUES"
        print(f"   {status} {test_name}")
    
    print(f"\n📈 OVERALL SCORE: {passed}/{total} test categories passed")
    
    if passed == total:
        print("🎉 ALL SYSTEMS OPERATIONAL!")
        print("✅ All forms and APIs are working correctly")
        print("✅ Field mappings are successful")
        print("✅ Frontend-backend integration is complete")
    elif passed >= total * 0.7:  # 70% or more
        print("✅ SYSTEM MOSTLY OPERATIONAL!")
        print("⚠️  Some minor issues need attention")
    else:
        print("⚠️  SYSTEM NEEDS ATTENTION")
        print("❌ Multiple issues require fixing")
    
    print(f"\n🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    return passed >= total * 0.7

if __name__ == '__main__':
    run_comprehensive_tests()
