import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { rupees } from '../../lib/format.js';
import { UserIcon, WhatsAppIcon } from '../Icons.jsx';
import { ErrorNote, LANGUAGE_NAMES, NotesEditor, STATUS_STYLES } from './shared.jsx';

/** Every booking, with the actions the doctor needs: verify payment, notes, complete, cancel. */
export default function BookingsView({ token, onChange, initialScope = 'today' }) {
  const [data, setData] = useState(null);
  const [scope, setScope] = useState(initialScope);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminBookings(token, scope));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [token, scope]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    try {
      await action();
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    }
  }
  const confirmPayment = (id) => run(() => api.adminConfirmPayment(token, id));
  const markRefunded = (id) => run(() => api.adminMarkRefunded(token, id));
  const setStatus = (id, status) => run(() => api.adminUpdate(token, id, status));

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Which bookings to show">
        {['today', 'upcoming', 'all'].map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-[2.5rem] rounded-lg px-4 py-2 text-[0.9375rem] font-medium capitalize transition-colors ${
              scope === value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {value}
          </button>
        ))}
        <button type="button" onClick={load} className="btn-secondary !py-2 sm:ml-auto">Refresh</button>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="mt-6 space-y-4">
        {data?.bookings.length === 0 && (
          <p className="card text-[0.9375rem] text-slate-600">
            {scope === 'today'
              ? 'Nothing booked for today.'
              : scope === 'upcoming'
                ? 'No upcoming bookings.'
                : 'No bookings yet.'}
          </p>
        )}

        {data?.bookings.map((b) => (
          <article key={b.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">{b.when}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.status.replace('-', ' ')}
                  </span>
                  {b.status === 'pending' && b.payment.paymentId && (
                    <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Verify payment
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[0.9375rem] text-slate-600">
                  {b.serviceName} · {b.durationMinutes} min · {rupees(b.amount)} · ID {b.id}
                </p>
                {b.bodyRegion && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[0.8125rem] font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
                    Body map: {b.bodyRegion}
                  </p>
                )}
              </div>

              {b.whatsappLink && (
                <a
                  href={b.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp !py-2"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Open chat
                </a>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[16rem_1fr]">
              <div className="text-[0.9375rem]">
                <p className="flex items-center gap-1.5 font-medium text-slate-900">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  {b.patient.name}
                  {b.patient.age ? `, ${b.patient.age}` : ''}
                  {b.patient.gender ? ` · ${b.patient.gender}` : ''}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-slate-600">
                  Booked in {LANGUAGE_NAMES[b.language] || 'English'}
                </p>
                <p className="mt-1.5 text-slate-600">
                  <a href={`tel:+91${b.patient.phone}`} className="hover:text-brand-700">
                    +91 {b.patient.phone}
                  </a>
                </p>
                <p className="break-all text-slate-600">
                  <a href={`mailto:${b.patient.email}`} className="hover:text-brand-700">
                    {b.patient.email}
                  </a>
                </p>
                <p className="mt-2 text-[0.8125rem] text-slate-500">
                  Payment: {b.payment.status} ({b.payment.mode})
                </p>
                {b.refundDue && (
                  <p className="mt-1 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    Refund due · {rupees(b.amount)}
                  </p>
                )}
                {b.payment.mode === 'upi' && b.payment.paymentId && (
                  <p className="mt-1 text-[0.8125rem] text-slate-700">
                    UTR: <span className="font-mono font-semibold">{b.payment.paymentId}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600">
                  Symptom summary
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-slate-700">
                  {b.patient.symptoms}
                </p>
                {b.note && (
                  <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[0.9375rem] text-red-800">
                    {b.note}
                  </p>
                )}
              </div>
            </div>

            <NotesEditor token={token} booking={b} onSaved={load} />

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              {b.status === 'pending' && b.payment.paymentId && (
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      `Confirm ${rupees(b.amount)} received from ${b.patient.name}?\n\n` +
                        `UTR ${b.payment.paymentId}. Check this in your bank or UPI app first. ` +
                        'The patient will be told their booking is confirmed.',
                    );
                    if (ok) confirmPayment(b.id);
                  }}
                  className="btn-primary !py-2"
                >
                  Confirm payment
                </button>
              )}
              {b.refundDue && (
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      `Mark ${rupees(b.amount)} as refunded to ${b.patient.name}?\n\n` +
                        'Do this only after you have sent the money back by UPI. The patient is emailed.',
                    );
                    if (ok) markRefunded(b.id);
                  }}
                  className="btn-primary !py-2"
                >
                  Mark refunded
                </button>
              )}
              {b.status !== 'completed' && b.status !== 'pending' && (
                <button
                  type="button"
                  onClick={() => setStatus(b.id, 'completed')}
                  className="btn-primary !py-2"
                >
                  Mark completed
                </button>
              )}
              {b.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    // This releases the slot and the patient has already paid,
                    // so it is worth one deliberate confirmation.
                    const ok = window.confirm(
                      `Cancel ${b.patient.name}'s ${b.when} consultation?\n\n` +
                        'The slot is released and the patient is emailed. If they have paid, you must ' +
                        'send the refund yourself by UPI, then press "Mark refunded" here.',
                    );
                    if (ok) setStatus(b.id, 'cancelled');
                  }}
                  className="btn-secondary !py-2"
                >
                  Cancel booking
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
