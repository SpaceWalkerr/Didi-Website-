import { waLink } from '@shared/practice.config.js';
import { formatTime } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { Bone } from '../../design/Skeleton.jsx';

/**
 * Times for the chosen date.
 *
 * Unavailable slots stay in place, greyed, so the grid does not change shape
 * as the patient browses days. "Booked" and "the doctor is unavailable" are
 * distinguished: one means try another time, the other another day.
 */
export default function SlotGrid({ slots, loading, value, onChange }) {
  const { t, locale } = useI18n();

  if (loading) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label={t('common.loading')}>
        {Array.from({ length: 8 }, (_, i) => (
          <Bone key={i} className="h-12 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <p className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[0.9375rem] text-amber-900">
        {t('booking.noConsultDay')}
      </p>
    );
  }

  const available = slots.filter((s) => s.available);

  if (!available.length) {
    return (
      <p className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[0.9375rem] leading-relaxed text-amber-900">
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
          slot.reason === 'blocked' ? t('booking.blockedSlot') : slot.reason === 'booked' ? t('booking.alreadyBooked') : null;

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onChange(slot.time)}
            aria-pressed={selected}
            aria-label={why ? `${label} — ${why}` : label}
            title={why || undefined}
            className={`min-h-[3rem] rounded-2xl border px-2 py-2.5 text-[0.9375rem] font-medium tabular-nums
                        transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-calm focus-visible:ring-2 focus-visible:ring-brand-600
                        focus-visible:ring-offset-2 ${
                          !slot.available
                            ? 'cursor-not-allowed border-transparent bg-slate-100 text-slate-500 line-through'
                            : selected
                              ? 'scale-[1.03] border-action bg-action text-white shadow-[0_10px_24px_-12px_rgba(15,128,120,0.9)]'
                              : 'border-slate-200 bg-paper text-slate-700 hover:border-brand-300 active:scale-95'
                        }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
