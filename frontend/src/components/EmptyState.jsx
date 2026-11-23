import React from 'react';
import { Briefcase, Bookmark, AlertTriangle, RotateCcw } from 'lucide-react';

export default function EmptyState({ 
  viewSavedOnly, 
  error, 
  onRetry, 
  onResetFilters 
}) {
  if (error) {
    return (
      <div 
        role="alert"
        className="py-16 text-center rounded-3xl bg-white dark:bg-[#11231C] border border-red-200 dark:border-red-900/50 p-8 shadow-sm space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold text-[#17261F] dark:text-white">
            Connection Interrupted
          </h3>
          <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-1">
            {error || 'Unable to retrieve remote jobs right now. Please check your internet connection or try again.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry loading jobs"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] hover:opacity-90 transition-all shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] p-8 shadow-sm">
      {viewSavedOnly ? (
        <Bookmark className="w-12 h-12 text-[#00DF81] mx-auto mb-4" />
      ) : (
        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-bold text-[#17261F] dark:text-white">
        {viewSavedOnly ? 'No saved jobs yet' : 'No jobs found matching your criteria'}
      </h3>
      <p className="text-xs text-[#6C7A72] dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
        {viewSavedOnly 
          ? 'Click the bookmark icon on any job card to save listings here for easy access.'
          : 'Try broadening your keyword, clearing active filters, or toggling workplace mode.'}
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        aria-label={viewSavedOnly ? "Browse all remote jobs" : "Reset all active filters"}
        className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] transition-all shadow-md hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none"
      >
        {viewSavedOnly ? '← Browse Remote Jobs' : 'Reset All Filters'}
      </button>
    </div>
  );
}
