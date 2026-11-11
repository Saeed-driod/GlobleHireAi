import React from 'react';
import { X, ShieldCheck, Mail, Globe, FileText, CheckCircle2, HeartHandshake, Lock, Sparkles } from 'lucide-react';

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
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#F4F6F2] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#57685E] dark:text-slate-300 transition-colors"
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
              GlobalHire AI is an autonomous remote job aggregator built to help talent worldwide discover genuine work-from-anywhere opportunities. We aggregate and verify open roles from trusted job boards—including Remotive, Arbeitnow, Jobicy, and Himalayas—filtering out clutter, non-remote on-site roles, and noisy listings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">Curated</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Trusted Job Boards</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">Zero Spam</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Direct ATS Applications</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5">
                <span className="text-lg font-black text-[#0A5734] dark:text-[#00DF81] block">Worldwide</span>
                <span className="text-xs text-[#57685E] dark:text-slate-400">Tech, Design & Growth</span>
              </div>
            </div>
          </div>
        )}

        {page === 'contact' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Contact & Support</h2>
            <p className="text-sm text-[#57685E] dark:text-[#A3B8AC] leading-relaxed">
              Have questions, feedback, or want to list a remote vacancy directly on our radar? Reach out to our team anytime.
            </p>
            <div className="p-4 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 space-y-2 text-xs font-mono">
              <p>📧 Email: <a href="mailto:support@globalhireai.vercel.app" className="text-emerald-600 dark:text-[#00DF81] font-bold hover:underline">support@globalhireai.vercel.app</a></p>
              <p>🌐 Official Portal: <a href="https://globalhireai.vercel.app/" className="hover:underline">https://globalhireai.vercel.app/</a></p>
              <p>📍 Operations: Remote Worldwide</p>
            </div>
          </div>
        )}

        {page === 'privacy' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Privacy Policy</h2>
            <div className="text-xs text-[#57685E] dark:text-[#A3B8AC] space-y-3 leading-relaxed">
              <p><strong>Last Updated: November 2026</strong></p>
              <p>1. <strong>Information We Collect:</strong> When you drop your CV for job match alerts, we collect only your provided contact details (name, email), skills, and degree level. We do not sell or monetize personal candidate profiles.</p>
              <p>2. <strong>Source Attribution:</strong> All job openings are aggregated with source board attribution. Clicking an application link routes you directly to the employer or hosting platform's official application tracking system.</p>
              <p>3. <strong>Client Storage:</strong> Saved bookmarks and theme preferences (dark mode) are stored locally in your browser's localStorage and remain under your full control.</p>
              <p>4. <strong>Advertisements:</strong> We use only non-intrusive native banner placements. We do not utilize pop-under windows, aggressive click redirects, or background tracking scripts.</p>
            </div>
          </div>
        )}

        {page === 'terms' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#17261F] dark:text-white">Terms of Service</h2>
            <div className="text-xs text-[#57685E] dark:text-[#A3B8AC] space-y-3 leading-relaxed">
              <p><strong>Last Updated: November 2026</strong></p>
              <p>1. <strong>Platform Purpose:</strong> GlobalHire AI serves as an informational aggregator connecting remote job seekers with verified employment opportunities worldwide.</p>
              <p>2. <strong>Application Terms:</strong> Employment conditions, compensation packages, and hiring criteria are determined solely by the respective employer. GlobalHire AI does not collect application fees from job seekers.</p>
              <p>3. <strong>Content Accuracy:</strong> While we strive to verify remote criteria and salary transparency, listings may expire or close without advance notice from the source board.</p>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold text-xs hover:scale-105 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
