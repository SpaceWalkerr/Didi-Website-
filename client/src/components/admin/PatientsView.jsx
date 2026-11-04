import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { rupees } from '../../lib/format.js';
import { ErrorNote, LANGUAGE_NAMES, NotesEditor, StatusPill } from './shared.jsx';

/** One patient's history: every visit, what they reported, and the doctor's private notes. */
function PatientHistory({ token, phone }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.adminPatient(token, phone));
    } catch (err) {
      setError(err.message);
    }
  }, [token, phone]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <p className="p-4 text-slate-500">Loading…</p>;

  return (
    <div className="space-y-3 border-t border-slate-200 bg-surface p-4">
      <p className="text-[0.9375rem] text-slate-600">
        {data.patient.email} · +91 {data.patient.phone}
        {data.patient.age ? ` · ${data.patient.age}` : ''}
        {data.patient.gender ? ` · ${data.patient.gender}` : ''} · {LANGUAGE_NAMES[data.patient.language]}
      </p>
      {data.bookings.map((b) => (
        <article key={b.id} className="rounded-xl border border-slate-200 bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-900">{b.when}</p>
            <StatusPill status={b.status} awaiting={b.awaitingVerification} />
          </div>
          <p className="mt-1 text-[0.9375rem] text-slate-600">{b.serviceName} · {rupees(b.amount)} · ID {b.id}</p>
          <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] text-slate-700">
            <span className="font-semibold">Reported: </span>{b.symptoms}
          </p>
          <NotesEditor token={token} booking={b} onSaved={load} />
        </article>
      ))}
    </div>
  );
}

export default function PatientsView({ token }) {
  const [q, setQ] = useState('');
  const [patients, setPatients] = useState(null);
  const [openPhone, setOpenPhone] = useState(null);
  const [error, setError] = useState(null);

  // Debounced search: wait for a pause in typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setPatients((await api.adminPatients(token, q)).patients);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [token, q]);

  return (
    <div>
      <label htmlFor="patient-search" className="label">Search patients</label>
      <input
        id="patient-search" type="search" className="input sm:max-w-md" placeholder="Name, phone or email"
        value={q} onChange={(e) => setQ(e.target.value)}
      />
      <ErrorNote>{error}</ErrorNote>

      {patients && patients.length === 0 && <p className="card mt-5 text-[0.9375rem] text-slate-600">No patients found.</p>}

      <ul className="mt-5 space-y-3">
        {patients?.map((p) => (
          <li key={p.phone} className="overflow-hidden rounded-xl border border-slate-200 bg-paper">
            <button
              type="button"
              aria-expanded={openPhone === p.phone}
              onClick={() => setOpenPhone(openPhone === p.phone ? null : p.phone)}
              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"
            >
              <span>
                <span className="block font-semibold text-slate-900">{p.name}</span>
                <span className="block text-[0.9375rem] text-slate-600">+91 {p.phone}</span>
              </span>
              <span className="text-right text-[0.9375rem] text-slate-600">
                <span className="block">{p.visits} visit{p.visits === 1 ? '' : 's'} · {rupees(p.totalSpent)}</span>
                <span className="block text-[0.8125rem] text-slate-500">{p.lastVisit ? `Last: ${p.lastVisit}` : 'No completed visit yet'}</span>
              </span>
            </button>
            {openPhone === p.phone && <PatientHistory token={token} phone={p.phone} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
