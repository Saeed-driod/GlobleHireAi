import React from 'react';
import { Bookmark } from 'lucide-react';

export default function SavedJobsBanner({ savedCount, onCloseSavedView }) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-[#E3F9ED] dark:bg-[#00DF81]/15 border border-[#BCE8D3] dark:border-[#00DF81]/30 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-[#0A5734] dark:text-[#00DF81] fill-current" />
        <span className="text-sm font-bold text-[#0A5734] dark:text-[#00DF81]">
          Saved Bookmarks View ({savedCount})
        </span>
      </div>
      <button
        type="button"
        onClick={onCloseSavedView}
        aria-label="View all remote jobs"
        className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/10 text-[#17261F] dark:text-white border border-black/[0.08] dark:border-white/10 hover:bg-slate-50 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none"
      >
        ← View All Remote Jobs
      </button>
    </div>
  );
}
