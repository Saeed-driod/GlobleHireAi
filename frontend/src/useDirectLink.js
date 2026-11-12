import { useState, useEffect } from 'react';

const COOLDOWN_KEY = 'gh_smartlink_last_timestamp';
const COOLDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function triggerDirectLink(targetUrl, smartlinkUrl) {
  if (typeof window === 'undefined') return;

  const smartlink = smartlinkUrl?.trim();
  if (!smartlink) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const now = Date.now();
  let lastTimestamp = 0;
  try {
    const stored = sessionStorage.getItem(COOLDOWN_KEY);
    if (stored) lastTimestamp = parseInt(stored, 10);
  } catch (e) {}

  const isCooldownActive = now - lastTimestamp < COOLDOWN_DURATION_MS;

  if (isCooldownActive) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    sessionStorage.setItem(COOLDOWN_KEY, now.toString());
  } catch (e) {}

  // Open legitimate target URL first
  window.open(targetUrl, '_blank', 'noopener,noreferrer');

  // Trigger Monetag / Adsterra Smartlink in separate tab
  try {
    window.open(smartlink, '_blank', 'noopener,noreferrer');
  } catch (e) {}
}

export function useDirectLink() {
  const [adSettings, setAdSettings] = useState(null);

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

  return {
    adSettings,
    smartlinkUrl: adSettings?.direct_link_url,
    masterEnabled: adSettings?.master_enabled ?? true,
    triggerDirectLink: (targetUrl) => {
      const smartlink = adSettings?.master_enabled ? adSettings?.direct_link_url : undefined;
      triggerDirectLink(targetUrl, smartlink);
    },
  };
}
