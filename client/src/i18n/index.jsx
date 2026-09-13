import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';

/**
 * English is bundled — it is the default and the fallback for every missing
 * key, so it must always be there synchronously. The other five are dynamic
 * imports, which Vite splits into separate chunks: a patient reading English
 * never downloads the Punjabi or Russian dictionary.
 */
const LOADERS = {
  hi: () => import('./hi.js'),
  pa: () => import('./pa.js'),
  bho: () => import('./bho.js'),
  bgc: () => import('./bgc.js'),
  ru: () => import('./ru.js'),
};

/**
 * Languages offered in the switcher, in display order.
 *
 * `locale` is what Intl uses for dates and numbers. Bhojpuri and Haryanvi have
 * no CLDR locale data, so they borrow hi-IN — the text is translated, the date
 * formatting just follows Hindi conventions.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', locale: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', locale: 'hi-IN' },
  { code: 'bho', label: 'Bhojpuri', native: 'भोजपुरी', locale: 'hi-IN' },
  { code: 'bgc', label: 'Haryanvi', native: 'हरियाणवी', locale: 'hi-IN' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', locale: 'pa-IN' },
  { code: 'ru', label: 'Russian', native: 'Русский', locale: 'ru-RU' },
];

export const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'clinic-language';

const isSupported = (code) => code === DEFAULT_LANGUAGE || Boolean(code && LOADERS[code]);

/**
 * Indian states and union territories mapped to the language most likely to be
 * useful there. Only consulted when a region is known — see `detectLanguage`.
 *
 * Anything not listed falls through to English, which is the deliberate default:
 * we would rather show English than guess a regional language wrongly.
 */
export const REGION_LANGUAGE = {
  HR: 'bgc', // Haryana
  PB: 'pa',  // Punjab
  CH: 'pa',  // Chandigarh
  BR: 'bho', // Bihar
  JH: 'bho', // Jharkhand
  UP: 'hi',  // Uttar Pradesh — Bhojpuri is eastern UP only, so Hindi is the safer default
  MP: 'hi',
  RJ: 'hi',
  DL: 'hi',
  UK: 'hi',
  HP: 'hi',
  CT: 'hi',
};

/**
 * Picks a language, in order of how much we trust the signal:
 *
 *   1. What the visitor previously chose here        (explicit, wins over everything)
 *   2. ?lang= in the URL                             (lets the clinic share a link in one language)
 *   3. A region code, if one has been supplied       (see setRegion / the README)
 *   4. The browser's own language preferences        (reliable, needs no permission, no network)
 *   5. Time zone, which distinguishes Russia         (every Indian state shares IST, so it cannot
 *                                                     tell them apart — only country-level)
 *   6. English
 */
export function detectLanguage(region = null) {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // Private browsing can throw on localStorage access — carry on detecting.
  }

  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isSupported(fromUrl)) return fromUrl;

  const fromRegion = REGION_LANGUAGE[String(region || '').toUpperCase()];
  if (isSupported(fromRegion)) return fromRegion;

  for (const tag of navigator.languages || [navigator.language || '']) {
    const lower = tag.toLowerCase();
    // Exact tags first (bho, bgc, pa-in), then the base subtag.
    const base = lower.split('-')[0];
    if (isSupported(base)) return base;
    if (lower.startsWith('pa')) return 'pa';
  }

  try {
    if (Intl.DateTimeFormat().resolvedOptions().timeZone?.startsWith('Europe/Moscow')) return 'ru';
  } catch {
    // Intl is always present in supported browsers; ignore if it ever is not.
  }

  return DEFAULT_LANGUAGE;
}

/** Reads a dot path out of a dictionary. Returns undefined rather than throwing. */
const lookup = (dict, path) =>
  path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict);

/** Replaces {placeholders}. Values that are not supplied are left as-is. */
const interpolate = (value, vars) =>
  typeof value === 'string' && vars
    ? value.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
    : value;

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => detectLanguage());
  const [dicts, setDicts] = useState({ en });

  const setLanguage = useCallback((code) => {
    if (!isSupported(code)) return;
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Preference just won't persist; the site still works.
    }
  }, []);

  // Fetch the chosen dictionary. Until it arrives `t` falls back to English, so
  // the page stays readable rather than blank or full of raw keys.
  useEffect(() => {
    if (dicts[language] || !LOADERS[language]) return undefined;

    let active = true;
    LOADERS[language]()
      .then((module) => {
        if (active) setDicts((prev) => ({ ...prev, [language]: module.default }));
      })
      .catch(() => {
        // Chunk failed to load (offline, cache miss). English is already showing.
      });

    return () => {
      active = false;
    };
  }, [language, dicts]);

  // Screen readers and search engines both rely on this being right.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const dict = dicts[language] || en;
    const meta = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

    /**
     * Translate. Falls back to English when a key is missing from the active
     * language, so an incomplete translation never shows a blank or a raw key.
     * Returns non-string values (arrays, objects) untouched for list content.
     */
    const t = (path, vars) => {
      const found = lookup(dict, path);
      const value = found === undefined ? lookup(en, path) : found;
      if (value === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${path}`);
        return path;
      }
      return interpolate(value, vars);
    };

    /** Always an array — for repeated blocks like steps, FAQs and credentials. */
    const tList = (path) => {
      const value = t(path);
      return Array.isArray(value) ? value : [];
    };

    return {
      language,
      setLanguage,
      locale: meta.locale,
      isEnglish: language === DEFAULT_LANGUAGE,
      /** False while a language's chunk is still downloading. */
      ready: Boolean(dicts[language]),
      t,
      tList,
    };
  }, [language, dicts, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
}
