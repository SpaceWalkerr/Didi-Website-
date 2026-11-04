import { STARTING_PRICE } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';

/**
 * Native <details>/<summary>: keyboard operable, screen-reader friendly and
 * searchable with find-in-page for free.
 */
export default function FaqAccordion({ items, limit }) {
  const { t } = useI18n();
  const shown = limit ? items.slice(0, limit) : items;

  const fill = (text) =>
    text
      .replace('{price}', String(STARTING_PRICE))
      .replace('{weekdaysTime}', t('hours.weekdaysTime'))
      .replace('{saturdayTime}', t('hours.saturdayTime'));

  return (
    <div className="mt-12 border-t border-slate-300/70">
      {shown.map((item) => (
        <details key={item.q} className="faq group border-b border-slate-300/70">
          <summary
            className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-6 py-6 text-left font-display text-[1.3rem] leading-snug text-ink
                       transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 [&::-webkit-details-marker]:hidden"
          >
            {item.q}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 text-brand-700 transition-[transform,background-color] duration-300 group-open:rotate-45 group-open:bg-brand-50" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </summary>
          <p className="max-w-3xl pb-7 pr-14 text-lg leading-relaxed text-slate-600" style={{ animation: 'rise .4s var(--ease-calm) both' }}>
            {fill(item.a)}
          </p>
        </details>
      ))}
    </div>
  );
}
