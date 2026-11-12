import os
import sys
import threading
import html
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Query, BackgroundTasks
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))
from database import (
    init_db,
    upsert_job,
    get_jobs,
    get_job_by_id,
    log_apply_click,
    get_dashboard_stats,
    toggle_feature_job,
    delete_job,
    save_candidate_alert,
    get_talent_pool_stats,
    find_matching_candidates_for_job,
    log_candidate_alert_sent,
    get_candidates_list,
    delete_candidate,
    log_visitor_traffic,
    get_traffic_analytics,
    get_ad_settings,
    update_ad_settings
)
from job_worker import run_sync_cycle
from email_notifier import send_job_match_email

class CandidateSubscribeRequest(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = ""
    education: str
    category: Optional[str] = "All"
    skills: Optional[list] = []
    experience_level: Optional[str] = "Any"
    preferred_job_type: Optional[str] = "Remote"
    resume_text: Optional[str] = ""

class JobCreateRequest(BaseModel):
    title: str
    company_name: str
    company_logo: Optional[str] = None
    location: Optional[str] = "Worldwide Remote"
    country: Optional[str] = "Worldwide"
    job_type: Optional[str] = "Remote"
    category: Optional[str] = "Software Dev"
    salary_range: Optional[str] = None
    description: str
    apply_url: str
    tags: Optional[list] = []
    is_featured: Optional[bool] = False

from card_generator import generate_job_playcard
from facebook_poster import post_job_to_facebook, format_facebook_caption

app = FastAPI(
    title="GlobalHire AI - Global Job Portal REST API",
    description="High-performance automated global job aggregation API",
    version="1.0.0"
)

# Enable CORS for all frontend origins (localhost, Vercel, Oracle VM, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# State for worker
worker_lock = threading.Lock()
worker_is_running = False

def background_sync():
    global worker_is_running
    with worker_lock:
        if worker_is_running:
            return
        worker_is_running = True
    try:
        run_sync_cycle()
    finally:
        with worker_lock:
            worker_is_running = False

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def root():
    return {
        "service": "GlobalHire AI API",
        "status": "online",
        "port": 5001,
        "docs_url": "/docs"
    }

@app.get("/api/jobs")
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    sort: str = Query("latest", regex="^(latest|popular|featured)$"),
    include_onsite: bool = Query(False)
):
    try:
        data = get_jobs(
            page=page,
            limit=limit,
            q=q,
            category=category,
            job_type=job_type,
            country=country,
            featured=featured,
            sort=sort,
            include_onsite=include_onsite
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs")
def create_job_endpoint(payload: JobCreateRequest):
    try:
        job_dict = payload.model_dump()
        job_dict["source_api"] = "Direct Post"
        res = upsert_job(job_dict)
        if res == "skipped":
            raise HTTPException(status_code=400, detail="Failed to create job listing. Ensure title, company, and apply_url are valid.")
        return {"status": "created", "action": res, "job": job_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/export/csv")
def export_jobs_csv():
    try:
        import csv
        import io
        data = get_jobs(page=1, limit=500, sort="latest")
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Title", "Company", "Location", "Job Type", "Category", "Salary", "Apply URL", "Source", "Views", "Clicks", "Posted At"])
        for j in data.get("jobs", []):
            writer.writerow([
                j.get("id"), j.get("title"), j.get("company_name"), j.get("location"),
                j.get("job_type"), j.get("category"), j.get("salary_range") or "N/A", j.get("apply_url"),
                j.get("source_api"), j.get("views_count"), j.get("clicks_count"), j.get("posted_at")
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=globalhire_jobs.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}")
def get_job(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/api/jobs/{job_id}/apply")
def apply_to_job(job_id: int, request: Request):
    # Extract client IP and headers
    client_ip = request.client.host if request.client else "Anonymous"
    user_agent = request.headers.get("user-agent", "")
    country = request.headers.get("cf-ipcountry") or request.headers.get("x-country-code") or "Worldwide"

    apply_url = log_apply_click(job_id, country=country, user_ip=client_ip, user_agent=user_agent)
    if not apply_url:
        raise HTTPException(status_code=404, detail="Job not found or invalid apply URL")

    return {
        "job_id": job_id,
        "apply_url": apply_url,
        "status": "logged"
    }

@app.get("/api/dashboard/stats")
def dashboard_stats():
    try:
        stats = get_dashboard_stats()
        stats["is_syncing_now"] = worker_is_running
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/worker/trigger")
def trigger_worker(background_tasks: BackgroundTasks):
    global worker_is_running
    if worker_is_running:
        return {"status": "already_running", "message": "A job sync is already in progress."}

    background_tasks.add_task(background_sync)
    return {
        "status": "started",
        "message": "Auto-Pilot aggregation cycle initiated in background."
    }

@app.patch("/api/jobs/{job_id}/feature")
def toggle_feature(job_id: int):
    result = toggle_feature_job(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"id": job_id, "is_featured": result}

@app.delete("/api/jobs/{job_id}")
def remove_job(job_id: int):
    success = delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"id": job_id, "deleted": True}

@app.get("/api/jobs/{job_id}/playcard.png")
def get_job_playcard_image(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        img_bytes = generate_job_playcard(job)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/caption")
def get_job_caption(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    caption = format_facebook_caption(job)
    return {"job_id": job_id, "caption": caption}

class FacebookPostRequest(BaseModel):
    page_id: Optional[str] = None
    access_token: Optional[str] = None

@app.post("/api/jobs/{job_id}/post-facebook")
def post_job_facebook_route(job_id: int, payload: Optional[FacebookPostRequest] = None):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    pid = payload.page_id if payload else None
    token = payload.access_token if payload else None
    result = post_job_to_facebook(job, page_id=pid, access_token=token)
    return result

@app.get("/api/rss")
def get_rss_feed():
    try:
        data = get_jobs(page=1, limit=50, sort="latest")
        items_xml = []
        for j in data.get("jobs", []):
            title = html.escape(f"{j['title']} at {j['company_name']}")
            link = f"https://globalhireai.vercel.app/?job={j['id']}"
            desc = html.escape(j.get('excerpt', ''))
            pub = j.get('posted_at', '')
            cat = html.escape(j.get('category', 'Tech'))
            items_xml.append(f"""
    <item>
      <title>{title}</title>
      <link>{link}</link>
      <guid>{link}</guid>
      <description>{desc}</description>
      <pubDate>{pub}</pubDate>
      <category>{cat}</category>
    </item>""")
        
        xml = f"""<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>GlobalHire AI — Worldwide Remote &amp; Tech Jobs Feed</title>
    <link>https://globalhireai.vercel.app</link>
    <description>Autonomous multi-source job aggregator for remote &amp; AI roles</description>
    <language>en-us</language>
    {''.join(items_xml)}
  </channel>
</rss>"""
        return Response(content=xml, media_type="application/xml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sitemap")
def get_sitemap():
    try:
        data = get_jobs(page=1, limit=200, sort="latest")
        urls = []
        for j in data.get("jobs", []):
            job_url = f"https://globalhireai.vercel.app/?job={j['id']}"
            pub = (j.get('posted_at') or '')[:10]
            urls.append(f"""
  <url>
    <loc>{job_url}</loc>
    <lastmod>{pub}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>""")
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://globalhireai.vercel.app/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  {''.join(urls)}
</urlset>"""
        return Response(content=xml, media_type="application/xml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/candidate/subscribe")
def subscribe_candidate(payload: CandidateSubscribeRequest, bg_tasks: BackgroundTasks):
    try:
        cand = save_candidate_alert(payload.dict())
        # Find immediate matching jobs in database
        jobs_res = get_jobs(page=1, limit=50, sort="latest")
        matches = []
        for j in jobs_res.get("jobs", []):
            cand_cat = cand.get("category", "All")
            cand_edu = (cand.get("education") or "").lower()
            if cand_cat == "All" or cand_cat.lower() == j.get("category", "").lower():
                matches.append(j)
            elif any(s.lower() in (j.get("title") or "").lower() for s in payload.skills if len(s) > 2):
                matches.append(j)
        
        # Dispatch instant alert email in background for top matching job
        if matches:
            top_match = matches[0]
            bg_tasks.add_task(send_job_match_email, cand, top_match)
            if cand.get("id") and top_match.get("id"):
                log_candidate_alert_sent(cand["id"], top_match["id"])
            
        return {
            "status": "success",
            "message": "Candidate CV profile registered successfully! Automated email alerts activated.",
            "immediate_matches_count": len(matches),
            "top_matching_job": matches[0] if matches else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/candidate/stats")
def get_candidate_stats_route():
    return get_talent_pool_stats()

class VisitTrackRequest(BaseModel):
    referrer: Optional[str] = "Direct"
    device: Optional[str] = "Desktop"
    page_url: Optional[str] = "/"
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None

@app.post("/api/track/visit")
def track_visitor_visit(req: Request, payload: Optional[VisitTrackRequest] = None):
    try:
        ip = req.headers.get("x-forwarded-for") or (req.client.host if req.client else "Anonymous")
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()
        country = (payload.country if payload and payload.country else None) or req.headers.get("cf-ipcountry") or req.headers.get("x-country")
        country_code = (payload.country_code if payload and payload.country_code else None) or req.headers.get("cf-ipcountry")
        city = (payload.city if payload and payload.city else None)
        ref = (payload.referrer if payload and payload.referrer else req.headers.get("referer", "Direct"))
        dev = payload.device if payload and payload.device else "Desktop"
        page = payload.page_url if payload and payload.page_url else "/"
        log_visitor_traffic(ip=ip, country=country, country_code=country_code, city=city, referrer=ref, device=dev, page_url=page)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.get("/api/dashboard/traffic")
def get_traffic_route():
    return get_traffic_analytics()

@app.get("/api/candidates")
def list_candidates_route(page: int = 1, limit: int = 50, q: str = ""):
    return get_candidates_list(page=page, limit=limit, q=q)

@app.delete("/api/candidates/{candidate_id}")
def delete_candidate_route(candidate_id: int):
    success = delete_candidate(candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"status": "deleted", "candidate_id": candidate_id}

@app.get("/api/settings/ads")
def get_job_portal_ad_settings():
    return get_ad_settings()

@app.post("/api/settings/ads")
async def update_job_portal_ad_settings(request: Request):
    data = await request.json()
    return update_ad_settings(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)

