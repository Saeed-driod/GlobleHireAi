import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Sparkles, Building2, Bookmark } from 'lucide-react';

function formatPostingDate(isoString) {
  if (!isoString) return 'Posted recently';
  try {
    const diffSecs = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diffSecs < 0 || diffSecs < 3600) return 'Posted today';
    const hours = Math.floor(diffSecs / 3600);
    if (hours < 24) return `Posted ${hours}h ago`;
    const days = Math.floor(diffSecs / 86400);
    if (days === 1) return 'Posted 1 day ago';
    if (days < 30) return `Posted ${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return 'Posted 1 mo ago';
    return `Posted ${months} mos ago`;
  } catch (e) {
    return 'Posted recently';
  }
}

function isJobExpired(isoString) {
  if (!isoString) return false;
  try {
    const diffDays = (Date.now() - new Date(isoString).getTime()) / (1000 * 86400);
    return diffDays > 45;
  } catch (e) {
    return false;
  }
}

export default function JobCard({ 
  job, 
  onSelect,
  onSelectJob, 
  onTagClick, 
  onApplyClick, 
  isSaved = false, 
  onToggleSave 
}) {
  const handleApply = (e) => {
    e.stopPropagation();
    if (onApplyClick) {
      onApplyClick(job);
    } else {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(job.id);
  };

  const expired = isJobExpired(job.posted_at);

  return (
    <article 
      onClick={() => {
        if (onSelectJob) onSelectJob(job.id);
        else if (onSelect) onSelect(job);
      }}
      className="v22-card p-6 cursor-pointer flex flex-col justify-between relative overflow-hidden group bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl transition-all shadow-sm hover:shadow-md"
    >
      {/* Top badges: Sponsored or Expired */}
      <div className="absolute top-0 right-0 flex items-center">
        {expired && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 text-[10px] font-bold rounded-bl-xl border-b border-l border-black/[0.06]">
            EXPIRED
          </span>
        )}
        {job.is_featured ? (
          <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold rounded-bl-xl border-b border-l border-amber-200 dark:border-amber-700/50">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Sponsored
          </div>
        ) : null}
      </div>

      <div>
        {/* Header: Company Logo + Role Title (2 lines max, hover tooltip) + Bookmark */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F2EE] dark:bg-white/5 border border-black/[0.05] dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={`${job.company_name} logo`}
                loading="lazy"
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.innerHTML = `<span class="text-[#0A241B] dark:text-[#00DF81] font-bold text-lg">${job.company_name?.charAt(0) || 'J'}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-[#0A5734] dark:text-[#00DF81] font-black text-lg">
                {job.company_name ? job.company_name.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            {/* 2-line wrapped title with native tooltip on hover */}
            <h3 
              title={job.title}
              className="text-base font-bold text-[#17261F] dark:text-white group-hover:text-[#0A5734] dark:group-hover:text-[#00DF81] transition-colors line-clamp-2 leading-snug cursor-pointer"
            >
              {job.title}
            </h3>
            
            {/* Company Name & Step 6 Clickable Source Attribution */}
            <p className="text-xs font-semibold text-[#6C7A72] dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{job.company_name}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={`View original job posting on ${job.source_api || 'source'}`}
                className="font-mono text-[11px] text-[#0A5734] dark:text-[#00DF81] hover:underline inline-flex items-center gap-0.5"
              >
                via {job.source_api || 'Remotive'}
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            </p>
          </div>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            title={isSaved ? "Remove from saved jobs" : "Save this job"}
            aria-label={isSaved ? "Remove from saved jobs" : "Save this job"}
            className={`p-2.5 rounded-2xl transition-all shrink-0 ${
              isSaved 
                ? 'bg-emerald-100 text-[#0A5734] dark:bg-[#00DF81]/20 dark:text-[#00DF81]' 
                : 'bg-[#F4F6F2] dark:bg-white/5 text-[#8C9B92] hover:text-[#0A241B] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges: Location, Type, Salary (or "Salary not listed") */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F4F6F2] dark:bg-white/5 text-[#3D4D43] dark:text-slate-300">
            <MapPin className="w-3 h-3 text-[#6C7A72]" />
            <span className="truncate max-w-[140px]">{job.location || 'Worldwide'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F4F6F2] dark:bg-white/5 text-[#3D4D43] dark:text-slate-300">
            <Briefcase className="w-3 h-3 text-[#6C7A72]" />
            <span>{job.job_type || 'Remote'}</span>
          </span>

          {job.salary_range && job.salary_range !== 'Competitive' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#D7F5E5] dark:bg-[#00DF81]/15 text-[#084D2E] dark:text-[#00DF81] border border-[#BCE8D3] dark:border-[#00DF81]/30">
              <DollarSign className="w-3 h-3" />
              <span>{job.salary_range}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-[#F4F6F2] dark:bg-white/5 text-[#6C7A72] dark:text-slate-400">
              <span>Salary not listed</span>
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="mt-3 text-xs text-[#57685E] dark:text-slate-400 line-clamp-2 leading-relaxed">
          {job.excerpt || 'View full scope of responsibilities and technical skills required on GlobalHire AI.'}
        </p>

        {/* Skill Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {job.tags.slice(0, 4).map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTagClick) onTagClick(tag);
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#F4F6F2] dark:bg-white/5 hover:bg-[#E3F9ED] dark:hover:bg-[#00DF81]/10 text-[#57685E] dark:text-slate-300 hover:text-[#0A5734] dark:hover:text-[#00DF81] border border-black/[0.04] dark:border-white/5 transition-all"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Real Posting Date & Apply Button */}
      <div className="mt-5 pt-3.5 border-t border-black/[0.05] dark:border-white/10 flex items-center justify-between text-xs text-[#8C9B92]">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#6C7A72] dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatPostingDate(job.posted_at)}</span>
        </div>

        <button
          type="button"
          onClick={handleApply}
          aria-label={`Apply for ${job.title} at ${job.company_name}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_2px_10px_rgba(0,223,129,0.3)] active:scale-95"
        >
          <span>Apply Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
