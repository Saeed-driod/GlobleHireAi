import React from 'react';
import { Sparkles, PlusCircle, Globe, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Navbar({ onOpenPostModal, totalJobs = 143, isAdmin, onGoToAdmin }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#ECEEE9]/90 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0A241B] flex items-center justify-center text-[#00DF81] font-black text-lg shadow-[0_4px_12px_rgba(10,36,27,0.2)] group-hover:scale-105 transition-transform">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#17261F]">
                GlobalHire
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734] border border-[#BCE8D3]">
                AI
              </span>
            </div>
            <p className="text-[10px] text-[#6C7A72] font-mono hidden sm:block">Worldwide Remote & Tech Radar</p>
          </div>
        </div>

        {/* Center Live Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/[0.06] text-xs text-[#17261F] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#00DF81] pulse-glow"></span>
          <span className="font-bold text-[#0A5734]">{totalJobs}</span>
          <span className="text-[#6C7A72]">Live Jobs Aggregated 24/7</span>
        </div>

        {/* Right Actions: Clean, purely User-Facing */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-[#0A241B] text-[#00DF81] shadow-sm"
              title="Open Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </button>
          )}

          <button
            onClick={onOpenPostModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_2px_12px_rgba(0,223,129,0.3)] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Job</span>
          </button>
        </div>

      </div>
    </header>
  );
}
