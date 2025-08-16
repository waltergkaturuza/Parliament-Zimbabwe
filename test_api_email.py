import requests
import json

# Test the user approval API endpoint with email functionality
BASE_URL = 'http://127.0.0.1:8000'

def test_api_with_email():
    print("=== Testing User Approval API with Email ===")
    
    # First, login as admin to get token
    login_data = {
        'username': 'admin',
        'password': 'pass@123'
    }
    
    try:
        # Login
        login_response = requests.post(f'{BASE_URL}/api/auth/login/', json=login_data)
        if login_response.status_code == 200:
            tokens = login_response.json()
            auth_headers = {
                'Authorization': f'Bearer {tokens["access"]}'
            }
            print("✅ Successfully logged in as admin")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return
        
        # Get user statistics before
        stats_response = requests.get(f'{BASE_URL}/api/admin/users/stats/', headers=auth_headers)
        if stats_response.status_code == 200:
            stats_before = stats_response.json()
            print(f"📊 Stats before approval:")
            print(f"   - Total users: {stats_before.get('total_users', 0)}")
            print(f"   - Approved users: {stats_before.get('approved_users', 0)}")
            print(f"   - Pending users: {stats_before.get('pending_users', 0)}")
        
        # Create a test user for approval
        user_data = {
            'username': 'test_email_user',
            'email': 'test.email@parliament.gov.zw',
            'password': 'testpass123',
            'password2': 'testpass123',
            'first_name': 'Email',
            'last_name': 'Test',
            'role': 'BENEFICIARY',
            'phone': '+263123456789',
            'national_id': 'EMAIL123456'
        }
        
        print(f"\n📝 Creating test user: {user_data['username']}")
        create_response = requests.post(f'{BASE_URL}/api/admin/users/', json=user_data, headers=auth_headers)
        
        if create_response.status_code == 201:
            created_user = create_response.json()
            user_id = created_user['id']
            print(f"✅ Created user with ID: {user_id}")
            print(f"   Email: {created_user.get('email')}")
            print(f"   Is approved: {created_user.get('is_approved')}")
        else:
            print(f"❌ Failed to create user: {create_response.status_code}")
            print(create_response.text)
            return
        
        # Now approve the user (this should trigger email)
        print(f"\n📧 Approving user {user_id} (this should send email to console)...")
        approve_response = requests.post(f'{BASE_URL}/api/admin/users/{user_id}/approve_user/', headers=auth_headers)
        
        if approve_response.status_code == 200:
            approval_result = approve_response.json()
            print("✅ User approval successful!")
            print(f"   Message: {approval_result.get('message')}")
            print(f"   Email sent: {approval_result.get('email_sent')}")
            print(f"   Email address: {approval_result.get('email_address')}")
            print("\n🔍 Check the Django server console for the email content!")
        else:
            print(f"❌ Failed to approve user: {approve_response.status_code}")
            print(approve_response.text)
        
        # Get updated statistics
        stats_response = requests.get(f'{BASE_URL}/api/admin/users/stats/', headers=auth_headers)
        if stats_response.status_code == 200:
            stats_after = stats_response.json()
            print(f"\n📊 Stats after approval:")
            print(f"   - Total users: {stats_after.get('total_users', 0)}")
            print(f"   - Approved users: {stats_after.get('approved_users', 0)}")
            print(f"   - Pending users: {stats_after.get('pending_users', 0)}")
            print(f"   - Approval rate: {stats_after.get('approval_rate', 0)}%")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Is the Django server running on 127.0.0.1:8000?")
        print("   Start the server with: python manage.py runserver --settings=config.settings_local")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_api_with_email()
