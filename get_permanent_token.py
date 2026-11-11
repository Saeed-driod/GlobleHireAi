import urllib.request
import urllib.parse
import json

app_id = "1852996629029417"
app_secret = "3fdd130b53adad56f10d7f4154d47dbf"
short_token = "EAAaVSmXX4ikBS3vhZCDRZChHf3yYR5j9074ZAH0Tll2EjzXceTShAE2EqhnuA8B2TN39ETqZCmANmiSN5kZCURUpWFllDP3TrNj2roKMI6fZCQ2sL9tTrRqGReDLYmHey2ilUJqTJbuaxEkvZAwiXvMIvrMdS40LnrInVR6TReFmP4SbZCVYUgJkQTTBZCI8PfDtkouyeZAoMyUA4EDtlWS8eSjcVXwE8r7zSozI1qBlJy3RNgVzsZCQqZCJImSVvrPZBRDQdalFdWIaagnqG4CG3VzaBc0wY"

print("--- STEP 1: Exchanging for 60-Day Long-Lived User Token ---")
exchange_url = (
    f"https://graph.facebook.com/v19.0/oauth/access_token?"
    f"grant_type=fb_exchange_token&"
    f"client_id={app_id}&"
    f"client_secret={app_secret}&"
    f"fb_exchange_token={short_token}"
)

req = urllib.request.Request(exchange_url)
with urllib.request.urlopen(req) as resp:
    res1 = json.loads(resp.read().decode("utf-8"))
    long_user_token = res1.get("access_token")
    print("Long-lived User Token acquired! Expires in (seconds):", res1.get("expires_in"))

print("\n--- STEP 2: Fetching Never-Expiring Page Access Tokens ---")
accounts_url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={long_user_token}"
req2 = urllib.request.Request(accounts_url)
with urllib.request.urlopen(req2) as resp:
    res2 = json.loads(resp.read().decode("utf-8"))

target_page_token = None
target_page_id = "1502687246257283" # Global Pulse AI

for p in res2.get("data", []):
    print(f"Page: {p.get('name')} | ID: {p.get('id')}")
    if p.get("id") == target_page_id or "Global Pulse" in p.get("name", ""):
        target_page_token = p.get("access_token")
        target_page_id = p.get("id")
        print(f"--> MATCH FOUND! Page Token: {target_page_token[:25]}...{target_page_token[-15:]}")

if not target_page_token and res2.get("data"):
    # Fallback to first page
    p = res2["data"][0]
    target_page_token = p.get("access_token")
    target_page_id = p.get("id")
    print(f"--> Using Page: {p.get('name')} | ID: {target_page_id}")

print("\n--- STEP 3: Debugging Page Token to Verify Permanent Expiration ---")
debug_url = f"https://graph.facebook.com/v19.0/debug_token?input_token={target_page_token}&access_token={app_id}|{app_secret}"
req3 = urllib.request.Request(debug_url)
with urllib.request.urlopen(req3) as resp:
    debug_res = json.loads(resp.read().decode("utf-8"))
    data = debug_res.get("data", {})
    expires_at = data.get("expires_at")
    data_access_expires_at = data.get("data_access_expires_at")
    print(f"Token Type: {data.get('type')}")
    print(f"Target: {data.get('target_name')} (ID: {data.get('target_id')})")
    print(f"Expires At: {expires_at} {'(NEVER EXPIRES / PERMANENT ✅)' if expires_at == 0 else '(Expires: ' + str(expires_at) + ')'}")
    print(f"Scopes / Permissions: {data.get('scopes')}")

print("\n--- FINAL PERMANENT CREDENTIALS ---")
print(f"FB_PAGE_ID={target_page_id}")
print(f"FB_PAGE_ACCESS_TOKEN={target_page_token}")

