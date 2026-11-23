import React from 'react';
import { Loader2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoadMoreSection({
  page,
  totalPages,
  total,
  currentCount,
  loadingMore,
  onLoadMore,
  onOpenCandidateModal
}) {
  return (
    <div className="mt-12 text-center">
      {page < totalPages ? (
        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-label="Load more remote jobs"
            className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] hover:bg-[#12382B] dark:hover:bg-[#2EF8A0] transition-colors shadow-[0_4px_16px_rgba(10,36,27,0.15)] flex items-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#00DF81] dark:text-[#0A241B]" />
                <span>Loading fresh listings...</span>
              </>
            ) : (
              <>
                <span>Load More Remote Jobs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
          
          <p className="text-[11px] text-[#6C7A72] dark:text-slate-400 font-mono">
            Showing {currentCount} of {total} total listings
          </p>
        </div>
      ) : currentCount > 0 ? (
        /* All jobs loaded state */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] max-w-lg mx-auto shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#E3F9ED] dark:bg-[#00DF81]/20 text-[#0A5734] dark:text-[#00DF81] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-[#17261F] dark:text-white">
            You have viewed all {total} remote jobs!
          </h4>
          <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-1 mb-4 leading-relaxed">
            Do not see your exact role? Drop your CV profile and our automated radar will alert you as soon as new jobs open.
          </p>
          <button
            type="button"
            onClick={onOpenCandidateModal}
            aria-label="Drop your CV for automated job alerts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#00DF81] text-[#0A241B] hover:bg-[#2EF8A0] transition-all shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Drop Your CV for Alerts →</span>
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}
