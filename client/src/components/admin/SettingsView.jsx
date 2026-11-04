import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ErrorNote } from './shared.jsx';
import BlocksPanel from './BlocksPanel.jsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Show Monday first, the way a clinic week reads.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Weekly consulting hours. Saved hours apply to new bookings straight away. */
function HoursEditor({ token }) {
  const [hours, setHours] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.adminAvailability(token).then((r) => setHours(r.hours)).catch((err) => setError(err.message));
  }, [token]);

  const edit = (fn) => {
    setSaved(false);
    setHours((prev) => {
      const next = Object.fromEntries(Object.entries(prev).map(([d, w]) => [d, w.map((x) => [...x])]));
      fn(next);
      return next;
    });
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      setHours((await api.adminSaveAvailability(token, hours)).hours);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!hours) return <section className="card"><ErrorNote>{error}</ErrorNote><p className="text-slate-500">Loading…</p></section>;

  return (
    <section aria-labelledby="hours-h" className="card">
      <h2 id="hours-h" className="font-sans text-lg font-semibold">Consulting hours</h2>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate-600">
        Patients can book only inside these windows. Changes apply to new bookings immediately;
        appointments already booked outside the new hours are <strong className="font-semibold">not</strong> cancelled.
      </p>

      <div className="mt-5 space-y-3">
        {ORDER.map((d) => (
          <fieldset key={d} className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-[0.9375rem] font-semibold text-slate-900">{DAYS[d]}</legend>
            {hours[d].length === 0 && <p className="text-[0.9375rem] text-slate-500">Closed</p>}
            {hours[d].map(([start, end], i) => (
              <div key={i} className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="time" aria-label={`${DAYS[d]} window ${i + 1} opens`} className="input !w-auto" value={start}
                  onChange={(e) => edit((h) => { h[d][i][0] = e.target.value; })}
                />
                <span aria-hidden="true">to</span>
                <input
                  type="time" aria-label={`${DAYS[d]} window ${i + 1} closes`} className="input !w-auto" value={end}
                  onChange={(e) => edit((h) => { h[d][i][1] = e.target.value; })}
                />
                <button type="button" className="btn-secondary !py-2" onClick={() => edit((h) => { h[d].splice(i, 1); })}
                  aria-label={`Remove ${DAYS[d]} window ${i + 1}`}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-ghost mt-2 !min-h-0 !px-2 !py-1.5"
              onClick={() => edit((h) => { h[d].push(['09:00', '13:00']); })}>+ Add a window</button>
          </fieldset>
        ))}
      </div>

      <ErrorNote>{error}</ErrorNote>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save hours'}</button>
        {saved && <span role="status" className="text-[0.9375rem] font-medium text-care-800">Saved. New bookings use these hours.</span>}
      </div>
    </section>
  );
}

export default function SettingsView({ token }) {
  return (
    <div className="space-y-6">
      <HoursEditor token={token} />
      <BlocksPanel token={token} />
    </div>
  );
}
