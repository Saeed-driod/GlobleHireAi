import React from 'react';
import { Sparkles, PlusCircle, Sun, Moon, Bookmark } from 'lucide-react';

export default function Navbar({ 
  onOpenPostModal, 
  onOpenCandidateModal, 
  totalJobs = 143,
  darkMode = false,
  onToggleDarkMode,
  savedCount = 0,
  onViewSaved
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#ECEEE9]/90 dark:bg-[#0A1A14]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a 
          href="/"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="GlobalHire AI Homepage"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81] flex items-center justify-center text-[#00DF81] dark:text-[#0A241B] font-black text-lg shadow-[0_4px_12px_rgba(10,36,27,0.2)] group-hover:scale-105 transition-transform">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#17261F] dark:text-white">
                GlobalHire
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#E3F9ED] dark:bg-[#00DF81]/20 text-[#0A5734] dark:text-[#00DF81] border border-[#BCE8D3] dark:border-[#00DF81]/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-[#6C7A72] dark:text-slate-400 font-mono hidden sm:block">Worldwide Remote & Tech Radar</p>
          </div>
        </a>

        {/* Center Live Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/10 text-xs text-[#17261F] dark:text-slate-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#00DF81] pulse-glow"></span>
          <span className="font-bold text-[#0A5734] dark:text-[#00DF81]">{totalJobs}</span>
          <span className="text-[#6C7A72] dark:text-slate-400">Live Jobs Aggregated 24/7</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Saved Jobs Pill */}
          {savedCount > 0 && (
            <button
              onClick={onViewSaved}
              aria-label={`View ${savedCount} saved jobs`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-white dark:bg-white/10 text-[#0A5734] dark:text-[#00DF81] border border-black/[0.06] dark:border-white/10 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Saved</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-[#E3F9ED] dark:bg-[#00DF81]/20 font-bold">
                {savedCount}
              </span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2.5 rounded-2xl bg-white dark:bg-white/10 text-[#57685E] dark:text-slate-200 hover:text-[#0A241B] dark:hover:text-white border border-black/[0.06] dark:border-white/10 transition-all shadow-sm"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Drop CV button */}
          <button
            onClick={onOpenCandidateModal}
            aria-label="Drop your CV for automated job alerts"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-[#E3F9ED] dark:bg-[#00DF81]/15 text-[#0A5734] dark:text-[#00DF81] border border-[#BCE8D3] dark:border-[#00DF81]/30 hover:bg-[#D4F4E4] transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00DF81]" />
            <span className="hidden sm:inline">Drop CV / Get Alerts</span>
            <span className="sm:hidden">Drop CV</span>
          </button>

          {/* Post a Job button */}
          <button
            onClick={onOpenPostModal}
            aria-label="Post a remote job vacancy"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_2px_12px_rgba(0,223,129,0.3)] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Post a Job</span>
          </button>
        </div>

      </div>
    </header>
  );
}
