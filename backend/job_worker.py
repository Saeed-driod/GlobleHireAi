import sys
import os
import time
import json
import re
import argparse
import logging
from datetime import datetime

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

try:
    import requests
    def http_get_json(url: str, timeout: int = 25):
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return None, r.status_code
        return r.json(), 200
except ImportError:
    import urllib.request
    import urllib.error
    def http_get_json(url: str, timeout: int = 25):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data, 200
        except urllib.error.HTTPError as e:
            return None, e.code
        except Exception as e:
            return None, str(e)

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))
from database import (
    init_db, 
    upsert_job, 
    log_sync, 
    expire_old_jobs,
    get_jobs_to_post_to_fb,
    mark_job_posted_to_fb
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [GlobalHire-Worker] %(message)s"
)
logger = logging.getLogger("GlobalHireWorker")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GlobalHireAI/1.0"
}

POPULAR_SKILLS = [
    "Python", "React", "TypeScript", "JavaScript", "Node.js", "Next.js", "Vue.js", "Angular",
    "Go", "Rust", "Java", "C++", "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "FastAPI", "Django", "Flask", "GraphQL", "REST API", "Tailwind CSS",
    "Machine Learning", "AI", "LLM", "Data Science", "PyTorch", "TensorFlow", "Pandas",
    "Figma", "UI/UX", "Product Design", "SEO", "Content Strategy", "Salesforce",
    "Visa Sponsorship", "Worldwide Remote"
]

def clean_html_description(raw_html: str) -> str:
    if not raw_html:
        return "No description provided."
    try:
        if HAS_BS4:
            soup = BeautifulSoup(raw_html, "html.parser")
            for tag in soup(["script", "style", "iframe", "noscript"]):
                tag.decompose()
            for block in soup.find_all(["p", "div", "li", "h1", "h2", "h3", "h4", "br"]):
                block.insert_before("\n")
            text = soup.get_text()
        else:
            text = re.sub(r"<(script|style|iframe|noscript)[^>]*>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h1>|</h2>|</h3>", "\n", text, flags=re.IGNORECASE)
            text = re.sub(r"<[^>]+>", " ", text)

        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()[:10000]
    except Exception:
        return re.sub(r"<[^>]+>", " ", raw_html).strip()[:10000]

BAD_TAG_PATTERNS = [
    r"high\s*school",
    r"equivalent",
    r"diploma",
    r"bachelor",
    r"master",
    r"degree",
    r"education",
    r"ged\b",
    r"entry\s*level",
    r"mid\s*level",
    r"senior\s*level",
    r"full\s*time",
    r"part\s*time",
    r"contract\b"
]

def is_german_or_non_english(title: str, desc: str) -> bool:
    """Detect non-English or German job postings."""
    combined = f"{title} {desc}".lower()
    if any(marker in title.lower() for marker in ['(m/w/d)', '(w/m/d)', '(m/w/x)', '(d/m/w)', 'mwd', 'wmd']):
        return True
    german_keywords = [
        ' wir ', ' und ', ' für ', ' mit ', ' dich ', ' uns ', ' bewerbung ',
        ' über uns ', ' du bringst ', ' deine aufgaben ', ' dein profil ',
        ' anforderungen ', ' unternehmen ', ' erfahrung ', ' m/w/d ', ' w/m/d ',
        ' standort ', ' karriere ', ' vollzeit ', ' teilzeit ', ' weiterbildung '
    ]
    count = sum(1 for kw in german_keywords if kw in combined)
    return count >= 2

def extract_tags(text: str, existing_tags: list = None) -> list:
    tags = set()
    if existing_tags:
        for t in existing_tags:
            if isinstance(t, str) and len(t.strip()) > 1:
                t_clean = t.strip()
                t_low = t_clean.lower()
                # Skip education or employment level noise
                if any(re.search(pat, t_low) for pat in BAD_TAG_PATTERNS):
                    continue
                tags.add(t_clean)

    text_lower = f" {text.lower()} "
    for skill in POPULAR_SKILLS:
        # Match word boundary
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            tags.add(skill)

    # Detect visa sponsorship
    if "visa" in text_lower or "sponsorship" in text_lower or "relocation" in text_lower:
        tags.add("Visa Sponsorship")

    return list(tags)[:10]

def normalize_category(raw_cat: str, title: str) -> str:
    combined = f"{raw_cat} {title}".lower()

    if any(k in combined for k in ["ai", "machine learning", "data", "deep learning", "llm", "nlp", "scientist", "analytics"]):
        return "AI / Data"
    if any(k in combined for k in ["design", "ui", "ux", "creative", "product designer", "graphic", "art director"]):
        return "Design"
    if any(k in combined for k in ["marketing", "growth", "seo", "content", "social media", "copywriter", "community"]):
        return "Marketing"
    if any(k in combined for k in ["product manager", "scrum", "project manager", "program manager", "head of", "director", "vp", "chief"]):
        return "Management"
    if any(k in combined for k in ["support", "customer success", "client", "sales", "account executive", "bdr", "sdr"]):
        return "Customer Support"
    if any(k in combined for k in ["devops", "sre", "cloud", "infrastructure", "security", "sysadmin"]):
        return "DevOps / Cloud"
    if any(k in combined for k in ["software", "developer", "engineer", "frontend", "backend", "fullstack", "web", "mobile", "ios", "android"]):
        return "Software Dev"

    return "Software Dev"

def fetch_remotive() -> tuple:
    url = "https://remotive.com/api/remote-jobs"
    added, updated = 0, 0
    try:
        logger.info(f"Fetching jobs from Remotive API: {url}...")
        data, status = http_get_json(url, timeout=25)
        if not data or status != 200:
            logger.warning(f"Remotive HTTP {status}")
            return (0, 0, f"HTTP {status}")
        
        jobs = data.get("jobs", [])
        logger.info(f"Remotive returned {len(jobs)} jobs. Processing top 50...")

        for item in jobs[:60]:
            title = item.get("title", "").strip()
            company = item.get("company_name", "").strip()
            apply_url = item.get("url", "").strip()
            if not title or not company or not apply_url:
                continue

            desc = clean_html_description(item.get("description", ""))
            tags = extract_tags(f"{title} {desc}", item.get("tags", []))
            cat = normalize_category(item.get("category", ""), title)

            salary = item.get("salary")
            if salary and isinstance(salary, str) and salary.strip():
                salary_str = salary.strip()
            else:
                salary_str = None

            location = item.get("candidate_required_location") or "Worldwide Remote"
            
            job_obj = {
                "title": title,
                "company_name": company,
                "company_logo": item.get("company_logo_url") or item.get("company_logo"),
                "location": location,
                "country": "Worldwide" if "worldwide" in location.lower() or "anywhere" in location.lower() else location[:50],
                "job_type": "Remote",
                "category": cat,
                "salary_range": salary_str,
                "description": desc,
                "requirements": None,
                "apply_url": apply_url,
                "source_api": "Remotive",
                "tags": tags,
                "is_featured": 1 if added < 3 else 0,
                "posted_at": item.get("publication_date") or datetime.utcnow().isoformat()
            }
            res = upsert_job(job_obj)
            if res == "added":
                added += 1
            elif res == "updated":
                updated += 1

        logger.info(f"[Remotive] Added: {added}, Updated: {updated}")
        return (added, updated, "success")
    except Exception as e:
        logger.error(f"[Remotive] Error: {e}")
        return (added, updated, str(e))

def fetch_arbeitnow() -> tuple:
    url = "https://www.arbeitnow.com/api/job-board-api"
    added, updated = 0, 0
    try:
        logger.info(f"Fetching jobs from Arbeitnow Global API: {url}...")
        data, status = http_get_json(url, timeout=25)
        if not data or status != 200:
            logger.warning(f"Arbeitnow HTTP {status}")
            return (0, 0, f"HTTP {status}")
        
        jobs = data.get("data", [])
        logger.info(f"Arbeitnow returned {len(jobs)} jobs. Processing top 75...")

        for item in jobs[:75]:
            title = item.get("title", "").strip()
            company = item.get("company_name", "").strip()
            apply_url = item.get("url", "").strip()
            if not title or not company or not apply_url:
                continue

            desc = clean_html_description(item.get("description", ""))
            # STEP 1 requirement: Skip jobs whose description is not in English
            if is_german_or_non_english(title, desc):
                continue

            is_remote = bool(item.get("remote", False))
            loc_raw = item.get("location") or ""
            loc_lower = loc_raw.lower()

            # Skip German on-site job locations (Berlin, Munich, Dresden, etc.)
            if any(city in loc_lower for city in ['berlin', 'munich', 'münchen', 'dresden', 'frankfurt', 'hamburg', 'köln', 'cologne', 'stuttgart']):
                if not is_remote and 'remote' not in loc_lower and 'worldwide' not in loc_lower:
                    continue

            tags = extract_tags(f"{title} {desc}", item.get("tags", []))
            cat = normalize_category("", title)

            job_types = item.get("job_types", [])
            job_type_str = "Remote" if is_remote else ("Hybrid" if "hybrid" in str(job_types).lower() else "On-site")
            location = loc_raw or ("Worldwide Remote" if is_remote else "Global")
            
            job_obj = {
                "title": title,
                "company_name": company,
                "company_logo": None,
                "location": location,
                "country": location.split(",")[-1].strip() if "," in location else location,
                "job_type": job_type_str,
                "category": cat,
                "salary_range": None,
                "description": desc,
                "requirements": None,
                "apply_url": apply_url,
                "source_api": "Arbeitnow",
                "tags": tags,
                "is_featured": 0,
                "posted_at": datetime.fromtimestamp(item.get("created_at")).isoformat() if item.get("created_at") else datetime.utcnow().isoformat()
            }
            res = upsert_job(job_obj)
            if res == "added":
                added += 1
            elif res == "updated":
                updated += 1

        logger.info(f"[Arbeitnow] Added: {added}, Updated: {updated}")
        return (added, updated, "success")
    except Exception as e:
        logger.error(f"[Arbeitnow] Error: {e}")
        return (added, updated, str(e))

def fetch_jobicy() -> tuple:
    url = "https://jobicy.com/api/v2/remote-jobs?count=60"
    added, updated = 0, 0
    try:
        logger.info(f"Fetching jobs from Jobicy API: {url}...")
        data, status = http_get_json(url, timeout=25)
        if not data or status != 200:
            logger.warning(f"Jobicy HTTP {status}")
            return (0, 0, f"HTTP {status}")
        
        jobs = data.get("jobs", [])
        logger.info(f"Jobicy returned {len(jobs)} jobs. Processing...")

        for item in jobs:
            title = item.get("jobTitle", "").strip()
            company = item.get("companyName", "").strip()
            apply_url = item.get("url", "").strip()
            if not title or not company or not apply_url:
                continue

            desc = clean_html_description(item.get("jobDescription", ""))
            tags = extract_tags(f"{title} {desc}", [item.get("jobIndustry", ""), item.get("jobLevel", "")])
            cat = normalize_category(item.get("jobIndustry", ""), title)

            salary_str = None
            min_sal = item.get("annualSalaryMin")
            max_sal = item.get("annualSalaryMax")
            curr = item.get("salaryCurrency") or "$"
            if min_sal and max_sal:
                salary_str = f"{curr}{min_sal:,} - {curr}{max_sal:,}"
            elif min_sal:
                salary_str = f"From {curr}{min_sal:,}"

            location = item.get("jobGeo") or "Anywhere (Worldwide)"

            job_obj = {
                "title": title,
                "company_name": company,
                "company_logo": item.get("companyLogo"),
                "location": location,
                "country": "Worldwide" if "anywhere" in location.lower() or "world" in location.lower() else location,
                "job_type": "Remote",
                "category": cat,
                "salary_range": salary_str,
                "description": desc,
                "requirements": None,
                "apply_url": apply_url,
                "source_api": "Jobicy",
                "tags": tags,
                "is_featured": 0,
                "posted_at": item.get("pubDate") or datetime.utcnow().isoformat()
            }
            res = upsert_job(job_obj)
            if res == "added":
                added += 1
            elif res == "updated":
                updated += 1

        logger.info(f"[Jobicy] Added: {added}, Updated: {updated}")
        return (added, updated, "success")
    except Exception as e:
        logger.error(f"[Jobicy] Error: {e}")
        return (added, updated, str(e))

def fetch_himalayas() -> tuple:
    url = "https://himalayas.app/jobs/api?limit=50"
    added, updated = 0, 0
    try:
        logger.info(f"Fetching jobs from Himalayas Public API: {url}...")
        data, status = http_get_json(url, timeout=25)
        if not data or status != 200:
            logger.warning(f"Himalayas HTTP {status}")
            return (0, 0, f"HTTP {status}")
        
        jobs = data.get("jobs", [])
        logger.info(f"Himalayas returned {len(jobs)} jobs. Processing...")

        for item in jobs:
            title = item.get("title", "").strip()
            company = item.get("companyName", "").strip()
            apply_url = item.get("applicationLink") or f"https://himalayas.app/jobs/{item.get('companySlug')}/{item.get('guid')}"
            if not title or not company or not apply_url:
                continue

            desc = clean_html_description(item.get("description", ""))
            tags = extract_tags(f"{title} {desc}", item.get("categories", []))
            cat = normalize_category(str(item.get("parentCategories", "")), title)

            salary_str = None
            min_s = item.get("minSalary")
            max_s = item.get("maxSalary")
            curr = item.get("currency") or "$"
            if min_s and max_s:
                salary_str = f"{curr}{min_s:,} - {curr}{max_s:,}"
            elif min_s:
                salary_str = f"From {curr}{min_s:,}"

            loc_list = item.get("locationRestrictions", [])
            location = ", ".join(loc_list) if loc_list else "Worldwide Remote"

            job_obj = {
                "title": title,
                "company_name": company,
                "company_logo": item.get("companyLogo"),
                "location": location,
                "country": "Worldwide" if not loc_list or "worldwide" in location.lower() else location[:50],
                "job_type": "Remote",
                "category": cat,
                "salary_range": salary_str,
                "description": desc,
                "requirements": None,
                "apply_url": apply_url,
                "source_api": "Himalayas",
                "tags": tags,
                "is_featured": 0,
                "posted_at": item.get("pubDate") or datetime.utcnow().isoformat()
            }
            res = upsert_job(job_obj)
            if res == "added":
                added += 1
            elif res == "updated":
                updated += 1

        logger.info(f"[Himalayas] Added: {added}, Updated: {updated}")
        return (added, updated, "success")
    except Exception as e:
        logger.error(f"[Himalayas] Error: {e}")
        return (added, updated, str(e))

def run_sync_cycle() -> dict:
    logger.info("=== STARTING GLOBAL JOB AGGREGATION CYCLE ===")
    init_db()

    total_added = 0
    total_updated = 0
    results = {}

    fetchers = [
        ("Remotive", fetch_remotive),
        ("Arbeitnow", fetch_arbeitnow),
        ("Jobicy", fetch_jobicy),
        ("Himalayas", fetch_himalayas)
    ]

    for name, func in fetchers:
        try:
            a, u, status = func()
            total_added += a
            total_updated += u
            results[name] = {"added": a, "updated": u, "status": status}
            log_sync(name, a, u, "success" if status == "success" else "partial", f"Synced {a} added, {u} updated")
        except Exception as e:
            logger.error(f"Failed {name} sync: {e}")
            results[name] = {"added": 0, "updated": 0, "status": str(e)}
            log_sync(name, 0, 0, "failed", str(e))

    # Auto-expire jobs older than 45 days
    expired_count = expire_old_jobs(days=45)
    if expired_count > 0:
        logger.info(f"Auto-expired {expired_count} jobs older than 45 days.")

    # Automated Facebook Playcard Posting
    auto_post_to_facebook()

    # Automated Candidate CV Email Match Alerts
    dispatch_candidate_email_alerts()

    logger.info(f"=== CYCLE COMPLETED: Total Added: {total_added}, Total Updated: {total_updated} ===")
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_added": total_added,
        "total_updated": total_updated,
        "sources": results
    }

def auto_post_to_facebook():
    try:
        from facebook_poster import post_job_to_facebook
        unposted = get_jobs_to_post_to_fb(limit=1)
        if not unposted:
            logger.info("[Facebook Auto-Poster] All current jobs are already posted.")
            return
        for j in unposted:
            res = post_job_to_facebook(j)
            if res.get("status") == "success":
                mark_job_posted_to_fb(j["id"])
                logger.info(f"[Facebook Auto-Poster] Successfully published '{j['title']}' to Facebook! ID: {res.get('post_id')}")
            elif res.get("status") == "config_missing":
                logger.info("[Facebook Auto-Poster] Awaiting FB_PAGE_ID & FB_PAGE_ACCESS_TOKEN. (Auto-post will fire immediately once credentials are set).")
                break
            else:
                logger.warning(f"[Facebook Auto-Poster] Post returned: {res}")
    except Exception as e:
        logger.error(f"[Facebook Auto-Poster] Error: {e}")

def dispatch_candidate_email_alerts():
    try:
        from database import get_jobs, find_matching_candidates_for_job, log_candidate_alert_sent
        from email_notifier import send_job_match_email
        recent_jobs = get_jobs(page=1, limit=10, sort="latest").get("jobs", [])
        total_alerts = 0
        for j in recent_jobs:
            matching_cands = find_matching_candidates_for_job(j, limit=20)
            for cand in matching_cands:
                ok = send_job_match_email(cand, j)
                if ok:
                    log_candidate_alert_sent(cand["id"], j["id"])
                    total_alerts += 1
        if total_alerts > 0:
            logger.info(f"[Candidate Alerts] Dispatched {total_alerts} job alert emails to matching candidates!")
    except Exception as e:
        logger.error(f"[Candidate Alerts] Error matching/dispatching emails: {e}")

def main():
    parser = argparse.ArgumentParser(description="GlobalHire AI 24/7 Job Aggregator")
    parser.add_argument("--once", action="store_true", help="Run once and exit immediately")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in background daemon mode")
    parser.add_argument("--interval", type=int, default=1800, help="Interval in seconds between syncs & Facebook posts (default: 30m / 1800s)")
    args = parser.parse_args()

    if args.once:
        logger.info("Running single sync cycle (--once)...")
        summary = run_sync_cycle()
        print(json.dumps(summary, indent=2))
        sys.exit(0)

    logger.info(f"Starting 24/7 Auto-Pilot Worker. Sync cycle interval: {args.interval}s (3 hours)...")
    while True:
        try:
            run_sync_cycle()
        except Exception as e:
            logger.error(f"Unhandled error in sync cycle: {e}")
        
        logger.info(f"Sleeping for {args.interval}s until next sync...")
        time.sleep(args.interval)

if __name__ == "__main__":
    main()
