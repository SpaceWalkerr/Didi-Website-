import { Link } from '../../lib/router.jsx';
import { AlertIcon, ArrowRightIcon, HeartPulseIcon, WhatsAppIcon } from '../Icons.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { waLink } from '@shared/practice.config.js';

/**
 * The result card: what a general physician is commonly asked about for the
 * chosen area, and the route into booking.
 *
 * Concerns are framed as things patients come in *about* — never a diagnosis,
 * a promise or a treatment claim. Choosing one carries it into the booking
 * form as ?area= and ?topic=: prefilled text the patient can edit freely.
 */
export default function RegionPanel({ region, selectedTopic, onSelectTopic }) {
  const { t, tList } = useI18n();

  if (!region) {
    return (
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-4xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center lg:min-h-[22rem]">
        <span className="relative hidden h-14 w-14 items-center justify-center rounded-full bg-paper text-brand-700 shadow-card sm:flex">
          <HeartPulseIcon className="h-6 w-6" />
        </span>
        <p className="display-md sm:mt-5">{t('bodyMap.emptyTitle')}</p>
        <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-slate-600">{t('bodyMap.emptyBody')}</p>
      </div>
    );
  }

  const label = t(`bodyMap.regions.${region.id}.label`);
  const concerns = tList(`bodyMap.regions.${region.id}.concerns`);
  const params = new URLSearchParams({ area: region.id });
  if (selectedTopic) params.set('topic', selectedTopic);

  return (
    <div
      key={region.id}
      className="flex flex-col rounded-4xl border border-slate-200/80 bg-paper p-6 shadow-lift sm:p-8"
      style={{ animation: 'slide-up .55s var(--ease-calm) both' }}
    >
      <p className="eyebrow">{t('bodyMap.panelEyebrow')}</p>
      <h3 className="display-md mt-3">{label}</h3>
      <p className="mt-3 leading-relaxed text-slate-600">{t(`bodyMap.regions.${region.id}.summary`)}</p>

      {region.urgent && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">{t('emergency.label')}</strong>{' '}
            {t(`bodyMap.regions.${region.id}.urgentNote`)}
          </p>
        </div>
      )}

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('bodyMap.concernsTitle')}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {concerns.map((concern) => {
          const active = selectedTopic === concern;
          return (
            <li key={concern}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelectTopic(active ? null : concern)}
                className="chip"
              >
                {concern}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="hint mt-3">{t('bodyMap.concernsHint')}</p>

      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Link to={`/book?${params.toString()}`} className="btn-primary btn-lg flex-1">
          {t('bodyMapPlus.bookThis')}
          <ArrowRightIcon />
        </Link>
        <a
          href={waLink(t('whatsapp.bodyMap', { area: label, doctor: t('doctor.name') }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary btn-lg"
        >
          <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
          {t('bodyMap.askInstead')}
        </a>
      </div>
    </div>
  );
}
