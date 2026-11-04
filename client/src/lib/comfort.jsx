import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Comfort controls: night mode and text size.
 *
 * Many patients are older, or are reading at night with a worry they could
 * not sleep on. Both settings are remembered on the device and applied before
 * first paint by the boot script in index.html (same storage key), so this
 * provider only has to keep <html> in step when the visitor changes them.
 *
 *   theme: 'auto' (follow the phone) | 'light' | 'night'
 *   text:  'normal' | 'large' (112.5%) | 'xl' (125%)
 */
const KEY = 'clinic-comfort';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

const ComfortContext = createContext(null);
const darkQuery = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function ComfortProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ theme: 'auto', text: 'normal', ...read() }));
  const [systemDark, setSystemDark] = useState(() => Boolean(darkQuery()?.matches));

  useEffect(() => {
    const q = darkQuery();
    if (!q) return undefined;
    const on = (e) => setSystemDark(e.matches);
    q.addEventListener?.('change', on);
    return () => q.removeEventListener?.('change', on);
  }, []);

  const night = settings.theme === 'night' || (settings.theme === 'auto' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (night) root.setAttribute('data-theme', 'night');
    else root.removeAttribute('data-theme');
    if (settings.text === 'normal') root.removeAttribute('data-text-size');
    else root.setAttribute('data-text-size', settings.text);
    // The browser chrome follows the page, so the status bar matches at night.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', night ? '#0b1615' : '#fbf7f0'));
  }, [night, settings.text]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Private mode: the choice lasts for this visit only.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...settings, night, update }), [settings, night, update]);
  return <ComfortContext.Provider value={value}>{children}</ComfortContext.Provider>;
}

export const useComfort = () => useContext(ComfortContext);
