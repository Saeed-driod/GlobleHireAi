import React, { useEffect } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

export default function AdSlot({ type = 'in-feed', className = '', zoneId = null }) {
  useEffect(() => {
    // If Monetag script is injected and zone is active, trigger Monetag render if available
    try {
      if (window.show_monetag_ad && zoneId) {
        window.show_monetag_ad(zoneId);
      }
    } catch (e) {}
  }, [zoneId]);

  if (type === 'leaderboard') {
    return (
      <div 
        id={zoneId ? `monetag-zone-${zoneId}` : undefined}
        className={`w-full max-w-5xl mx-auto my-5 p-4 rounded-3xl bg-white border border-black/[0.06] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left transition-all ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#00DF81]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734]">Sponsored</span>
              <p className="text-xs sm:text-sm font-bold text-[#17261F]">Scale Your Global Remote Engineering Team</p>
            </div>
            <p className="text-xs text-[#6C7A72] mt-0.5">Hire vetted senior full-stack and AI engineers with automated international compliance.</p>
          </div>
        </div>
        <a 
          href="https://globalhireai.vercel.app/?category=Software%20Dev" 
          className="whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold bg-[#0A241B] hover:bg-[#12382B] text-white transition-all flex items-center gap-1.5 shadow-sm shrink-0"
        >
          View Verified Tech Jobs <ExternalLink className="w-3.5 h-3.5 text-[#00DF81]" />
        </a>
      </div>
    );
  }

  // In-Feed Native Job Ad
  return (
    <div 
      id={zoneId ? `monetag-zone-${zoneId}` : undefined}
      className={`v22-card p-6 border-2 border-[#BCE8D3] bg-gradient-to-br from-[#E3F9ED]/40 via-white to-white flex flex-col justify-between relative overflow-hidden group transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0A241B] text-[#00DF81] flex items-center justify-center font-bold text-lg shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h4 className="text-base font-bold text-[#17261F] group-hover:text-[#0A5734] transition-colors">
              AI Engineering & Cloud Architecture Residency
            </h4>
            <p className="text-xs font-semibold text-[#6C7A72] mt-0.5">
              Global Accelerator • Remote Worldwide • Full Funding + $120k Grant
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0A241B] text-[#00DF81]">
          Featured Ad
        </span>
      </div>

      <p className="mt-3 text-xs text-[#57685E] leading-relaxed line-clamp-2">
        Join world-class founders and researchers building autonomous agent infrastructure. Includes stipend, GPU compute credits, and full immigration/relocation assistance.
      </p>

      <div className="mt-4 pt-3.5 border-t border-black/[0.05] flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["AI / LLM", "Worldwide Remote", "Equity Grant"].map((t, idx) => (
            <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F4F6F2] text-[#57685E]">
              {t}
            </span>
          ))}
        </div>
        <a
          href="https://globalhireai.vercel.app/?category=AI%2FData"
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-[#0A241B] hover:bg-[#12382B] text-white transition-all flex items-center gap-1 shadow-sm"
        >
          Explore Roles <ExternalLink className="w-3 h-3 text-[#00DF81]" />
        </a>
      </div>
    </div>
  );
}
