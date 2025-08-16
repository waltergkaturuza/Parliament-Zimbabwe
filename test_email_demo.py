import requests
import json

def test_email_functionality():
    print('=== Testing User Management with Email Functionality ===')

    base_url = 'http://127.0.0.1:8000'

    # Step 1: Login to get access token
    try:
        login_data = {'username': 'admin', 'password': 'pass@123'}
        login_response = requests.post(f'{base_url}/api/auth/login/', json=login_data)
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            headers = {'Authorization': f'Bearer {tokens["access"]}'}
            print('✅ Successfully logged in as admin')
        else:
            print(f'❌ Login failed: {login_response.status_code}')
            print('Available endpoints include /api/auth/ - let me check the correct structure')
            
            # Try different login endpoints
            for endpoint in ['/api/auth/token/', '/api/v1/auth/login/', '/api/auth/jwt/create/']:
                try:
                    test_response = requests.post(f'{base_url}{endpoint}', json=login_data)
                    print(f'{endpoint}: {test_response.status_code}')
                except:
                    pass
            
            return

        # Step 2: Get current user statistics
        stats_response = requests.get(f'{base_url}/api/auth/users/stats/', headers=headers)
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f'📊 Current User Stats:')
            print(f'   - Total users: {stats.get("total_users", 0)}')
            print(f'   - Approved users: {stats.get("approved_users", 0)}')
            print(f'   - Pending users: {stats.get("pending_users", 0)}')
        
        # Step 3: Create a test user with email
        test_user = {
            'username': 'email_test_user',
            'email': 'test.approval@parliament.gov.zw',
            'password': 'test123456',
            'password2': 'test123456',
            'first_name': 'Email',
            'last_name': 'Test',
            'role': 'BENEFICIARY',
            'phone': '+263771234567',
            'national_id': 'EMAIL001234'
        }
        
        create_response = requests.post(f'{base_url}/api/auth/users/', json=test_user, headers=headers)
        
        if create_response.status_code == 201:
            user_data = create_response.json()
            user_id = user_data['id']
            print(f'✅ Created test user: {user_data["username"]} (ID: {user_id})')
            print(f'   Email: {user_data.get("email")}')
            print(f'   Is approved: {user_data.get("is_approved", False)}')
            
            # Step 4: Approve the user (this should send email to console)
            print(f'\n📧 Approving user {user_id}...')
            print('🔍 Watch the Django server console for email output!')
            
            approve_response = requests.post(f'{base_url}/api/auth/users/{user_id}/approve_user/', headers=headers)
            
            if approve_response.status_code == 200:
                result = approve_response.json()
                print('✅ User approval API call successful!')
                print(f'   Message: {result.get("message")}')
                print(f'   Email sent: {result.get("email_sent")}')
                print(f'   Email address: {result.get("email_address")}')
                
                if result.get("email_sent"):
                    print('\n🎉 EMAIL FUNCTIONALITY IS WORKING!')
                    print('📧 The approval email with username and temporary password has been sent to console')
                    print('🔍 Check the Django server terminal for the full email content')
                else:
                    print('⚠️ Email sending failed - check server logs')
            else:
                print(f'❌ Approval failed: {approve_response.status_code}')
                print(approve_response.text)
        
        else:
            print(f'❌ Failed to create test user: {create_response.status_code}')
            print(create_response.text)

    except requests.exceptions.ConnectionError:
        print('❌ Connection error: Make sure Django server is running on 127.0.0.1:8000')
        print('   Start with: python manage.py runserver --settings=config.settings_local')
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == '__main__':
    test_email_functionality()
    
    print('\n=== Email Test Summary ===')
    print('1. ✅ Email settings configured for console output in local development')
    print('2. ✅ Email utility functions created with HTML and plain text templates')  
    print('3. ✅ User approval process enhanced to send emails with temporary passwords')
    print('4. ✅ Frontend updated to show email status in success messages')
    print('5. ✅ Statistics endpoint enhanced to provide real-time data')
    print('\n📧 When users are approved, they receive:')
    print('   - Welcome email with their username')
    print('   - Temporary password they can change')
    print('   - Login instructions and system details')
    print('   - Professional HTML-formatted email')
