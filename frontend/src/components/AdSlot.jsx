import React, { useEffect, useRef, useState } from 'react';

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

  // Return null if no configured script exists — eliminates blank ad boxes & fake placeholders
  if (!hasConfiguredScript) return null;

  if (type === 'leaderboard') {
    return (
      <aside
        ref={containerRef}
        aria-label="Sponsored Display"
        className={`w-full max-w-5xl mx-auto my-5 px-4 flex flex-col items-center justify-center ${className}`}
      >
        <div className="w-full min-h-[50px] md:min-h-[90px] max-w-[728px] rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-sm">
          <div className="ad-script-mount w-full flex items-center justify-center" />
        </div>
      </aside>
    );
  }

  // In-feed native ad
  return (
    <article
      ref={containerRef}
      aria-label="Sponsored Job Listing"
      className={`v22-card p-6 border-2 border-[#BCE8D3] dark:border-[#0A5734] bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden group transition-all shadow-sm ${className}`}
    >
      <div className="ad-script-mount min-h-[140px] flex items-center justify-center" />
    </article>
  );
}
