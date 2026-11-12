import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Sparkles, Building2, Bookmark, CheckCircle2 } from 'lucide-react';

const CATEGORY_THEMES = {
  'Software Dev': {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50',
    accentBar: 'from-emerald-500 via-teal-400 to-[#00DF81]',
    avatarGradient: 'from-emerald-900 via-[#0A241B] to-slate-950 text-[#00DF81]',
    tagHover: 'hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300',
    label: '💻 Tech & Dev'
  },
  'AI / Data': {
    badge: 'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50',
    accentBar: 'from-purple-500 via-fuchsia-500 to-indigo-500',
    avatarGradient: 'from-purple-950 via-indigo-950 to-slate-950 text-purple-300',
    tagHover: 'hover:bg-purple-50 hover:text-purple-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-300',
    label: '🧠 AI & Data'
  },
  'Design': {
    badge: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50',
    accentBar: 'from-rose-500 via-pink-500 to-orange-400',
    avatarGradient: 'from-rose-950 via-pink-950 to-slate-950 text-rose-300',
    tagHover: 'hover:bg-rose-50 hover:text-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300',
    label: '🎨 Design & UX'
  },
  'Marketing': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
    accentBar: 'from-amber-500 via-orange-500 to-yellow-400',
    avatarGradient: 'from-amber-950 via-orange-950 to-slate-950 text-amber-300',
    tagHover: 'hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300',
    label: '📈 Growth & Mktg'
  },
  'DevOps / Cloud': {
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200/80 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/50',
    accentBar: 'from-cyan-500 via-sky-500 to-blue-500',
    avatarGradient: 'from-cyan-950 via-slate-900 to-blue-950 text-cyan-300',
    tagHover: 'hover:bg-cyan-50 hover:text-cyan-800 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300',
    label: '☁️ Cloud & DevOps'
  },
  'Customer Support': {
    badge: 'bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/50',
    accentBar: 'from-teal-500 via-emerald-500 to-teal-400',
    avatarGradient: 'from-teal-950 via-slate-900 to-emerald-950 text-teal-300',
    tagHover: 'hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-950/40 dark:hover:text-teal-300',
    label: '🎧 Customer Support'
  },
  'default': {
    badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
    accentBar: 'from-[#00DF81] via-emerald-400 to-teal-400',
    avatarGradient: 'from-[#0A241B] via-slate-900 to-slate-950 text-[#00DF81]',
    tagHover: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white',
    label: '🌍 Worldwide Remote'
  }
};

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
  const theme = CATEGORY_THEMES[job.category] || CATEGORY_THEMES['default'];

  return (
    <article 
      onClick={() => {
        if (onSelectJob) onSelectJob(job.id);
        else if (onSelect) onSelect(job);
      }}
      className="group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.07] dark:border-white/[0.08] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* Top Category Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.accentBar} opacity-90 group-hover:h-2 transition-all`}></div>

      {/* Top Header Row: Category Badge + Bookmark + Status */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${theme.badge}`}>
          {theme.label}
        </span>

        <div className="flex items-center gap-1.5">
          {job.is_featured ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-700/50 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Sponsored
            </span>
          ) : null}

          {expired && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400 text-[10px] font-bold rounded-full">
              Expired
            </span>
          )}

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmark}
            title={isSaved ? "Remove from bookmarks" : "Save this job"}
            aria-label={isSaved ? "Remove from bookmarks" : "Save this job"}
            className={`p-2 rounded-xl transition-all ${
              isSaved 
                ? 'bg-emerald-100 text-[#0A5734] dark:bg-[#00DF81]/20 dark:text-[#00DF81] scale-105' 
                : 'bg-[#F4F6F2] dark:bg-white/5 text-[#8C9B92] hover:text-[#0A241B] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div>
        {/* Company Logo + Role Title */}
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl border border-black/[0.05] dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-gradient-to-br ${theme.avatarGradient}`}>
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={`${job.company_name} logo`}
                loading="lazy"
                className="w-full h-full object-contain p-1.5 bg-white"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentElement) {
                    e.target.parentElement.innerHTML = `<span class="font-black text-base">${job.company_name?.charAt(0) || 'G'}</span>`;
                  }
                }}
              />
            ) : (
              <span className="font-black text-lg">
                {job.company_name ? job.company_name.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h3 
              title={job.title}
              className="text-base font-extrabold text-[#17261F] dark:text-white group-hover:text-[#0A5734] dark:group-hover:text-[#00DF81] transition-colors line-clamp-2 leading-snug cursor-pointer"
            >
              {job.title}
            </h3>
            
            <p className="text-xs font-semibold text-[#6C7A72] dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-[#17261F] dark:text-slate-200 font-bold">{job.company_name}</span>
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
        </div>

        {/* Location & Details Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F4F6F2] dark:bg-white/5 text-[#3D4D43] dark:text-slate-300">
            <MapPin className="w-3 h-3 text-[#6C7A72] dark:text-slate-400 shrink-0" />
            <span className="truncate max-w-[130px]">{job.location || 'Worldwide'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F4F6F2] dark:bg-white/5 text-[#3D4D43] dark:text-slate-300">
            <Briefcase className="w-3 h-3 text-[#6C7A72] dark:text-slate-400 shrink-0" />
            <span>{job.job_type || 'Remote'}</span>
          </span>

          {job.salary_range && job.salary_range !== 'Competitive' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#D7F5E5] dark:bg-[#00DF81]/15 text-[#084D2E] dark:text-[#00DF81] border border-[#BCE8D3] dark:border-[#00DF81]/30">
              <DollarSign className="w-3 h-3 shrink-0" />
              <span>{job.salary_range}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-[#F4F6F2] dark:bg-white/5 text-[#6C7A72] dark:text-slate-400">
              <span>Salary not listed</span>
            </span>
          )}
        </div>

        {/* Short Summary */}
        <p className="mt-3 text-xs text-[#57685E] dark:text-slate-400 line-clamp-2 leading-relaxed">
          {job.excerpt || 'Verified remote opportunity with transparent compensation and direct ATS application.'}
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
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 border border-black/[0.04] dark:border-white/5 transition-all ${theme.tagHover}`}
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_2px_12px_rgba(0,223,129,0.3)] active:scale-95 group-hover:scale-102"
        >
          <span>Apply Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
