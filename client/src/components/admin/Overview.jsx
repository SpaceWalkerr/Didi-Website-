import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { rupees } from '../../lib/format.js';
import { ErrorNote, Stat, StatusPill } from './shared.jsx';

const dayLabel = (date) =>
  new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Bookings per day, a week back to a week ahead. Today is the darker bar. */
function DayBars({ series, today }) {
  const max = Math.max(1, ...series.map((s) => s.bookings));
  return (
    <figure>
      <div className="flex h-40 items-end gap-1 sm:gap-2" role="img" aria-label="Bookings per day, last 7 days and next 7 days">
        {series.map((s) => (
          <div key={s.date} className="flex h-full flex-1 flex-col items-center justify-end" title={`${dayLabel(s.date)}: ${s.bookings} booking${s.bookings === 1 ? '' : 's'}, ${rupees(s.revenue)}`}>
            <span className="mb-1 text-[11px] font-semibold text-slate-600">{s.bookings || ''}</span>
            <div
              className={`w-full rounded-t ${s.date === today ? 'bg-brand-700' : s.date > today ? 'bg-brand-300' : 'bg-brand-500'}`}
              style={{ height: `${Math.max(s.bookings ? 6 : 2, (s.bookings / max) * 100)}%`, opacity: s.bookings ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-2" aria-hidden="true">
        {series.map((s) => (
          <span key={s.date} className={`flex-1 text-center text-[10px] sm:text-xs ${s.date === today ? 'font-bold text-brand-800' : 'text-slate-500'}`}>
            {Number(s.date.slice(8))}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 text-[13px] text-slate-500">Confirmed and completed bookings. Lighter bars are upcoming.</figcaption>
    </figure>
  );
}

export default function Overview({ token, onGoTo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminOverview(token));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(b) {
    const ok = window.confirm(
      `Confirm ${rupees(b.amount)} received from ${b.patientName}?\n\nUTR ${b.payment.paymentId}. Check your bank or UPI app first. The patient will be told their booking is confirmed.`,
    );
    if (!ok) return;
    try {
      await api.adminConfirmPayment(token, b.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <><ErrorNote>{error}</ErrorNote><p className="text-slate-500">Loading…</p></>;
  const s = data.stats;

  return (
    <div className="space-y-8">
      <ErrorNote>{error}</ErrorNote>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today" value={`${s.todayRemaining} left`} highlight />
        <Stat label="Upcoming" value={s.upcoming} />
        <Stat label="This month" value={rupees(s.monthRevenue)} />
        <Stat label="All time" value={rupees(s.totalRevenue)} />
        <Stat label="Patients seen" value={s.patients} />
        <Stat label="Completed visits" value={s.completed} />
        <Stat label="Payments to verify" value={data.awaitingVerification.length} highlight={data.awaitingVerification.length > 0} />
        <Stat label="Need attention" value={s.needsAttention} highlight={s.needsAttention > 0} />
        <Stat label="Refunds to send" value={s.refundsDue} highlight={s.refundsDue > 0} />
      </dl>

      {data.awaitingVerification.length > 0 && (
        <section aria-labelledby="verify-h" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 id="verify-h" className="font-sans text-lg font-semibold text-amber-900">
            Payments waiting for you ({data.awaitingVerification.length})
          </h2>
          <p className="mt-1 text-[15px] text-amber-900">
            Check each amount and reference in your bank or UPI app, then confirm.
          </p>
          <ul className="mt-4 space-y-3">
            {data.awaitingVerification.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-900">{b.patientName} · {rupees(b.amount)}</p>
                  <p className="text-[15px] text-slate-600">{b.when} · UTR <span className="font-mono">{b.payment.paymentId}</span></p>
                </div>
                <button type="button" onClick={() => confirm(b)} className="btn-primary !py-2">Confirm payment</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.refundsDue.length > 0 && (
        <section aria-labelledby="refund-h" className="rounded-2xl border border-red-300 bg-red-50 p-5">
          <h2 id="refund-h" className="font-sans text-lg font-semibold text-red-900">
            Refunds to send ({data.refundsDue.length})
          </h2>
          <p className="mt-1 text-[15px] text-red-900">
            These bookings were cancelled after payment. Send the money back by UPI, then mark it refunded in Bookings.
          </p>
          <ul className="mt-4 space-y-3">
            {data.refundsDue.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-900">{b.patientName} · {rupees(b.amount)}</p>
                  <p className="text-[15px] text-slate-600">+91 {b.phone} · {b.when} · UTR <span className="font-mono">{b.payment.paymentId || 'n/a'}</span></p>
                </div>
                <button type="button" onClick={() => onGoTo('bookings')} className="btn-secondary !py-2">Open bookings</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="today-h" className="card">
          <div className="flex items-center justify-between gap-3">
            <h2 id="today-h" className="font-sans text-lg font-semibold">Today's schedule</h2>
            <button type="button" onClick={() => onGoTo('bookings')} className="text-[15px] font-medium text-brand-700 hover:underline">All bookings</button>
          </div>
          {data.todaysBookings.length === 0 ? (
            <p className="mt-4 text-[15px] text-slate-500">Nothing booked for today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200">
              {data.todaysBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{b.time} · {b.patientName}</p>
                    <p className="text-[15px] text-slate-600">{b.serviceName} · {b.durationMinutes} min</p>
                  </div>
                  <StatusPill status={b.status} awaiting={b.awaitingVerification} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="chart-h" className="card">
          <h2 id="chart-h" className="font-sans text-lg font-semibold">Bookings, 7 days either side</h2>
          <div className="mt-5"><DayBars series={data.series} today={data.today} /></div>
        </section>
      </div>
    </div>
  );
}
