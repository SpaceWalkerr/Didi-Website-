/**
 * Date, time and money formatting.
 *
 * Every function takes a `locale` so dates read naturally in the language the
 * patient is using.
 */

/**
 * Amounts always use Indian digit grouping (₹1,00,000), whatever the interface
 * language — it is an Indian fee in rupees, and the grouping is part of how the
 * number is recognised.
 */
export const rupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

/** "2026-09-20" + "14:30" → "Sun, 20 Sep 2026 at 2:30 PM", localised. */
export const formatDateTime = (date, time, locale = 'en-IN') =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`${date}T${time}:00+05:30`));

/** "14:30" → "2:30 PM" (or "14:30" in locales that use a 24-hour clock). */
export const formatTime = (time, locale = 'en-IN') =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`2000-01-01T${time}:00+05:30`));

/** Dates for the next N days, as {value, weekday, day, month, isToday}. */
export const upcomingDates = (count = 21, locale = 'en-IN') => {
  const fmt = (d, opts) => new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', ...opts }).format(d);
  // en-CA gives the ISO "YYYY-MM-DD" the API expects, whatever the display locale.
  const iso = (d) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return {
      value: iso(d),
      weekday: fmt(d, { weekday: 'short' }),
      day: fmt(d, { day: 'numeric' }),
      month: fmt(d, { month: 'short' }),
      isToday: i === 0,
    };
  });
};
