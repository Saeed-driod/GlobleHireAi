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
        """)

        try:
            conn.execute("ALTER TABLE jobs ADD COLUMN posted_to_fb BOOLEAN DEFAULT 0;")
        except Exception:
            pass
    conn.close()

def clean_tags(tags) -> str:
    if isinstance(tags, list):
        clean = [str(t).strip() for t in tags if str(t).strip()]
        return json.dumps(clean[:10])
    elif isinstance(tags, str):
        try:
            parsed = json.loads(tags)
            if isinstance(parsed, list):
                return json.dumps([str(t).strip() for t in parsed if str(t).strip()][:10])
        except Exception:
            parts = [t.strip() for t in tags.split(",") if t.strip()]
            return json.dumps(parts[:10])
    return json.dumps([])

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
                job_data.get("description") or "No description provided.",
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
    sort: str = "latest"
) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    conditions = []
    params: List[Any] = []

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

    if job_type and job_type.strip() and job_type.lower() != "all":
        conditions.append("LOWER(job_type) LIKE ?")
        params.append(f"%{job_type.strip().lower()}%")

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

