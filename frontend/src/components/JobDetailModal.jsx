import React, { useEffect, useState } from 'react';
import { X, MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Sparkles, Building2, Share2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import PlaycardModal from './PlaycardModal';
import { fetchJobDetails, logJobApply } from '../api';

export default function JobDetailModal({ jobId, onClose, onTagClick, onSelectRelated, onApplyClick }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPlaycard, setShowPlaycard] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    fetchJobDetails(jobId)
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [jobId]);

  if (!jobId) return null;

  const handleApply = () => {
    if (!job) return;
    if (onApplyClick) {
      onApplyClick(job);
    } else {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/40 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl my-8 bg-white border border-black/[0.08] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#17261F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E3F9ED] text-[#0A5734] border border-[#BCE8D3]">
              Verified Source: {job?.source_api || 'Direct Feed'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlaycard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1877F2] text-xs font-bold transition-colors"
              title="Generate Facebook Playcard Flyer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Facebook Playcard</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-[#F4F6F2] hover:bg-slate-200 text-[#57685E] transition-colors"
              title="Share link"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-[#00DF81]" /> : <ExternalLink className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F4F6F2] hover:bg-slate-200 text-[#57685E] transition-colors"
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
              <p className="mt-4 text-xs font-semibold text-[#6C7A72]">Loading verified details...</p>
            </div>
          ) : job ? (
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F0F2EE] border border-black/[0.05] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#0A241B]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#17261F]">{job.title}</h2>
                    {job.is_featured ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        FEATURED
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-[#0A5734] mt-0.5">{job.company_name}</p>
                </div>
              </div>

              {/* Key Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.04]">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Location</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#17261F]">
                    <MapPin className="w-3.5 h-3.5 text-[#0A5734] shrink-0" />
                    <span className="truncate">{job.location || 'Worldwide'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.04]">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Job Type</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#17261F]">
                    <Briefcase className="w-3.5 h-3.5 text-[#0A5734] shrink-0" />
                    <span>{job.job_type || 'Full-time'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.04]">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Compensation</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#084D2E]">
                    <DollarSign className="w-3.5 h-3.5 text-[#084D2E] shrink-0" />
                    <span className="truncate">{job.salary_range || 'Competitive'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F6F2] border border-black/[0.04]">
                  <span className="text-[11px] text-[#8C9B92] block font-semibold">Category</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#0A241B]">
                    <Sparkles className="w-3.5 h-3.5 text-[#00DF81] shrink-0" />
                    <span className="truncate">{job.category || 'Tech'}</span>
                  </div>
                </div>
              </div>

              {/* Skill Tags */}
              {job.tags && job.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        onClick={() => {
                          onTagClick(tag);
                          onClose();
                        }}
                        className="cursor-pointer text-xs font-semibold px-3 py-1 rounded-xl bg-[#F4F6F2] hover:bg-[#E3F9ED] text-[#57685E] hover:text-[#0A5734] border border-black/[0.04] transition-all"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Content */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] mb-2.5">Scope & Responsibilities</h4>
                <div className="text-xs sm:text-sm text-[#3D4D43] leading-relaxed whitespace-pre-line bg-[#FAFBF9] p-5 rounded-2xl border border-black/[0.05] font-sans">
                  {job.description}
                </div>
              </div>

              {/* Related Jobs */}
              {job.related_jobs && job.related_jobs.length > 0 && (
                <div className="pt-4 border-t border-black/[0.06]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7A72] mb-3">Similar Roles</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {job.related_jobs.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectRelated(rel.id)}
                        className="cursor-pointer p-3.5 rounded-2xl bg-[#F4F6F2] hover:bg-[#E3F9ED] border border-black/[0.04] transition-all"
                      >
                        <p className="text-xs font-bold text-[#17261F] line-clamp-1">{rel.title}</p>
                        <p className="text-[11px] text-[#6C7A72] mt-0.5">{rel.company_name}</p>
                        <span className="inline-block mt-2 text-[10px] text-[#0A5734] font-semibold">
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
          <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-xl border-t border-black/[0.06]">
            <div>
              <p className="text-xs text-[#6C7A72]">Ready to apply?</p>
              <p className="text-sm font-bold text-[#17261F]">Apply directly on {job.source_api}</p>
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

      {/* Google Jobs Schema Markup for Search Console */}
      {job && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "JobPosting",
              "title": job.title,
              "description": job.description || job.title,
              "datePosted": job.posted_at || job.created_at,
              "validThrough": "2026-12-31T23:59:59Z",
              "employmentType": job.job_type === "Contract" ? "CONTRACTOR" : "FULL_TIME",
              "hiringOrganization": {
                "@type": "Organization",
                "name": job.company_name,
                "logo": job.company_logo || "https://globalhireai.vercel.app/favicon.svg"
              },
              "jobLocationType": "TELECOMMUTE",
              "applicantLocationRequirements": {
                "@type": "Country",
                "name": job.location || "Worldwide"
              },
              "directApply": true
            })
          }}
        />
      )}
    </div>
  );
}
