import { STARTING_PRICE } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';

/**
 * Native <details>/<summary> rather than a hand-rolled accordion.
 *
 * It is keyboard operable, screen-reader friendly and searchable with the
 * browser's own find-in-page for free — a scripted version has to reimplement
 * all three and usually gets at least one of them wrong.
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
    <div className="mx-auto mt-10 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {shown.map((item) => (
        <details key={item.q} className="group">
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5
                       text-left text-[17px] font-medium text-slate-900
                       hover:bg-brand-50/50 focus-visible:ring-2 focus-visible:ring-inset
                       focus-visible:ring-brand-600 [&::-webkit-details-marker]:hidden"
          >
            {item.q}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-45"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-slate-600">{fill(item.a)}</p>
        </details>
      ))}
    </div>
  );
}
