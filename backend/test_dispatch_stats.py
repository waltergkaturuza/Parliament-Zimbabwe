#!/usr/bin/env python3
import requests
import time

BASE = 'http://127.0.0.1:8000/api/v1'


def get_token(username='admin', password='Admin@123'):
    r = requests.post(f'{BASE}/auth/login/', json={'username': username, 'password': password}, timeout=10)
    r.raise_for_status()
    data = r.json()
    return data.get('access') or data.get('access_token')


def main():
    # Try a couple times in case the server is just starting
    for attempt in range(3):
        try:
            token = get_token()
            break
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(1)
    headers = {'Authorization': f'Bearer {token}'}

    print('--- GET fuel-dispatches stats (default) ---')
    r = requests.get(f'{BASE}/fuel-dispatches/stats/?subcenter=default', headers=headers, timeout=10)
    print('Status:', r.status_code)
    print('Body:', r.text[:500])

    # Also try a numeric and a non-filtered call for comparison
    print('\n--- GET fuel-dispatches stats (no filter) ---')
    r2 = requests.get(f'{BASE}/fuel-dispatches/stats/', headers=headers, timeout=10)
    print('Status:', r2.status_code)
    print('Body:', r2.text[:500])


if __name__ == '__main__':
    main()
