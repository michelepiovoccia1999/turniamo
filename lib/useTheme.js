import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'turniamo_theme';

export function useTheme() {
  const [theme, setTheme] = useState(null); // 'light' | 'dark' | null (segue il sistema)

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveCurrent = current || (prefersDark ? 'dark' : 'light');
      const next = effectiveCurrent === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        // storage non disponibile, ignora
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
