import React, { useState, useEffect, useTransition, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import PostJobModal from './components/PostJobModal';
import AdminLoginModal from './components/AdminLoginModal';
import CandidateModal from './components/CandidateModal';
import LegalModal from './components/LegalModal';
import FilterBar from './components/FilterBar';
import EmptyState from './components/EmptyState';
import LoadMoreSection from './components/LoadMoreSection';
import SavedJobsBanner from './components/SavedJobsBanner';
import Footer from './components/Footer';
import { fetchJobs, trackPageVisit, getAdminKey, clearAdminKey } from './api';

// Code Splitting: Lazy load heavy admin dashboard to keep initial bundle lean
const BentoDashboard = lazy(() => import('./components/BentoDashboard'));

function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A241B] text-white flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl border-4 border-[#00DF81]/20 border-t-[#00DF81] animate-spin"></div>
      <p className="text-sm font-bold text-[#00DF81] tracking-wide">Loading Admin Intelligence Hub...</p>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('portal'); // 'portal' or 'admin'
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Core Jobs Data & State
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [workplaceMode, setWorkplaceMode] = useState('Remote'); // 'Remote', 'Hybrid', 'On-site', 'All'
  const [sort, setSort] = useState('latest');
  const [activeQuickPill, setActiveQuickPill] = useState(null);
  const [countryFilter, setCountryFilter] = useState('All');
  const [salaryFilter, setSalaryFilter] = useState('All');
  const [experienceLevel, setExperienceLevel] = useState('All');
  const [openToPakistan, setOpenToPakistan] = useState(false);
  const [visaSponsored, setVisaSponsored] = useState(false);
  const [hideExpired, setHideExpired] = useState(false);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);

  // Saved / Bookmarked Jobs
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem('globalhire_saved_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('globalhire_theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

  // Modals State
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [legalModalPage, setLegalModalPage] = useState(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('globalhire_theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('globalhire_theme', 'light'); } catch (e) {}
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Toggle Save / Bookmark
  const handleToggleSave = (jobId) => {
    setSavedJobIds((prev) => {
      const exists = prev.includes(jobId);
      const next = exists ? prev.filter(id => id !== jobId) : [...prev, jobId];
      try {
        localStorage.setItem('globalhire_saved_jobs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleApplyClick = (job) => {
    setApplyingJob(job);
    setCandidateModalOpen(true);
  };

  // URL Hash & Slug Route check on mount
  useEffect(() => {
    trackPageVisit();

    const isAuth = Boolean(getAdminKey());
    setIsAdmin(isAuth);

    const checkHashAndRoute = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#admin' || hash === '#saeed-admin' || path === '/admin') {
        if (getAdminKey()) {
          setView('admin');
        } else {
          setView('portal');
          setAdminModalOpen(true);
        }
      } else {
        setView('portal');
      }

      // Deep-linked job (/jobs/[slug] or ?job=123)
      if (path.startsWith('/jobs/')) {
        const parts = path.split('/').filter(Boolean);
        const slug = parts[parts.length - 1] || '';
        const idMatch = slug.match(/-(\d+)$/);
        if (idMatch) setSelectedJobId(Number(idMatch[1]));
      }

      // Deep-linked legal routes (/about, /privacy, /terms, /contact)
      const cleanPath = path.toLowerCase().replace(/\/$/, '');
      if (['/about', '/privacy', '/terms', '/contact'].includes(cleanPath)) {
        setLegalModalPage(cleanPath.replace('/', ''));
      }

      const params = new URLSearchParams(window.location.search);
      const jobParam = params.get('job');
      if (jobParam) setSelectedJobId(Number(jobParam));
    };

    checkHashAndRoute();
    window.addEventListener('hashchange', checkHashAndRoute);
    return () => window.removeEventListener('hashchange', checkHashAndRoute);
  }, []);

  // Search input debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load jobs from API
  const loadJobs = async (targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);

    try {
      const includeOnsiteParam = workplaceMode === 'All' || workplaceMode === 'On-site';
      const apiJobType = (workplaceMode !== 'All' && workplaceMode !== 'On-site') ? workplaceMode : '';

      const data = await fetchJobs({
        page: targetPage,
        limit: 15,
        q: debouncedQuery,
        category: category !== 'All' ? category : '',
        job_type: apiJobType,
        sort,
        include_onsite: includeOnsiteParam
      });

      const incomingJobs = data.jobs || [];

      if (append) {
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const uniqueNew = incomingJobs.filter(j => !existingIds.has(j.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setJobs(incomingJobs);
      }

      setPage(targetPage);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setFetchError(err.message || 'Unable to connect to the jobs server.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger reload on filter criteria changes
  useEffect(() => {
    loadJobs(1, false);
  }, [debouncedQuery, category, workplaceMode, sort]);

  // Load More Handler
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      loadJobs(page + 1, true);
    }
  };

  // Client-side Filter refinement
  const filteredJobs = jobs.filter((job) => {
    // 1. Saved only
    if (viewSavedOnly && !savedJobIds.includes(job.id)) return false;

    // 2. Workplace Mode Filter
    if (workplaceMode === 'Remote') {
      const jt = (job.job_type || '').toLowerCase();
      const loc = (job.location || '').toLowerCase();
      if (jt === 'on-site' || jt === 'onsite') return false;
      if (job.title && (job.title.includes('(m/w/d)') || job.title.includes('(w/m/d)') || job.title.includes('(m/w/x)'))) return false;
    } else if (workplaceMode === 'Hybrid') {
      const jt = (job.job_type || '').toLowerCase();
      const loc = (job.location || '').toLowerCase();
      if (!jt.includes('hybrid') && !loc.includes('hybrid')) return false;
    } else if (workplaceMode === 'On-site') {
      const jt = (job.job_type || '').toLowerCase();
      if (!jt.includes('on-site') && !jt.includes('onsite')) return false;
    }

    // 3. Open to Pakistan filter
    if (openToPakistan) {
      const loc = (job.location || '').toLowerCase();
      const cty = (job.country || '').toLowerCase();
      const tags = (job.tags || []).join(' ').toLowerCase();
      const matches = loc.includes('worldwide') || loc.includes('anywhere') || 
                      cty.includes('worldwide') || cty.includes('pakistan') || 
                      loc.includes('pakistan') || tags.includes('visa') || 
                      (job.job_type || '').toLowerCase().includes('remote');
      if (!matches) return false;
    }

    // 4. Country / Region Filter
    if (countryFilter !== 'All') {
      const loc = (job.location || '').toLowerCase();
      const cty = (job.country || '').toLowerCase();
      const cf = countryFilter.toLowerCase();
      
      if (cf === 'worldwide') {
        if (!loc.includes('worldwide') && !loc.includes('anywhere') && !cty.includes('worldwide')) return false;
      } else if (cf === 'pakistan') {
        if (!loc.includes('pakistan') && !loc.includes('worldwide') && !loc.includes('anywhere')) return false;
      } else if (cf === 'north america') {
        if (!loc.includes('united states') && !loc.includes('usa') && !loc.includes('canada') && !cty.includes('usa')) return false;
      } else if (cf === 'europe') {
        if (!loc.includes('europe') && !loc.includes('uk') && !loc.includes('united kingdom') && !loc.includes('germany') && !loc.includes('netherlands')) return false;
      } else if (cf === 'asia') {
        if (!loc.includes('asia') && !loc.includes('singapore') && !loc.includes('japan') && !loc.includes('india') && !loc.includes('pakistan')) return false;
      } else {
        if (!loc.includes(cf) && !cty.includes(cf)) return false;
      }
    }

    // 5. Experience Level Filter
    if (experienceLevel !== 'All') {
      const text = `${job.title} ${(job.tags || []).join(' ')} ${job.experience_level || ''}`.toLowerCase();
      if (experienceLevel === 'Entry') {
        if (!text.includes('entry') && !text.includes('junior') && !text.includes('intern') && !text.includes('associate') && !text.includes('graduate')) return false;
      } else if (experienceLevel === 'Mid') {
        if (text.includes('senior') || text.includes('lead') || text.includes('director') || text.includes('principal') || text.includes('staff')) return false;
      } else if (experienceLevel === 'Senior') {
        if (!text.includes('senior') && !text.includes('sr.') && !text.includes('sr ')) return false;
      } else if (experienceLevel === 'Lead') {
        if (!text.includes('lead') && !text.includes('principal') && !text.includes('staff') && !text.includes('director') && !text.includes('head') && !text.includes('manager')) return false;
      }
    }

    // 6. Visa Sponsorship
    if (visaSponsored) {
      const combined = `${job.title} ${job.location} ${(job.tags || []).join(' ')} ${job.excerpt}`.toLowerCase();
      if (!combined.includes('visa') && !combined.includes('relocation') && !combined.includes('sponsor')) {
        return false;
      }
    }

    // 7. Hide Expired (> 45 days)
    if (hideExpired && job.posted_at) {
      const diffDays = (new Date() - new Date(job.posted_at)) / (1000 * 86400);
      if (diffDays > 45) return false;
    }

    // 8. Salary Filter
    if (salaryFilter !== 'All') {
      const sal = (job.salary_range || '').toLowerCase();
      if (sal === 'competitive' || !sal) return false;
      const numMatch = sal.match(/\d+/);
      const val = numMatch ? parseInt(numMatch[0]) : 0;
      if (salaryFilter === '$200k+' && val < 200) return false;
      if (salaryFilter === '$150k+' && val < 150) return false;
      if (salaryFilter === '$100k+' && val < 100) return false;
      if (salaryFilter === '$50k+' && val < 50) return false;
    }

    return true;
  });

  // Handle Quick Filter Pill
  const handleQuickPill = (pill) => {
    if (activeQuickPill === pill.id) {
      setActiveQuickPill(null);
      setCategory('All');
      setWorkplaceMode('Remote');
      setSearchQuery('');
      setOpenToPakistan(false);
      setVisaSponsored(false);
    } else {
      setActiveQuickPill(pill.id);
      setVisaSponsored(pill.id === 'visa');
      if (pill.filter?.category) setCategory(pill.filter.category);
      if (pill.filter?.job_type) setWorkplaceMode(pill.filter.job_type);
      if (pill.filter?.q !== undefined) setSearchQuery(pill.filter.q);
    }
  };

  const handleResetAllFilters = () => {
    setCountryFilter('All');
    setSalaryFilter('All');
    setExperienceLevel('All');
    setOpenToPakistan(false);
    setVisaSponsored(false);
    setHideExpired(false);
    setWorkplaceMode('Remote');
    setCategory('All');
    setSearchQuery('');
    setActiveQuickPill(null);
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    setAdminModalOpen(false);
    setView('admin');
    window.location.hash = 'admin';
  };

  const handleAdminLogout = () => {
    clearAdminKey();
    setIsAdmin(false);
    setView('portal');
    window.location.hash = '';
  };

  // If viewing Admin Bento Dashboard (Code Splitted with Suspense)
  if (view === 'admin') {
    return (
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <BentoDashboard
          onBackToPortal={handleAdminLogout}
          onSelectJob={(j) => setSelectedJobId(j.id)}
        />
        {selectedJobId && (
          <JobDetailModal
            jobId={selectedJobId}
            onClose={() => setSelectedJobId(null)}
            onTagClick={handleTagClick}
            onSelectRelated={(id) => setSelectedJobId(id)}
            onApplyClick={handleApplyClick}
          />
        )}
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEEE9] dark:bg-[#06120E] text-[#17261F] dark:text-[#E2E8E4] flex flex-col font-sans transition-colors">
      
      {/* 100% User-Facing Clean Navbar with Dark Mode & Saved Jobs */}
      <Navbar
        onOpenPostModal={() => setPostModalOpen(true)}
        onOpenCandidateModal={() => setCandidateModalOpen(true)}
        totalJobs={total}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        savedCount={savedJobIds.length}
        onViewSaved={() => setViewSavedOnly(prev => !prev)}
      />

      {/* Hero Section with Live Search */}
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={category}
        setSelectedCategory={setCategory}
        onQuickPillClick={handleQuickPill}
        activeQuickPill={activeQuickPill}
        onOpenCandidateModal={() => setCandidateModalOpen(true)}
        totalJobs={total}
      />

      {/* Main Jobs Discovery Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">
        
        {/* Modular Filter Bar */}
        <FilterBar
          category={category}
          setCategory={setCategory}
          workplaceMode={workplaceMode}
          setWorkplaceMode={setWorkplaceMode}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          salaryFilter={salaryFilter}
          setSalaryFilter={setSalaryFilter}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          openToPakistan={openToPakistan}
          setOpenToPakistan={setOpenToPakistan}
          visaSponsored={visaSponsored}
          setVisaSponsored={setVisaSponsored}
          hideExpired={hideExpired}
          setHideExpired={setHideExpired}
          onResetAll={handleResetAllFilters}
        />

        {/* Saved Jobs View Banner */}
        {viewSavedOnly && (
          <SavedJobsBanner
            savedCount={savedJobIds.length}
            onCloseSavedView={() => setViewSavedOnly(false)}
          />
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#17261F] dark:text-white flex items-center gap-2">
              <span>{viewSavedOnly ? 'Saved Jobs' : 'Worldwide Remote Openings'}</span>
              <span className="text-xs font-normal text-[#6C7A72] dark:text-slate-400">
                ({filteredJobs.length} shown of {total})
              </span>
            </h2>
            <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-0.5">
              {workplaceMode === 'Remote' 
                ? 'Displaying 100% remote & work-from-anywhere roles' 
                : `Showing ${workplaceMode.toLowerCase()} positions`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6C7A72] dark:text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort listings"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-[#11231C] border border-black/[0.08] dark:border-white/10 text-[#17261F] dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none cursor-pointer"
            >
              <option value="latest">Newest First</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && jobs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.04] dark:border-white/5 p-6 animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-full mb-4"></div>
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-white/10 rounded-lg mb-2"></div>
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-white/10 rounded mb-2"></div>
                  <div className="h-3 w-4/5 bg-slate-200 dark:bg-white/10 rounded"></div>
                </div>
                <div className="h-8 w-full bg-slate-200 dark:bg-white/10 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 || fetchError ? (
          /* Empty or Error State */
          <EmptyState
            viewSavedOnly={viewSavedOnly}
            error={fetchError}
            onRetry={() => loadJobs(1, false)}
            onResetFilters={() => {
              if (viewSavedOnly) setViewSavedOnly(false);
              else handleResetAllFilters();
            }}
          />
        ) : (
          /* Framer Motion Animated Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                  layout
                >
                  <JobCard
                    job={job}
                    onSelect={(j) => setSelectedJobId(j.id)}
                    onTagClick={handleTagClick}
                    onApplyClick={handleApplyClick}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Modular Load More Section */}
        {!viewSavedOnly && !fetchError && (
          <LoadMoreSection
            page={page}
            totalPages={totalPages}
            total={total}
            currentCount={filteredJobs.length}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onOpenCandidateModal={() => setCandidateModalOpen(true)}
          />
        )}

      </main>

      {/* Modular Trust & Legal Footer */}
      <Footer onOpenLegalModal={(page) => setLegalModalPage(page)} />

      {/* Modals */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => {
            setSelectedJobId(null);
            if (window.location.pathname.startsWith('/jobs/')) {
              window.history.pushState({}, '', '/');
            }
          }}
          onTagClick={handleTagClick}
          onSelectRelated={(id) => setSelectedJobId(id)}
          onApplyClick={(job) => {
            setSelectedJobId(null);
            handleApplyClick(job);
          }}
        />
      )}

      <PostJobModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
      />

      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onLoginSuccess={handleAdminSuccess}
      />

      <CandidateModal
        isOpen={candidateModalOpen}
        onClose={() => {
          setCandidateModalOpen(false);
          setApplyingJob(null);
        }}
        targetJob={applyingJob}
      />

      <LegalModal
        isOpen={!!legalModalPage}
        onClose={() => setLegalModalPage(null)}
        page={legalModalPage || 'about'}
      />

    </div>
  );
}
