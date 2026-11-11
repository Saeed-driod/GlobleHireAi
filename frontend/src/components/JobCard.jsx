import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Sparkles, Building2, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { logJobApply } from '../api';

function formatTimeAgo(isoString) {
  if (!isoString) return 'Recent';
  try {
    const diff = (new Date() - new Date(isoString)) / 1000;
    if (diff < 3600) return 'Just now';
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / (86400 * 7))}w ago`;
  } catch (e) {
    return 'Recent';
  }
}

export default function JobCard({ job, onSelect, onTagClick }) {
  const handleApply = async (e) => {
    e.stopPropagation();
    
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00DF81', '#10B981', '#0A241B']
      });
    } catch (err) {}

    try {
      const res = await logJobApply(job.id);
      window.open(res.apply_url || job.apply_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  const isRemote = (job.job_type || '').toLowerCase().includes('remote') || (job.location || '').toLowerCase().includes('remote');

  return (
    <div 
      onClick={() => onSelect(job)}
      className="v22-card p-6 cursor-pointer flex flex-col justify-between relative overflow-hidden group"
    >
      {/* Featured Pill */}
      {job.is_featured ? (
        <div className="absolute top-0 right-0">
          <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-bl-xl border-b border-l border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-600" />
            FEATURED
          </div>
        </div>
      ) : null}

      <div>
        {/* Header: Company Avatar/Logo + Role Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F2EE] border border-black/[0.05] flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={job.company_name} 
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-[#0A241B] font-bold text-lg">${job.company_name?.charAt(0) || 'J'}</span>`;
                }}
              />
            ) : (
              <span className="text-[#0A5734] font-black text-lg">
                {job.company_name ? job.company_name.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-base font-bold text-[#17261F] group-hover:text-[#0A5734] transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-xs font-semibold text-[#6C7A72] flex items-center gap-1.5 mt-0.5">
              <span>{job.company_name}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-[#8C9B92]">{job.source_api}</span>
            </p>
          </div>
        </div>

        {/* V22 Badges: Location, Type, Salary */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
            isRemote 
              ? 'bg-[#E3F9ED] text-[#0A5734] border border-[#BCE8D3]' 
              : 'bg-[#F4F6F2] text-[#3D4D43]'
          }`}>
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[130px]">{job.location || 'Worldwide'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#F4F6F2] text-[#3D4D43]">
            <Briefcase className="w-3 h-3 text-[#6C7A72]" />
            <span>{job.job_type || 'Remote'}</span>
          </span>

          {job.salary_range && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#D7F5E5] text-[#084D2E] border border-[#BCE8D3]">
              <DollarSign className="w-3 h-3" />
              <span>{job.salary_range}</span>
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="mt-3 text-xs text-[#57685E] line-clamp-2 leading-relaxed">
          {job.excerpt || 'View full scope of responsibilities and technical skills required...'}
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
                  onTagClick(tag);
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#F4F6F2] hover:bg-[#E3F9ED] text-[#57685E] hover:text-[#0A5734] border border-black/[0.04] transition-all"
              >
                #{tag}
              </button>
            ))}
            {job.tags.length > 4 && (
              <span className="text-[11px] text-[#8C9B92] font-mono self-center">
                +{job.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Relative Time & Mint Apply Button */}
      <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#8C9B92]">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimeAgo(job.posted_at)}</span>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_2px_10px_rgba(0,223,129,0.3)] active:scale-95"
        >
          <span>Apply Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
