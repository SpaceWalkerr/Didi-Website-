import { Link } from 'react-router-dom';
import { CONTACT, waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import { RevealGroup, RevealItem } from '../design/Reveal.jsx';
import { AlertIcon, ArrowRightIcon, ClockIcon, MailIcon, PhoneIcon, WhatsAppIcon } from '../components/Icons.jsx';

export default function Contact() {
  const { t } = useI18n();

  const channels = [
    {
      Icon: WhatsAppIcon,
      title: t('contact.whatsappTitle'),
      body: t('contact.whatsappBody', { note: t('contact.responseNote') }),
      action: (
        <a
          href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mt-5"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {CONTACT.whatsappDisplay}
        </a>
      ),
    },
    {
      Icon: MailIcon,
      title: t('contact.emailTitle'),
      body: t('contact.emailBody'),
      action: (
        <a href={`mailto:${CONTACT.email}`} className="btn-secondary mt-5 break-all">
          <MailIcon className="h-4 w-4 shrink-0" />
          {CONTACT.email}
        </a>
      ),
    },
    {
      Icon: PhoneIcon,
      title: t('contact.phoneTitle'),
      body: t('contact.phoneBody'),
      action: (
        <a href={`tel:${CONTACT.phoneDisplay.replace(/\s/g, '')}`} className="btn-secondary mt-5">
          <PhoneIcon className="h-4 w-4" />
          {CONTACT.phoneDisplay}
        </a>
      ),
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        lede={t('contact.description')}
      />

      <div className="container-page py-12 sm:py-16">
        <RevealGroup as="ul" className="grid gap-6 md:grid-cols-3">
          {channels.map(({ Icon, title, body, action }) => (
            <RevealItem as="li" key={title} className="card flex flex-col">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-sans text-lg font-semibold">{title}</h2>
              <p className="mt-2 flex-1 leading-relaxed text-slate-600">{body}</p>
              {action}
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card-warm">
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold">
              <ClockIcon className="h-5 w-5 text-brand-700" />
              {t('contact.hoursTitle')}
            </h2>
            <dl className="mt-4 space-y-2 text-[15px]">
              {[
                [t('hours.weekdays'), t('hours.weekdaysTime')],
                [t('hours.saturday'), t('hours.saturdayTime')],
                [t('hours.sunday'), t('hours.sundayTime')],
              ].map(([day, time]) => (
                <div key={day} className="flex flex-wrap gap-x-3">
                  <dt className="font-medium text-slate-800">{day}:</dt>
                  <dd className="text-slate-600">{time}</dd>
                </div>
              ))}
            </dl>
            <p className="hint mt-4">{t('contact.hoursNote')}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{t('contact.onlineOnly')}</p>
          </div>

          <div className="card-warm flex flex-col">
            <h2 className="font-sans text-lg font-semibold">{t('contact.selfServiceTitle')}</h2>
            <p className="mt-2 flex-1 leading-relaxed text-slate-600">
              {t('contact.selfServiceBody')}
            </p>
            <Link to="/book" className="btn-primary mt-5 self-start">
              {t('common.book')}
              <ArrowRightIcon />
            </Link>
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-sans text-lg font-semibold text-amber-900">
              {t('contact.emergencyTitle')}
            </h2>
            <p className="mt-1.5 leading-relaxed text-amber-900">{t('emergency.notice')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
