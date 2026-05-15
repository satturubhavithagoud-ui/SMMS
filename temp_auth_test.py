import json
import urllib.request
import urllib.error

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode())

print('Testing signup...')
try:
    post('http://127.0.0.1:8000/api/signup/', {
        'fullname': 'testuser',
        'email': 'testuser@example.com',
        'password': 'Test1234',
        'platforms': ['instagram'],
    })
except urllib.error.HTTPError as e:
    print('ERROR', e.code)
    print(e.read().decode())

print('Testing login...')
try:
    post('http://127.0.0.1:8000/api/login/', {
        'email': 'testuser@example.com',
        'password': 'Test1234',
    })
except urllib.error.HTTPError as e:
    print('ERROR', e.code)
    print(e.read().decode())
