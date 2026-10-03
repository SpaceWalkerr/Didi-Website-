import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

/**
 * Time the doctor has marked themselves unavailable for.
 *
 * Blocking hides that time from the booking page but deliberately does NOT
 * touch appointments already in it: cancelling on a patient who has paid has
 * to be a deliberate act, not a side effect of blocking a day. The warning
 * below says so, because the opposite is a reasonable thing to assume.
 *
 * English only, like the rest of this page — it is only ever seen by the clinic.
 */
export default function BlocksPanel({ token, onChange }) {
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState('');
  const [wholeDay, setWholeDay] = useState(true);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.adminBlocks(token);
      setBlocks(data.blocks);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.adminAddBlock(token, {
        date,
        start: wholeDay ? null : start,
        end: wholeDay ? null : end,
        reason: reason.trim() || null,
      });
      setReason('');
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setError(null);
    try {
      await api.adminRemoveBlock(token, id);
      await load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section aria-labelledby="blocks-heading" className="card">
      <h2 id="blocks-heading" className="font-sans text-lg font-semibold">
        Time off
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
        Blocked time disappears from the booking page. Appointments already booked into it
        are <strong className="font-semibold">not</strong> cancelled — cancel those yourself
        from the list, so nobody who has paid is dropped silently.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={add} className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="block-date" className="label">Date</label>
            <input
              id="block-date" type="date" required min={today}
              className="input" value={date} onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label htmlFor="block-whole" className="flex cursor-pointer items-center gap-2.5 pb-2.5">
              <input
                id="block-whole" type="checkbox" checked={wholeDay}
                onChange={(e) => setWholeDay(e.target.checked)}
                className="h-5 w-5 rounded border-slate-400 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600"
              />
              <span className="text-[15px] text-slate-700">Whole day</span>
            </label>
          </div>
        </div>

        {!wholeDay && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="block-start" className="label">From</label>
              <input id="block-start" type="time" required className="input"
                value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label htmlFor="block-end" className="label">Until</label>
              <input id="block-end" type="time" required className="input"
                value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="block-reason" className="label">Reason (optional, private)</label>
          <input
            id="block-reason" type="text" maxLength={200} className="input"
            placeholder="Leave, hospital duty, travel…"
            value={reason} onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <button type="submit" disabled={busy || !date} className="btn-primary w-full sm:w-auto">
          {busy ? 'Blocking…' : 'Block this time'}
        </button>
      </form>

      <h3 className="mt-6 text-[15px] font-semibold text-slate-700">
        Blocked ({blocks.length})
      </h3>

      {blocks.length === 0 ? (
        <p className="mt-2 text-[15px] text-slate-500">Nothing blocked in the next 30 days.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {blocks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">
                  {new Date(`${b.date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <p className="text-[15px] text-slate-600">
                  {b.wholeDay ? 'Whole day' : `${b.start} – ${b.end}`}
                  {b.reason ? ` · ${b.reason}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(b.id)}
                className="btn-secondary !py-2"
                aria-label={`Unblock ${b.date}${b.wholeDay ? '' : ` ${b.start} to ${b.end}`}`}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
