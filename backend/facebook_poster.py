import os
import json
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
    title = job.get("title", "Remote Specialist")
    company = job.get("company_name", "Global Enterprise")
    location = job.get("location", "Worldwide Remote")
    salary = job.get("salary_range") or "$75,000 - $140,000 / Year (USD)"
    job_type = job.get("job_type", "Full-Time Remote")
    category = job.get("category", "Tech & AI")
    job_id = job.get("id", "")
    job_apply_link = f"https://globalhireai.vercel.app/?job={job_id}" if job_id else "https://globalhireai.vercel.app"

    caption = f"""🚨 URGENT HIRING ALERT: {title} (Work From Home)

🏢 Hiring Company: {company}
📍 Location: {location} (100% Remote Worldwide)
💰 Expected Salary: {salary}
⚡ Job Type: {job_type}
🏷 Category: {category}

✨ KEY PERKS & ELIGIBILITY:
✅ Zero Experience Required / Freshers & Experienced Both Welcome
✅ 100% Work From Anywhere (Flexible International Hours)
✅ Work Laptop & High-Speed Internet Stipend Covered
✅ Visa Sponsorship / Relocation Assistance Available
✅ 100% Free Direct Application (No Agent / No Registration Fee)

━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 CLICK LINK BELOW TO APPLY DIRECTLY:
👉 {job_apply_link}
👉 {job_apply_link}
━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Discover 220+ more verified high-paying global remote jobs:
https://globalhireai.vercel.app

#RemoteJobs #UrgentHiring #WorkFromHome #GlobalJobs #HighSalary #TechJobs #JobVacancy #CareerOpportunity #HiringNow #GlobalHireAI"""
    return caption

def post_job_to_facebook(job: Dict[str, Any], page_id: str = None, access_token: str = None) -> Dict[str, Any]:
    """
    Posts a job to Facebook with high-converting flyer poster image
    and direct clickable apply links.
    """
    pid = page_id or os.environ.get("FB_PAGE_ID", FB_PAGE_ID)
    token = access_token or os.environ.get("FB_PAGE_ACCESS_TOKEN", FB_PAGE_ACCESS_TOKEN)

    if not pid or not token:
        return {
            "status": "config_missing",
            "message": "Facebook Page ID or Page Access Token is not configured. Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN."
        }

    job_id = job.get("id", "")
    target_link = f"https://globalhireai.vercel.app/?job={job_id}" if job_id else "https://globalhireai.vercel.app"
    caption = format_facebook_caption(job)

    # 1. Generate new high-converting flyer image bytes
    try:
        image_bytes = generate_job_playcard(job)
    except Exception as e:
        logger.error(f"Error generating playcard flyer: {e}")
        image_bytes = None

    # 2. Upload to Facebook Graph API as Photo with Caption & Link
    url = f"https://graph.facebook.com/v19.0/{pid}/photos"
    
    files = {
        "source": ("hiring_poster.png", image_bytes, "image/png")
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
            logger.info(f"Successfully posted flyer for job {job.get('id')} to Facebook! Post ID: {post_id}")
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
