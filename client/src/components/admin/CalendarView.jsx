import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ErrorNote, StatusPill } from './shared.jsx';

const iso = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
const shift = (date, n) => iso(new Date(Date.parse(`${date}T12:00:00+05:30`) + n * 86400000));
/** Monday of the week containing `date`. */
const monday = (date) => {
  const dow = new Date(`${date}T12:00:00+05:30`).getUTCDay();
  return shift(date, -((dow + 6) % 7));
};
const longDay = (date) =>
  new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** One week at a glance: hours, time off and bookings for each day. */
export default function CalendarView({ token }) {
  const today = iso(new Date());
  const [from, setFrom] = useState(monday(today));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminCalendar(token, from, 7));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [token, from]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFrom(shift(from, -7))} className="btn-secondary !py-2">← Previous</button>
        <button type="button" onClick={() => setFrom(monday(today))} className="btn-secondary !py-2">This week</button>
        <button type="button" onClick={() => setFrom(shift(from, 7))} className="btn-secondary !py-2">Next →</button>
        <p className="ml-1 text-[15px] font-medium text-slate-700">{longDay(from)} – {longDay(shift(from, 6))}</p>
      </div>
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data?.days.map((day) => (
          <section
            key={day.date}
            aria-label={longDay(day.date)}
            className={`rounded-xl border p-4 ${day.date === today ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white'}`}
          >
            <h3 className="font-sans text-[15px] font-semibold text-slate-900">{longDay(day.date)}</h3>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {day.hours.length ? day.hours.map(([s, e]) => `${s}–${e}`).join(', ') : 'Closed'}
            </p>

            {day.blocks.map((b) => (
              <p key={b.id} className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[13px] text-red-800">
                Time off: {b.wholeDay ? 'whole day' : `${b.start}–${b.end}`}{b.reason ? ` · ${b.reason}` : ''}
              </p>
            ))}

            {day.bookings.length === 0 ? (
              <p className="mt-3 text-[13px] text-slate-400">No bookings</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {day.bookings.map((b) => (
                  <li key={b.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="text-[15px] font-semibold text-slate-900">{b.time} · {b.patientName}</p>
                    <p className="text-[13px] text-slate-600">{b.serviceName} · {b.durationMinutes} min</p>
                    <div className="mt-1"><StatusPill status={b.status} awaiting={b.awaitingVerification} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
