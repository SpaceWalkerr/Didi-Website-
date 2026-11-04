import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { UserIcon, WhatsAppIcon } from '../components/Icons.jsx';
import BlocksPanel from '../components/admin/BlocksPanel.jsx';

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
  // 'today' is the default: on a consulting day it is the only list that matters.
  const [scope, setScope] = useState('today');
  const [error, setError] = useState(null);
  const [showBlocks, setShowBlocks] = useState(false);

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

  async function confirmPayment(id) {
    try {
      await api.adminConfirmPayment(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
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
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
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
          {loginError && (
            <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-800">
              {loginError}
            </p>
          )}
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
          <p className="mt-1 text-[15px] text-slate-600">
            All times are Indian Standard Time.
            {stats ? ` · ${stats.todayRemaining} left today` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBlocks((v) => !v)}
            aria-expanded={showBlocks}
            className="btn-secondary !py-2"
          >
            {showBlocks ? 'Hide time off' : 'Time off'}
          </button>
          <button type="button" onClick={() => load()} className="btn-secondary !py-2">Refresh</button>
          <button type="button" onClick={logout} className="btn-secondary !py-2">Sign out</button>
        </div>
      </div>

      {stats && (
        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ['Today', stats.today, true],
            ['Upcoming', stats.upcoming],
            ['Confirmed (all time)', stats.confirmed],
            ['Collected', rupees(stats.revenue)],
          ].map(([label, value, highlight]) => (
            <div
              key={label}
              className={`rounded-xl border p-4 ${
                highlight ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
              }`}
            >
              <dt className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">{label}</dt>
              <dd className={`mt-1 font-display text-2xl font-semibold ${highlight ? 'text-brand-800' : 'text-slate-900'}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {showBlocks && (
        <div className="mt-6">
          <BlocksPanel token={token} onChange={() => load()} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Which bookings to show">
        {['today', 'upcoming', 'all'].map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-[2.5rem] rounded-lg px-4 py-2 text-[15px] font-medium capitalize transition-colors ${
              scope === value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data?.bookings.length === 0 && (
          <p className="card text-[15px] text-slate-600">
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
                <p className="mt-1 text-[15px] text-slate-600">
                  {b.serviceName} · {b.durationMinutes} min · {rupees(b.amount)} · ID {b.id}
                </p>
                {b.bodyRegion && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[13px] font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
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
              <div className="text-[15px]">
                <p className="flex items-center gap-1.5 font-medium text-slate-900">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  {b.patient.name}
                  {b.patient.age ? `, ${b.patient.age}` : ''}
                  {b.patient.gender ? ` · ${b.patient.gender}` : ''}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-600">
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
                <p className="mt-2 text-[13px] text-slate-500">
                  Payment: {b.payment.status} ({b.payment.mode})
                </p>
                {b.payment.mode === 'upi' && b.payment.paymentId && (
                  <p className="mt-1 text-[13px] text-slate-700">
                    UTR: <span className="font-mono font-semibold">{b.payment.paymentId}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                  Symptom summary
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                  {b.patient.symptoms}
                </p>
                {b.note && (
                  <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-800">
                    {b.note}
                  </p>
                )}
              </div>
            </div>

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
                        'The slot is released immediately. Any refund has to be issued ' +
                        'separately (bank or UPI app, or the Razorpay dashboard).',
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
