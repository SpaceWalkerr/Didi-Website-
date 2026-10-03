/**
 * Date and time formatting for a booking, in the patient's own language.
 *
 * Its own module so that notify.js and whatsapp.js can both use it without
 * importing each other — the WhatsApp provider needs to format a time inside
 * the join message, and the notifier needs the WhatsApp link, which would
 * otherwise be a circular import.
 */

const LOCALES = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', ru: 'ru-RU' };

/** "Sun, 20 Sep 2026 at 2:30 PM", localised, always in IST. */
export function formatWhen(booking, language = 'en') {
  const when = new Date(`${booking.date}T${booking.time}:00+05:30`);
  return new Intl.DateTimeFormat(LOCALES[language] || 'en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(when);
}
