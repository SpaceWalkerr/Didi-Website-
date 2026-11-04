import { useI18n } from '../../i18n/index.jsx';

/**
 * Horizontal strip of upcoming dates.
 *
 * Each button carries an explicit aria-label built from the full date. The
 * visible content is three stacked fragments ("Mon" / "29" / "Sep") which a
 * screen reader would otherwise read as disconnected words — and which, in the
 * previous version of this page, produced buttons with no usable name at all.
 */
export default function DatePicker({ dates, value, onChange, minDate, maxDate, openDays }) {
  const { t } = useI18n();

  return (
    <div>
      <p className="label" id="date-label">
        {t('booking.date')}
      </p>
      <div
        role="group"
        aria-labelledby="date-label"
        className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
      >
        {dates
          .filter(
            (d) =>
              (!minDate || d.value >= minDate) &&
              (!maxDate || d.value <= maxDate) &&
              (!openDays?.length || openDays.includes(d.dow)),
          )
          .map((d) => {
            const selected = value === d.value;
            // The first line shows "Today" instead of the weekday on today's
            // button, so the accessible name has to use the same word in the
            // same order — WCAG 2.5.3 requires the accessible name to contain
            // the visible label, and "Mon 28 Sept, Today" did not contain the
            // visible "Today 28 Sept".
            const lead = d.isToday ? t('booking.today') : d.weekday;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => onChange(d.value)}
                aria-pressed={selected}
                aria-label={`${lead} ${d.day} ${d.month}`}
                className={`min-h-[4.5rem] w-[4.25rem] shrink-0 snap-start rounded-xl border px-2 py-2.5
                            text-center transition-colors focus-visible:ring-2
                            focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                              selected
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                            }`}
              >
                {/* opacity-80 on the teal selected state gave 3.67:1. The
                    muted tone is now a real colour per state instead. */}
                <span
                  aria-hidden="true"
                  className={`block text-xs uppercase tracking-wide ${
                    selected ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {lead}
                </span>{' '}
                {/* The spaces between these spans are load-bearing: without
                    them the button's text content reads "Today29Sept", which
                    no longer matches the accessible name. Voice-control users
                    say what they see, so the two have to agree. */}
                <span aria-hidden="true" className="mt-0.5 block text-lg font-semibold leading-none">
                  {d.day}
                </span>{' '}
                <span
                  aria-hidden="true"
                  className={`mt-0.5 block text-xs ${selected ? 'text-white' : 'text-slate-600'}`}
                >
                  {d.month}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
