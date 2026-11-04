import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { CheckIcon } from '../Icons.jsx';

const KEY = 'clinic-prepare';

/**
 * "What to keep ready" — a checklist the patient can tick off. Plain,
 * non-clinical wording. Ticks are kept on this phone only (localStorage) and
 * never sent anywhere. Real checkboxes, so it works with any assistive tech.
 */
export default function PrepareChecklist({ compact = false, id = 'prepare' }) {
  const { t, tList } = useI18n();
  const items = tList('prepare.items');
  const [done, setDone] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      // Private mode: ticks last for this visit.
    }
  }, [done]);

  const toggle = (i) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const count = done.filter((i) => i < items.length).length;
  const all = count === items.length;

  return (
    <div className={compact ? '' : 'rounded-[2.5rem] bg-sand-100 p-6 sm:p-10 lg:p-14'}>
      <div className={compact ? '' : 'grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16'}>
        <div>
          <p className="eyebrow">{t('prepare.eyebrow')}</p>
          <h2 id={`${id}-heading`} className={compact ? 'mt-3 font-sans text-lg font-semibold' : 'display-lg mt-4'}>
            {t('prepare.title')}
          </h2>
          {!compact && <p className="mt-5 text-lg leading-relaxed text-slate-600">{t('prepare.lede')}</p>}

          <div className="mt-6 flex items-center gap-3" aria-live="polite">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full w-full origin-left rounded-full bg-care-500 transition-transform duration-500 ease-calm"
                style={{ transform: `scaleX(${items.length ? count / items.length : 0})` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-600">
              {all ? t('prepare.done') : t('prepare.progress', { done: count, total: items.length })}
            </span>
          </div>
        </div>

        <div>
          <ul className="space-y-2.5">
            {items.map((item, i) => {
              const checked = done.includes(i);
              return (
                <li key={item}>
                  <label
                    className={`flex min-h-[3.25rem] cursor-pointer items-start gap-4 rounded-2xl border px-4 py-3.5 transition-[background-color,border-color,transform] duration-300 active:scale-[0.99]
                                focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 ${
                                  checked ? 'border-care-200 bg-care-50' : 'border-slate-200/80 bg-paper hover:border-brand-200'
                                }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(i)} className="peer sr-only" />
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color] duration-300 ${
                        checked ? 'border-care-600 bg-care-600 text-white' : 'border-slate-300 bg-paper text-transparent'
                      }`}
                    >
                      <CheckIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${checked ? 'scale-100' : 'scale-50'}`} />
                    </span>
                    <span className={`text-base leading-relaxed transition-colors ${checked ? 'text-slate-500 line-through decoration-care-400' : 'text-slate-700'}`}>
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {count > 0 && (
            <button type="button" onClick={() => setDone([])} className="btn-ghost mt-3 !min-h-[2.75rem] text-sm">
              {t('prepare.reset')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
