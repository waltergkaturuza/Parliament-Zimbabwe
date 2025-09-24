#!/usr/bin/env python3
import requests
import sys

BASE = 'http://127.0.0.1:8000/api/v1'

def main():
    try:
        print('--- LOGIN (debug_local_login) ---')
        resp = requests.post(f'{BASE}/auth/login/', json={'username':'admin','password':'Admin@123'})
        print('Status:', resp.status_code)
        print('Body:', resp.text[:300])
        if not resp.ok:
            sys.exit(1)
        data = resp.json()
        token = data.get('access') or data.get('access_token')
        if not token:
            print('No token in response')
            sys.exit(1)
        headers = {'Authorization': f'Bearer {token}'}
        print('\n--- SUBCENTER STATS ---')
        r = requests.get(f'{BASE}/subcenters/1/statistics/', headers=headers)
        print('Status:', r.status_code)
        print('Body:', r.text[:500])
        print('\n--- SUBCENTER RECENT ACTIVITY ---')
        r2 = requests.get(f'{BASE}/subcenters/1/recent_activity/', headers=headers)
        print('Status:', r2.status_code)
        print('Body:', r2.text[:500])
    except Exception as e:
        print('Error:', e)
        sys.exit(2)

if __name__ == '__main__':
    main()
