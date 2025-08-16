import requests
import json

def test_email_functionality():
    # Login to get token
    login_response = requests.post('http://127.0.0.1:8000/api/auth/login/', json={
        'username': 'admin',
        'password': 'pass@123'
    })

    if login_response.status_code == 200:
        token = login_response.json()['access']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test stats endpoint
        stats_response = requests.get('http://127.0.0.1:8000/api/users/stats/', headers=headers)
        
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print('=== Updated Stats Endpoint ===')
            print(f'Total Users: {stats["total_users"]}')
            print(f'Active Users: {stats["active_users"]}')
            print(f'Approved Users: {stats["approved_users"]}')
            print(f'Pending Users: {stats["pending_users"]}')
            print(f'Rejected Users: {stats["rejected_users"]}')
            print(f'Approval Rate: {stats["approval_rate"]}%')
            print(f'New Users Today: {stats["new_users_today"]}')
            print('Recent Activity:')
            print(f'  - Registrations (7d): {stats["recent_activity"]["registrations_last_7_days"]}')
            print(f'  - Approvals (7d): {stats["recent_activity"]["approvals_last_7_days"]}')
        else:
            print(f'Stats error: {stats_response.status_code} - {stats_response.text}')
            
        # Test creating a user with email for approval testing
        test_user_data = {
            "username": "testuser_email",
            "email": "testuser@parliament.gov.zw", 
            "password": "testpass123",
            "password2": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "role": "BENEFICIARY",
            "phone_number": "+263777123456",
            "sub_center": 1  # Assuming sub-center with ID 1 exists
        }
        
        # Check if user already exists
        users_response = requests.get('http://127.0.0.1:8000/api/users/', headers=headers)
        if users_response.status_code == 200:
            existing_users = users_response.json().get('results', [])
            test_user_exists = any(user['username'] == 'testuser_email' for user in existing_users)
            
            if not test_user_exists:
                # Create test user
                create_response = requests.post('http://127.0.0.1:8000/api/users/', 
                                              json=test_user_data, headers=headers)
                
                if create_response.status_code == 201:
                    new_user = create_response.json()
                    print(f'\\n=== Test User Created ===')
                    print(f'Username: {new_user["username"]}')
                    print(f'Email: {new_user["email"]}')
                    print(f'Approved: {new_user["is_approved"]}')
                    
                    # Try to approve the user to test email functionality
                    user_id = new_user['id']
                    approve_response = requests.post(f'http://127.0.0.1:8000/api/users/{user_id}/approve_user/', 
                                                   headers=headers)
                    
                    if approve_response.status_code == 200:
                        approval_result = approve_response.json()
                        print('\\n=== Approval Test Result ===')
                        print(f'Message: {approval_result["message"]}')
                        print(f'Email Sent: {approval_result.get("email_sent", "N/A")}')
                        print(f'Email Address: {approval_result.get("email_address", "N/A")}')
                    else:
                        print(f'Approval error: {approve_response.status_code} - {approve_response.text}')
                        
                else:
                    print(f'User creation error: {create_response.status_code} - {create_response.text}')
            else:
                print('Test user already exists')
        
    else:
        print(f'Login error: {login_response.status_code} - {login_response.text}')

if __name__ == '__main__':
    test_email_functionality()
