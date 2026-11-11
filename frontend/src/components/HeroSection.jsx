import React from 'react';
import { Search, MapPin, Briefcase, Sparkles, Filter, X } from 'lucide-react';

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onQuickPillClick,
  activeQuickPill
}) {
  const quickPills = [
    { id: 'remote', label: '🌍 Worldwide Remote', filter: { job_type: 'Remote', q: '' } },
    { id: 'tech', label: '💻 Tech & AI', filter: { category: 'Software Dev', q: '' } },
    { id: 'ai', label: '🧠 AI / Data', filter: { category: 'AI / Data', q: '' } },
    { id: 'design', label: '🎨 Design & Creative', filter: { category: 'Design', q: '' } },
    { id: 'marketing', label: '📈 Growth & Marketing', filter: { category: 'Marketing', q: '' } },
    { id: 'visa', label: '✈️ Visa Sponsored', filter: { q: 'visa' } },
  ];

  const categories = [
    'All Categories',
    'Software Dev',
    'AI / Data',
    'Design',
    'Marketing',
    'Management',
    'Customer Support',
    'DevOps / Cloud'
  ];

  return (
    <div className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-[#00DF81]/15 via-emerald-200/20 to-teal-200/20 blur-3xl pointer-events-none rounded-full"></div>

      <div className="relative max-w-4xl mx-auto space-y-5">
        
        {/* Top Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3F9ED] border border-[#BDEFD4] text-[#0A5734] text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#00DF81]" />
          <span>V22 Automated Worldwide Radar — 140+ Fresh Listings</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#17261F] tracking-tight leading-[1.12]">
          Work's always <br />
          <span className="text-[#0A5734] bg-gradient-to-r from-[#0A241B] via-[#0A5734] to-[#00DF81] bg-clip-text text-transparent">
            better together
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#57685E] leading-relaxed">
          Zero clutter, 100% verified opportunities automatically gathered from top international boards with salary clarity and direct applications.
        </p>

        {/* V22 White Pill Search Box */}
        <div className="max-w-3xl mx-auto mt-6 p-2 rounded-full bg-white border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col sm:flex-row items-center gap-2">
          
          {/* Main Search Input */}
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-5 h-5 text-[#8C9B92] absolute left-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, skill (Python, React), or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-transparent text-sm text-[#17261F] placeholder-[#8C9B92] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="hidden sm:block w-px h-7 bg-black/[0.08]"></div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-44">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-3 px-4 bg-transparent text-xs font-semibold text-[#3D4D43] focus:outline-none cursor-pointer rounded-full"
            >
              {categories.map((c, idx) => (
                <option key={idx} value={c === 'All Categories' ? 'All' : c} className="bg-white text-[#17261F]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={() => {}}
            className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-extrabold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-[0_4px_14px_rgba(0,223,129,0.35)] shrink-0 active:scale-95"
          >
            Search Jobs
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-[#8C9B92] font-mono hidden sm:inline mr-1">Trending:</span>
          {quickPills.map((pill) => {
            const isSelected = activeQuickPill === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onQuickPillClick(pill)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-sm ${
                  isSelected 
                    ? 'bg-[#0A241B] text-[#00DF81] shadow-md scale-105' 
                    : 'bg-white hover:bg-slate-50 border border-black/[0.05] text-[#3D4D43] hover:text-[#17261F]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
