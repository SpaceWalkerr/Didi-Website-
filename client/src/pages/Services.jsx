import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { HIGHLIGHTED_SERVICE, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import Badge from '../design/Badge.jsx';
import { RevealGroup, RevealItem } from '../design/Reveal.jsx';
import { ArrowRightIcon, CheckIcon, ClockIcon, WhatsAppIcon } from '../components/Icons.jsx';

export default function Services() {
  const { t, tList } = useI18n();
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prices and durations come from the server; the wording comes from i18n,
  // keyed by service id — so switching language never changes the fee.
  useEffect(() => {
    let active = true;
    api
      .meta()
      .then((data) => active && setServices(data.services))
      .catch((err) => active && setError(err.messageKey ? t(err.messageKey) : err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <>
      <PageIntro
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        lede={t('services.description')}
      />

      <div className="container-page py-12 sm:py-16">
        {loading && <p className="text-slate-500">{t('services.loading')}</p>}

        {error && (
          <div className="card mb-8 border-amber-300 bg-amber-50">
            <p className="text-[15px] leading-relaxed text-amber-900">
              {t('services.loadError', { error })}
            </p>
            <a
              href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-4"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t('common.messageClinic')}
            </a>
          </div>
        )}

        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {services.map((service) => {
            const highlighted = service.id === HIGHLIGHTED_SERVICE;
            return (
              <RevealItem
                key={service.id}
                className={`flex flex-col rounded-2xl border bg-white p-6 shadow-card ${
                  highlighted ? 'border-brand-400 ring-1 ring-brand-300' : 'border-slate-200'
                }`}
              >
                {highlighted && (
                  <Badge className="self-start">{t('services.mostBooked')}</Badge>
                )}

                <h2 className={`font-display text-2xl ${highlighted ? 'mt-3' : ''}`}>
                  {t(`services.items.${service.id}.name`)}
                </h2>

                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-brand-800">
                    {rupees(service.price)}
                  </span>
                  <span className="text-sm text-slate-500">{t('common.perConsultation')}</span>
                </p>

                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <ClockIcon className="h-4 w-4 text-brand-600" />
                  {t('common.minutes', { count: service.durationMinutes })}
                </p>

                <p className="mt-4 leading-relaxed text-slate-600">
                  {t(`services.items.${service.id}.description`)}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tList(`services.items.${service.id}.includes`).map((line) => (
                    <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-care-600" />
                      {line}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/book?service=${service.id}`}
                  className={`mt-6 ${highlighted ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('services.bookThis')}
                  <ArrowRightIcon />
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Payment and refund summaries, with the full policies a click away. */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="card-warm">
            <h2 className="font-sans text-lg font-semibold">{t('services.paymentTitle')}</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{t('services.paymentBody')}</p>
            <Link to="/terms" className="btn-ghost mt-4 -ml-2">
              {t('legal.terms.navLabel')}
              <ArrowRightIcon />
            </Link>
          </div>
          <div className="card-warm">
            <h2 className="font-sans text-lg font-semibold">{t('services.refundTitle')}</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{t('services.refundBody')}</p>
            <Link to="/refund" className="btn-ghost mt-4 -ml-2">
              {t('common.readPolicies')}
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
