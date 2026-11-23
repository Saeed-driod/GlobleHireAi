"""
GlobalHire AI - Security & Authentication Test Suite
Tests:
1. Admin API key protection on sensitive endpoints:
   - Without key: 401 Unauthorized
   - With invalid key: 403 Forbidden
   - With valid key: 200 OK
   - Without server ADMIN_API_KEY configured: 503 Service Unavailable (fail-closed)
2. Sensitive admin endpoints:
   - GET /api/candidates
   - DELETE /api/candidates/{id}
   - POST /api/jobs
   - DELETE /api/jobs/{id}
   - PATCH /api/jobs/{id}/feature
   - POST /api/worker/trigger
   - GET /api/dashboard/stats
   - GET /api/dashboard/traffic
   - POST /api/jobs/{id}/post-facebook
   - POST /api/settings/ads
   - GET /api/jobs/export/csv
3. Public endpoints remain open without key:
   - GET /api/jobs
   - GET /api/jobs/{id}
   - GET /
4. In-memory Rate Limiting on /api/candidate/subscribe and /api/track/visit (5 req/min)
5. Production docs disabled (docs_url=None, redoc_url=None, openapi_url=None)
"""

import os
import sys
import unittest

# Set test environment key BEFORE importing app
TEST_ADMIN_KEY = "test-secret-admin-key-2026"
os.environ["ADMIN_API_KEY"] = TEST_ADMIN_KEY
os.environ["ENVIRONMENT"] = "development"

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app import app, candidate_subscribe_limiter, visitor_track_limiter, get_admin_api_key

class SecurityTestSuite(unittest.TestCase):
    def setUp(self):
        os.environ["ADMIN_API_KEY"] = TEST_ADMIN_KEY
        self.client = TestClient(app)
        candidate_subscribe_limiter.reset()
        visitor_track_limiter.reset()

    # --- 1. Core Auth Checks (401, 403, 200, 503) ---

    def test_candidates_without_key_returns_401(self):
        resp = self.client.get("/api/candidates")
        self.assertEqual(resp.status_code, 401, f"Expected 401, got {resp.status_code}")
        self.assertIn("Missing", resp.json().get("detail", ""))

    def test_candidates_with_invalid_key_returns_403(self):
        resp = self.client.get("/api/candidates", headers={"X-Admin-Key": "wrong-secret-key"})
        self.assertEqual(resp.status_code, 403, f"Expected 403, got {resp.status_code}")
        self.assertIn("Invalid", resp.json().get("detail", ""))

    def test_candidates_with_valid_key_returns_200(self):
        resp = self.client.get("/api/candidates", headers={"X-Admin-Key": TEST_ADMIN_KEY})
        self.assertEqual(resp.status_code, 200, f"Expected 200, got {resp.status_code}")

    def test_fail_closed_when_admin_key_not_configured_returns_503(self):
        # Temporarily wipe ADMIN_API_KEY
        saved_key = os.environ.get("ADMIN_API_KEY")
        try:
            os.environ["ADMIN_API_KEY"] = ""
            resp = self.client.get("/api/candidates", headers={"X-Admin-Key": TEST_ADMIN_KEY})
            self.assertEqual(resp.status_code, 503, f"Expected 503 fail-closed, got {resp.status_code}")
        finally:
            if saved_key:
                os.environ["ADMIN_API_KEY"] = saved_key

    # --- 2. All Protected Admin Endpoints Return 401 Without Key ---

    def test_dashboard_stats_without_key_returns_401(self):
        resp = self.client.get("/api/dashboard/stats")
        self.assertEqual(resp.status_code, 401)

    def test_dashboard_stats_with_valid_key_returns_200(self):
        resp = self.client.get("/api/dashboard/stats", headers={"X-Admin-Key": TEST_ADMIN_KEY})
        self.assertEqual(resp.status_code, 200)

    def test_worker_trigger_without_key_returns_401(self):
        resp = self.client.post("/api/worker/trigger")
        self.assertEqual(resp.status_code, 401)

    def test_worker_trigger_with_valid_key_returns_200(self):
        resp = self.client.post("/api/worker/trigger", headers={"X-Admin-Key": TEST_ADMIN_KEY})
        self.assertEqual(resp.status_code, 200)

    def test_job_create_without_key_returns_401(self):
        payload = {
            "title": "Security Lead",
            "company_name": "SecureCorp",
            "description": "Security testing role",
            "apply_url": "https://securecorp.com/apply"
        }
        resp = self.client.post("/api/jobs", json=payload)
        self.assertEqual(resp.status_code, 401)

    def test_job_feature_without_key_returns_401(self):
        resp = self.client.patch("/api/jobs/1/feature")
        self.assertEqual(resp.status_code, 401)

    def test_job_delete_without_key_returns_401(self):
        resp = self.client.delete("/api/jobs/1")
        self.assertEqual(resp.status_code, 401)

    def test_export_csv_without_key_returns_401(self):
        resp = self.client.get("/api/jobs/export/csv")
        self.assertEqual(resp.status_code, 401)

    def test_export_csv_with_valid_key_returns_200(self):
        resp = self.client.get("/api/jobs/export/csv", headers={"X-Admin-Key": TEST_ADMIN_KEY})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("text/csv", resp.headers.get("content-type", ""))

    def test_settings_ads_without_key_returns_401(self):
        resp = self.client.post("/api/settings/ads", json={})
        self.assertEqual(resp.status_code, 401)

    # --- 3. Public Endpoints Remain Completely Open Without Key ---

    def test_public_jobs_endpoint_open(self):
        resp = self.client.get("/api/jobs?limit=5")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("jobs", resp.json())

    def test_public_root_open(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)

    # --- 4. Rate Limiting Tests (5 req/min) ---

    def test_candidate_subscribe_rate_limit(self):
        payload = {
            "full_name": "Rate Test User",
            "email": "rate@example.com",
            "education": "BS Computer Science",
            "category": "Software Dev",
            "skills": ["Python"]
        }
        # First 5 succeed
        for i in range(5):
            r = self.client.post("/api/candidate/subscribe", json=payload)
            self.assertEqual(r.status_code, 200, f"Request {i+1} should succeed, got {r.status_code}")

        # 6th must return 429
        r6 = self.client.post("/api/candidate/subscribe", json=payload)
        self.assertEqual(r6.status_code, 429)

    def test_visitor_track_rate_limit(self):
        payload = {"page_url": "/", "country": "United States", "country_code": "US"}
        # First 5 succeed
        for i in range(5):
            r = self.client.post("/api/track/visit", json=payload)
            self.assertEqual(r.status_code, 200)

        # 6th must return 429
        r6 = self.client.post("/api/track/visit", json=payload)
        self.assertEqual(r6.status_code, 429)

    # --- 5. Docs Disabled ---

    def test_docs_disabled(self):
        r_docs = self.client.get("/docs")
        self.assertEqual(r_docs.status_code, 404)
        r_redoc = self.client.get("/redoc")
        self.assertEqual(r_redoc.status_code, 404)
        r_openapi = self.client.get("/openapi.json")
        self.assertEqual(r_openapi.status_code, 404)

if __name__ == "__main__":
    unittest.main()
