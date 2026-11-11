import urllib.request
import urllib.error
import json

page_id = '1502687246257283'
page_token = 'EAAaVSmXX4ikBS7ILwlrS9AxKNEgukMfIZCqT6Y8ECWnC7Jnc2UoB4Sf1qsnknkfNwuwb6tjPKXH1g5714bm9Bm6XchFLDgRZBBvIBwj6Rd6x2XF049Ia5O17GAuZBh7WqQkCULp00P0bcKafmGSFd7ee5tpApIzxTPdBBD7FUo5DUdjTnf1TBAuzAblfHKNOeYXYrrTVf3x1lKnyslmrdMQhdxZAJnPRnVgpDboZD'

img_path = r'C:\Users\muham\.gemini\antigravity\brain\c0d2f155-e725-470b-885b-abf85609e56b\test_flyer.png'
with open(img_path, 'rb') as f:
    img_bytes = f.read()

caption = """🚨 URGENT HIRING: Senior Python & AI Engineer (Work From Home)

🏢 Hiring Company: Tech Corp Worldwide
📍 Location: Worldwide Remote (100% Work From Anywhere)
💰 Expected Salary: $90,000 - $160,000 / Year (USD)
⚡ Job Type: Full-Time Remote
🏷 Category: Software Dev & AI

✨ KEY PERKS & ELIGIBILITY:
✅ Zero Experience Required / Freshers & Experienced Both Welcome
✅ 100% Work From Anywhere (Flexible International Hours)
✅ Work Laptop & High-Speed Internet Stipend Covered
✅ Visa Sponsorship / Relocation Assistance Available
✅ 100% Free Direct Application (No Agent / No Registration Fee)

━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 CLICK LINK BELOW TO APPLY DIRECTLY:
👉 https://globalhireai.vercel.app/?job=1
👉 https://globalhireai.vercel.app/?job=1
━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Discover 220+ more verified high-paying global remote jobs:
https://globalhireai.vercel.app

#RemoteJobs #UrgentHiring #WorkFromHome #GlobalJobs #HighSalary #TechJobs #JobVacancy #CareerOpportunity #HiringNow #GlobalHireAI"""

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
add_file('source', 'hiring_flyer.png', img_bytes)
body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

fb_url = f'https://graph.facebook.com/v19.0/{page_id}/photos'
fb_req = urllib.request.Request(fb_url, data=bytes(body), headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})

try:
    with urllib.request.urlopen(fb_req) as fr:
        result = json.loads(fr.read().decode('utf-8'))
        print('SUCCESS! Facebook Flyer Published:')
        print(json.dumps(result, indent=2))
        post_id = result.get('post_id') or result.get('id')
        print(f'Direct Facebook Post URL: https://www.facebook.com/{post_id}')
except urllib.error.HTTPError as e:
    print('Facebook Error:', e.code, e.read().decode('utf-8'))

