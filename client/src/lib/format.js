export const rupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

/** "2026-09-20" + "14:30" → "Sun, 20 Sep 2026 at 2:30 PM" */
export const formatDateTime = (date, time) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(`${date}T${time}:00+05:30`));

/** "14:30" → "2:30 PM" */
export const formatTime = (time) => {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

/** Dates for the next N days, as {value, weekday, day, month, isToday}. */
export const upcomingDates = (count = 21) => {
  const fmt = (d, opts) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(d);
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
