import os
import requests
import logging
from typing import Dict, Any, Optional
from card_generator import generate_job_playcard

logger = logging.getLogger("FacebookAutoPoster")

# Auto-load .env if present
env_file = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_file):
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip("\"' \r\n"))
    except Exception:
        pass

FB_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
FB_PAGE_ACCESS_TOKEN = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
OFFICIAL_WEBSITE_URL = "https://globalhireai.vercel.app"

def format_facebook_caption(job: Dict[str, Any]) -> str:
    title = job.get("title", "")
    company = job.get("company_name", "")
    location = job.get("location", "Worldwide Remote")
    salary = job.get("salary_range") or "Competitive Global Compensation"
    job_type = job.get("job_type", "Remote")
    category = job.get("category", "Tech")
    portal_url = "https://globalhireai.vercel.app"

    caption = f"""🚀 NEW OPPORTUNITY ALERT: {title}

🏢 Company: {company}
📍 Location: {location} ({job_type})
💰 Salary: {salary}
🏷 Category: {category}

✨ Key Responsibilities & Overview:
{(job.get('description', '')[:250]).strip()}...

👉 APPLY ONLINE & VIEW FULL DETAILS:
{portal_url}

🌐 Explore 190+ Verified Worldwide Remote Jobs:
{portal_url}

#GlobalHireAI #RemoteJobs #JobOpportunity #Hiring #Career #TechJobs #WorkFromAnywhere"""
    return caption

def post_job_to_facebook(job: Dict[str, Any], page_id: str = None, access_token: str = None) -> Dict[str, Any]:
    """Posts a job along with its generated visual playcard to a Facebook Page."""
    pid = page_id or os.environ.get("FB_PAGE_ID", FB_PAGE_ID)
    token = access_token or os.environ.get("FB_PAGE_ACCESS_TOKEN", FB_PAGE_ACCESS_TOKEN)

    if not pid or not token:
        return {
            "status": "config_missing",
            "message": "Facebook Page ID or Page Access Token is not configured. Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN."
        }

    # 1. Generate image bytes
    image_bytes = generate_job_playcard(job)
    caption = format_facebook_caption(job)

    # 2. Upload to Facebook Graph API: POST https://graph.facebook.com/v19.0/{page-id}/photos
    url = f"https://graph.facebook.com/v19.0/{pid}/photos"
    
    files = {
        "source": ("playcard.png", image_bytes, "image/png")
    }
    data = {
        "message": caption,
        "access_token": token
    }

    try:
        resp = requests.post(url, files=files, data=data, timeout=30)
        res_data = resp.json()
        if resp.status_code == 200:
            post_id = res_data.get("post_id") or res_data.get("id")
            logger.info(f"Successfully posted job {job.get('id')} to Facebook! Post ID: {post_id}")
            return {
                "status": "success",
                "post_id": post_id,
                "facebook_url": f"https://www.facebook.com/{post_id}" if post_id else None
            }
        else:
            logger.error(f"Facebook Graph API Error: {res_data}")
            return {
                "status": "error",
                "detail": res_data
            }
    except Exception as e:
        logger.error(f"Exception posting to Facebook: {e}")
        return {
            "status": "error",
            "detail": str(e)
        }
