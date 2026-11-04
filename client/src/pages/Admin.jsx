import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Seo from '../components/seo/Seo.jsx';
import Overview from '../components/admin/Overview.jsx';
import BookingsView from '../components/admin/BookingsView.jsx';
import CalendarView from '../components/admin/CalendarView.jsx';
import PatientsView from '../components/admin/PatientsView.jsx';
import SettingsView from '../components/admin/SettingsView.jsx';

const SESSION_KEY = 'clinic-admin-session';

const TABS = [
  ['overview', 'Overview'],
  ['bookings', 'Bookings'],
  ['calendar', 'Calendar'],
  ['patients', 'Patients'],
  ['settings', 'Hours & time off'],
];

/**
 * The clinic's own dashboard. English only: nobody but the clinic sees it.
 * The session lives in sessionStorage, so it ends when the tab closes
 * (the server also expires it after 12 hours).
 */
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [tab, setTab] = useState('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [busy, setBusy] = useState(false);
  // Bumped when something changes elsewhere, so the visible tab reloads.
  const [version, setVersion] = useState(0);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken('');
  }, []);

  // Any admin request that comes back 401 means the session ended.
  useEffect(() => {
    window.addEventListener('admin-unauthorized', logout);
    return () => window.removeEventListener('admin-unauthorized', logout);
  }, [logout]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError(null);
    setBusy(true);
    try {
      const session = await api.adminLogin(email, password);
      sessionStorage.setItem(SESSION_KEY, session.token);
      setToken(session.token);
      setPassword('');
    } catch (err) {
      setLoginError(err.status === 401 ? 'Wrong email or password.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="container-page py-16 sm:py-20">
        <Seo title="Clinic sign in" description="Clinic dashboard" noIndex />
        <form onSubmit={handleLogin} className="card mx-auto max-w-sm">
          <h1 className="text-xl">Clinic sign in</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            For the doctor only. Use the clinic email and the clinic password.
          </p>
          <label htmlFor="admin-email" className="label mt-5">Email</label>
          <input
            id="admin-email" type="email" className="input" value={email} autoComplete="username"
            onChange={(e) => setEmail(e.target.value)} required
          />
          <label htmlFor="admin-password" className="label mt-4">Password</label>
          <input
            id="admin-password" type="password" className="input" value={password} autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)} required
          />
          {loginError && (
            <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-800">
              {loginError}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo title="Clinic dashboard" description="Clinic dashboard" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Clinic dashboard</h1>
          <p className="mt-1 text-[15px] text-slate-600">All times are Indian Standard Time.</p>
        </div>
        <button type="button" onClick={logout} className="btn-secondary !py-2">Sign out</button>
      </div>

      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label="Dashboard sections">
          {TABS.map(([id, label]) => (
            <button
              key={id} type="button" role="tab" aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-[2.5rem] whitespace-nowrap rounded-lg px-4 py-2 text-[15px] font-medium transition-colors ${
                tab === id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === 'overview' && <Overview key={version} token={token} onGoTo={setTab} />}
        {tab === 'bookings' && <BookingsView key={version} token={token} onChange={() => setVersion((v) => v + 1)} />}
        {tab === 'calendar' && <CalendarView key={version} token={token} />}
        {tab === 'patients' && <PatientsView token={token} />}
        {tab === 'settings' && <SettingsView token={token} />}
      </div>
    </div>
  );
}
