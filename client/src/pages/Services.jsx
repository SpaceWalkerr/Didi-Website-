import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { HIGHLIGHTED_SERVICE, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
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
      <PageHeader
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        description={t('services.description')}
      />

      <section className="container-page py-14 sm:py-16">
        {loading && <p className="text-sm text-slate-500">{t('services.loading')}</p>}

        {error && (
          <div className="card mb-8 border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-900">{t('services.loadError', { error })}</p>
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

        <div className="grid gap-6 lg:grid-cols-3">
          {services.map((service) => {
            const highlighted = service.id === HIGHLIGHTED_SERVICE;
            return (
              <div
                key={service.id}
                className={`card flex flex-col ${highlighted ? 'ring-2 ring-brand-500' : ''}`}
              >
                {highlighted && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    {t('services.mostBooked')}
                  </span>
                )}

                <h2 className="text-xl">{t(`services.items.${service.id}.name`)}</h2>

                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <ClockIcon className="h-4 w-4 shrink-0" />
                  {t('common.minutes', { count: service.durationMinutes })}
                </p>

                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {rupees(service.price)}
                  <span className="ml-1.5 text-sm font-normal text-slate-500">
                    {t('common.perConsultation')}
                  </span>
                </p>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {t(`services.items.${service.id}.description`)}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tList(`services.items.${service.id}.includes`).map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-care-600" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/book?service=${service.id}`}
                  className={`${highlighted ? 'btn-primary' : 'btn-secondary'} mt-6 w-full`}
                >
                  {t('services.bookThis')}
                  <ArrowRightIcon />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Payment & refund terms */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg">{t('services.paymentTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('services.paymentBody')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg">{t('services.refundTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('services.refundBody')}</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl">{t('services.faqTitle')}</h2>
          <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {tList('services.faqs').map((faq) => (
              <details key={faq.q} className="group bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-slate-900 hover:bg-slate-50">
                  {faq.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
