import React from 'react';

export default function Footer({ onOpenLegalModal }) {
  return (
    <footer className="mt-20 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#E5E8E2] dark:bg-[#071510] py-12 text-center text-xs text-[#6C7A72] dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-xl bg-[#0A241B] dark:bg-[#00DF81] flex items-center justify-center text-[#00DF81] dark:text-[#0A241B] font-black text-xs">
            G
          </div>
          <span className="font-bold text-[#17261F] dark:text-white text-sm">GlobalHire AI</span>
        </div>

        <p className="max-w-md mx-auto text-[#6C7A72] dark:text-slate-400 text-[11px] leading-relaxed">
          Curated from trusted job boards. Remote listings aggregated from Remotive, Arbeitnow, Jobicy, and Himalayas.
        </p>

        {/* Legal & Trust Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[#57685E] dark:text-slate-300 text-[11px] font-semibold">
          <button 
            type="button" 
            onClick={() => onOpenLegalModal('about')} 
            aria-label="Read About Us"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            About Us
          </button>
          <span aria-hidden="true">•</span>
          <button 
            type="button" 
            onClick={() => onOpenLegalModal('contact')} 
            aria-label="Contact and Support"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Contact & Support
          </button>
          <span aria-hidden="true">•</span>
          <button 
            type="button" 
            onClick={() => onOpenLegalModal('privacy')} 
            aria-label="Read Privacy Policy"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Privacy Policy
          </button>
          <span aria-hidden="true">•</span>
          <button 
            type="button" 
            onClick={() => onOpenLegalModal('terms')} 
            aria-label="Read Terms of Service"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Terms of Service
          </button>
          <span aria-hidden="true">•</span>
          <a 
            href="/sitemap.xml" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="View Sitemap XML"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Sitemap
          </a>
        </div>

        <p className="text-[10px] text-[#8C9B92] pt-2">
          © {new Date().getFullYear()} GlobalHire AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
