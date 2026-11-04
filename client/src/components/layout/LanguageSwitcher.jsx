import { useEffect, useId, useRef, useState } from 'react';
import { LANGUAGES, useI18n } from '../../i18n/index.jsx';

const GlobeIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);

/**
 * Language picker. Each language is shown in its own script, because someone
 * who needs Punjabi recognises "ਪੰਜਾਬੀ" faster than the word "Punjabi".
 *
 * Choosing one preloads the dictionary and swaps the page inside a view
 * transition (see i18n/index.jsx), so the scripts dissolve into each other.
 * Options are plain buttons with aria-pressed, which every screen reader
 * announces once and correctly.
 */
export default function LanguageSwitcher({ variant = 'desktop' }) {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listId = useId();
  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'mobile') {
    return (
      <div className="px-1">
        <p className="mb-2.5 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t('common.languageLabel')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              lang={lang.code}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={lang.code === language}
              className={`min-h-[3rem] rounded-2xl border px-4 py-2 text-left text-base font-medium transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] ${
                lang.code === language
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50'
              }`}
            >
              {lang.native}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600
                   transition-colors hover:bg-slate-100 hover:text-ink"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('common.changeLanguage')}: ${current.native}`}
      >
        <GlobeIcon className="h-4 w-4" />
        <span lang={current.code}>{current.native}</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          aria-label={t('common.languageLabel')}
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-paper p-1 shadow-lift"
          style={{ animation: 'fade .18s ease-out both' }}
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                lang={lang.code}
                aria-pressed={lang.code === language}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex min-h-[2.75rem] w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-[0.9375rem] transition-colors ${
                  lang.code === language ? 'bg-brand-50 font-semibold text-brand-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{lang.native}</span>
                <span className="text-xs text-slate-500" lang="en">{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
