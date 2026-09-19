import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { UserIcon, WhatsAppIcon } from '../components/Icons.jsx';

const TOKEN_KEY = 'clinic-admin-token';

/** The admin view stays in English — it is only ever seen by the clinic. */
const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  ru: 'Russian',
};

const STATUS_STYLES = {
  confirmed: 'bg-care-100 text-care-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-800',
  'needs-attention': 'bg-red-100 text-red-700',
};

export default function Admin() {
  // sessionStorage, not localStorage: the token is cleared when the tab closes.
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [loginError, setLoginError] = useState(null);

  const [data, setData] = useState(null);
  const [scope, setScope] = useState('upcoming');
  const [error, setError] = useState(null);

  const load = useCallback(
    async (activeToken = token, activeScope = scope) => {
      if (!activeToken) return;
      try {
        const result = await api.adminBookings(activeToken, activeScope);
        setData(result);
        setAuthed(true);
        setError(null);
      } catch (err) {
        setError(err.message);
        if (err.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setAuthed(false);
          setToken('');
        }
      }
    },
    [token, scope],
  );

  useEffect(() => {
    if (token) load(token, scope);
  }, [token, scope, load]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError(null);
    try {
      await api.adminLogin(tokenInput);
      sessionStorage.setItem(TOKEN_KEY, tokenInput);
      setToken(tokenInput);
      setTokenInput('');
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthed(false);
    setData(null);
  }

  async function setStatus(id, status) {
    try {
      await api.adminUpdate(token, id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authed) {
    return (
      <div className="container-page py-20">
        <form onSubmit={handleLogin} className="card mx-auto max-w-sm">
          <h1 className="text-xl">Clinic login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the admin token to see upcoming bookings. It is set as{' '}
            <code className="rounded bg-slate-100 px-1">ADMIN_TOKEN</code> in server/.env.
          </p>
          <label htmlFor="token" className="label mt-5">Admin token</label>
          <input
            id="token"
            type="password"
            className="input"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            autoComplete="off"
            required
          />
          {loginError && <p className="mt-2 text-sm text-red-600">{loginError}</p>}
          <button type="submit" className="btn-primary mt-5 w-full">Sign in</button>
        </form>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            All times are Indian Standard Time. Refreshes when you switch views.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load()} className="btn-secondary !py-2">Refresh</button>
          <button type="button" onClick={logout} className="btn-secondary !py-2">Sign out</button>
        </div>
      </div>

      {stats && (
        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ['Upcoming', stats.upcoming],
            ['Confirmed (all time)', stats.confirmed],
            ['Total bookings', stats.total],
            ['Collected', rupees(stats.revenue)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8 flex gap-2">
        {['upcoming', 'all'].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              scope === value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data?.bookings.length === 0 && (
          <p className="card text-sm text-slate-500">
            No {scope === 'upcoming' ? 'upcoming' : ''} bookings yet.
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
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {b.serviceName} · {b.durationMinutes} min · {rupees(b.amount)} · ID {b.id}
                </p>
              </div>

              {b.whatsappLink && (
                <a
                  href={b.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp !py-2 !text-xs"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Open chat
                </a>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[16rem_1fr]">
              <div className="text-sm">
                <p className="flex items-center gap-1.5 font-medium text-slate-900">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  {b.patient.name}
                  {b.patient.age ? `, ${b.patient.age}` : ''}
                  {b.patient.gender ? ` · ${b.patient.gender}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
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
                <p className="mt-2 text-xs text-slate-400">
                  Payment: {b.payment.status} ({b.payment.mode})
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Symptom summary
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {b.patient.symptoms}
                </p>
                {b.note && <p className="mt-2 text-sm text-red-600">{b.note}</p>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              {b.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setStatus(b.id, 'completed')}
                  className="btn-secondary !py-2 !text-xs"
                >
                  Mark completed
                </button>
              )}
              {b.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setStatus(b.id, 'cancelled')}
                  className="btn-secondary !py-2 !text-xs"
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
