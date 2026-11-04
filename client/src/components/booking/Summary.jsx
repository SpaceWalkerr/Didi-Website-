import { formatDateTime, rupees } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { ShieldIcon } from '../Icons.jsx';

/** Sticky booking summary — what is being bought, and for how much. */
export default function Summary({ service, date, time, rules, paymentMode }) {
  const { t, locale } = useI18n();
  const notSelected = t('booking.summary.notSelected');

  const rows = [
    [t('booking.summary.consultation'), service ? t(`services.items.${service.id}.name`) : notSelected],
    [
      t('booking.summary.duration'),
      service ? t('common.minutes', { count: service.durationMinutes }) : notSelected,
    ],
    [t('booking.summary.when'), date && time ? formatDateTime(date, time, locale) : notSelected],
  ];

  return (
    <aside className="rounded-2xl border border-slate-200 bg-paper p-6 shadow-card lg:sticky lg:top-24">
      <h2 className="font-display text-xl">{t('booking.summaryTitle')}</h2>

      <dl className="mt-4 space-y-3 text-[0.9375rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
        <span className="font-medium text-slate-900">{t('booking.summary.total')}</span>
        <span className="font-display text-2xl font-semibold text-brand-800">
          {service ? rupees(service.price) : '—'}
        </span>
      </div>

      <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        {t(paymentMode === 'upi' ? 'booking.secureNoteUpi' : 'booking.secureNote')}
      </p>

      {rules && (
        <p className="hint mt-3">
          {t('booking.holdNote', {
            hold: rules.pendingHoldMinutes,
            days: rules.maxDaysAhead,
            lead: rules.minLeadMinutes,
          })}
        </p>
      )}
    </aside>
  );
}
