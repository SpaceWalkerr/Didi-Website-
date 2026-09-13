import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { CONTACT, DOCTOR, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import {
  AlertIcon, ArrowRightIcon, ClockIcon, MailIcon, PhoneIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

export default function Contact() {
  const { t } = useI18n();

  const hours = [
    [t('hours.weekdays'), t('hours.weekdaysTime')],
    [t('hours.saturday'), t('hours.saturdayTime')],
    [t('hours.sunday'), t('hours.sundayTime')],
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        description={t('contact.description')}
      />

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div className="min-w-0 space-y-6">
            {/* WhatsApp — the primary channel, so it gets the most weight. */}
            <div className="card border-[#25D366]/30 bg-[#25D366]/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl">{t('contact.whatsappTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t('contact.whatsappBody', { note: t('contact.responseNote') })}
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-900">{CONTACT.whatsappDisplay}</p>
              <a
                href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp mt-5 w-full sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t('common.chatWhatsApp')}
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MailIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg">{t('contact.emailTitle')}</h2>
                <p className="mt-2 text-sm text-slate-600">{t('contact.emailBody')}</p>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="mt-3 inline-block break-all text-sm font-medium text-brand-700 hover:underline"
                >
                  {CONTACT.email}
                </a>
              </div>

              <div className="card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg">{t('contact.phoneTitle')}</h2>
                <p className="mt-2 text-sm text-slate-600">{t('contact.phoneBody')}</p>
                <a
                  href={`tel:+${CONTACT.whatsappNumber}`}
                  className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-base text-amber-900">{t('contact.emergencyTitle')}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">{t('emergency.notice')}</p>
              </div>
            </div>
          </div>

          <aside className="min-w-0 space-y-6">
            <div className="card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-care-50 text-care-700">
                <ClockIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg">{t('contact.hoursTitle')}</h2>
              <p className="mt-1 text-xs text-slate-500">{t('contact.hoursNote')}</p>
              <dl className="mt-4 divide-y divide-slate-200">
                {hours.map(([days, time]) => (
                  <div key={days} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm font-medium text-slate-900">{days}</dt>
                    <dd className="mt-0.5 text-sm text-slate-600">{time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card">
              <h2 className="text-lg">{t('contact.selfServiceTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('contact.selfServiceBody')}</p>
              <Link to="/book" className="btn-primary mt-5 w-full">
                {t('common.book')}
                <ArrowRightIcon />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
              <p className="font-medium text-slate-900">{t('doctor.name')}</p>
              <p className="mt-1">{t('doctor.qualification')}</p>
              <p className="mt-2">
                {t('common.regNo', { number: DOCTOR.registrationNumber })}
                <br />
                {t('doctor.council')}
              </p>
              <p className="mt-3 text-xs text-slate-500">{t('contact.onlineOnly')}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
