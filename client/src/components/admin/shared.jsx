import { useState } from 'react';
import { api } from '../../lib/api.js';

/** The clinic view stays in English: only the clinic ever sees it. */
export const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', pa: 'Punjabi', ru: 'Russian' };

export const STATUS_STYLES = {
  confirmed: 'bg-care-100 text-care-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-800',
  'needs-attention': 'bg-red-100 text-red-700',
};

export function StatusPill({ status, awaiting }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
          STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
        }`}
      >
        {status.replace('-', ' ')}
      </span>
      {awaiting && (
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          Verify payment
        </span>
      )}
    </span>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[0.9375rem] text-red-800">
      {children}
    </p>
  );
}

export function Stat({ label, value, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-paper'}`}
    >
      <dt className="text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-semibold ${highlight ? 'text-brand-800' : 'text-slate-900'}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * The doctor's private notes on a visit, and an optional follow-up date.
 * The follow-up date is the only part a patient ever sees; the notes never leave the clinic view.
 */
export function NotesEditor({ token, booking, onSaved }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(booking.doctorNotes || '');
  const [followUp, setFollowUp] = useState(booking.followUpDate || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.adminNotes(token, booking.id, { doctorNotes: notes.trim() || null, followUpDate: followUp || null });
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      {!open ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-prose whitespace-pre-wrap text-[0.9375rem] text-slate-700">
            {booking.doctorNotes ? (
              <>
                <span className="font-semibold text-slate-900">Private notes: </span>
                {booking.doctorNotes}
              </>
            ) : (
              <span className="text-slate-500">No notes yet.</span>
            )}
            {booking.followUpDate && (
              <span className="mt-1 block text-[0.8125rem] text-slate-600">Follow-up: {booking.followUpDate}</span>
            )}
          </p>
          <button type="button" onClick={() => setOpen(true)} className="btn-secondary !py-2">
            {booking.doctorNotes || booking.followUpDate ? 'Edit notes' : 'Add notes'}
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <div>
            <label htmlFor={`notes-${booking.id}`} className="label">
              Private notes <span className="font-normal text-slate-500">(only you see these)</span>
            </label>
            <textarea
              id={`notes-${booking.id}`} rows={4} maxLength={4000} className="input"
              value={notes} onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`fu-${booking.id}`} className="label">
              Follow-up date <span className="font-normal text-slate-500">(shown to the patient)</span>
            </label>
            <input
              id={`fu-${booking.id}`} type="date" className="input sm:max-w-xs"
              value={followUp} onChange={(e) => setFollowUp(e.target.value)}
            />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary !py-2">{busy ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary !py-2">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
