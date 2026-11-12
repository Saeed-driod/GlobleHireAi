import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export default function AdSlot({ type = 'in-feed', className = '' }) {
  const containerRef = useRef(null);
  const [adSettings, setAdSettings] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scriptRendered, setScriptRendered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings/ads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) setAdSettings(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // IntersectionObserver for 90+ PageSpeed
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Safe script injection
  useEffect(() => {
    if (!isVisible || scriptRendered || !adSettings) return;
    if (!adSettings.master_enabled) return;

    let targetScriptCode = '';
    if (type === 'leaderboard') targetScriptCode = adSettings.adsterra_header_banner || '';
    else if (type === 'in-feed') targetScriptCode = adSettings.adsterra_infeed_banner || '';
    else if (type === 'sidebar') targetScriptCode = adSettings.adsterra_sidebar_banner || '';

    const raw = targetScriptCode.trim();
    if (!raw) return;

    const container = containerRef.current;
    if (!container) return;

    const adTargetBox = container.querySelector('.ad-script-mount');
    if (!adTargetBox) return;

    adTargetBox.innerHTML = '';

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = raw;

      const nonScripts = Array.from(tempDiv.childNodes).filter((n) => n.nodeName !== 'SCRIPT');
      nonScripts.forEach((n) => adTargetBox.appendChild(n.cloneNode(true)));

      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        newScript.async = true;
        for (let i = 0; i < oldScript.attributes.length; i++) {
          const attr = oldScript.attributes[i];
          newScript.setAttribute(attr.name, attr.value);
        }
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        adTargetBox.appendChild(newScript);
      });

      setScriptRendered(true);
    } catch (err) {
      console.warn(`[JobPortal AdSlot ${type} Injection Error]:`, err);
    }
  }, [isVisible, scriptRendered, adSettings, type]);

  if (adSettings && !adSettings.master_enabled) return null;

  const hasConfiguredScript = Boolean(
    adSettings &&
      ((type === 'leaderboard' && adSettings.adsterra_header_banner?.trim()) ||
        (type === 'in-feed' && adSettings.adsterra_infeed_banner?.trim()) ||
        (type === 'sidebar' && adSettings.adsterra_sidebar_banner?.trim()))
  );

  // 1. TOP LEADERBOARD BANNER
  if (type === 'leaderboard') {
    return (
      <aside
        ref={containerRef}
        aria-label="Sponsored Display"
        className={`w-full max-w-5xl mx-auto my-5 px-4 flex flex-col items-center justify-center ${className}`}
      >
        <div className="w-full flex items-center justify-between max-w-[728px] mb-1 px-1">
          <span className="text-[9px] font-mono tracking-widest text-[#6C7A72] dark:text-slate-400 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00DF81]" />
            Sponsored Display
          </span>
          <span className="text-[9px] font-mono text-[#8C9B92]">Adsterra Golden Network</span>
        </div>

        <div className="w-full min-h-[50px] md:min-h-[90px] max-w-[728px] rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-sm">
          <div className="ad-script-mount w-full flex items-center justify-center">
            {!hasConfiguredScript && (
              <div className="w-full p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E3F9ED] text-[#0A5734] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#00DF81]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E3F9ED] text-[#0A5734]">Sponsored</span>
                      <p className="text-xs sm:text-sm font-bold text-[#17261F] dark:text-white">Scale Your Global Remote Engineering Team</p>
                    </div>
                    <p className="text-xs text-[#6C7A72] dark:text-slate-400 mt-0.5">Hire vetted senior full-stack and AI engineers with international compliance.</p>
                  </div>
                </div>
                <a
                  href="https://globalhireai.vercel.app/?category=Software%20Dev"
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold bg-[#0A241B] hover:bg-[#12382B] text-white transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  View Tech Jobs <ExternalLink className="w-3.5 h-3.5 text-[#00DF81]" />
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 2. IN-FEED NATIVE JOB AD (Every 5th Card)
  return (
    <article
      ref={containerRef}
      aria-label="Sponsored Job Listing"
      className={`v22-card p-6 border-2 border-[#BCE8D3] dark:border-[#0A5734] bg-gradient-to-br from-[#E3F9ED]/40 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden group transition-all shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-black/[0.05] dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E3F9ED] dark:bg-emerald-950 text-[#0A5734] dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#00DF81]/30">
            <Sparkles className="w-2.5 h-2.5" />
            Sponsored Job
          </span>
          <span className="text-xs text-[#6C7A72] dark:text-slate-400 font-medium">Verified Partner</span>
        </div>
        <span className="text-[10px] font-mono text-[#8C9B92]">Adsterra Native</span>
      </div>

      <div className="ad-script-mount min-h-[140px] flex items-center justify-center">
        {!hasConfiguredScript && (
          <div className="w-full flex flex-col justify-between h-full">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0A241B] text-[#00DF81] flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-base font-bold text-[#17261F] dark:text-white group-hover:text-[#0A5734] transition-colors">
                  AI Engineering &amp; Cloud Architecture Residency
                </h4>
                <p className="text-xs font-semibold text-[#6C7A72] dark:text-slate-400 mt-0.5">
                  Global Accelerator • Remote Worldwide • Full Funding + $120k Grant
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-xs font-bold text-[#0A5734] dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#00DF81]" /> Direct Fast-Track
              </span>
              <a
                href="https://globalhireai.vercel.app"
                target="_blank"
                rel="nofollow noopener sponsored"
                className="px-4 py-2 rounded-2xl text-xs font-extrabold text-[#0A241B] bg-[#00DF81] hover:bg-[#2EF8A0] transition-all shadow-sm"
              >
                Apply Fast-Track →
              </a>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
