import requests
import json

url = 'http://localhost:8080/'
payload = {'extra': 1, 'mask': {}, 'data': {}, 'session': 100, 'user': 'a'}
headers = {'content-type': 'application/json'}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print response
