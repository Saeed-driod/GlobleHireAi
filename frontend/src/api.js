// GlobalHire AI API Client
const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'http://150.136.214.192');

export async function fetchJobs({
  page = 1,
  limit = 15,
  q = '',
  category = '',
  job_type = '',
  country = '',
  featured = null,
  sort = 'latest',
  include_onsite = false
} = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (q) params.set('q', q);
  if (category && category !== 'All') params.set('category', category);
  if (job_type && job_type !== 'All') params.set('job_type', job_type);
  if (country && country !== 'All') params.set('country', country);
  if (featured !== null && featured !== undefined) params.set('featured', featured);
  if (sort) params.set('sort', sort);
  if (include_onsite) params.set('include_onsite', 'true');

  const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch jobs`);
  return res.json();
}

export async function fetchJobDetails(jobId) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Job not found`);
  return res.json();
}
export const fetchJobById = fetchJobDetails;

export async function logJobApply(jobId) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to log apply click`);
  return res.json();
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load dashboard stats`);
  return res.json();
}

export async function triggerWorkerSync() {
  const res = await fetch(`${API_BASE}/api/worker/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Trigger failed`);
  return res.json();
}

export async function toggleJobFeatured(jobId) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/feature`, {
    method: 'PATCH'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update job`);
  return res.json();
}

export async function deleteJob(jobId) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete job`);
  return res.json();
}

export async function createJob(jobData) {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}: Failed to submit job`);
  }
  return res.json();
}

export function getExportCsvUrl() {
  return `${API_BASE}/api/jobs/export/csv`;
}

export async function subscribeCandidate(candidateData) {
  const res = await fetch(`${API_BASE}/api/candidate/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}: Failed to submit candidate profile`);
  }
  return res.json();
}

export async function fetchCandidateStats() {
  const res = await fetch(`${API_BASE}/api/candidate/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load candidate stats`);
  return res.json();
}

export async function trackPageVisit() {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    await fetch(`${API_BASE}/api/track/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer || 'Direct',
        device: isMobile ? 'Mobile' : 'Desktop',
        page_url: window.location.pathname + window.location.search
      })
    });
  } catch (e) {}
}

export async function fetchTrafficAnalytics() {
  const res = await fetch(`${API_BASE}/api/dashboard/traffic`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch traffic analytics`);
  return res.json();
}

export async function fetchCandidates({ page = 1, limit = 50, q = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set('q', q);
  const res = await fetch(`${API_BASE}/api/candidates?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch candidates`);
  return res.json();
}

export async function deleteCandidate(candidateId) {
  const res = await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete candidate`);
  return res.json();
}


