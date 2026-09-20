import { Link } from 'react-router-dom';
import { CONTACT, DOCTOR, waLink } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import { AlertIcon, MailIcon, WhatsAppIcon } from '../Icons.jsx';

export default function Footer() {
  const { t, isEnglish } = useI18n();
  const year = new Date().getFullYear();

  const hours = [
    [t('hours.weekdays'), t('hours.weekdaysTime')],
    [t('hours.saturday'), t('hours.saturdayTime')],
    [t('hours.sunday'), t('hours.sundayTime')],
  ];

  const quickLinks = [
    ['/', t('nav.home')],
    ['/about', t('footer.aboutLink')],
    ['/services', t('footer.servicesLink')],
    ['/faq', t('footer.faqLink')],
    ['/book', t('footer.bookLink')],
    ['/contact', t('nav.contact')],
  ];

  const policyLinks = [
    ['/privacy', t('legal.privacy.navLabel')],
    ['/terms', t('legal.terms.navLabel')],
    ['/refund', t('legal.refund.navLabel')],
  ];

  return (
    <footer className="mt-auto border-t border-surface-200 bg-surface">
      {/* The emergency notice goes above everything else: for the small number
          of people who need it, it is the most important thing on the page. */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="container-page flex items-start gap-3 py-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-[15px] leading-relaxed text-amber-900">
            <strong className="font-semibold">{t('emergency.label')}</strong> {t('emergency.notice')}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="font-display text-lg text-slate-900">{t('doctor.name')}</h2>
          <p className="mt-1 text-[15px] text-slate-600">
            {t('doctor.qualification')} · {t('doctor.specialty')}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            {t('common.regNo', { number: DOCTOR.registrationNumber })}
            <br />
            {t('doctor.council')}
          </p>
        </div>

        <nav aria-label={t('footer.quickLinks')}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {t('footer.quickLinks')}
          </h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {quickLinks.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-600 transition-colors hover:text-brand-800">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('footer.legalTitle')}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {t('footer.legalTitle')}
          </h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {policyLinks.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-600 transition-colors hover:text-brand-800">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {t('footer.getInTouch')}
          </h2>
          <ul className="mt-4 space-y-3 text-[15px]">
            <li>
              <a
                href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-brand-800"
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 break-all text-slate-600 transition-colors hover:text-brand-800"
              >
                <MailIcon className="h-4 w-4 shrink-0" />
                {CONTACT.email}
              </a>
            </li>
          </ul>
          <div className="mt-4 space-y-1 text-[15px] text-slate-600">
            {hours.map(([days, time]) => (
              <p key={days}>
                <span className="font-medium text-slate-800">{days}:</span> {time}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Telemedicine compliance disclaimer — shown on every page. */}
      <div className="border-t border-surface-200">
        <div className="container-page space-y-4 py-8 text-[13px] leading-relaxed text-slate-500">
          <p>
            <strong className="font-semibold text-slate-700">{t('footer.disclaimerLabel')}</strong>{' '}
            {t('footer.disclaimer1')}
          </p>
          <p>{t('footer.disclaimer2')}</p>
          <p>{t('footer.disclaimer3')}</p>

          {/* The English wording is the version the doctor signed off, so a
              translated page has to say which one governs. */}
          {!isEnglish && <p className="italic">{t('footer.translationNote')}</p>}

          <p className="pt-2 text-slate-400">
            {t('footer.rights', { year, name: t('doctor.name') })} ·{' '}
            <Link to="/admin" className="transition-colors hover:text-slate-600">
              {t('footer.clinicLogin')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
