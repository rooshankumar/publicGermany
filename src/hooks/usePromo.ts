import { useEffect, useState } from 'react';

// Shows a promo at most once per session with a cooldown (ms)
export function usePromoOncePerSession(key: string, cooldownMs = 6 * 60 * 60 * 1000) {
  const storageKey = `promo:lastShown:${key}`;
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    try {
      const last = sessionStorage.getItem(storageKey);
      const lastNum = last ? parseInt(last, 10) : 0;
      const now = Date.now();
      if (!lastNum || now - lastNum > cooldownMs) {
        setShouldShow(true);
      }
    } catch (_) {
      // If storage fails, fallback to showing once
      setShouldShow(true);
    }
  }, []);

  const markShown = () => {
    try {
      sessionStorage.setItem(storageKey, String(Date.now()));
    } catch (_) {}
    setShouldShow(false);
  };

  return { shouldShow, markShown };
}
