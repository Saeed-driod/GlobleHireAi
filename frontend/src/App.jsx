import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import BentoDashboard from './components/BentoDashboard';
import PostJobModal from './components/PostJobModal';
import AdminLoginModal from './components/AdminLoginModal';
import CandidateModal from './components/CandidateModal';
import LegalModal from './components/LegalModal';
import AdSlot from './components/AdSlot';
import { fetchJobs, trackPageVisit } from './api';
import { 
  Sparkles, Filter, Briefcase, Globe, CheckCircle2, 
  RefreshCw, Lock, DollarSign, Compass, Bookmark, 
  ShieldCheck, Mail, FileText, Loader2, ArrowRight,
  SlidersHorizontal, Building2, MapPin, Award, Check
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState('portal'); // 'portal' or 'admin'
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Core Jobs Data
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters (Step 4)
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [workplaceMode, setWorkplaceMode] = useState('Remote'); // 'Remote', 'Hybrid', 'On-site', 'All'
  const [sort, setSort] = useState('latest');
  const [activeQuickPill, setActiveQuickPill] = useState(null);
  const [countryFilter, setCountryFilter] = useState('All');
  const [salaryFilter, setSalaryFilter] = useState('All');
  const [experienceLevel, setExperienceLevel] = useState('All'); // 'All', 'Entry', 'Mid', 'Senior', 'Lead'
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

  // Modals
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

    const isAuth = sessionStorage.getItem('globalhire_admin_auth') === 'true';
    setIsAdmin(isAuth);

    const checkHashAndRoute = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (hash === '#admin' || hash === '#saeed-admin' || path === '/admin') {
        if (sessionStorage.getItem('globalhire_admin_auth') === 'true') {
          setView('admin');
        } else {
          setAdminModalOpen(true);
        }
      } else {
        setView('portal');
      }

      // Check deep-linked job: /jobs/[slug]
      if (path.startsWith('/jobs/')) {
        const parts = path.split('/').filter(Boolean);
        const slug = parts[parts.length - 1] || '';
        const idMatch = slug.match(/-(\d+)$/);
        if (idMatch) {
          setSelectedJobId(Number(idMatch[1]));
        }
      }

      // Check query param (?job=123)
      const params = new URLSearchParams(window.location.search);
      const jobParam = params.get('job');
      if (jobParam) {
        setSelectedJobId(Number(jobParam));
      }
    };

    checkHashAndRoute();
    window.addEventListener('hashchange', checkHashAndRoute);
    return () => window.removeEventListener('hashchange', checkHashAndRoute);
  }, []);

  // Sync real job count in document title / meta description
  useEffect(() => {
    if (total > 0) {
      const desc = `Find remote jobs you can do from anywhere. Explore ${total} active worldwide remote jobs across tech, design, marketing, and support. Curated from trusted job boards with transparent salaries.`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', desc);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', desc);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', desc);
    }
  }, [total]);

  // Load jobs from API (supports initial fetch and incremental "Load More")
  const loadJobs = async (targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const includeOnsiteParam = workplaceMode === 'All' || workplaceMode === 'On-site';
      const apiJobType = (workplaceMode !== 'All' && workplaceMode !== 'On-site') ? workplaceMode : '';

      const data = await fetchJobs({
        page: targetPage,
        limit: 15,
        q: searchQuery,
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
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced initial reload on filter criteria changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, category, workplaceMode, sort]);

  // Trigger "Load more"
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
      if (pill.id === 'visa') {
        setVisaSponsored(true);
      } else {
        setVisaSponsored(false);
      }
      if (pill.filter?.category) setCategory(pill.filter.category);
      if (pill.filter?.job_type) setWorkplaceMode(pill.filter.job_type);
      if (pill.filter?.q !== undefined) setSearchQuery(pill.filter.q);
    }
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
    sessionStorage.removeItem('globalhire_admin_auth');
    setIsAdmin(false);
    setView('portal');
    window.location.hash = '';
  };

  // If viewing Admin Bento Dashboard
  if (view === 'admin') {
    return (
      <>
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
      </>
    );
  }

  const categoryChips = [
    'All',
    'Software Dev',
    'AI / Data',
    'Design',
    'Marketing',
    'Management',
    'Customer Support',
    'DevOps / Cloud'
  ];

  const workplaceOptions = [
    { id: 'Remote', label: '🌍 Remote' },
    { id: 'Hybrid', label: '🏢 Hybrid' },
    { id: 'On-site', label: '📍 On-site' },
    { id: 'All', label: '🌐 All Modes' },
  ];

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
        onViewSaved={() => {
          setViewSavedOnly(prev => !prev);
        }}
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

      {/* Header Banner Ad Slot (Non-intrusive Native Banner) */}
      <AdSlot type="leaderboard" />

      {/* Main Jobs Discovery Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">
        
        {/* Step 4: Comprehensive Mobile-Friendly Filters Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] shadow-sm mb-8 space-y-4">
          
          {/* Top Row: Workplace Mode Segment + Category Chips */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Workplace Segmented Control (Remote / Hybrid / On-site / All) */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5 shrink-0">
              {workplaceOptions.map((opt) => {
                const isSelected = workplaceMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setWorkplaceMode(opt.id)}
                    aria-label={`Filter by ${opt.label} jobs`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#0A241B] text-[#0A5734] dark:text-[#00DF81] shadow-sm'
                        : 'text-[#6C7A72] dark:text-slate-400 hover:text-[#17261F] dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Category Chips with Horizontal Scrolling on Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {categoryChips.map((c) => {
                const isActive = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-2xl transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold shadow-sm'
                        : 'bg-[#F4F6F2] dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[#57685E] dark:text-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Bottom Filter Controls: Country, Salary, Experience, Pakistan, Visa, Expired */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/5 text-xs">
            
            {/* Open to Pakistan Filter Toggle */}
            <button
              onClick={() => setOpenToPakistan(prev => !prev)}
              aria-label="Filter jobs open to candidates in Pakistan"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold transition-all ${
                openToPakistan
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span>🇵🇰 Open to Pakistan</span>
              {openToPakistan && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Visa Sponsorship Filter */}
            <button
              onClick={() => setVisaSponsored(prev => !prev)}
              aria-label="Filter visa sponsored and relocation jobs"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold transition-all ${
                visaSponsored
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Visa Sponsorship</span>
              {visaSponsored && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Country / Region Dropdown */}
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                aria-label="Filter by candidate country or region"
                className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="Worldwide">🌍 Worldwide Only</option>
                <option value="Pakistan">🇵🇰 Pakistan Friendly</option>
                <option value="North America">🇺🇸 North America (US/CA)</option>
                <option value="Europe">🇪🇺 Europe & UK</option>
                <option value="Asia">🌏 Asia & Pacific</option>
              </select>
            </div>

            {/* Salary Range Dropdown */}
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              aria-label="Filter by minimum salary range"
              className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
            >
              <option value="All">All Salaries</option>
              <option value="$50k+">$50,000+ / yr</option>
              <option value="$100k+">$100,000+ / yr</option>
              <option value="$150k+">$150,000+ / yr</option>
              <option value="$200k+">$200,000+ / yr</option>
            </select>

            {/* Experience Level Dropdown */}
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              aria-label="Filter by candidate experience level"
              className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus:outline-none cursor-pointer"
            >
              <option value="All">All Experience Levels</option>
              <option value="Entry">Entry / Junior Level</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead / Staff / Director</option>
            </select>

            {/* Hide Expired Toggle */}
            <button
              onClick={() => setHideExpired(prev => !prev)}
              aria-label="Toggle hiding expired job listings"
              className={`px-3 py-1.5 rounded-2xl font-semibold transition-all ${
                hideExpired
                  ? 'bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold'
                  : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Hide Expired (&gt;45d)
            </button>

            {/* Clear All Filters button if any active */}
            {(countryFilter !== 'All' || salaryFilter !== 'All' || experienceLevel !== 'All' || openToPakistan || visaSponsored || hideExpired || workplaceMode !== 'Remote') && (
              <button
                onClick={() => {
                  setCountryFilter('All');
                  setSalaryFilter('All');
                  setExperienceLevel('All');
                  setOpenToPakistan(false);
                  setVisaSponsored(false);
                  setHideExpired(false);
                  setWorkplaceMode('Remote');
                  setCategory('All');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline px-2 py-1 ml-auto"
              >
                Clear Filters
              </button>
            )}

          </div>
        </div>

        {/* Saved Jobs View Banner */}
        {viewSavedOnly && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E3F9ED] dark:bg-[#00DF81]/15 border border-[#BCE8D3] dark:border-[#00DF81]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#0A5734] dark:text-[#00DF81] fill-current" />
              <span className="text-sm font-bold text-[#0A5734] dark:text-[#00DF81]">
                Saved Bookmarks View ({savedJobIds.length})
              </span>
            </div>
            <button
              onClick={() => {
                setViewSavedOnly(false);
              }}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/10 text-[#17261F] dark:text-white border border-black/[0.08] dark:border-white/10 hover:bg-slate-50 transition-all shadow-sm"
            >
              ← View All Remote Jobs
            </button>
          </div>
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
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-[#11231C] border border-black/[0.08] dark:border-white/10 text-[#17261F] dark:text-slate-200 focus:outline-none cursor-pointer"
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
        ) : filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] p-8 shadow-sm">
            {viewSavedOnly ? (
              <Bookmark className="w-12 h-12 text-[#00DF81] mx-auto mb-4" />
            ) : (
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-bold text-[#17261F] dark:text-white">
              {viewSavedOnly ? 'No saved jobs yet' : 'No jobs found matching your criteria'}
            </h3>
            <p className="text-xs text-[#6C7A72] dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {viewSavedOnly 
                ? 'Click the bookmark icon on any job card to save listings here for easy access.'
                : 'Try broadening your keyword, clearing active filters, or toggling workplace mode.'}
            </p>
            <button
              onClick={() => {
                if (viewSavedOnly) {
                  setViewSavedOnly(false);
                } else {
                  setSearchQuery('');
                  setCategory('All');
                  setWorkplaceMode('Remote');
                  setCountryFilter('All');
                  setSalaryFilter('All');
                  setExperienceLevel('All');
                  setOpenToPakistan(false);
                  setVisaSponsored(false);
                  setActiveQuickPill(null);
                }
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] transition-all shadow-md hover:scale-105"
            >
              {viewSavedOnly ? '← Browse Remote Jobs' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => {
              const showAd = (index + 1) % 5 === 0;
              return (
                <React.Fragment key={job.id}>
                  {showAd && (
                    <div className="md:col-span-2 lg:col-span-3 my-2">
                      <AdSlot type="in-feed" />
                    </div>
                  )}
                  <JobCard
                    job={job}
                    onSelect={(j) => setSelectedJobId(j.id)}
                    onTagClick={handleTagClick}
                    onApplyClick={handleApplyClick}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Step 4: "Load More" Button (Replacing the 15-page pagination) */}
        {!viewSavedOnly && (
          <div className="mt-12 text-center">
            {page < totalPages ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  aria-label="Load more remote jobs"
                  className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] hover:bg-[#12382B] dark:hover:bg-[#2EF8A0] transition-all shadow-[0_4px_16px_rgba(10,36,27,0.15)] flex items-center gap-2 group active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#00DF81] dark:text-[#0A241B]" />
                      <span>Loading fresh listings...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Remote Jobs</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[#6C7A72] dark:text-slate-400 font-mono">
                  Showing {filteredJobs.length} of {total} total listings
                </p>
              </div>
            ) : filteredJobs.length > 0 ? (
              /* All jobs loaded state */
              <div className="p-6 rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] max-w-lg mx-auto shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-[#E3F9ED] dark:bg-[#00DF81]/20 text-[#0A5734] dark:text-[#00DF81] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#17261F] dark:text-white">
                  You have viewed all {total} remote jobs!
                </h4>
                <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-1 mb-4">
                  Do not see your exact role? Drop your CV profile and our automated radar will alert you as soon as new jobs open.
                </p>
                <button
                  onClick={() => setCandidateModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#00DF81] text-[#0A241B] hover:bg-[#2EF8A0] transition-all shadow-sm"
                >
                  Drop Your CV for Alerts →
                </button>
              </div>
            ) : null}
          </div>
        )}

      </main>

      {/* Trust & Legal Footer */}
      <footer className="mt-20 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#E5E8E2] dark:bg-[#071510] py-12 text-center text-xs text-[#6C7A72] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-xl bg-[#0A241B] dark:bg-[#00DF81] flex items-center justify-center text-[#00DF81] dark:text-[#0A241B] font-black text-xs">
              G
            </div>
            <span className="font-bold text-[#17261F] dark:text-white text-sm">GlobalHire AI</span>
          </div>

          <p className="max-w-md mx-auto text-[#6C7A72] dark:text-slate-400 text-[11px] leading-relaxed">
            Curated from trusted job boards. Remote listings aggregated from Remotive, Arbeitnow, Jobicy, and Himalayas.
          </p>

          {/* Legal and Trust Pages Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[#57685E] dark:text-slate-300 text-[11px] font-semibold">
            <button onClick={() => setLegalModalPage('about')} className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline">
              About Us
            </button>
            <span>•</span>
            <button onClick={() => setLegalModalPage('contact')} className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline">
              Contact & Support
            </button>
            <span>•</span>
            <button onClick={() => setLegalModalPage('privacy')} className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setLegalModalPage('terms')} className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline">
              Terms of Service
            </button>
            <span>•</span>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline">
              Sitemap
            </a>
          </div>

          <p className="text-[10px] text-[#8C9B92] pt-2">
            © 2026 GlobalHire AI. All rights reserved.
          </p>
        </div>
      </footer>

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
