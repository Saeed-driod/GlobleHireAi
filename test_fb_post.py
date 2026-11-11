import urllib.request
import urllib.error
import json

page_id = '1502687246257283'
page_token = 'EAAaVSmXX4ikBS3btdYrYrYo6LIWuPgPU4VZBm20mrJAGwiNu8dLNfx4bEFuGjK7moboZCZCZBUo5LExF3XZA1XDMC81C68KKpJZAFt93Bw7ByIpvtJj6fs4Cc46nwAWDX7RXCBRVS5JbxKN5DXkW0HM6YExCp8KuVMwBwPlTSZBsjdSqORpPPkq8wsVQ6yYOLPLSnW4vJ0XdeztZCNgZCTcPdMrVErKsyPfk44jkMZCwHO'

# Fetch job 1 from our live API
req = urllib.request.Request('http://150.136.214.192/api/jobs/1')
with urllib.request.urlopen(req) as r:
    job = json.loads(r.read().decode('utf-8'))

print('Fetched Job 1:', job.get('title'), 'at', job.get('company_name'))

caption = f"""🚀 NEW GLOBAL REMOTE OPPORTUNITY

💼 Role: {job.get('title')}
🏢 Company: {job.get('company_name')}
📍 Location: {job.get('location', 'Worldwide Remote')}
💰 Salary: {job.get('salary_range') or 'Competitive Worldwide Range'}

👉 Apply Directly Here:
{job.get('apply_url')}

🌐 Explore 190+ verified worldwide remote jobs:
http://150.136.214.192

#GlobalHireAI #RemoteJobs #TechHiring #GlobalPulseAI"""

# Download playcard image from our VM API
img_req = urllib.request.Request('http://150.136.214.192/api/jobs/1/playcard.png')
with urllib.request.urlopen(img_req) as ir:
    img_bytes = ir.read()

print(f'Downloaded playcard image: {len(img_bytes)} bytes')

# Multipart upload to Facebook
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()

def add_field(name, val):
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))

def add_file(name, filename, data, mime='image/png'):
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode('utf-8'))
    body.extend(data)
    body.extend(b'\r\n')

add_field('message', caption)
add_field('access_token', page_token)
add_file('source', 'playcard.png', img_bytes)
body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

fb_url = f'https://graph.facebook.com/v19.0/{page_id}/photos'
fb_req = urllib.request.Request(fb_url, data=bytes(body), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})

try:
    with urllib.request.urlopen(fb_req) as fr:
        result = json.loads(fr.read().decode('utf-8'))
        print('SUCCESS! Facebook Post Published:')
        print(json.dumps(result, indent=2))
        post_id = result.get('post_id') or result.get('id')
        print(f'Direct Facebook Post URL: https://www.facebook.com/{post_id}')
except urllib.error.HTTPError as e:
    print('Facebook Error:', e.code, e.read().decode('utf-8'))

