import React from 'react';
import { X, ShieldCheck, Mail, Globe, FileText, CheckCircle2 } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, page = 'about' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl my-8 bg-white dark:bg-[#11231C] text-[#17261F] dark:text-[#E2E8E4] rounded-3xl p-6 sm:p-8 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#F4F6F2] dark:bg-white/10 hover:bg-slate-200 text-[#57685E] dark:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {page === 'about' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] flex items-center justify-center font-black text-xl mb-3">
              G
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">About GlobalHire AI</h2>
            <p className="text-sm text-[#57685E] dark:text-[#A3B8AC] leading-relaxed">
              GlobalHire AI is an autonomous worldwide remote and tech job radar. We scrape, verify, and aggregate over 200+ verified listings 24/7 directly from premier engineering companies and verified platforms including Remotive, Arbeitnow, Jobicy, and Himalayas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">100%</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Verified Remote Openings</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">0 Spam</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Direct Company Applications</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">Real Time</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Instant Email Match Alerts</span>
              </div>
            </div>
          </div>
        )}

        {page === 'contact' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Contact & Support</h2>
            <p className="text-sm text-[#57685E] dark:text-[#A3B8AC] leading-relaxed">
              Have questions, feedback, or want to list a company opening directly? Our team is available 24/7.
            </p>
            <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 space-y-2 text-xs font-mono">
              <p>📧 Email: <a href="mailto:support@globalhire.ai" className="text-emerald-600 font-bold hover:underline">support@globalhire.ai</a></p>
              <p>🌐 Website: <a href="https://globalhireai.vercel.app/" className="hover:underline">https://globalhireai.vercel.app/</a></p>
              <p>📍 Headquarters: GlobalHire AI Remote Operations</p>
            </div>
          </div>
        )}

        {page === 'privacy' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Privacy Policy</h2>
            <div className="text-xs text-[#57685E] dark:text-[#A3B8AC] space-y-3 leading-relaxed">
              <p><strong>Last Updated: November 2026</strong></p>
              <p>1. <strong>Information We Collect:</strong> When you subscribe to job alerts or submit your candidate profile, we collect your name, email, preferred category, skills, and highest education to match you with verified opportunities.</p>
              <p>2. <strong>How We Use Data:</strong> We do NOT sell, rent, or trade your personal information. Candidate data is strictly used to deliver automated email job alerts and forward applications to official hiring sites.</p>
              <p>3. <strong>Data Storage:</strong> Saved jobs and candidate preferences are stored locally in your browser (localStorage) and secured in our encrypted backend.</p>
            </div>
          </div>
        )}

        {page === 'terms' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Terms of Service</h2>
            <div className="text-xs text-[#57685E] dark:text-[#A3B8AC] space-y-3 leading-relaxed">
              <p><strong>Last Updated: November 2026</strong></p>
              <p>1. <strong>Job Listings:</strong> GlobalHire AI aggregates remote opportunities from verified public sources. While we filter for salary transparency and quality, hiring terms are governed by the respective employer.</p>
              <p>2. <strong>Free Access:</strong> Job search, bookmarks, and email alerts on GlobalHire AI are 100% free for candidates.</p>
              <p>3. <strong>Direct Apply:</strong> When applying, you are safely redirected to the employer's official applicant tracking system.</p>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
