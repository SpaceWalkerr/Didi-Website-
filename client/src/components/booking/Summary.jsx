import { formatDateTime, rupees } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { ClockIcon, ShieldIcon } from '../Icons.jsx';

/**
 * Sticky booking summary — what is being bought, and for how much. Styled as
 * the stub of the appointment ticket the patient gets at the end.
 */
export default function Summary({ service, date, time, rules, paymentMode, held }) {
  const { t, locale } = useI18n();
  const notSelected = t('booking.summary.notSelected');

  const rows = [
    [t('booking.summary.consultation'), service ? t(`services.items.${service.id}.name`) : notSelected],
    [t('booking.summary.duration'), service ? t('common.minutes', { count: service.durationMinutes }) : notSelected],
    [t('booking.summary.when'), date && time ? `${formatDateTime(date, time, locale)} IST` : notSelected],
  ];

  return (
    <aside className="relative lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-4xl border border-slate-200/80 bg-paper shadow-card">
        <div className="bg-deep px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fe0d5]">{t('ticket.label')}</p>
          <h2 className="mt-1 font-display text-xl !text-white">{t('booking.summaryTitle')}</h2>
        </div>

        {/* Perforation between the stub and the body. */}
        <div className="relative h-0" aria-hidden="true">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200/80 bg-cream" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200/80 bg-cream" />
        </div>

        <div className="px-6 pb-6 pt-5">
          <dl className="space-y-3 text-[0.9375rem]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-slate-300 pt-5">
            <span className="font-medium text-ink">{t('booking.summary.total')}</span>
            <span className="font-display text-3xl font-medium text-brand-700">{service ? rupees(service.price) : '—'}</span>
          </div>

          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            {t(paymentMode === 'upi' ? 'booking.secureNoteUpi' : 'booking.secureNote')}
          </p>

          {rules && !held && (
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-clay-700" />
              {t('hold.before', { minutes: rules.pendingHoldMinutes })}
            </p>
          )}

          {rules && (
            <p className="hint mt-3">
              {t('booking.holdNote', { hold: rules.pendingHoldMinutes, days: rules.maxDaysAhead, lead: rules.minLeadMinutes })}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
