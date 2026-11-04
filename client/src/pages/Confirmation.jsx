import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatDateTime, rupees } from '../lib/format.js';
import { CONTACT, waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import { AlertIcon, CheckIcon, ClockIcon, WhatsAppIcon } from '../components/Icons.jsx';
import Seo from '../components/seo/Seo.jsx';

export default function Confirmation() {
  const { bookingId } = useParams();
  const { t, tList, locale } = useI18n();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  const translateError = useCallback(
    (err) => (err.messageKey ? t(err.messageKey, err.params || {}) : err.message),
    [t],
  );

  useEffect(() => {
    api.getBooking(bookingId).then(setBooking).catch((err) => setError(translateError(err)));
  }, [bookingId, translateError]);

  if (error) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="text-2xl">{t('confirmation.notFoundTitle')}</h1>
          <p className="mt-3 leading-relaxed text-slate-600">{error}</p>
          <a
            href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t('common.messageClinic')}
          </a>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <p className="container-page py-20 text-center text-slate-500">
        {t('confirmation.loadingBooking')}
      </p>
    );
  }

  const confirmed = booking.status === 'confirmed';
  const verifying = booking.paymentSubmitted;
  // The server sends its own English `when`; re-format from the raw date and
  // time so it reads correctly in the patient's language.
  const when = formatDateTime(booking.date, booking.time, locale);

  return (
    <>
      <Seo title={t(confirmed ? 'confirmation.confirmedTitle' : verifying ? 'confirmation.verifyingTitle' : 'confirmation.pendingTitle')} description={t('doctor.tagline')} noIndex />
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="card text-center">
            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                confirmed ? 'bg-care-100 text-care-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {confirmed ? <CheckIcon className="h-8 w-8" /> : <ClockIcon className="h-8 w-8" />}
            </span>

            <h1 className="mt-5 text-2xl sm:text-3xl">
              {confirmed
                ? t('confirmation.confirmedTitle')
                : verifying
                  ? t('confirmation.verifyingTitle')
                  : t('confirmation.pendingTitle')}
            </h1>

            <p className="mt-3 leading-relaxed text-slate-600">
              {confirmed
                ? t('confirmation.confirmedBody', {
                    email: booking.patientEmail,
                    phone: booking.patientPhone,
                  })
                : verifying
                  ? t('confirmation.verifyingBody', { email: booking.patientEmail })
                  : t('confirmation.pendingBody', { status: booking.status })}
            </p>

            <dl className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 text-left">
              {[
                [t('confirmation.rows.id'), booking.id],
                [t('confirmation.rows.patient'), booking.patientName],
                [
                  t('confirmation.rows.consultation'),
                  `${t(`services.items.${booking.serviceId}.name`)} · ${t('common.minutesShort', {
                    count: booking.durationMinutes,
                  })}`,
                ],
                [t('confirmation.rows.when'), `${when} IST`],
                [t('confirmation.rows.amount'), rupees(booking.amount)],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4 ${
                    i % 2 ? 'bg-white' : 'bg-surface'
                  }`}
                >
                  <dt className="text-[15px] text-slate-500">{label}</dt>
                  <dd className="break-words font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            {confirmed && booking.whatsappLink && (
              <div className="mt-8 rounded-2xl border border-care-200 bg-care-50 p-6">
                <h2 className="font-sans text-lg font-semibold text-care-900">{t('confirmation.joinTitle')}</h2>
                <p className="mt-2 leading-relaxed text-care-900">
                  {t('confirmation.joinBody', { when })}
                </p>
                <a
                  href={booking.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp mt-5 w-full"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {t('confirmation.joinCta')}
                </a>
                <p className="mt-3 text-[15px] text-care-900">{t('confirmation.joinNote')}</p>
              </div>
            )}
          </div>

          <div className="card mt-6">
            <h2 className="font-sans text-lg font-semibold">{t('confirmation.beforeTitle')}</h2>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-600">
              {tList('confirmation.beforeItems').map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={waLink(t('confirmation.questionMessage', { id: booking.id }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1"
              >
                <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                {t('common.messageClinic')}
              </a>
              <Link to="/account" className="btn-secondary flex-1">
                {t('nav.account')}
              </Link>
              <Link to="/" className="btn-secondary flex-1">
                {t('common.backHome')}
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-[15px] leading-relaxed text-amber-900">
              {t('emergency.notice')}{' '}
              {t('confirmation.emergencySuffix', { number: CONTACT.whatsappDisplay })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
