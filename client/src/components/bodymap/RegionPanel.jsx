import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { AlertIcon, ArrowRightIcon, WhatsAppIcon } from '../Icons.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { waLink } from '@shared/practice.config.js';

/**
 * The detail panel beside the figure: what a general physician commonly sees
 * for the selected area, and the route into booking.
 *
 * The concerns are framed as things patients come in *about* — never as a
 * diagnosis, a promise or a treatment claim. Selecting one carries it into the
 * booking form as ?area= and ?topic=, which is all the "carries the concern
 * through" behaviour amounts to: prefilled text the patient can edit freely.
 */
export default function RegionPanel({ region, selectedTopic, onSelectTopic }) {
  const { t, tList } = useI18n();
  const reduced = useReducedMotion();

  if (!region) {
    return (
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center">
        <p className="font-display text-xl text-slate-900">{t('bodyMap.emptyTitle')}</p>
        <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-slate-600">
          {t('bodyMap.emptyBody')}
        </p>
      </div>
    );
  }

  const label = t(`bodyMap.regions.${region.id}.label`);
  const concerns = tList(`bodyMap.regions.${region.id}.concerns`);

  const params = new URLSearchParams({ area: region.id });
  if (selectedTopic) params.set('topic', selectedTopic);

  return (
    <m.div
      key={region.id}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7"
    >
      <p className="eyebrow">{t('bodyMap.panelEyebrow')}</p>
      <h3 className="mt-2 text-2xl">{label}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
        {t(`bodyMap.regions.${region.id}.summary`)}
      </p>

      {region.urgent && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">{t('emergency.label')}</strong>{' '}
            {t(`bodyMap.regions.${region.id}.urgentNote`)}
          </p>
        </div>
      )}

      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t('bodyMap.concernsTitle')}
      </p>

      {/* Single-select: picking one is optional and only prefills the form. */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {concerns.map((concern) => {
          const active = selectedTopic === concern;
          return (
            <li key={concern}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelectTopic(active ? null : concern)}
                className={`min-h-[2.5rem] rounded-full border px-3.5 py-2 text-left text-[15px]
                            transition-colors focus-visible:ring-2 focus-visible:ring-brand-600
                            focus-visible:ring-offset-2 ${
                              active
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                            }`}
              >
                {concern}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="hint mt-3">{t('bodyMap.concernsHint')}</p>

      <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row">
        <Link to={`/book?${params.toString()}`} className="btn-primary flex-1">
          {t('common.book')}
          <ArrowRightIcon />
        </Link>
        <a
          href={waLink(t('whatsapp.bodyMap', { area: label }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {t('bodyMap.askInstead')}
        </a>
      </div>
    </m.div>
  );
}
