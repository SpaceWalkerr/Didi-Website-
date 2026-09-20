import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, useI18n } from '../../i18n/index.jsx';

const GlobeIcon = ({ className = 'h-5 w-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);

/**
 * Language picker. Shows each language in its own script, because someone who
 * needs the Punjabi version is far more likely to recognise "ਪੰਜਾਬੀ" than the
 * word "Punjabi".
 */
export default function LanguageSwitcher({ variant = 'desktop' }) {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close on an outside click or Escape — standard menu behaviour.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // On mobile the menu is already open, so a plain list beats a nested dropdown.
  if (variant === 'mobile') {
    return (
      <div className="px-3 py-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('common.languageLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              lang={lang.code}
              onClick={() => setLanguage(lang.code)}
              aria-current={lang.code === language}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                lang.code === language
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
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
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600
                   transition hover:bg-slate-50 hover:text-brand-700"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('common.changeLanguage')}
      >
        <GlobeIcon className="h-4 w-4" />
        <span lang={current.code}>{current.native}</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('common.languageLabel')}
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200
                     bg-white py-1 shadow-lg"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                lang={lang.code}
                role="option"
                aria-selected={lang.code === language}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${
                  lang.code === language
                    ? 'bg-brand-50 font-semibold text-brand-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{lang.native}</span>
                <span className="text-xs text-slate-400">{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
