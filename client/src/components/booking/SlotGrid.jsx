import { Link } from '../../lib/router.jsx';
import { waLink } from '@shared/practice.config.js';
import { formatTime } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';

/**
 * Times for the chosen date.
 *
 * Unavailable slots are shown greyed rather than removed — patients find a
 * grid that changes shape as they browse days much harder to read than one
 * where the same times are always in the same place.
 *
 * "Booked" and "the doctor is unavailable" are deliberately distinguished:
 * one means try another time, the other means try another day.
 */
export default function SlotGrid({ slots, loading, value, onChange }) {
  const { t, locale } = useI18n();

  if (loading) {
    return <p className="mt-3 text-slate-500">{t('common.loading')}</p>;
  }

  if (!slots.length) {
    return (
      <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[0.9375rem] text-amber-900">
        {t('booking.noConsultDay')}
      </p>
    );
  }

  const available = slots.filter((s) => s.available);

  if (!available.length) {
    return (
      <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[0.9375rem] leading-relaxed text-amber-900">
        {t('booking.allBooked')
          .split('{link}')
          .flatMap((part, i) =>
            i === 0
              ? [part]
              : [
                  <a
                    key="wa"
                    href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                  >
                    {t('booking.allBookedLink')}
                  </a>,
                  part,
                ],
          )}
      </p>
    );
  }

  return (
    <div role="group" aria-label={t('booking.availableTimes')} className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const selected = value === slot.time;
        const label = formatTime(slot.time, locale);
        const why =
          slot.reason === 'blocked'
            ? t('booking.blockedSlot')
            : slot.reason === 'booked'
              ? t('booking.alreadyBooked')
              : null;

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onChange(slot.time)}
            aria-pressed={selected}
            aria-label={why ? `${label} — ${why}` : label}
            title={why || undefined}
            className={`min-h-[2.75rem] rounded-xl border px-2 py-2.5 text-[0.9375rem] font-medium
                        transition-colors focus-visible:ring-2 focus-visible:ring-brand-600
                        focus-visible:ring-offset-2 ${
                          !slot.available
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                            : selected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-paper text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                        }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
