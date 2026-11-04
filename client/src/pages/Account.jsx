import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../lib/router.jsx';
import { api } from '../lib/api.js';
import { formatDateTime, rupees, upcomingDates } from '../lib/format.js';
import DatePicker from '../components/booking/DatePicker.jsx';
import SlotGrid from '../components/booking/SlotGrid.jsx';
import { waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import Seo from '../components/seo/Seo.jsx';
import { WhatsAppIcon } from '../components/Icons.jsx';

const SESSION_KEY = 'clinic-patient-session';

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};
const storeSession = (value) => {
  try {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked (private mode): the session simply lasts until the page closes.
  }
};

const STATUS_STYLES = {
  confirmed: 'bg-care-100 text-care-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-800',
  verifying: 'bg-amber-100 text-amber-800',
  'needs-attention': 'bg-red-100 text-red-700',
};

/** Email sign-in: no password, just a one-time link. */
function SignIn({ onLinkError }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState(onLinkError || null);

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setState('sending');
    try {
      await api.accountLoginLink(email.trim());
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(err.messageKey ? t(err.messageKey, err.params || {}) : err.message);
    }
  }

  if (state === 'sent') {
    return (
      <div className="card mx-auto max-w-lg text-center" role="status">
        <h2 className="text-xl">{t('account.sentTitle')}</h2>
        <p className="mt-3 leading-relaxed text-slate-600">{t('account.sentBody', { email })}</p>
        <button type="button" onClick={() => setState('idle')} className="btn-secondary mt-6">
          {t('account.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-lg" noValidate>
      <h2 className="text-xl">{t('account.signInTitle')}</h2>
      <p className="mt-2 leading-relaxed text-slate-600">{t('account.signInBody')}</p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-[0.9375rem] text-red-900">
          {error}
        </p>
      )}
      <label htmlFor="account-email" className="label mt-5">{t('account.emailLabel')}</label>
      <input
        id="account-email" type="email" inputMode="email" autoComplete="email" required
        className="input" value={email} onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={state === 'sending' || !email} className="btn-primary mt-5 w-full">
        {state === 'sending' ? t('account.sending') : t('account.sendLink')}
      </button>
    </form>
  );
}

/** Inline picker for moving a confirmed booking to another free slot. */
function ReschedulePanel({ booking, session, onDone, onClose }) {
  const { t, locale } = useI18n();
  const [meta, setMeta] = useState(null);
  const [date, setDate] = useState(booking.date); // always an open day: it was bookable
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dates = useMemo(() => upcomingDates(31, locale), [locale]);

  const fail = (err) => setError(err.messageKey ? t(err.messageKey, err.params || {}) : err.message);

  useEffect(() => {
    api.meta().then(setMeta).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setTime('');
    api
      .slots(date, booking.serviceId)
      .then((r) => live && setSlots(r.slots))
      .catch((err) => live && fail(err))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, booking.serviceId]);

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      await api.accountReschedule(session.token, booking.id, date, time);
      await onDone();
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-sans text-base font-semibold text-slate-900">{t('account.rescheduleTitle')}</h4>
      <p className="text-sm text-slate-600">{t('account.rescheduleNote')}</p>
      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-[0.9375rem] text-red-900">{error}</p>
      )}
      <div className="min-w-0">
        <DatePicker dates={dates} value={date} onChange={setDate} minDate={meta?.minDate} maxDate={meta?.maxDate} openDays={meta?.openDays} />
      </div>
      <SlotGrid slots={slots} loading={loading} value={time} onChange={setTime} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!time || saving} onClick={confirm} className="btn-primary !py-2">
          {saving ? t('account.sending') : t('account.rescheduleConfirm')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary !py-2">
          {t('account.rescheduleKeep')}
        </button>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, onRescheduled, session, busy }) {
  const { t, locale } = useI18n();
  const [rescheduling, setRescheduling] = useState(false);
  const statusKey = booking.status === 'pending' && booking.paymentSubmitted ? 'verifying' : booking.status;

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-lg font-semibold text-slate-900">
            {t(`services.items.${booking.serviceId}.name`)}
          </h3>
          <p className="mt-1 text-slate-600">
            {formatDateTime(booking.date, booking.time, locale)} IST ·{' '}
            {t('common.minutesShort', { count: booking.durationMinutes })} · {rupees(booking.amount)}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">ID {booking.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[statusKey] || 'bg-slate-100 text-slate-700'}`}>
          {t(`account.status.${statusKey}`)}
        </span>
      </div>

      {booking.followUpDate && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[0.9375rem] text-brand-900">
          {t('account.followUp', { date: formatDateTime(booking.followUpDate, '12:00', locale).split(',').slice(0, 3).join(',') })}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.whatsappLink && (
          <a href={booking.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp !py-2">
            <WhatsAppIcon className="h-4 w-4" />
            {t('account.join')}
          </a>
        )}
        {booking.canCancel && (
          <button type="button" disabled={busy} onClick={() => onCancel(booking.id)} className="btn-secondary !py-2">
            {t('account.cancel')}
          </button>
        )}
        {booking.canReschedule && !rescheduling && (
          <button type="button" disabled={busy} onClick={() => setRescheduling(true)} className="btn-secondary !py-2">
            {t('account.reschedule')}
          </button>
        )}
        {!booking.canCancel && ['pending', 'confirmed'].includes(booking.status) && (
          <a
            href={waLink(t('confirmation.questionMessage', { id: booking.id }))}
            target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2"
          >
            {t('account.messageClinic')}
          </a>
        )}
      </div>

      {rescheduling && (
        <ReschedulePanel
          booking={booking}
          session={session}
          onClose={() => setRescheduling(false)}
          onDone={async () => {
            await onRescheduled();
            setRescheduling(false);
          }}
        />
      )}
    </article>
  );
}

export default function Account() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [session, setSession] = useState(readSession);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [redeeming, setRedeeming] = useState(Boolean(params.get('token')));

  const translate = useCallback(
    (err) => (err.messageKey ? t(err.messageKey, err.params || {}) : err.message),
    [t],
  );

  const signOut = useCallback(() => {
    storeSession(null);
    setSession(null);
    setMe(null);
  }, []);

  // Arriving from the emailed link: swap the one-time token for a session.
  useEffect(() => {
    const token = params.get('token');
    if (!token) return;
    api
      .accountSession(token)
      .then((s) => {
        const value = { token: s.token, email: s.email };
        storeSession(value);
        setSession(value);
      })
      .catch((err) => setLinkError(translate(err)))
      .finally(() => {
        setRedeeming(false);
        // Take the token out of the address bar and the history.
        navigate('/account', { replace: true });
      });
    // Runs once for the token present at arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setMe(await api.accountMe(session.token));
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        signOut();
        setLinkError(translate(err));
      } else {
        setError(t('account.loadError'));
      }
    }
  }, [session, signOut, translate, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id) {
    if (!window.confirm(t('account.cancelConfirm'))) return;
    setBusy(true);
    try {
      await api.accountCancel(session.token, id);
      await load();
    } catch (err) {
      setError(translate(err));
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();
  const upcoming = me?.bookings.filter(
    (b) => ['pending', 'confirmed', 'needs-attention'].includes(b.status) && b.startsAt >= now - 60 * 60 * 1000,
  );
  const history = me?.bookings.filter((b) => !upcoming.includes(b));

  return (
    <>
      <Seo title={t('account.title')} description={t('account.signInBody')} noIndex />
      <PageIntro eyebrow={t('account.eyebrow')} title={t('account.title')} />

      <div className="container-page py-10 sm:py-14">
        {redeeming && <p role="status" className="text-center text-slate-500">{t('common.loading')}</p>}

        {!redeeming && !session && <SignIn onLinkError={linkError} />}

        {!redeeming && session && (
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {me ? t('account.hello', { name: me.name }) : session.email}
                </p>
                <p className="text-[0.9375rem] text-slate-500">{me?.email || session.email}</p>
              </div>
              <div className="flex gap-2">
                <Link to="/book" className="btn-primary !py-2">{t('account.bookNew')}</Link>
                <button type="button" onClick={signOut} className="btn-secondary !py-2">{t('account.signOut')}</button>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3 text-[0.9375rem] text-red-900">{error}</p>
            )}

            {me && (
              <>
                <section aria-labelledby="upcoming-h" className="mt-8">
                  <h2 id="upcoming-h" className="text-xl">{t('account.upcoming')}</h2>
                  <div className="mt-4 space-y-4">
                    {upcoming.length === 0 && <p className="text-slate-600">{t('account.noUpcoming')}</p>}
                    {upcoming.map((b) => <BookingCard key={b.id} booking={b} onCancel={cancel} onRescheduled={load} session={session} busy={busy} />)}
                  </div>
                </section>

                <section aria-labelledby="history-h" className="mt-10">
                  <h2 id="history-h" className="text-xl">{t('account.history')}</h2>
                  <div className="mt-4 space-y-4">
                    {history.length === 0 && <p className="text-slate-600">{t('account.noHistory')}</p>}
                    {history.map((b) => <BookingCard key={b.id} booking={b} onCancel={cancel} onRescheduled={load} session={session} busy={busy} />)}
                  </div>
                </section>

                <p className="mt-8 rounded-xl bg-surface p-4 text-[0.9375rem] leading-relaxed text-slate-600">{t('account.help')}</p>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
