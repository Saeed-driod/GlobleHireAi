# GlobalHire AI — 100% Automated Global Job Hunt Portal 🌍🚀

A fully autonomous, multi-source worldwide tech and remote job aggregation platform built with **Python FastAPI**, **SQLite (WAL mode)**, **24/7 systemd worker**, and a **V22 Bento Grid Glassmorphism UI** (React + Tailwind CSS + Framer Motion).

Deployed on an **Oracle Cloud Ubuntu VM (Ampere A1)** alongside existing workloads with **zero port or resource conflicts**.

---

## 🏛 Architecture Overview

| Component | Technology | Host / Port | Details |
|---|---|---|---|
| **API Server** | FastAPI + Uvicorn | `150.136.214.192:5001` & Nginx `/api/jobs` | High-concurrency REST API with full CORS, analytics click tracking, and manual sync triggers |
| **24/7 Autopilot Worker** | Python `job_worker.py` | `systemd: globalhire-worker` | Runs every 3 hours; scrapes Remotive, Arbeitnow, Jobicy, and Himalayas APIs; deduplicates & auto-expires >45 days |
| **Database** | SQLite with WAL Mode | `/home/ubuntu/global-job-portal/jobs.db` | High-speed concurrent reads, indexed on categories, job types, and apply URLs |
| **Reverse Proxy** | Nginx | Port `80` (`/api/jobs`, `/api/dashboard`, `/jobs-api/`) | Seamlessly co-exists with `GlobalPulse AI` on Port `8000` |
| **Frontend** | React 18 + Tailwind CSS + Framer Motion | Vercel / Local (`localhost:5173`) | Dark glassmorphism (`#090A0F`), real-time search, quick pills, Ad monetization slots, Bento Grid Admin Dashboard |

---

## ⚡ Active Oracle VM Services

Both services run 24/7 under `systemd` on your Oracle Cloud VM (`150.136.214.192`):

```bash
# Check API service status
sudo systemctl status globalhire-api

# Check 24/7 Worker status
sudo systemctl status globalhire-worker

# View live worker aggregation logs
sudo journalctl -u globalhire-worker -f
```

---

## 💻 Local Frontend Preview

To run and preview the frontend locally:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

The frontend is already configured to pull live jobs and real-time Bento analytics directly from your Oracle VM at `http://150.136.214.192`.

---

## 🚀 Deploying to Vercel

### Option 1: Via Vercel CLI
```bash
cd frontend
npx vercel
```

### Option 2: Via GitHub / Vercel Web Dashboard
1. Push this repository to GitHub.
2. In Vercel, click **"Add New Project"** and select the repository.
3. Set the **Root Directory** to `frontend`.
4. In **Environment Variables**, set:
   - `VITE_API_BASE_URL` = `http://150.136.214.192`
5. Click **Deploy**.

---

## 📊 Bento Grid Admin Dashboard

Navigate to the Bento Dashboard by clicking the **"Bento Dashboard"** button in the header or visiting the dashboard view:
- **Total Active Jobs & Daily Intake** counter
- **Total Apply Clicks** & conversion tracker
- **Live Scraper Activity Feed & Monospace Console**
- **7-Day Trend Chart & Category Breakdown Progress Bars**
- **One-Click "Sync Now"** button to trigger instant multi-source aggregation
- **Interactive Job Management Table** (toggle featured promotion, delete obsolete entries)

---

## 💰 Monetization Ad Slots

Built-in monetization placeholders ready for **Adsterra**, **Monetag**, or **Google AdSense**:
1. **Header Leaderboard Ad** (`728x90` responsive banner)
2. **In-Feed Native Job Card** (automatically injected every 5 jobs in the main feed)
3. Custom partner promotions in `frontend/src/components/AdSlot.jsx`

