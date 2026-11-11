import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import BentoDashboard from './components/BentoDashboard';
import PostJobModal from './components/PostJobModal';
import AdminLoginModal from './components/AdminLoginModal';
import CandidateModal from './components/CandidateModal';
import AdSlot from './components/AdSlot';
import { fetchJobs, trackPageVisit } from './api';
import { 
  Sparkles, Filter, ChevronLeft, ChevronRight, Briefcase, 
  Layers, Globe, CheckCircle2, RefreshCw, Cpu, Lock
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState('portal'); // 'portal' or 'admin'
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [jobType, setJobType] = useState('All');
  const [sort, setSort] = useState('latest');
  const [activeQuickPill, setActiveQuickPill] = useState(null);

  // Modals
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);

  // Check URL hash & session on mount + track visitor
  useEffect(() => {
    trackPageVisit();

    const isAuth = sessionStorage.getItem('globalhire_admin_auth') === 'true';
    setIsAdmin(isAuth);

    const checkHash = () => {
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

      // Check URL search parameters for direct deep-linked job (?job=123)
      const params = new URLSearchParams(window.location.search);
      const jobParam = params.get('job');
      if (jobParam) {
        setSelectedJobId(Number(jobParam));
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Load jobs from API
  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await fetchJobs({
        page,
        limit: 12,
        q: searchQuery,
        category: category !== 'All' ? category : '',
        job_type: jobType !== 'All' ? jobType : '',
        sort
      });
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, category, jobType, sort, page]);

  // Handle Quick Filter Pill
  const handleQuickPill = (pill) => {
    if (activeQuickPill === pill.id) {
      setActiveQuickPill(null);
      setCategory('All');
      setJobType('All');
      setSearchQuery('');
    } else {
      setActiveQuickPill(pill.id);
      if (pill.filter.category) setCategory(pill.filter.category);
      if (pill.filter.job_type) setJobType(pill.filter.job_type);
      if (pill.filter.q !== undefined) setSearchQuery(pill.filter.q);
      setPage(1);
    }
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    setPage(1);
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

  const jobTypes = ['All', 'Remote', 'Hybrid', 'On-site'];

  return (
    <div className="min-h-screen bg-[#ECEEE9] text-[#17261F] flex flex-col font-sans">
      
      {/* 100% User-Facing Clean Navbar (No Dashboard button!) */}
      <Navbar
        onOpenPostModal={() => setPostModalOpen(true)}
        onOpenCandidateModal={() => setCandidateModalOpen(true)}
        totalJobs={total || 143}
        isAdmin={isAdmin}
        onGoToAdmin={() => setView('admin')}
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
      />

      {/* Header Banner Ad Slot */}
      <AdSlot type="leaderboard" />

      {/* Main Jobs Discovery Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">
        
        {/* Filters Bar in Clean White V22 Card */}
        <div className="p-4 rounded-3xl bg-white border border-black/[0.06] shadow-sm mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categoryChips.map((c) => {
              const isActive = category === c;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPage(1);
                  }}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-2xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0A241B] text-[#00DF81] font-bold shadow-sm'
                      : 'bg-[#F4F6F2] hover:bg-slate-200 text-[#57685E] hover:text-[#17261F]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Sub Filters: Job Type & Sort */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* Job Type Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F4F6F2] border border-black/[0.04] text-xs">
              {jobTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setJobType(t);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                    jobType === t
                      ? 'bg-white text-[#0A241B] font-bold shadow-sm'
                      : 'text-[#6C7A72] hover:text-[#17261F]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs text-[#6C7A72]">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white border border-black/[0.08] text-[#17261F] px-3.5 py-1.5 rounded-2xl focus:outline-none cursor-pointer shadow-sm font-semibold"
              >
                <option value="latest">Latest Aggregated</option>
                <option value="popular">Most Popular</option>
                <option value="featured">Featured First</option>
              </select>
            </div>

          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-[#17261F] flex items-center gap-2">
              <span>Verified Worldwide Openings</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734] border border-[#BCE8D3]">
                {total} Total
              </span>
            </h2>
            <p className="text-xs text-[#6C7A72] mt-0.5">Showing verified listings matching your criteria</p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#0A5734] font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Updating live feed...</span>
            </div>
          )}
        </div>

        {/* Bento Job Cards Grid */}
        {loading && jobs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-3xl bg-white border border-black/[0.05] animate-pulse p-6"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-black/[0.06] p-8 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#17261F]">No jobs found matching your criteria</h3>
            <p className="text-xs text-[#6C7A72] max-w-sm mx-auto mt-1 mb-6">
              Try broadening your keyword or clearing active category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategory('All');
                setJobType('All');
                setActiveQuickPill(null);
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#0A241B] text-[#00DF81] transition-all shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => {
              const showAd = index > 0 && index % 5 === 0;
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
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-[#17261F] shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-[#6C7A72] px-4 font-semibold">
              Page <span className="text-[#0A241B] font-bold">{page}</span> of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-[#17261F] shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Public Footer */}
      <footer className="mt-20 border-t border-black/[0.06] bg-[#E5E8E2] py-12 text-center text-xs text-[#6C7A72]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-xl bg-[#0A241B] flex items-center justify-center text-[#00DF81] font-black text-xs">
              G
            </div>
            <span className="font-bold text-[#17261F] text-sm">GlobalHire AI</span>
          </div>

          <p className="max-w-md mx-auto text-[#6C7A72] text-[11px] leading-relaxed">
            The autonomous worldwide tech job radar. 100% verified listings aggregated from Remotive, Arbeitnow, Jobicy, and Himalayas.
          </p>

          <div className="flex items-center justify-center gap-4 text-[#57685E] text-[11px] font-semibold">
            <button onClick={() => setPostModalOpen(true)} className="hover:text-[#0A241B] underline">
              Post an Opportunity
            </button>
            <span>•</span>
            <a href="http://150.136.214.192/api/rss" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A241B] underline">
              RSS Feed
            </a>
            <span>•</span>
            <a href="http://150.136.214.192/api/sitemap" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A241B] underline">
              Sitemap
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onTagClick={handleTagClick}
          onSelectRelated={(id) => setSelectedJobId(id)}
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
        onClose={() => setCandidateModalOpen(false)}
      />

    </div>
  );
}
