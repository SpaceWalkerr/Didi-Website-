import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '../lib/router.jsx';
import { api } from '../lib/api.js';
import { formatDateTime, formatTime, rupees } from '../lib/format.js';
import { buildIcs, downloadIcs } from '../lib/calendar.js';
import { BRAND, CONTACT, waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import { AlertIcon, CalendarPlusIcon, ClockIcon, ShareIcon, WhatsAppIcon } from '../components/Icons.jsx';
import PrepareChecklist from '../components/home/PrepareChecklist.jsx';
import { Bone } from '../design/Skeleton.jsx';
import Seo from '../components/seo/Seo.jsx';

/** Check that draws itself inside a softly glowing disc. No confetti. */
function Seal({ confirmed }) {
  return (
    <div className="relative mx-auto h-24 w-24">
      <span className={`seal-glow absolute inset-0 rounded-full ${confirmed ? 'bg-care-300' : 'bg-amber-200'}`} aria-hidden="true" />
      <span className={`relative flex h-24 w-24 items-center justify-center rounded-full ${confirmed ? 'bg-care-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
        {confirmed ? (
          <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 25l8 8 16-17" pathLength="1" className="seal-check" />
          </svg>
        ) : (
          <ClockIcon className="h-10 w-10" />
        )}
      </span>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="container-page py-14" role="status" aria-live="polite">
      <div className="mx-auto max-w-xl space-y-4">
        <Bone className="mx-auto h-24 w-24 rounded-full" />
        <Bone className="mx-auto h-8 w-2/3 rounded-full" />
        <Bone className="h-80 w-full rounded-4xl" />
      </div>
    </div>
  );
}

/**
 * Signature moment 5 (end) — the appointment ticket.
 *
 * Everything the old confirmation table showed is still here, in the same
 * three states (confirmed / payment being verified / not completed). Add to
 * calendar builds an .ics on the device. Share on WhatsApp sends only the date
 * and time: never the booking ID or this page's link, because this page shows
 * the patient's name and masked contact details.
 */
export default function Confirmation() {
  const { bookingId } = useParams();
  const { t, locale } = useI18n();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  const translateError = useCallback((err) => (err.messageKey ? t(err.messageKey, err.params || {}) : err.message), [t]);

  useEffect(() => {
    api.getBooking(bookingId).then(setBooking).catch((err) => setError(translateError(err)));
  }, [bookingId, translateError]);

  if (error) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="display-md">{t('confirmation.notFoundTitle')}</h1>
          <p className="mt-3 leading-relaxed text-slate-600">{error}</p>
          <a href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-6">
            <WhatsAppIcon className="h-5 w-5" />
            {t('common.messageClinic')}
          </a>
        </div>
      </div>
    );
  }

  if (!booking) return <TicketSkeleton />;

  const confirmed = booking.status === 'confirmed';
  const verifying = !confirmed && booking.paymentSubmitted;
  const titleKey = confirmed ? 'confirmation.confirmedTitle' : verifying ? 'confirmation.verifyingTitle' : 'confirmation.pendingTitle';
  const when = formatDateTime(booking.date, booking.time, locale);
  const instant = new Date(`${booking.date}T${booking.time}:00+05:30`);
  const dayName = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(instant);
  const dayNum = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(instant);
  const monthYear = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }).format(instant);
  const status = confirmed ? 'statusConfirmed' : verifying ? 'statusVerifying' : 'statusPending';
  const serviceName = t(`services.items.${booking.serviceId}.name`);

  const addToCalendar = () => {
    const ics = buildIcs({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      durationMinutes: booking.durationMinutes,
      title: t('ticket.calendarTitle', { doctor: t('doctor.name') }),
      description: confirmed && booking.whatsappLink
        ? t('ticket.calendarBody', { link: booking.whatsappLink })
        : t('ticket.calendarBodyPending'),
      url: `${BRAND.siteUrl}/confirmation/${booking.id}`,
    });
    downloadIcs(`consultation-${booking.date}.ics`, ics);
  };

  const shareHref = `https://wa.me/?text=${encodeURIComponent(
    t('ticket.shareText', { doctor: t('doctor.name'), when, site: BRAND.siteUrl.replace(/^https?:\/\//, '') }),
  )}`;

  return (
    <>
      <Seo title={t(titleKey)} description={t('doctor.tagline')} noIndex />
      <div className="relative overflow-hidden bg-cream">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(var(--c-brand-100)),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative pb-20 pt-12 sm:pt-16">
          <div className="mx-auto max-w-xl">
            <div className="text-center" style={{ animation: 'rise .7s var(--ease-calm) both' }}>
              <Seal confirmed={confirmed} />
              <h1 className="display-lg mt-7">{t(titleKey)}</h1>
              <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-600">
                {confirmed
                  ? t('confirmation.confirmedBody', { email: booking.patientEmail, phone: booking.patientPhone })
                  : verifying
                    ? t('confirmation.verifyingBody', { email: booking.patientEmail })
                    : t('confirmation.pendingBody', { status: booking.status })}
              </p>
            </div>

            {/* ── The ticket ───────────────────────────────────────────── */}
            <article
              aria-label={t('ticket.label')}
              className="ticket relative mt-10 overflow-hidden rounded-[2rem] bg-paper shadow-lift"
              style={{ animation: 'ticket-in .9s var(--ease-calm) .15s both' }}
            >
              <div className="relative bg-deep px-6 pb-7 pt-6 text-white sm:px-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fe0d5]">{t('ticket.kind')}</p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      confirmed ? 'bg-[#6fd49b] text-[#0b3320]' : verifying ? 'bg-[#f6d995] text-[#5a3912]' : 'bg-[#f5c1bc] text-[#64241f]'
                    }`}
                  >
                    {t(`ticket.${status}`)}
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/75">{dayName}</p>
                    <p className="font-display text-[3.5rem] font-medium leading-none">{dayNum}</p>
                    <p className="mt-1 text-white/85">{monthYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/70">{t('ticket.time')}</p>
                    <p className="font-display text-[2.25rem] font-medium leading-none tabular-nums">{formatTime(booking.time, locale)}</p>
                  </div>
                </div>
              </div>

              <div className="relative h-0" aria-hidden="true">
                <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-cream" />
                <span className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-cream" />
                <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-slate-200" />
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-6 text-[0.9375rem] sm:px-8">
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('ticket.type')}</dt>
                  <dd className="mt-0.5 font-display text-lg text-ink">
                    {serviceName} · {t('common.minutesShort', { count: booking.durationMinutes })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('ticket.patient')}</dt>
                  <dd className="mt-0.5 break-words font-medium text-ink">{booking.patientName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('ticket.amount')}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{rupees(booking.amount)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('ticket.id')}</dt>
                  <dd className="mt-0.5 break-all font-mono text-base font-semibold tracking-wide text-ink">{booking.id}</dd>
                </div>
              </dl>

              <div className="border-t border-slate-200/80 bg-care-50/60 px-6 py-6 sm:px-8">
                <h2 className="font-sans text-base font-semibold text-ink">{t('ticket.howTitle')}</h2>
                {confirmed && booking.whatsappLink ? (
                  <>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-700">{t('confirmation.joinBody', { when })}</p>
                    <a href={booking.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-lg mt-5 w-full">
                      <WhatsAppIcon className="h-5 w-5" />
                      {t('confirmation.joinCta')}
                    </a>
                    <p className="mt-3 text-sm text-slate-600">{t('confirmation.joinNote')}</p>
                  </>
                ) : (
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-700">{t('ticket.howBody')}</p>
                )}
              </div>
            </article>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={addToCalendar} className="btn-secondary btn-lg">
                <CalendarPlusIcon className="h-5 w-5" />
                {t('ticket.addCalendar')}
              </button>
              <a href={shareHref} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-lg">
                <ShareIcon className="h-5 w-5" />
                {t('ticket.share')}
              </a>
            </div>

            <div className="mt-10 rounded-4xl border border-slate-200/80 bg-paper p-6 sm:p-8">
              <PrepareChecklist compact id="ticket-prepare" />
              <ul className="mt-6 space-y-2 border-t border-slate-200/80 pt-5 text-[0.9375rem] leading-relaxed text-slate-600">
                <li>{t('confirmation.beforeItems.0')}</li>
                <li>{t('confirmation.beforeItems.3')}</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={waLink(t('confirmation.questionMessage', { id: booking.id }))} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1">
                  <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                  {t('common.messageClinic')}
                </a>
                <Link to="/account" className="btn-secondary flex-1">
                  {t('nav.account')}
                </Link>
                <Link to="/" className="btn-ghost flex-1">
                  {t('common.backHome')}
                </Link>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-[0.9375rem] leading-relaxed text-amber-900">
                {t('emergency.notice')} {t('confirmation.emergencySuffix', { number: CONTACT.whatsappDisplay })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
