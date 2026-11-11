import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, MousePointerClick, RefreshCw, Server, 
  ArrowUpRight, TrendingUp, Layers, Terminal, Trash2, Star, 
  Search, Globe, DollarSign, Briefcase, ChevronLeft, ChevronRight,
  ExternalLink, Eye, CheckCircle2, Sparkles, Calendar as CalendarIcon,
  Users, Bell, Compass, ArrowRight, ShieldCheck, Flame, Share2, Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PlaycardModal from './PlaycardModal';
import { 
  fetchDashboardStats, 
  triggerWorkerSync, 
  toggleJobFeatured, 
  deleteJob, 
  fetchJobs,
  getExportCsvUrl
} from '../api';

export default function BentoDashboard({ onBackToPortal, onSelectJob }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedPlaycardJob, setSelectedPlaycardJob] = useState(null);

  // Calendar state for the V22 November 2026 widget
  const calendarDays = [
    { day: 'M', date: 9, active: false },
    { day: 'T', date: 10, active: true },
    { day: 'W', date: 11, active: false },
    { day: 'T', date: 12, active: false },
    { day: 'F', date: 13, active: false },
    { day: 'S', date: 14, active: false },
    { day: 'S', date: 15, active: false },
  ];

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      if (data.is_syncing_now) {
        setSyncing(true);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobsList = async () => {
    setJobsLoading(true);
    try {
      const res = await fetchJobs({ page: 1, limit: 20, q: jobSearch });
      setJobs(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadJobsList();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [jobSearch]);

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncMsg('Connecting to Oracle VM Auto-Pilot worker...');
    try {
      const res = await triggerWorkerSync();
      setSyncMsg(res.message || 'Worker sync cycle started!');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#00DF81', '#10B981', '#0A241B']
      });
      setTimeout(() => {
        loadStats();
        loadJobsList();
      }, 4000);
    } catch (err) {
      setSyncMsg('Failed to trigger worker.');
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncMsg('');
      }, 6000);
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await toggleJobFeatured(id);
      loadJobsList();
      loadStats();
    } catch (err) {
      alert("Error updating job: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this listing from the database?")) return;
    try {
      await deleteJob(id);
      loadJobsList();
      loadStats();
    } catch (err) {
      alert("Error deleting job: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEEE9] text-[#17261F] p-3 sm:p-6 lg:p-8 flex gap-6 font-sans">
      
      {/* FLOATING V22 OBSIDIAN FOREST SIDEBAR */}
      <aside className="hidden lg:flex w-20 bg-[#0A241B] rounded-[32px] p-4 flex-col justify-between items-center shadow-2xl shrink-0 border border-white/5">
        
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#00DF81] flex items-center justify-center text-[#0A241B] font-black text-xl shadow-[0_0_20px_rgba(0,223,129,0.4)]">
          G
        </div>

        {/* Center Icons */}
        <nav className="flex flex-col gap-4">
          {[
            { id: 'overview', icon: Layers, label: 'Bento' },
            { id: 'live-jobs', icon: Briefcase, label: 'Jobs' },
            { id: 'autopilot', icon: RefreshCw, label: 'Autopilot' },
            { id: 'monetization', icon: DollarSign, label: 'Revenue' },
            { id: 'health', icon: Server, label: 'Oracle VM' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#00DF81] text-[#0A241B] shadow-[0_4px_16px_rgba(0,223,129,0.35)] scale-105 font-bold' 
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Pill & Portal Link */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onBackToPortal}
            title="Return to Public Job Portal"
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-[#00DF81] text-white hover:text-[#0A241B] flex items-center justify-center transition-all duration-300 shadow-sm"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-[#0A241B] flex items-center justify-center text-xs font-bold text-[#00DF81]">
              AI
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN BENTO CANVAS */}
      <main className="flex-1 space-y-6 max-w-7xl mx-auto overflow-hidden">
        
        {/* TOP MOBILE BAR */}
        <div className="flex lg:hidden items-center justify-between bg-white px-5 py-3 rounded-2xl shadow-sm border border-black/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00DF81] flex items-center justify-center text-[#0A241B] font-bold">
              G
            </div>
            <span className="font-bold text-sm text-[#0A241B]">GlobalHire AI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-xl bg-[#0A241B] text-[#00DF81] text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing' : 'Sync'}</span>
            </button>
            <button
              onClick={onBackToPortal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Portal ↗
            </button>
          </div>
        </div>

        {/* ================= V22 TOP ROW ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Card 1: "Work's always better together" Big Forest Card (Span 5) */}
          <div className="md:col-span-5 bg-[#0A241B] rounded-[28px] p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
            {/* Subtle wavy green background mesh */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00DF81]/20 via-[#0A241B]/0 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 font-semibold">
                  Dashboard V22
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3 leading-snug">
                  Work's always <br />
                  <span className="text-[#00DF81]">better together</span>
                </h2>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-[#00DF81] pulse-glow"></span>
                <span className="font-medium text-xs">Oracle VM</span>
              </div>
            </div>

            <div className="relative z-10 pt-6 flex items-center justify-between border-t border-white/10 mt-4">
              {/* Stacked Avatars */}
              <div className="flex items-center -space-x-2">
                <div className="w-9 h-9 rounded-full bg-emerald-300 border-2 border-[#0A241B] flex items-center justify-center text-[#0A241B] font-bold text-xs">
                  JD
                </div>
                <div className="w-9 h-9 rounded-full bg-teal-200 border-2 border-[#0A241B] flex items-center justify-center text-[#0A241B] font-bold text-xs">
                  SK
                </div>
                <div className="w-9 h-9 rounded-full bg-cyan-200 border-2 border-[#0A241B] flex items-center justify-center text-[#0A241B] font-bold text-xs">
                  MR
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border-2 border-[#0A241B] flex items-center justify-center text-white font-bold text-xs">
                  +143
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={handleTriggerSync}
                disabled={syncing}
                className="px-4 py-2 rounded-2xl bg-[#00DF81] hover:bg-[#2EF8A0] text-[#0A241B] font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(0,223,129,0.3)] transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Aggregating...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Stat Card "Active Jobs" (Span 2) */}
          <div className="md:col-span-2 v22-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6C7A72]">Live Jobs</span>
              <div className="w-7 h-7 rounded-full bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center">
                <Database className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-3">
              <h3 className="text-3xl font-black text-[#17261F] tracking-tight">
                {stats ? stats.total_jobs : '143'}
              </h3>
              <p className="text-xs font-semibold text-[#00DF81] flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +100% verified
              </p>
            </div>

            <span className="text-[10px] font-mono text-[#8C9B92] block">
              Deduplicated SQLite
            </span>
          </div>

          {/* Card 3: Stat Card "Synced Today" (Span 2) */}
          <div className="md:col-span-2 v22-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6C7A72]">Today Intake</span>
              <div className="w-7 h-7 rounded-full bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-3">
              <h3 className="text-3xl font-black text-[#17261F] tracking-tight">
                {stats ? stats.new_jobs_today : '143'}
              </h3>
              <p className="text-xs font-semibold text-[#00DF81] flex items-center gap-1 mt-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> 4 public APIs
              </p>
            </div>

            <span className="text-[10px] font-mono text-[#8C9B92] block">
              Every 3 hours
            </span>
          </div>

          {/* Card 4: Mini Calendar "November, 2026" (Span 3) */}
          <div className="md:col-span-3 v22-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0A241B]" />
                <span className="text-xs font-bold text-[#17261F]">November, 2026</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-[#8C9B92]">{d.day}</span>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    d.active 
                      ? 'bg-[#00DF81] text-[#0A241B] shadow-[0_2px_8px_rgba(0,223,129,0.4)] scale-105' 
                      : 'text-[#17261F] hover:bg-slate-100'
                  }`}>
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6C7A72]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00DF81]"></span>
                Next sync in ~3h
              </span>
              <span className="font-mono text-[#0A241B] font-semibold">14:59 UTC</span>
            </div>
          </div>

        </div>

        {/* ================= V22 MIDDLE ROW ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Middle Left: Focus this week / Aggregation Trend Bar Chart (Span 5) */}
          <div className="md:col-span-5 v22-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-[#17261F]">Intake cadence</h4>
                <p className="text-[11px] text-[#6C7A72]">Real-time aggregation volume this week</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734] font-semibold">
                Auto-Pilot
              </span>
            </div>

            {/* Clean Rounded Pill Bar Chart in V22 Mint Green */}
            <div className="h-36 flex items-end gap-3 px-2 pt-4 pb-2 border-b border-black/[0.05]">
              {stats?.trend_data?.map((day, idx) => {
                const height = Math.min(100, Math.max(18, (day.jobs_added / 150) * 100));
                const isToday = idx === 6;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-[#0A5734] opacity-0 group-hover:opacity-100 transition-opacity">
                      +{day.jobs_added}
                    </span>
                    <div 
                      style={{ height: `${height}%` }}
                      className={`w-full max-w-[32px] rounded-full transition-all duration-300 ${
                        isToday 
                          ? 'bg-[#00DF81] shadow-[0_4px_12px_rgba(0,223,129,0.35)]' 
                          : 'bg-[#D6DDD3] hover:bg-[#B8C4B3]'
                      }`}
                    ></div>
                    <span className={`text-[10px] font-mono ${isToday ? 'font-bold text-[#0A241B]' : 'text-[#8C9B92]'}`}>
                      {day.date.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#6C7A72]">
              <span>Peak ingestion: <strong className="text-[#17261F]">143 listings</strong></span>
              <span className="font-semibold text-[#00DF81]">99.8% Success</span>
            </div>
          </div>

          {/* Middle Center: Unleash Your Career / Auto-Pilot Aggregator (Span 4) */}
          <div className="md:col-span-4 rounded-[28px] p-6 bg-gradient-to-br from-[#E3F9ED] via-[#D7F5E5] to-[#C9EFE0] border border-[#BCE8D3] flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#0A241B] text-[#00DF81] flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 text-[#0A5734]">
                Pro Engine
              </span>
            </div>

            <div className="my-4">
              <h4 className="text-xl font-extrabold text-[#0A241B] tracking-tight leading-snug">
                Unleash the <br />
                Worldwide Job Radar
              </h4>
              <p className="text-xs text-[#1C5338] mt-2 leading-relaxed">
                4 public API connectors running 24/7 on Ubuntu Oracle VM. Instant salary and skill normalization.
              </p>
            </div>

            <button
              onClick={onBackToPortal}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#0A241B] hover:bg-[#12382B] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Explore Public Job Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00DF81]" />
            </button>
          </div>

          {/* Middle Right: Notifications / Terminal Feed (Span 3) */}
          <div className="md:col-span-3 v22-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0A241B]" />
                  <span className="text-xs font-bold text-[#17261F]">Scraper Feed</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00DF81] pulse-glow"></span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
                {stats?.recent_sync_logs?.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-[#F4F6F2] border border-black/[0.04] text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-[#0A241B]">[{log.source}]</span>
                      <span className="text-[10px] text-[#8C9B92]">{log.timestamp?.split('T')[1]?.split('.')[0] || 'Recent'}</span>
                    </div>
                    <div className="text-[#3D4D43] flex items-center justify-between">
                      <span>+{log.jobs_added} added</span>
                      <span className="text-[10px] font-bold text-[#0A5734] uppercase">{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6C7A72]">
              <span className="font-mono">Port 5001</span>
              <button 
                onClick={handleTriggerSync}
                className="text-[#0A5734] font-semibold hover:underline"
              >
                Trigger Sync
              </button>
            </div>
          </div>

        </div>

        {/* ================= V22 BOTTOM ROW: JOBS TABLE ================= */}
        <div className="v22-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[#17261F] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#0A241B]" />
                Recent Opportunities ({jobs.length} Loaded)
              </h3>
              <p className="text-xs text-[#6C7A72]">Manage verified listings, toggle promotional featured status, and track clicks</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={getExportCsvUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 border border-black/[0.08] text-xs font-bold text-[#17261F] shadow-sm shrink-0 transition-colors"
                title="Download CSV spreadsheet of all jobs"
              >
                <Download className="w-3.5 h-3.5 text-[#0A5734]" />
                <span className="hidden sm:inline">Export CSV</span>
              </a>

              {/* Pill Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#8C9B92] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-[#F4F6F2] border border-black/[0.05] text-[#17261F] placeholder-[#8C9B92] focus:outline-none focus:border-[#00DF81]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] text-[#8C9B92] font-mono uppercase text-[10px]">
                  <th className="py-3 px-3">Role / Company</th>
                  <th className="py-3 px-3">Location & Type</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Source API</th>
                  <th className="py-3 px-3 text-center">Featured</th>
                  <th className="py-3 px-3 text-center">Views / Clicks</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {jobsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[#8C9B92]">
                      Loading verified jobs...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[#8C9B92]">
                      No listings found.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-[#F9FAF8] transition-colors group">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#17261F] group-hover:text-[#0A5734] transition-colors line-clamp-1 max-w-xs">
                          {j.title}
                        </div>
                        <div className="text-[11px] text-[#6C7A72]">{j.company_name}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-[#3D4D43] truncate max-w-[140px]">{j.location}</div>
                        <div className="text-[10px] text-[#0A5734] font-semibold">{j.job_type}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734] border border-[#BDEFD4] text-[10px] font-semibold">
                          {j.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[#6C7A72] text-[11px]">
                        {j.source_api}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleFeature(j.id)}
                          className={`p-1.5 rounded-xl border transition-all ${
                            j.is_featured 
                              ? 'bg-amber-100 border-amber-300 text-amber-600' 
                              : 'bg-slate-100 border-black/[0.05] text-slate-400 hover:text-amber-500'
                          }`}
                          title="Toggle featured"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="text-[#6C7A72]">{j.views_count}</span>
                        <span className="text-slate-300"> / </span>
                        <span className="text-[#0A5734] font-bold">{j.clicks_count}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPlaycardJob(j)}
                            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1877F2] transition-colors"
                            title="Generate Facebook Playcard & Auto-Post"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectJob(j)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#E3F9ED] text-slate-600 hover:text-[#0A5734] transition-colors"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={j.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#E3F9ED] text-slate-600 hover:text-[#0A5734] transition-colors"
                            title="Apply page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(j.id)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Facebook & Social Playcard Modal */}
      {selectedPlaycardJob && (
        <PlaycardModal
          job={selectedPlaycardJob}
          onClose={() => setSelectedPlaycardJob(null)}
        />
      )}

    </div>
  );
}
