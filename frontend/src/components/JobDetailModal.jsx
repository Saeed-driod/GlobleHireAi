import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Briefcase, DollarSign, Clock, ExternalLink, 
  Sparkles, Building2, CheckCircle2, Share2, ArrowUpRight 
} from 'lucide-react';
import PlaycardModal from './PlaycardModal';
import { fetchJobById } from '../api';

export default function JobDetailModal({ jobId, onClose, onTagClick, onSelectRelated, onApplyClick }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPlaycard, setShowPlaycard] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDetail() {
      setLoading(true);
      try {
        const data = await fetchJobById(jobId);
        if (isMounted) setJob(data);
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (jobId) loadDetail();
    return () => { isMounted = false; };
  }, [jobId]);

  if (!jobId) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyClick && job) {
      onApplyClick(job);
    } else if (job && job.apply_url) {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#11231C] text-[#17261F] dark:text-[#E2E8E4] rounded-3xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00DF81] pulse-glow"></span>
            <span className="text-xs font-mono font-bold text-[#0A5734] dark:text-[#00DF81] uppercase tracking-wider">
              Curated Remote Opening
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlaycard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1877F2] text-xs font-bold transition-colors"
              title="Generate Facebook Playcard Flyer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Facebook Playcard</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-[#F4F6F2] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#57685E] dark:text-slate-300 transition-colors"
              title="Share link"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-[#00DF81]" /> : <ExternalLink className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F4F6F2] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#57685E] dark:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-[#00DF81]/30 border-t-[#00DF81] rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-xs font-semibold text-[#6C7A72] dark:text-slate-400">Loading verified details...</p>
            </div>
          ) : job ? (
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F0F2EE] dark:bg-white/5 border border-black/[0.05] dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#0A241B] dark:text-[#00DF81]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#17261F] dark:text-white">{job.title}</h2>
                    {job.is_featured ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Sponsored
                      </span>
                    ) : null}
                  </div>
                  
                  {/* Step 6 Source Attribution Link */}
                  <p className="text-sm font-semibold text-[#0A5734] dark:text-[#00DF81] mt-1 flex flex-wrap items-center gap-2">
                    <span>{job.company_name}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <a 
                      href={job.apply_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title={`View original job posting on ${job.source_api || 'job board'}`}
                      className="text-xs text-[#57685E] dark:text-slate-300 hover:text-[#0A5734] dark:hover:text-[#00DF81] underline inline-flex items-center gap-1 font-mono"
                    >
                      via {job.source_api || 'Remotive'} <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </p>
                </div>
              </div>

              {/* Key Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Location</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#17261F] dark:text-white">
                    <MapPin className="w-3.5 h-3.5 text-[#0A5734] dark:text-[#00DF81] shrink-0" />
                    <span className="truncate">{job.location || 'Worldwide'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Job Type</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#17261F] dark:text-white">
                    <Briefcase className="w-3.5 h-3.5 text-[#0A5734] dark:text-[#00DF81] shrink-0" />
                    <span>{job.job_type || 'Remote'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Compensation</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#084D2E] dark:text-[#00DF81]">
                    <DollarSign className="w-3.5 h-3.5 text-[#084D2E] dark:text-[#00DF81] shrink-0" />
                    <span className="truncate">{job.salary_range && job.salary_range !== 'Competitive' ? job.salary_range : 'Salary not listed'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Source Board</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#0A241B] dark:text-[#00DF81]">
                    <Sparkles className="w-3.5 h-3.5 text-[#00DF81] shrink-0" />
                    <span className="truncate">{job.source_api || 'Remotive'}</span>
                  </div>
                </div>
              </div>

              {/* Skill Tags */}
              {job.tags && job.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] dark:text-slate-400 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        onClick={() => {
                          onTagClick(tag);
                          onClose();
                        }}
                        className="cursor-pointer text-xs font-semibold px-3 py-1 rounded-xl bg-[#F4F6F2] dark:bg-white/5 hover:bg-[#E3F9ED] dark:hover:bg-[#00DF81]/15 text-[#57685E] dark:text-slate-300 hover:text-[#0A5734] dark:hover:text-[#00DF81] border border-black/[0.04] dark:border-white/5 transition-all"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Content */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] dark:text-slate-400 mb-2.5">Scope & Responsibilities</h4>
                <div className="text-xs sm:text-sm text-[#3D4D43] dark:text-slate-300 leading-relaxed whitespace-pre-line bg-[#FAFBF9] dark:bg-white/5 p-5 rounded-2xl border border-black/[0.05] dark:border-white/5 font-sans">
                  {job.description}
                </div>
              </div>

              {/* Related Jobs */}
              {job.related_jobs && job.related_jobs.length > 0 && (
                <div className="pt-4 border-t border-black/[0.06] dark:border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] dark:text-slate-400 mb-3">Similar Roles</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {job.related_jobs.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectRelated(rel.id)}
                        className="cursor-pointer p-3.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 hover:bg-[#E3F9ED] dark:hover:bg-[#00DF81]/15 border border-black/[0.04] dark:border-white/5 transition-all"
                      >
                        <p className="text-xs font-bold text-[#17261F] dark:text-white line-clamp-1">{rel.title}</p>
                        <p className="text-[11px] text-[#6C7A72] dark:text-slate-400 mt-0.5">{rel.company_name}</p>
                        <span className="inline-block mt-2 text-[10px] text-[#0A5734] dark:text-[#00DF81] font-semibold">
                          {rel.location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-center py-10">Job details not available.</p>
          )}
        </div>

        {/* Sticky Apply Footer */}
        {job && (
          <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#11231C]/95 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/10">
            <div>
              <p className="text-xs text-[#6C7A72] dark:text-slate-400">Apply directly at the source:</p>
              <a 
                href={job.apply_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs sm:text-sm font-bold text-[#0A5734] dark:text-[#00DF81] hover:underline flex items-center gap-1"
              >
                <span>Original listing via {job.source_api || 'Remotive'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_4px_14px_rgba(0,223,129,0.35)] active:scale-95"
            >
              <span>Apply on Official Board</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {showPlaycard && job && (
        <PlaycardModal
          job={job}
          onClose={() => setShowPlaycard(false)}
        />
      )}
    </div>
  );
}
