import React from 'react';
import { Compass, Check, X } from 'lucide-react';

const WORKPLACE_OPTIONS = [
  { id: 'Remote', label: '🌍 Remote' },
  { id: 'Hybrid', label: '🏢 Hybrid' },
  { id: 'On-site', label: '📍 On-site' },
  { id: 'All', label: '🌐 All Modes' },
];

const CATEGORY_CHIPS = [
  'All',
  'Software Dev',
  'AI / Data',
  'Design',
  'Marketing',
  'Management',
  'Customer Support',
  'DevOps / Cloud'
];

export default function FilterBar({
  category,
  setCategory,
  workplaceMode,
  setWorkplaceMode,
  countryFilter,
  setCountryFilter,
  salaryFilter,
  setSalaryFilter,
  experienceLevel,
  setExperienceLevel,
  openToPakistan,
  setOpenToPakistan,
  visaSponsored,
  setVisaSponsored,
  hideExpired,
  setHideExpired,
  onResetAll
}) {
  const hasActiveFilters = 
    countryFilter !== 'All' || 
    salaryFilter !== 'All' || 
    experienceLevel !== 'All' || 
    openToPakistan || 
    visaSponsored || 
    hideExpired || 
    workplaceMode !== 'Remote' || 
    category !== 'All';

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#11231C] border border-black/[0.06] dark:border-white/[0.08] shadow-sm mb-8 space-y-4">
      
      {/* Top Row: Workplace Mode Segment + Category Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Workplace Segmented Control */}
        <div 
          role="radiogroup" 
          aria-label="Workplace Mode"
          className="inline-flex items-center p-1 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 border border-black/[0.04] dark:border-white/5 shrink-0"
        >
          {WORKPLACE_OPTIONS.map((opt) => {
            const isSelected = workplaceMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setWorkplaceMode(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none ${
                  isSelected
                    ? 'bg-white dark:bg-[#0A241B] text-[#0A5734] dark:text-[#00DF81] shadow-sm'
                    : 'text-[#6C7A72] dark:text-slate-400 hover:text-[#17261F] dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Category Chips - Scrollable Row on Mobile */}
        <div 
          role="group" 
          aria-label="Job Categories"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none"
        >
          {CATEGORY_CHIPS.map((c) => {
            const isActive = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={isActive}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-2xl transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none ${
                  isActive
                    ? 'bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold shadow-sm'
                    : 'bg-[#F4F6F2] dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[#57685E] dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

      </div>

      {/* Bottom Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/5 text-xs">
        
        {/* Open to Pakistan Toggle */}
        <button
          type="button"
          onClick={() => setOpenToPakistan(prev => !prev)}
          aria-pressed={openToPakistan}
          aria-label="Filter jobs open to candidates in Pakistan"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none ${
            openToPakistan
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <span>🇵🇰 Open to Pakistan</span>
          {openToPakistan && <Check className="w-3.5 h-3.5" />}
        </button>

        {/* Visa Sponsorship Toggle */}
        <button
          type="button"
          onClick={() => setVisaSponsored(prev => !prev)}
          aria-pressed={visaSponsored}
          aria-label="Filter visa sponsored and relocation jobs"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none ${
            visaSponsored
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Visa Sponsorship</span>
          {visaSponsored && <Check className="w-3.5 h-3.5" />}
        </button>

        {/* Country / Region Select */}
        <div className="relative">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filter by candidate country or region"
            className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none cursor-pointer"
          >
            <option value="All">All Regions</option>
            <option value="Worldwide">🌍 Worldwide Only</option>
            <option value="Pakistan">🇵🇰 Pakistan Friendly</option>
            <option value="North America">🇺🇸 North America (US/CA)</option>
            <option value="Europe">🇪🇺 Europe & UK</option>
            <option value="Asia">🌏 Asia & Pacific</option>
          </select>
        </div>

        {/* Salary Range Select */}
        <select
          value={salaryFilter}
          onChange={(e) => setSalaryFilter(e.target.value)}
          aria-label="Filter by minimum salary range"
          className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none cursor-pointer"
        >
          <option value="All">All Salaries</option>
          <option value="$50k+">$50,000+ / yr</option>
          <option value="$100k+">$100,000+ / yr</option>
          <option value="$150k+">$150,000+ / yr</option>
          <option value="$200k+">$200,000+ / yr</option>
        </select>

        {/* Experience Level Select */}
        <select
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          aria-label="Filter by candidate experience level"
          className="px-3 py-1.5 rounded-2xl bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 font-semibold border-none focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none cursor-pointer"
        >
          <option value="All">All Experience Levels</option>
          <option value="Entry">Entry / Junior Level</option>
          <option value="Mid">Mid-Level</option>
          <option value="Senior">Senior Level</option>
          <option value="Lead">Lead / Staff / Director</option>
        </select>

        {/* Hide Expired Toggle */}
        <button
          type="button"
          onClick={() => setHideExpired(prev => !prev)}
          aria-pressed={hideExpired}
          aria-label="Toggle hiding expired job listings"
          className={`px-3 py-1.5 rounded-2xl font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#00DF81] focus-visible:outline-none ${
            hideExpired
              ? 'bg-[#0A241B] dark:bg-[#00DF81] text-[#00DF81] dark:text-[#0A241B] font-bold'
              : 'bg-[#F4F6F2] dark:bg-white/5 text-[#57685E] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Hide Expired (&gt;45d)
        </button>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetAll}
            aria-label="Clear all active filters"
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline px-2 py-1 ml-auto flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg focus-visible:outline-none"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}

      </div>
    </div>
  );
}
