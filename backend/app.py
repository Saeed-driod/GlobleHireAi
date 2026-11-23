import os
import sys
import threading
import html
import logging
from logging.handlers import RotatingFileHandler
from typing import Optional, List, Annotated
from fastapi import FastAPI, HTTPException, Request, Query, BackgroundTasks, Security, Depends, status
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field, EmailStr, field_validator, StringConstraints

# Add current directory and parent directory to path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Helper to load .env without requiring third-party dotenv
def _load_env_fallback():
    possible_paths = [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    ]
    for p in possible_paths:
        if os.path.isfile(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_fallback()

# --- Logging Setup (Rotating File + Console) ---
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "api.log")

logger = logging.getLogger("globalhire.api")
logger.setLevel(logging.INFO)

if not logger.handlers:
    # 5MB per log file, keep up to 5 backups
    file_handler = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8")
    file_fmt = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] (%(filename)s:%(lineno)d) - %(message)s")
    file_handler.setFormatter(file_fmt)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_fmt = logging.Formatter("%(asctime)s [%(levelname)s] - %(message)s")
    console_handler.setFormatter(console_fmt)
    logger.addHandler(console_handler)

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
from card_generator import generate_job_playcard
from facebook_poster import post_job_to_facebook, format_facebook_caption
from rate_limiter import InMemoryRateLimiter

# Rate Limiters (5 req/min per IP for sensitive endpoints)
candidate_subscribe_limiter = InMemoryRateLimiter(
    max_requests=5,
    window_seconds=60,
    name="Candidate Subscription"
)
visitor_track_limiter = InMemoryRateLimiter(
    max_requests=5,
    window_seconds=60,
    name="Visitor Tracking"
)

# Admin API Key Security
ADMIN_KEY_HEADER = APIKeyHeader(name="X-Admin-Key", auto_error=False)

def get_admin_api_key() -> str:
    """Retrieves the authorized admin API key strictly from the environment."""
    return os.getenv("ADMIN_API_KEY", "").strip()

async def require_admin_key(api_key: Optional[str] = Security(ADMIN_KEY_HEADER)):
    """
    FastAPI security dependency enforcing X-Admin-Key header validation.
    - If ADMIN_API_KEY is not set on the server: Fail-closed with 503 Service Unavailable.
    - If no key provided in header: 401 Unauthorized.
    - If invalid key provided: 403 Forbidden.
    - If valid key: 200 OK.
    """
    expected_key = get_admin_api_key()
    if not expected_key:
        logger.error("ADMIN_API_KEY is not configured on the server.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ADMIN_API_KEY is not configured on the server."
        )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Admin-Key header."
        )
    if api_key != expected_key:
        logger.warning(f"Unauthorized admin attempt with header: {api_key[:6] if api_key else 'None'}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid X-Admin-Key header."
        )
    return api_key

app = FastAPI(
    title="GlobalHire AI - Global Job Portal REST API",
    description="High-performance automated global job aggregation API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# --- CORS Hardening (Strict Origin Whitelist & Vercel Previews Regex) ---
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://globalhireai.vercel.app",
]
ALLOWED_ORIGIN_REGEX = r"^https://([a-zA-Z0-9_-]+\.)?vercel\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Key", "Authorization", "Accept"],
)

# --- Global Exception Handlers (Sanitized 500 Responses) ---

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unexpected internal errors.
    Logs the full stack trace to rotating log file, returns sanitized message to client.
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.error(f"Unhandled 500 Exception on {request.method} {request.url.path} from {client_ip}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standard HTTPException handler maintaining sanitized responses."""
    if exc.status_code >= 500:
        logger.error(f"HTTPException {exc.status_code} on {request.method} {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers or {}
    )

# --- State for Worker ---
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
    except Exception as e:
        logger.error(f"Error during background sync cycle: {e}", exc_info=True)
    finally:
        with worker_lock:
            worker_is_running = False

@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("GlobalHire AI API started with secure authentication and rate limiting.")

# --- Tightened Pydantic Schemas ---

class CandidateSubscribeRequest(BaseModel):
    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: EmailStr
    phone: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=25)]] = ""
    education: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    category: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] = "All"
    skills: Optional[List[Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]]] = Field(default=[], max_length=30)
    experience_level: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] = "Any"
    preferred_job_type: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] = "Remote"
    resume_text: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=50000)]] = ""

class VisitTrackRequest(BaseModel):
    referrer: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=250)]] = "Direct"
    device: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)]] = "Desktop"
    page_url: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]] = "/"
    country: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]] = None
    country_code: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=10)]] = None
    city: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]] = None

class JobCreateRequest(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=150)]
    company_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=150)]
    company_logo: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]] = None
    location: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]] = "Worldwide Remote"
    country: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]] = "Worldwide"
    job_type: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)]] = "Remote"
    category: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)]] = "Software Dev"
    salary_range: Optional[Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]] = None
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=50000)]
    apply_url: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=1000)]
    tags: Optional[List[Annotated[str, StringConstraints(strip_whitespace=True, max_length=40)]]] = Field(default=[], max_length=20)
    is_featured: Optional[bool] = False

    @field_validator("apply_url")
    @classmethod
    def validate_apply_url(cls, v: str) -> str:
        clean = v.strip().lower()
        if not (clean.startswith("http://") or clean.startswith("https://")):
            raise ValueError("apply_url must start with http:// or https://")
        return v.strip()

# --- Public Endpoints ---

@app.get("/")
def root():
    return {
        "service": "GlobalHire AI API",
        "status": "online",
        "port": 5001,
        "docs": "disabled"
    }

@app.get("/api/admin/verify", dependencies=[Depends(require_admin_key)])
def verify_admin_credentials():
    """Admin-only endpoint to verify if the provided X-Admin-Key is valid."""
    return {"status": "authenticated", "role": "admin"}

@app.get("/api/jobs")
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    sort: str = Query("latest", pattern="^(latest|popular|featured)$"),
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
        logger.error(f"Error in list_jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve jobs listings.")

@app.get("/api/jobs/{job_id}")
def get_job(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/api/jobs/{job_id}/apply")
def apply_to_job(job_id: int, request: Request):
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

@app.get("/api/jobs/export/csv", dependencies=[Depends(require_admin_key)])
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
        logger.error(f"Error in export_jobs_csv: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export CSV.")

@app.get("/api/jobs/{job_id}/playcard.png")
def get_job_playcard_image(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        img_bytes = generate_job_playcard(job)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Error generating playcard for job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to render job playcard image.")

@app.get("/api/jobs/{job_id}/caption")
def get_job_caption(job_id: int):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    caption = format_facebook_caption(job)
    return {"job_id": job_id, "caption": caption}

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
        logger.error(f"Error generating RSS feed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate RSS feed.")

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
        logger.error(f"Error generating sitemap: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate sitemap.")

@app.post("/api/candidate/subscribe")
def subscribe_candidate(payload: CandidateSubscribeRequest, bg_tasks: BackgroundTasks, request: Request):
    # Enforce Rate Limiting (5 requests / 60 seconds per IP)
    candidate_subscribe_limiter.check(request)
    
    try:
        cand = save_candidate_alert(payload.model_dump())
        jobs_res = get_jobs(page=1, limit=50, sort="latest")
        matches = []
        for j in jobs_res.get("jobs", []):
            cand_cat = cand.get("category", "All")
            if cand_cat == "All" or cand_cat.lower() == j.get("category", "").lower():
                matches.append(j)
            elif any(s.lower() in (j.get("title") or "").lower() for s in (payload.skills or []) if len(s) > 2):
                matches.append(j)
        
        if matches:
            top_match = matches[0]
            bg_tasks.add_task(send_job_match_email, cand, top_match)
            if cand.get("id") and top_match.get("id"):
                log_candidate_alert_sent(cand["id"], top_match["id"])
            
        logger.info(f"Registered candidate alert for {payload.email} (Category: {payload.category})")
        return {
            "status": "success",
            "message": "Candidate CV profile registered successfully! Automated email alerts activated.",
            "immediate_matches_count": len(matches),
            "top_matching_job": matches[0] if matches else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in candidate subscribe: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/candidate/stats")
def get_candidate_stats_route():
    return get_talent_pool_stats()

@app.post("/api/track/visit")
def track_visitor_visit(req: Request, payload: Optional[VisitTrackRequest] = None):
    # Enforce Rate Limiting (60 requests / 60 seconds per IP)
    visitor_track_limiter.check(req)

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
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error in visitor tracking: {e}")
        return {"status": "error", "detail": "Tracking temporarily unavailable."}

# --- Protected Admin Endpoints (Require X-Admin-Key) ---

@app.post("/api/jobs", dependencies=[Depends(require_admin_key)])
def create_job_endpoint(payload: JobCreateRequest):
    try:
        job_dict = payload.model_dump()
        job_dict["source_api"] = "Direct Post"
        res = upsert_job(job_dict)
        if res == "skipped":
            raise HTTPException(status_code=400, detail="Failed to create job listing. Ensure title, company, and apply_url are valid.")
        logger.info(f"Direct job listing created: {payload.title} at {payload.company_name}")
        return {"status": "created", "action": res, "job": job_dict}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create job listing.")

@app.get("/api/dashboard/stats", dependencies=[Depends(require_admin_key)])
def dashboard_stats():
    try:
        stats = get_dashboard_stats()
        stats["is_syncing_now"] = worker_is_running
        return stats
    except Exception as e:
        logger.error(f"Error in dashboard_stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard stats.")

@app.post("/api/worker/trigger", dependencies=[Depends(require_admin_key)])
def trigger_worker(background_tasks: BackgroundTasks):
    global worker_is_running
    if worker_is_running:
        return {"status": "already_running", "message": "A job sync is already in progress."}

    background_tasks.add_task(background_sync)
    logger.info("Admin initiated background job sync cycle.")
    return {
        "status": "started",
        "message": "Auto-Pilot aggregation cycle initiated in background."
    }

@app.patch("/api/jobs/{job_id}/feature", dependencies=[Depends(require_admin_key)])
def toggle_feature(job_id: int):
    result = toggle_feature_job(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Job not found")
    logger.info(f"Toggled featured state for job {job_id} -> {result}")
    return {"id": job_id, "is_featured": result}

@app.delete("/api/jobs/{job_id}", dependencies=[Depends(require_admin_key)])
def remove_job(job_id: int):
    success = delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    logger.info(f"Deleted job {job_id}")
    return {"id": job_id, "deleted": True}

@app.get("/api/dashboard/traffic", dependencies=[Depends(require_admin_key)])
def get_traffic_route():
    try:
        return get_traffic_analytics()
    except Exception as e:
        logger.error(f"Error fetching traffic analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve traffic analytics.")

@app.get("/api/candidates", dependencies=[Depends(require_admin_key)])
def list_candidates_route(page: int = 1, limit: int = 50, q: str = ""):
    try:
        return get_candidates_list(page=page, limit=limit, q=q)
    except Exception as e:
        logger.error(f"Error fetching candidates list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve candidates list.")

@app.delete("/api/candidates/{candidate_id}", dependencies=[Depends(require_admin_key)])
def delete_candidate_route(candidate_id: int):
    success = delete_candidate(candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found")
    logger.info(f"Deleted candidate lead {candidate_id}")
    return {"status": "deleted", "candidate_id": candidate_id}

@app.get("/api/settings/ads", dependencies=[Depends(require_admin_key)])
def get_job_portal_ad_settings():
    return get_ad_settings()

@app.post("/api/settings/ads", dependencies=[Depends(require_admin_key)])
async def update_job_portal_ad_settings(request: Request):
    data = await request.json()
    return update_ad_settings(data)

class FacebookPostRequest(BaseModel):
    page_id: Optional[str] = None
    access_token: Optional[str] = None

@app.post("/api/jobs/{job_id}/post-facebook", dependencies=[Depends(require_admin_key)])
def post_job_facebook_route(job_id: int, payload: Optional[FacebookPostRequest] = None):
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    pid = payload.page_id if payload else None
    token = payload.access_token if payload else None
    result = post_job_to_facebook(job, page_id=pid, access_token=token)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
