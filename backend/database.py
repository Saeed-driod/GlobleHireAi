import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("GLOBALHIRE_DB_PATH", os.path.join(os.path.dirname(__file__), "jobs.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company_name TEXT NOT NULL,
            company_logo TEXT,
            location TEXT NOT NULL DEFAULT 'Worldwide',
            country TEXT NOT NULL DEFAULT 'Worldwide',
            job_type TEXT NOT NULL DEFAULT 'Remote',
            category TEXT NOT NULL DEFAULT 'Software Dev',
            salary_range TEXT,
            description TEXT NOT NULL,
            requirements TEXT,
            apply_url TEXT UNIQUE NOT NULL,
            source_api TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            is_featured BOOLEAN NOT NULL DEFAULT 0,
            views_count INTEGER NOT NULL DEFAULT 0,
            clicks_count INTEGER NOT NULL DEFAULT 0,
            posted_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
        CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
        CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
        CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
        CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured);
        CREATE INDEX IF NOT EXISTS idx_jobs_clicks ON jobs(clicks_count DESC);

        CREATE TABLE IF NOT EXISTS applications_click_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            country TEXT DEFAULT 'Unknown',
            user_ip TEXT DEFAULT 'Anonymous',
            user_agent TEXT,
            clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_clicks_job_id ON applications_click_logs(job_id);
        CREATE INDEX IF NOT EXISTS idx_clicks_time ON applications_click_logs(clicked_at DESC);

        CREATE TABLE IF NOT EXISTS sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            source TEXT NOT NULL,
            jobs_added INTEGER NOT NULL DEFAULT 0,
            jobs_updated INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'success',
            message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sync_time ON sync_logs(timestamp DESC);

        CREATE TABLE IF NOT EXISTS candidate_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            education TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'All',
            skills TEXT NOT NULL DEFAULT '[]',
            experience_level TEXT DEFAULT 'Any',
            preferred_job_type TEXT DEFAULT 'Remote',
            resume_text TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_notified_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_candidate_email ON candidate_alerts(email);
        CREATE INDEX IF NOT EXISTS idx_candidate_education ON candidate_alerts(education);
        CREATE INDEX IF NOT EXISTS idx_candidate_category ON candidate_alerts(category);

        CREATE TABLE IF NOT EXISTS candidate_alert_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL REFERENCES candidate_alerts(id) ON DELETE CASCADE,
            job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'sent'
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_cand_job ON candidate_alert_logs(candidate_id, job_id);

        CREATE TABLE IF NOT EXISTS visitor_traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT DEFAULT 'Anonymous',
            country TEXT DEFAULT 'Worldwide',
            referrer TEXT DEFAULT 'Direct',
            device TEXT DEFAULT 'Desktop',
            page_url TEXT DEFAULT '/',
            visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_traffic_visited_at ON visitor_traffic_logs(visited_at DESC);
        CREATE INDEX IF NOT EXISTS idx_traffic_country ON visitor_traffic_logs(country);
        CREATE INDEX IF NOT EXISTS idx_traffic_referrer ON visitor_traffic_logs(referrer);
        """)

        try:
            conn.execute("ALTER TABLE jobs ADD COLUMN posted_to_fb BOOLEAN DEFAULT 0;")
        except Exception:
            pass

        try:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS ad_settings (
                id INTEGER PRIMARY KEY,
                master_enabled BOOLEAN NOT NULL DEFAULT 1,
                monetag_global_script TEXT DEFAULT '',
                direct_link_url TEXT DEFAULT '',
                adsterra_header_banner TEXT DEFAULT '',
                adsterra_infeed_banner TEXT DEFAULT '',
                adsterra_sidebar_banner TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.execute("INSERT OR IGNORE INTO ad_settings (id, master_enabled) VALUES (1, 1);")
        except Exception:
            pass
    conn.close()

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

def clean_tags(tags) -> str:
    raw_list = []
    if isinstance(tags, list):
        raw_list = tags
    elif isinstance(tags, str):
        try:
            parsed = json.loads(tags)
            if isinstance(parsed, list):
                raw_list = parsed
            else:
                raw_list = [tags]
        except Exception:
            raw_list = tags.split(",")
    
    clean = []
    import re
    for t in raw_list:
        t_str = str(t).strip()
        t_lower = t_str.lower()
        if not t_str or len(t_str) < 2 or len(t_str) > 35:
            continue
        # Filter out education levels and generic employment type noise
        if any(re.search(pat, t_lower) for pat in BAD_TAG_PATTERNS):
            continue
        if t_str not in clean:
            clean.append(t_str)
    return json.dumps(clean[:10])

def upsert_job(job_data: Dict[str, Any]) -> str:
    """Insert or update job. Returns 'added', 'updated', or 'skipped'."""
    conn = get_db()
    try:
        apply_url = str(job_data.get("apply_url", "")).strip()
        if not apply_url:
            return "skipped"

        title = str(job_data.get("title", "")).strip()
        company_name = str(job_data.get("company_name", "")).strip()
        if not title or not company_name:
            return "skipped"

        description = str(job_data.get("description", "")).strip()
        # Skip jobs whose text is German or non-English
        if is_german_or_non_english(title, description):
            return "skipped"

        tags_json = clean_tags(job_data.get("tags", []))
        posted_at = job_data.get("posted_at") or datetime.utcnow().isoformat()
        if isinstance(posted_at, datetime):
            posted_at = posted_at.isoformat()

        cursor = conn.cursor()
        
        # Check existing by apply_url or exact (title + company_name)
        cursor.execute("SELECT id FROM jobs WHERE apply_url = ? OR (LOWER(title) = LOWER(?) AND LOWER(company_name) = LOWER(?))", 
                       (apply_url, title, company_name))
        existing = cursor.fetchone()

        if existing:
            job_id = existing["id"]
            cursor.execute("""
                UPDATE jobs SET 
                    company_logo = COALESCE(?, company_logo),
                    location = COALESCE(?, location),
                    country = COALESCE(?, country),
                    job_type = COALESCE(?, job_type),
                    category = COALESCE(?, category),
                    salary_range = COALESCE(?, salary_range),
                    tags = ?
                WHERE id = ?
            """, (
                job_data.get("company_logo"),
                job_data.get("location"),
                job_data.get("country"),
                job_data.get("job_type"),
                job_data.get("category"),
                job_data.get("salary_range"),
                tags_json,
                job_id
            ))
            conn.commit()
            return "updated"
        else:
            cursor.execute("""
                INSERT INTO jobs (
                    title, company_name, company_logo, location, country,
                    job_type, category, salary_range, description, requirements,
                    apply_url, source_api, tags, is_featured, posted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                title,
                company_name,
                job_data.get("company_logo"),
                job_data.get("location") or "Worldwide",
                job_data.get("country") or "Worldwide",
                job_data.get("job_type") or "Remote",
                job_data.get("category") or "Software Dev",
                job_data.get("salary_range"),
                description or "No description provided.",
                job_data.get("requirements"),
                apply_url,
                job_data.get("source_api") or "Manual",
                tags_json,
                1 if job_data.get("is_featured") else 0,
                posted_at
            ))
            conn.commit()
            return "added"
    except sqlite3.IntegrityError:
        return "skipped"
    except Exception as e:
        print(f"Error upserting job: {e}")
        return "skipped"
    finally:
        conn.close()

def get_jobs(
    page: int = 1,
    limit: int = 15,
    q: Optional[str] = None,
    category: Optional[str] = None,
    job_type: Optional[str] = None,
    country: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: str = "latest",
    include_onsite: bool = False
) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    conditions = []
    params: List[Any] = []

    # 1. By default, ONLY show verified Remote jobs unless "include_onsite" is explicitly enabled
    if not include_onsite:
        if not job_type or job_type.lower() == "all" or job_type.lower() == "remote":
            conditions.append("""(
                (LOWER(job_type) = 'remote' OR LOWER(location) LIKE '%remote%' OR LOWER(location) LIKE '%worldwide%' OR LOWER(location) LIKE '%anywhere%')
                AND LOWER(job_type) NOT IN ('on-site', 'onsite')
                AND LOWER(location) NOT LIKE '%berlin%'
                AND LOWER(location) NOT LIKE '%munich%'
                AND LOWER(location) NOT LIKE '%münchen%'
                AND LOWER(location) NOT LIKE '%dresden%'
            )""")
    elif job_type and job_type.strip() and job_type.lower() != "all":
        conditions.append("LOWER(job_type) LIKE ?")
        params.append(f"%{job_type.strip().lower()}%")

    # Exclude non-English job markers
    conditions.append("title NOT LIKE '%(m/w/d)%' AND title NOT LIKE '%(w/m/d)%' AND title NOT LIKE '%(m/w/x)%'")

    if q and q.strip():
        search = f"%{q.strip().lower()}%"
        conditions.append("""(
            LOWER(title) LIKE ? OR 
            LOWER(company_name) LIKE ? OR 
            LOWER(description) LIKE ? OR 
            LOWER(tags) LIKE ? OR
            LOWER(location) LIKE ?
        )""")
        params.extend([search, search, search, search, search])

    if category and category.strip() and category.lower() != "all":
        conditions.append("LOWER(category) = LOWER(?)")
        params.append(category.strip())

    if include_onsite and job_type and job_type.strip() and job_type.lower() != "all":
        pass # already handled above

    if country and country.strip() and country.lower() != "all":
        conditions.append("(LOWER(country) = LOWER(?) OR LOWER(location) LIKE ?)")
        params.extend([country.strip(), f"%{country.strip().lower()}%"])

    if featured is True:
        conditions.append("is_featured = 1")

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Count total
    count_sql = f"SELECT COUNT(*) as total FROM jobs{where_clause}"
    cursor.execute(count_sql, params)
    total = cursor.fetchone()["total"]

    # Sorting
    if sort == "popular":
        order_by = "ORDER BY is_featured DESC, clicks_count DESC, views_count DESC, posted_at DESC"
    elif sort == "featured":
        order_by = "ORDER BY is_featured DESC, posted_at DESC"
    else: # latest
        order_by = "ORDER BY is_featured DESC, posted_at DESC, id DESC"

    # Pagination
    offset = max(0, (page - 1) * limit)
    query_sql = f"""
        SELECT id, title, company_name, company_logo, location, country,
               job_type, category, salary_range, apply_url, source_api,
               tags, is_featured, views_count, clicks_count, posted_at, created_at,
               SUBSTR(description, 1, 350) as excerpt
        FROM jobs
        {where_clause}
        {order_by}
        LIMIT ? OFFSET ?
    """
    cursor.execute(query_sql, params + [limit, offset])
    rows = cursor.fetchall()

    jobs_list = []
    for r in rows:
        job = dict(r)
        try:
            job["tags"] = json.loads(job["tags"])
        except Exception:
            job["tags"] = []
        jobs_list.append(job)

    conn.close()

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "jobs": jobs_list,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

def get_job_by_id(job_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    job = dict(row)
    try:
        job["tags"] = json.loads(job["tags"])
    except Exception:
        job["tags"] = []

    # Increment view count
    cursor.execute("UPDATE jobs SET views_count = views_count + 1 WHERE id = ?", (job_id,))
    conn.commit()

    # Find related jobs
    cursor.execute("""
        SELECT id, title, company_name, company_logo, location, category, job_type, salary_range, posted_at
        FROM jobs
        WHERE category = ? AND id != ?
        ORDER BY posted_at DESC
        LIMIT 3
    """, (job.get("category", "Software Dev"), job_id))
    related = [dict(r) for r in cursor.fetchall()]

    conn.close()
    job["related_jobs"] = related
    return job

def log_apply_click(job_id: int, country: str = "Unknown", user_ip: str = "Anonymous", user_agent: str = "") -> Optional[str]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT apply_url FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    apply_url = row["apply_url"]

    # Increment clicks_count
    cursor.execute("UPDATE jobs SET clicks_count = clicks_count + 1 WHERE id = ?", (job_id,))
    # Record click log
    cursor.execute("""
        INSERT INTO applications_click_logs (job_id, country, user_ip, user_agent)
        VALUES (?, ?, ?, ?)
    """, (job_id, country or "Unknown", user_ip or "Anonymous", user_agent or ""))
    conn.commit()
    conn.close()

    return apply_url

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    # Total active jobs
    cursor.execute("SELECT COUNT(*) as total FROM jobs")
    total_jobs = cursor.fetchone()["total"]

    # New jobs in last 24h
    yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
    cursor.execute("SELECT COUNT(*) as new_today FROM jobs WHERE created_at >= ? OR posted_at >= ?", (yesterday, yesterday))
    new_today = cursor.fetchone()["new_today"]

    # Total clicks
    cursor.execute("SELECT COUNT(*) as total_clicks FROM applications_click_logs")
    total_clicks = cursor.fetchone()["total_clicks"]

    # Clicks today
    cursor.execute("SELECT COUNT(*) as clicks_today FROM applications_click_logs WHERE clicked_at >= ?", (yesterday,))
    clicks_today = cursor.fetchone()["clicks_today"]

    # Categories breakdown
    cursor.execute("""
        SELECT category, COUNT(*) as count 
        FROM jobs 
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 8
    """)
    top_categories = [dict(r) for r in cursor.fetchall()]

    # Job Types breakdown
    cursor.execute("""
        SELECT 
            SUM(CASE WHEN LOWER(job_type) LIKE '%remote%' THEN 1 ELSE 0 END) as remote_count,
            SUM(CASE WHEN LOWER(job_type) LIKE '%hybrid%' THEN 1 ELSE 0 END) as hybrid_count,
            SUM(CASE WHEN LOWER(job_type) LIKE '%on-site%' OR LOWER(job_type) LIKE '%onsite%' THEN 1 ELSE 0 END) as onsite_count
        FROM jobs
    """)
    type_counts = dict(cursor.fetchone() or {})

    # 7-day trend
    trend_data = []
    for i in range(6, -1, -1):
        day_date = datetime.utcnow() - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        next_day_str = (day_date + timedelta(days=1)).strftime("%Y-%m-%d")
        
        cursor.execute("SELECT COUNT(*) as c FROM jobs WHERE created_at >= ? AND created_at < ?", (day_str, next_day_str))
        jobs_added_day = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM applications_click_logs WHERE clicked_at >= ? AND clicked_at < ?", (day_str, next_day_str))
        clicks_day = cursor.fetchone()["c"]

        trend_data.append({
            "date": day_date.strftime("%b %d"),
            "jobs_added": jobs_added_day,
            "apply_clicks": clicks_day
        })

    # Recent sync logs
    cursor.execute("SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 10")
    recent_syncs = [dict(r) for r in cursor.fetchall()]

    # Top popular jobs
    cursor.execute("""
        SELECT id, title, company_name, category, views_count, clicks_count, is_featured, posted_at
        FROM jobs
        ORDER BY clicks_count DESC, views_count DESC
        LIMIT 10
    """)
    popular_jobs = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "total_jobs": total_jobs,
        "new_jobs_today": new_today,
        "total_clicks": total_clicks,
        "clicks_today": clicks_today,
        "top_categories": top_categories,
        "job_types": {
            "remote": type_counts.get("remote_count") or 0,
            "hybrid": type_counts.get("hybrid_count") or 0,
            "onsite": type_counts.get("onsite_count") or 0
        },
        "trend_data": trend_data,
        "recent_sync_logs": recent_syncs,
        "popular_jobs": popular_jobs,
        "worker_status": "ONLINE - 24/7 Oracle VM"
    }

def log_sync(source: str, added: int, updated: int, status: str = "success", message: str = ""):
    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO sync_logs (source, jobs_added, jobs_updated, status, message)
            VALUES (?, ?, ?, ?, ?)
        """, (source, added, updated, status, message))
    conn.close()

def expire_old_jobs(days: int = 45) -> int:
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    conn = get_db()
    with conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM jobs WHERE posted_at < ? AND is_featured = 0", (cutoff,))
        deleted = cursor.rowcount
    conn.close()
    return deleted

def toggle_feature_job(job_id: int) -> Optional[bool]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_featured FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    new_state = 0 if row["is_featured"] else 1
    cursor.execute("UPDATE jobs SET is_featured = ? WHERE id = ?", (new_state, job_id))
    conn.commit()
    conn.close()
    return bool(new_state)

def delete_job(job_id: int) -> bool:
    conn = get_db()
    with conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def get_jobs_to_post_to_fb(limit: int = 2) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM jobs 
        WHERE posted_to_fb = 0 
        ORDER BY is_featured DESC, posted_at DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    jobs = []
    for r in rows:
        j = dict(r)
        try:
            j["tags"] = json.loads(j["tags"])
        except Exception:
            j["tags"] = []
        jobs.append(j)
    conn.close()
    return jobs

def mark_job_posted_to_fb(job_id: int):
    conn = get_db()
    with conn:
        conn.execute("UPDATE jobs SET posted_to_fb = 1 WHERE id = ?", (job_id,))
    conn.close()

# -------------------------------------------------------------
# CANDIDATE CV ALERT & TALENT POOL FUNCTIONS
# -------------------------------------------------------------

def save_candidate_alert(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """Register or update a candidate for automated job match emails."""
    conn = get_db()
    cursor = conn.cursor()
    email = str(candidate_data.get("email", "")).strip().lower()
    full_name = str(candidate_data.get("full_name", "")).strip()
    education = str(candidate_data.get("education", "Bachelors")).strip()
    category = str(candidate_data.get("category", "All")).strip()
    phone = str(candidate_data.get("phone", "")).strip()
    exp = str(candidate_data.get("experience_level", "Any")).strip()
    job_type = str(candidate_data.get("preferred_job_type", "Remote")).strip()
    resume_text = str(candidate_data.get("resume_text", "")).strip()
    
    skills = candidate_data.get("skills", [])
    if isinstance(skills, str):
        try:
            skills = json.loads(skills)
        except Exception:
            skills = [s.strip() for s in skills.split(",") if s.strip()]
    skills_json = json.dumps(skills[:20])

    try:
        with conn:
            cursor.execute("""
                INSERT INTO candidate_alerts (
                    full_name, email, phone, education, category, skills,
                    experience_level, preferred_job_type, resume_text, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(email) DO UPDATE SET
                    full_name = excluded.full_name,
                    phone = excluded.phone,
                    education = excluded.education,
                    category = excluded.category,
                    skills = excluded.skills,
                    experience_level = excluded.experience_level,
                    preferred_job_type = excluded.preferred_job_type,
                    resume_text = excluded.resume_text,
                    is_active = 1
            """, (full_name, email, phone, education, category, skills_json, exp, job_type, resume_text))
            candidate_id = cursor.lastrowid
            
        cursor.execute("SELECT * FROM candidate_alerts WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else {"id": candidate_id, "email": email}
    except Exception as e:
        conn.close()
        raise e

def find_matching_candidates_for_job(job: Dict[str, Any], limit: int = 50) -> List[Dict[str, Any]]:
    """Finds candidates whose category, skills or education match the given job."""
    conn = get_db()
    cursor = conn.cursor()
    job_id = job.get("id")
    category = job.get("category", "")
    title = (job.get("title") or "").lower()
    desc = (job.get("description") or "").lower()

    # Find active candidates who haven't been notified of this specific job yet
    cursor.execute("""
        SELECT c.* FROM candidate_alerts c
        LEFT JOIN candidate_alert_logs l ON c.id = l.candidate_id AND l.job_id = ?
        WHERE c.is_active = 1 AND l.id IS NULL
        LIMIT ?
    """, (job_id, limit * 2))
    rows = cursor.fetchall()
    
    matched = []
    for r in rows:
        cand = dict(r)
        cand_cat = cand.get("category", "All")
        cand_edu = (cand.get("education") or "").lower()
        cand_skills = []
        try:
            cand_skills = json.loads(cand.get("skills", "[]"))
        except Exception:
            pass

        # Matching algorithm
        is_match = False
        # 1. Direct Category Match
        if cand_cat == "All" or cand_cat.lower() == category.lower():
            is_match = True
        
        # 2. Skill keywords in job title/description
        if not is_match and cand_skills:
            for s in cand_skills:
                s_lower = str(s).lower()
                if len(s_lower) > 2 and (s_lower in title or s_lower in desc):
                    is_match = True
                    break

        # 3. Education / Degree match (e.g. computer science, mba, engineering)
        if not is_match and cand_edu:
            edu_keywords = [w for w in cand_edu.split() if len(w) > 3]
            for ek in edu_keywords:
                if ek in title or ek in desc:
                    is_match = True
                    break

        if is_match:
            cand["skills"] = cand_skills
            matched.append(cand)
            if len(matched) >= limit:
                break

    conn.close()
    return matched

def log_candidate_alert_sent(candidate_id: int, job_id: int):
    """Record that an alert was sent so candidate isn't spammed with duplicates."""
    conn = get_db()
    try:
        with conn:
            conn.execute("""
                INSERT OR IGNORE INTO candidate_alert_logs (candidate_id, job_id)
                VALUES (?, ?)
            """, (candidate_id, job_id))
            conn.execute("""
                UPDATE candidate_alerts SET last_notified_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (candidate_id,))
    except Exception:
        pass
    finally:
        conn.close()

def get_talent_pool_stats() -> Dict[str, Any]:
    """Returns total subscribers and breakdown for admin dashboard."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM candidate_alerts WHERE is_active = 1")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as alerts_sent FROM candidate_alert_logs")
    alerts_sent = cursor.fetchone()["alerts_sent"]

    cursor.execute("""
        SELECT education, COUNT(*) as count 
        FROM candidate_alerts 
        GROUP BY education 
        ORDER BY count DESC 
        LIMIT 5
    """)
    edu_rows = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "total_candidates": total,
        "total_alerts_sent": alerts_sent,
        "education_breakdown": edu_rows
    }

def get_candidates_list(page: int = 1, limit: int = 50, q: str = "") -> Dict[str, Any]:
    """Returns paginated candidate CV registrations with search."""
    conn = get_db()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    where = "WHERE is_active = 1"
    params = []
    if q:
        where += " AND (full_name LIKE ? OR email LIKE ? OR education LIKE ? OR skills LIKE ?)"
        q_term = f"%{q}%"
        params.extend([q_term, q_term, q_term, q_term])

    cursor.execute(f"SELECT COUNT(*) as total FROM candidate_alerts {where}", params)
    total = cursor.fetchone()["total"]

    cursor.execute(f"""
        SELECT c.*, 
          (SELECT COUNT(*) FROM candidate_alert_logs l WHERE l.candidate_id = c.id) as alerts_count
        FROM candidate_alerts c
        {where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, params + [limit, offset])
    
    rows = cursor.fetchall()
    candidates = []
    for r in rows:
        cand = dict(r)
        try:
            cand["skills"] = json.loads(cand.get("skills", "[]"))
        except Exception:
            cand["skills"] = []
        candidates.append(cand)

    conn.close()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "candidates": candidates
    }

def delete_candidate(cand_id: int) -> bool:
    conn = get_db()
    with conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM candidate_alerts WHERE id = ?", (cand_id,))
        deleted = cursor.rowcount > 0
    conn.close()
    return deleted

# -------------------------------------------------------------
# REAL-TIME TRAFFIC & ORIGIN ANALYTICS
# -------------------------------------------------------------

def resolve_ip_geo(ip: str) -> tuple:
    """Returns (country, country_code, city) using local cache or ip-api."""
    if not ip or ip == "Anonymous" or ip.startswith("127.") or ip == "localhost":
        return ("Worldwide", "WW", "Global")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT country, country_code, city FROM ip_geo_cache WHERE ip = ?", (ip,))
    row = cursor.fetchone()
    if row:
        conn.close()
        return (row["country"] or "Worldwide", row["country_code"] or "", row["city"] or "")

    # Perform lightweight lookup
    try:
        import urllib.request
        url = f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city"
        req = urllib.request.Request(url, headers={'User-Agent': 'GlobalHireAI/1.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('status') == 'success':
                c = data.get('country') or 'Worldwide'
                cc = data.get('countryCode') or ''
                city = data.get('city') or ''
                with conn:
                    conn.execute("INSERT OR REPLACE INTO ip_geo_cache (ip, country, country_code, city) VALUES (?, ?, ?, ?)",
                                 (ip, c, cc, city))
                conn.close()
                return (c, cc, city)
    except Exception:
        pass
    
    conn.close()
    return ("Worldwide", "WW", "")

def log_visitor_traffic(ip: str = "Anonymous", country: str = None, country_code: str = None, city: str = None, referrer: str = "Direct", device: str = "Desktop", page_url: str = "/"):
    """Logs visitor traffic session with origin details, auto-resolving geo if needed."""
    # Normalize referrer
    ref = (referrer or "Direct").lower().strip()
    clean_ref = "Direct"
    if "facebook" in ref or "fb.com" in ref:
        clean_ref = "Facebook"
    elif "google" in ref:
        clean_ref = "Google Search"
    elif "whatsapp" in ref:
        clean_ref = "WhatsApp"
    elif "t.co" in ref or "twitter" in ref or "x.com" in ref:
        clean_ref = "Twitter / X"
    elif "linkedin" in ref:
        clean_ref = "LinkedIn"
    elif "instagram" in ref:
        clean_ref = "Instagram"
    elif ref and ref != "direct" and not ref.startswith("http://localhost") and not ref.startswith("http://150.136"):
        clean_ref = ref[:30]

    # Resolve country if missing or Worldwide
    final_country = country
    final_cc = country_code
    final_city = city

    if not final_country or final_country in ["Worldwide", "Unknown", ""]:
        resolved_c, resolved_cc, resolved_city = resolve_ip_geo(ip)
        final_country = resolved_c
        final_cc = resolved_cc
        final_city = resolved_city

    conn = get_db()
    try:
        with conn:
            conn.execute("""
                INSERT INTO visitor_traffic_logs (ip, country, country_code, city, referrer, device, page_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (ip, final_country or "Worldwide", final_cc or "", final_city or "", clean_ref, device, page_url))
    except Exception:
        pass
    finally:
        conn.close()

def get_traffic_analytics() -> Dict[str, Any]:
    """Returns comprehensive visitor stats, complete country origin, and live visitor feed."""
    conn = get_db()
    cursor = conn.cursor()

    # Total Pageviews & Today's Visitors
    cursor.execute("SELECT COUNT(*) as total FROM visitor_traffic_logs")
    total_views = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(*) as today 
        FROM visitor_traffic_logs 
        WHERE visited_at >= datetime('now', '-1 day')
    """)
    views_today = cursor.fetchone()["today"]

    # Unique IP Count
    cursor.execute("SELECT COUNT(DISTINCT ip) as unique_ips FROM visitor_traffic_logs")
    unique_visitors = cursor.fetchone()["unique_ips"]

    # Referrer Traffic Breakdown
    cursor.execute("""
        SELECT referrer, COUNT(*) as count 
        FROM visitor_traffic_logs 
        GROUP BY referrer 
        ORDER BY count DESC 
        LIMIT 10
    """)
    referrers = [dict(r) for r in cursor.fetchall()]

    # ALL Countries Breakdown (No restrictive LIMIT 6 so user can see every single country!)
    cursor.execute("""
        SELECT 
            COALESCE(country, 'Worldwide') as country,
            COALESCE(country_code, '') as country_code,
            COUNT(*) as count 
        FROM visitor_traffic_logs 
        WHERE country IS NOT NULL AND country != ''
        GROUP BY country 
        ORDER BY count DESC
    """)
    countries = [dict(r) for r in cursor.fetchall()]

    # Device Breakdown
    cursor.execute("""
        SELECT device, COUNT(*) as count 
        FROM visitor_traffic_logs 
        GROUP BY device
    """)
    devices = [dict(r) for r in cursor.fetchall()]

    # Last 7 Days Daily History
    cursor.execute("""
        SELECT strftime('%Y-%m-%d', visited_at) as day, COUNT(*) as count
        FROM visitor_traffic_logs
        WHERE visited_at >= datetime('now', '-7 days')
        GROUP BY day
        ORDER BY day ASC
    """)
    daily_history = [dict(r) for r in cursor.fetchall()]

    # Real-Time Recent Visitors (Last 40 visitors stream)
    cursor.execute("""
        SELECT id, ip, country, country_code, city, referrer, device, page_url, visited_at
        FROM visitor_traffic_logs
        ORDER BY id DESC
        LIMIT 40
    """)
    recent_visitors = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "total_pageviews": total_views,
        "views_today": views_today,
        "unique_visitors": unique_visitors,
        "top_referrers": referrers,
        "top_countries": countries,
        "devices": devices,
        "daily_history": daily_history,
        "recent_visitors": recent_visitors
    }


def get_ad_settings() -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ad_settings WHERE id = 1 LIMIT 1;")
    row = cursor.fetchone()
    if not row:
        cursor.execute("INSERT OR IGNORE INTO ad_settings (id, master_enabled) VALUES (1, 1);")
        conn.commit()
        cursor.execute("SELECT * FROM ad_settings WHERE id = 1 LIMIT 1;")
        row = cursor.fetchone()
    res = dict(row) if row else {
        "id": 1,
        "master_enabled": 1,
        "monetag_global_script": "",
        "direct_link_url": "",
        "adsterra_header_banner": "",
        "adsterra_infeed_banner": "",
        "adsterra_sidebar_banner": "",
        "updated_at": ""
    }
    conn.close()
    res["master_enabled"] = bool(res.get("master_enabled", 1))
    return res


def update_ad_settings(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    fields = ["master_enabled", "monetag_global_script", "direct_link_url", "adsterra_header_banner", "adsterra_infeed_banner", "adsterra_sidebar_banner"]
    updates = []
    values = []
    for f in fields:
        if f in data and data[f] is not None:
            updates.append(f"{f} = ?")
            val = int(data[f]) if f == "master_enabled" else str(data[f])
            values.append(val)
    if updates:
        values.append(1)
        cursor.execute(f"UPDATE ad_settings SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?;", values)
        conn.commit()
    conn.close()
    return get_ad_settings()




