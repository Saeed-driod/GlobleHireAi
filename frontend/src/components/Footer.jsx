import React from 'react';

const CATEGORY_SEO_LINKS = [
  { href: '/remote-software-dev-jobs', label: 'Remote Software Dev Jobs', cat: 'Software Dev' },
  { href: '/remote-ai-data-jobs', label: 'Remote AI & Data Jobs', cat: 'AI / Data' },
  { href: '/remote-devops-cloud-jobs', label: 'Remote DevOps & Cloud Jobs', cat: 'DevOps / Cloud' },
  { href: '/remote-design-jobs', label: 'Remote Design Jobs', cat: 'Design' },
  { href: '/remote-marketing-jobs', label: 'Remote Marketing Jobs', cat: 'Marketing' },
  { href: '/remote-customer-support-jobs', label: 'Remote Customer Support Jobs', cat: 'Customer Support' },
  { href: '/remote-management-jobs', label: 'Remote Management Jobs', cat: 'Management' },
];

export default function Footer({ onOpenLegalModal, onSelectCategory }) {
  return (
    <footer className="mt-20 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#E5E8E2] dark:bg-[#071510] py-12 text-center text-xs text-[#6C7A72] dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
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

        {/* SEO Crawlable Category Landing Pages */}
        <nav aria-label="Remote Job Categories" className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          {CATEGORY_SEO_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (onSelectCategory) {
                  e.preventDefault();
                  window.history.pushState({}, '', item.href);
                  onSelectCategory(item.cat);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 text-[10px] font-semibold text-[#3D4D43] dark:text-slate-300 hover:text-[#0A5734] dark:hover:text-[#00DF81] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Legal & Trust Links (Crawlable <a> tags + Modal UX) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[#57685E] dark:text-slate-300 text-[11px] font-semibold">
          <a 
            href="/about"
            onClick={(e) => { e.preventDefault(); onOpenLegalModal('about'); }} 
            aria-label="Read About Us"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            About Us
          </a>
          <span aria-hidden="true">•</span>
          <a 
            href="/contact"
            onClick={(e) => { e.preventDefault(); onOpenLegalModal('contact'); }} 
            aria-label="Contact and Support"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Contact & Support
          </a>
          <span aria-hidden="true">•</span>
          <a 
            href="/privacy"
            onClick={(e) => { e.preventDefault(); onOpenLegalModal('privacy'); }} 
            aria-label="Read Privacy Policy"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Privacy Policy
          </a>
          <span aria-hidden="true">•</span>
          <a 
            href="/terms"
            onClick={(e) => { e.preventDefault(); onOpenLegalModal('terms'); }} 
            aria-label="Read Terms of Service"
            className="hover:text-[#0A241B] dark:hover:text-[#00DF81] underline focus-visible:ring-2 focus-visible:ring-[#00DF81] rounded-sm focus-visible:outline-none"
          >
            Terms of Service
          </a>
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
