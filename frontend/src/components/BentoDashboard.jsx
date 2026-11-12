import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Globe, Eye, RefreshCw, Smartphone, Laptop, 
  Share2, Search, Trash2, Mail, Phone, GraduationCap, Briefcase, 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, 
  LogOut, ExternalLink, Filter, Calendar, TrendingUp, Layers, ChevronRight
} from 'lucide-react';
import { 
  fetchTrafficAnalytics, 
  fetchCandidates, 
  deleteCandidate, 
  fetchDashboardStats, 
  triggerWorkerSync, 
  fetchJobs, 
  toggleJobFeatured, 
  deleteJob 
} from '../api';

function getCountryFlag(country = '', code = '') {
  const c = (country || '').toLowerCase();
  const cd = (code || '').toUpperCase();
  if (cd === 'PK' || c.includes('pakistan')) return '🇵🇰';
  if (cd === 'US' || c.includes('united states') || c.includes('usa')) return '🇺🇸';
  if (cd === 'SE' || c.includes('sweden')) return '🇸🇪';
  if (cd === 'IE' || c.includes('ireland')) return '🇮🇪';
  if (cd === 'CA' || c.includes('canada')) return '🇨🇦';
  if (cd === 'GB' || c.includes('united kingdom') || c.includes('uk') || c.includes('britain')) return '🇬🇧';
  if (cd === 'DE' || c.includes('germany') || c.includes('deutschland')) return '🇩🇪';
  if (cd === 'FR' || c.includes('france')) return '🇫🇷';
  if (cd === 'IN' || c.includes('india')) return '🇮🇳';
  if (cd === 'AE' || c.includes('emirates') || c.includes('uae') || c.includes('dubai')) return '🇦🇪';
  if (cd === 'SA' || c.includes('saudi')) return '🇸🇦';
  if (cd === 'AU' || c.includes('australia')) return '🇦🇺';
  if (cd === 'BR' || c.includes('brazil')) return '🇧🇷';
  if (cd === 'BD' || c.includes('bangladesh')) return '🇧🇩';
  if (cd === 'NL' || c.includes('netherlands')) return '🇳🇱';
  if (cd === 'IT' || c.includes('italy')) return '🇮🇹';
  if (cd === 'ES' || c.includes('spain')) return '🇪🇸';
  return '🌍';
}

function formatVisitorTime(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const diffSecs = (Date.now() - new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z')).getTime()) / 1000;
    if (diffSecs < 60) return 'Just now';
    const mins = Math.floor(diffSecs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diffSecs / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Recently';
  }
}

export default function BentoDashboard({ onBackToPortal }) {
  const [activeTab, setActiveTab] = useState('traffic'); // 'traffic' | 'candidates' | 'jobs'
  
  // Traffic Analytics State
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(true);

  // Candidates State
  const [candidates, setCandidates] = useState([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Jobs & System State
  const [jobs, setJobs] = useState([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobSearch, setJobSearch] = useState('');
  const [jobsLoading, setJobsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [stats, setStats] = useState(null);

  // Auto-refresh interval
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadTraffic();
      loadCandidates();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = () => {
    loadTraffic();
    loadCandidates();
    loadJobs();
    loadSystemStats();
  };

  const loadTraffic = async () => {
    setTrafficLoading(true);
    try {
      const res = await fetchTrafficAnalytics();
      setTraffic(res);
    } catch (err) {
      console.error('Failed to load traffic:', err);
    } finally {
      setTrafficLoading(false);
    }
  };

  const loadCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await fetchCandidates({ page: 1, limit: 100, q: candidateSearch });
      setCandidates(res.candidates || []);
      setCandidateTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates();
    }, 300);
    return () => clearTimeout(timer);
  }, [candidateSearch]);

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetchJobs({ page: 1, limit: 25, q: jobSearch });
      setJobs(res.jobs || []);
      setJobTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [jobSearch]);

  const loadSystemStats = async () => {
    try {
      const res = await fetchDashboardStats();
      setStats(res);
    } catch (err) {}
  };

  const handleSyncWorker = async () => {
    setSyncing(true);
    setSyncMsg('Triggering worker sync on Oracle VM...');
    try {
      const res = await triggerWorkerSync();
      setSyncMsg(res.message || 'Worker sync launched successfully!');
      setTimeout(() => {
        loadJobs();
        loadSystemStats();
        setSyncing(false);
        setSyncMsg('');
      }, 4000);
    } catch (err) {
      setSyncMsg('Sync trigger error: ' + err.message);
      setSyncing(false);
    }
  };

  const handleDeleteCandidate = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await deleteCandidate(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
      setCandidateTotal(prev => Math.max(0, prev - 1));
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggleFeatured = async (jobId) => {
    try {
      const res = await toggleJobFeatured(jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, featured: res.featured } : j));
    } catch (err) {
      alert('Failed to update job');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setJobTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  // Helper calculation for Traffic percentages
  const totalViews = traffic?.total_pageviews || 0;
  const topReferrers = traffic?.top_referrers || [];
  const topCountries = traffic?.top_countries || [];
  const devices = traffic?.devices || [];
  const recentVisitors = traffic?.recent_visitors || [];
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = topCountries.filter(c => 
    !countrySearch || (c.country || '').toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#ECEEE9] text-[#17261F] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A241B] text-white border-b border-black/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00DF81] text-[#0A241B] flex items-center justify-center font-black text-xl shadow-md">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">GlobalHire AI</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00DF81]/20 text-[#00DF81] border border-[#00DF81]/30">
                  ADMIN COMMAND CENTER
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-mono hidden sm:block">
                Server: Oracle VM (150.136.214.192) • Status: 24/7 Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              title="Refresh Analytics"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${trafficLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={onBackToPortal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 pt-1 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('traffic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'traffic'
                ? 'bg-[#00DF81] text-[#0A241B] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Traffic & Origin Analytics</span>
            {traffic && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'traffic' ? 'bg-[#0A241B] text-[#00DF81]' : 'bg-white/20 text-white'
              }`}>
                {traffic.views_today || 0} today
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'candidates'
                ? 'bg-[#00DF81] text-[#0A241B] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Form Submissions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'candidates' ? 'bg-[#0A241B] text-[#00DF81]' : 'bg-white/20 text-white'
            }`}>
              {candidateTotal} Leads
            </span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'jobs'
                ? 'bg-[#00DF81] text-[#0A241B] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Radar & Auto-Pilot</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'jobs' ? 'bg-[#0A241B] text-[#00DF81]' : 'bg-white/20 text-white'
            }`}>
              {jobTotal} Jobs
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ============================================================== */}
        {/* TAB 1: TRAFFIC & ORIGIN ANALYTICS                              */}
        {/* ============================================================== */}
        {activeTab === 'traffic' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#6C7A72] text-xs font-bold mb-2">
                  <span>TOTAL PAGEVIEWS</span>
                  <Eye className="w-4 h-4 text-[#00DF81]" />
                </div>
                <div className="text-3xl font-black text-[#17261F] font-mono">
                  {traffic?.total_pageviews ?? '...'}
                </div>
                <p className="text-[11px] text-[#6C7A72] mt-1">All-time tracked visitors</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#6C7A72] text-xs font-bold mb-2">
                  <span>VIEWS TODAY</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-emerald-700 font-mono">
                  {traffic?.views_today ?? '...'}
                </div>
                <p className="text-[11px] text-[#6C7A72] mt-1">Past 24 hours traffic</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#6C7A72] text-xs font-bold mb-2">
                  <span>UNIQUE VISITORS</span>
                  <Globe className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-[#17261F] font-mono">
                  {traffic?.unique_visitors ?? '...'}
                </div>
                <p className="text-[11px] text-[#6C7A72] mt-1">Unique IP addresses</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center justify-between text-[#6C7A72] text-xs font-bold mb-2">
                  <span>CANDIDATE LEADS</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-3xl font-black text-purple-700 font-mono">
                  {candidateTotal}
                </div>
                <p className="text-[11px] text-[#6C7A72] mt-1">CVs & Alert subscribers</p>
              </div>
            </div>

            {/* Traffic Origin Breakdown (Where traffic comes from) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Traffic Sources (Facebook, Google, Direct, WhatsApp) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#17261F] flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#00DF81]" />
                      Traffic Origins & Acquisition Channels
                    </h3>
                    <p className="text-xs text-[#6C7A72] mt-0.5">
                      Where visitors found GlobalHire AI (Facebook auto-posts, search, WhatsApp shares)
                    </p>
                  </div>
                </div>

                {topReferrers.length === 0 ? (
                  <div className="py-12 text-center text-[#6C7A72] text-xs">
                    No referral data logged yet. Traffic is recorded automatically on visitor arrival.
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    {topReferrers.map((item, idx) => {
                      const pct = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                      const isFB = item.referrer.toLowerCase().includes('facebook');
                      const isGoogle = item.referrer.toLowerCase().includes('google');
                      const isWA = item.referrer.toLowerCase().includes('whatsapp');
                      
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#17261F] flex items-center gap-2">
                              {isFB && <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>}
                              {isGoogle && <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>}
                              {isWA && <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>}
                              {!isFB && !isGoogle && !isWA && <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>}
                              {item.referrer}
                            </span>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-xs font-bold text-[#0A241B]">{item.count} clicks</span>
                              <span className="text-[11px] text-[#6C7A72] w-12 text-right">{pct}%</span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-2.5 rounded-full bg-[#ECEEE9] overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFB ? 'bg-blue-600' : isGoogle ? 'bg-red-500' : isWA ? 'bg-green-500' : 'bg-[#0A241B]'
                              }`}
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Device Split (Mobile vs Desktop) */}
              <div className="bg-white p-6 rounded-3xl border border-black/[0.08] shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#17261F] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Visitor Devices
                  </h3>
                  <p className="text-xs text-[#6C7A72] mt-0.5">Mobile vs Desktop usage</p>

                  <div className="mt-8 space-y-5">
                    {devices.map((d, idx) => {
                      const pct = totalViews > 0 ? Math.round((d.count / totalViews) * 100) : 0;
                      const isMob = d.device.toLowerCase().includes('mobile');
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-[#F4F6F2] border border-black/[0.04]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold flex items-center gap-2">
                              {isMob ? <Smartphone className="w-4 h-4 text-emerald-600" /> : <Laptop className="w-4 h-4 text-blue-600" />}
                              {d.device}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#0A241B]">
                              {d.count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isMob ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {devices.length === 0 && (
                      <p className="text-xs text-[#6C7A72] py-4 text-center">No device stats logged yet</p>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#E3F9ED] text-[#0A5734] border border-[#BCE8D3] text-xs font-semibold mt-4">
                  💡 Tip: Over 70% of candidate visitors apply from mobile via Facebook links.
                </div>
              </div>
            </div>

            {/* Complete Geographic Country Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-black/[0.08] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#17261F] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#00DF81]" />
                    All Countries Traffic Intelligence (ممالک کی ٹریفک)
                  </h3>
                  <p className="text-xs text-[#6C7A72] mt-0.5">
                    Track exactly which countries all candidate traffic is arriving from
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#8C9B92] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F6F2] border border-black/[0.06] text-xs font-semibold text-[#17261F] placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81] w-44"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0A5734] px-2.5 py-1.5 rounded-xl bg-[#E3F9ED] border border-[#BCE8D3]">
                    {topCountries.length} Countries
                  </span>
                </div>
              </div>

              {filteredCountries.length === 0 ? (
                <div className="py-8 text-center text-[#6C7A72] text-xs">
                  {countrySearch ? `No traffic found matching "${countrySearch}"` : 'Geographic data gathering in progress...'}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Country Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {filteredCountries.map((c, idx) => {
                      const pct = totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0;
                      const flag = getCountryFlag(c.country, c.country_code);
                      return (
                        <div 
                          key={idx} 
                          className="p-4 rounded-2xl bg-[#F4F6F2] border border-black/[0.05] hover:border-[#00DF81]/50 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform">{flag}</span>
                            <span className="font-mono text-base font-black text-[#0A241B]">
                              {c.count.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#17261F] block truncate" title={c.country}>
                              {c.country}
                            </span>
                            <span className="text-[11px] text-[#6C7A72] font-mono">
                              {pct}% of visitors
                            </span>
                          </div>
                          {/* Mini Progress */}
                          <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2.5 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#00DF81]"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Live Visitor Feed (Recent Visitors Stream) */}
            <div className="bg-white p-6 rounded-3xl border border-black/[0.08] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#17261F] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                    Real-Time Visitor Stream (کون کون وزٹ کر رہا ہے)
                  </h3>
                  <p className="text-xs text-[#6C7A72] mt-0.5">
                    Live log of incoming candidate visits with origin country, referrer, and device
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Live Telemetry
                  </span>
                </div>
              </div>

              {recentVisitors.length === 0 ? (
                <div className="py-8 text-center text-[#6C7A72] text-xs">
                  Listening for incoming visitor traffic...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/[0.06] text-[11px] font-bold text-[#6C7A72] uppercase tracking-wider">
                        <th className="py-3 px-3">Country & Location</th>
                        <th className="py-3 px-3">Acquisition Source</th>
                        <th className="py-3 px-3">Device</th>
                        <th className="py-3 px-3">Page / URL</th>
                        <th className="py-3 px-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] text-xs">
                      {recentVisitors.slice(0, 25).map((v, idx) => {
                        const flag = getCountryFlag(v.country, v.country_code);
                        const isFB = (v.referrer || '').toLowerCase().includes('facebook');
                        const isGoogle = (v.referrer || '').toLowerCase().includes('google');
                        const isWA = (v.referrer || '').toLowerCase().includes('whatsapp');
                        const isMob = (v.device || '').toLowerCase().includes('mobile');

                        return (
                          <tr key={idx} className="hover:bg-[#F4F6F2]/60 transition-colors">
                            <td className="py-3 px-3 font-medium text-[#17261F]">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{flag}</span>
                                <div>
                                  <span className="font-bold text-[#17261F] block">{v.country || 'Worldwide'}</span>
                                  {v.city && <span className="text-[10px] text-[#6C7A72] font-mono">{v.city}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isFB ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                isGoogle ? 'bg-red-100 text-red-800 border border-red-200' :
                                isWA ? 'bg-green-100 text-green-800 border border-green-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                <Share2 className="w-2.5 h-2.5" />
                                {v.referrer || 'Direct'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#3D4D43] font-medium">
                                {isMob ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <Laptop className="w-3.5 h-3.5 text-blue-600" />}
                                {v.device || 'Desktop'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#6C7A72] max-w-[200px] truncate" title={v.page_url}>
                              {v.page_url || '/'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[11px] text-[#6C7A72]">
                              {formatVisitorTime(v.visited_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CANDIDATE CV SUBMISSIONS (کون کون فارم فل کر رہا ہے)     */}
        {/* ============================================================== */}
        {activeTab === 'candidates' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Search and Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-[#8C9B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, degree, or skill (e.g. BSCS, Python)..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.06] text-xs font-semibold text-[#17261F] placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81]"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-mono font-bold text-[#0A5734] px-3 py-1.5 rounded-2xl bg-[#E3F9ED] border border-[#BCE8D3]">
                  {candidateTotal} Registered Candidates
                </span>
                <button
                  onClick={loadCandidates}
                  className="p-2.5 rounded-2xl bg-[#F4F6F2] hover:bg-slate-200 text-[#17261F] transition-all"
                  title="Reload Candidates"
                >
                  <RefreshCw className={`w-4 h-4 ${candidatesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Candidates Table / List */}
            <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.06] bg-[#F9FAF8] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#17261F] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#00DF81]" />
                  Submitted Candidate CV Profiles
                </h3>
                <span className="text-xs text-[#6C7A72]">
                  Automated job alerts dispatched on every matching vacancy
                </span>
              </div>

              {candidates.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-[#17261F]">No Candidate Submissions Found</h4>
                  <p className="text-xs text-[#6C7A72] max-w-sm mx-auto mt-1">
                    {candidateSearch 
                      ? 'No candidate matches the search query. Try clearing filters.' 
                      : 'Visitors who drop their CV using the website "Drop CV" button will appear here instantly.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.05] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F4F6F2] text-[#57685E] font-bold">
                        <th className="py-3 px-6">Candidate</th>
                        <th className="py-3 px-4">Education / Degree</th>
                        <th className="py-3 px-4">Category & Skills</th>
                        <th className="py-3 px-4">Preference</th>
                        <th className="py-3 px-4">Date Registered</th>
                        <th className="py-3 px-4">Alerts Sent</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {candidates.map((cand) => (
                        <tr 
                          key={cand.id} 
                          className="hover:bg-[#F9FAF8] transition-colors cursor-pointer"
                          onClick={() => setSelectedCandidate(cand)}
                        >
                          {/* Name & Contact */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-[#17261F] text-sm">{cand.full_name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={`mailto:${cand.email}`} 
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono"
                              >
                                <Mail className="w-3 h-3" />
                                {cand.email}
                              </a>
                              {cand.phone && (
                                <a 
                                  href={`https://wa.me/${cand.phone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5 font-mono"
                                >
                                  <Phone className="w-3 h-3" />
                                  WA
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Education */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-[#17261F] block">{cand.education || 'Not specified'}</span>
                            <span className="text-[10px] text-[#6C7A72]">{cand.experience_level || 'Any level'}</span>
                          </td>

                          {/* Skills */}
                          <td className="py-4 px-4 max-w-xs">
                            <div className="text-[11px] font-bold text-[#0A5734] mb-1">{cand.category}</div>
                            <div className="flex flex-wrap gap-1">
                              {(cand.skills || []).slice(0, 4).map((skill, sIdx) => (
                                <span key={sIdx} className="px-2 py-0.5 rounded-md bg-[#ECEEE9] text-[#2C3E34] text-[10px] font-mono">
                                  {skill}
                                </span>
                              ))}
                              {(cand.skills || []).length > 4 && (
                                <span className="text-[10px] text-[#6C7A72]">+{cand.skills.length - 4} more</span>
                              )}
                            </div>
                          </td>

                          {/* Preference */}
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {cand.preferred_job_type || 'Remote'}
                            </span>
                          </td>

                          {/* Registered At */}
                          <td className="py-4 px-4 text-[#6C7A72] font-mono text-[11px]">
                            {cand.created_at ? cand.created_at.substring(0, 16) : 'Recently'}
                          </td>

                          {/* Alerts count */}
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734] text-[11px] font-mono font-bold">
                              {cand.alerts_count || 0} sent
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => handleDeleteCandidate(cand.id, e)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete Candidate Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Candidate Details Modal (If clicked) */}
            {selectedCandidate && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={() => setSelectedCandidate(null)}
              >
                <div 
                  className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-black/[0.08] shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <div>
                      <h3 className="text-lg font-black text-[#17261F]">{selectedCandidate.full_name}</h3>
                      <p className="text-xs text-[#6C7A72]">Candidate CV Submission Details</p>
                    </div>
                    <button 
                      onClick={() => setSelectedCandidate(null)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[#6C7A72] block font-semibold mb-0.5">Contact Information</span>
                      <p className="font-bold text-[#17261F]">{selectedCandidate.email}</p>
                      {selectedCandidate.phone && (
                        <p className="text-emerald-700 font-mono mt-0.5">Phone/WA: {selectedCandidate.phone}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[#6C7A72] block font-semibold mb-0.5">Education / Degree</span>
                      <p className="font-bold text-[#17261F]">{selectedCandidate.education}</p>
                    </div>

                    <div>
                      <span className="text-[#6C7A72] block font-semibold mb-0.5">Field & Experience Level</span>
                      <p className="font-bold text-[#17261F]">{selectedCandidate.category} • {selectedCandidate.experience_level}</p>
                    </div>

                    <div>
                      <span className="text-[#6C7A72] block font-semibold mb-1">Key Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCandidate.skills || []).map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-[#E3F9ED] text-[#0A5734] font-mono font-bold text-[11px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedCandidate.resume_text && (
                      <div>
                        <span className="text-[#6C7A72] block font-semibold mb-1">CV / Experience Note</span>
                        <div className="p-3 rounded-xl bg-[#F4F6F2] text-[#17261F] font-mono text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {selectedCandidate.resume_text}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-[#6C7A72]">
                      Registered: {selectedCandidate.created_at}
                    </span>
                    <a
                      href={`mailto:${selectedCandidate.email}?subject=Job%20Opportunity%20from%20GlobalHire%20AI`}
                      className="px-4 py-2 rounded-xl bg-[#0A241B] text-[#00DF81] font-bold text-xs flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email Candidate
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: JOB RADAR & WORKER SYNC                                */}
        {/* ============================================================== */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Sync Command Header Card */}
            <div className="bg-[#0A241B] text-white p-6 rounded-3xl shadow-lg border border-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00DF81] animate-pulse"></span>
                  <h3 className="text-base font-extrabold text-white">Auto-Pilot Job Aggregator & Facebook Poster</h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Aggregating 24/7 from Remotive, Arbeitnow, Jobicy, and Himalayas. Posting high-CTR 4:5 hiring flyers to Facebook page Global Pulse AI automatically.
                </p>
                {syncMsg && (
                  <p className="text-xs font-mono text-[#00DF81] mt-2 font-bold">{syncMsg}</p>
                )}
              </div>

              <button
                onClick={handleSyncWorker}
                disabled={syncing}
                className="px-5 py-3 rounded-2xl bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Now (Scrape & Post)'}</span>
              </button>
            </div>

            {/* Jobs Filter and List */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.08] shadow-sm flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#8C9B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter active jobs by title or company..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F4F6F2] border border-black/[0.06] text-xs font-semibold text-[#17261F] placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81]"
                />
              </div>

              <span className="text-xs font-mono font-bold text-[#0A5734] px-3 py-1.5 rounded-2xl bg-[#E3F9ED] border border-[#BCE8D3]">
                {jobTotal} Active Openings
              </span>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm overflow-hidden">
              <div className="divide-y divide-black/[0.04] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4F6F2] text-[#57685E] font-bold">
                      <th className="py-3 px-6">Role & Company</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Salary</th>
                      <th className="py-3 px-4">Apply Clicks</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-[#F9FAF8] transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-[#17261F]">{j.title}</div>
                          <div className="text-[11px] text-[#6C7A72]">{j.company}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0A5734]">{j.category}</td>
                        <td className="py-3.5 px-4 text-[#6C7A72]">{j.location || 'Remote'}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#17261F]">
                          {j.salary || 'Competitive'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0A241B]">
                          {j.apply_clicks || 0}
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleToggleFeatured(j.id)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                              j.featured 
                                ? 'bg-[#00DF81] text-[#0A241B]' 
                                : 'bg-[#ECEEE9] text-[#6C7A72] hover:bg-slate-200'
                            }`}
                          >
                            {j.featured ? 'Featured' : 'Feature'}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(j.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
