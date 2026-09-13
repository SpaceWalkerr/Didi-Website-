import { Link } from 'react-router-dom';
import { CONTACT, DOCTOR, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import { AlertIcon, MailIcon, WhatsAppIcon } from './Icons.jsx';

export default function Footer() {
  const { t, isEnglish } = useI18n();
  const year = new Date().getFullYear();

  const hours = [
    [t('hours.weekdays'), t('hours.weekdaysTime')],
    [t('hours.saturday'), t('hours.saturdayTime')],
  ];

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      {/* Emergency notice sits above everything else — it is the most important
          thing on the page for the small number of people who need it. */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="container-page flex items-start gap-3 py-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">{t('emergency.label')}</strong> {t('emergency.notice')}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{t('doctor.name')}</h3>
          <p className="mt-1 text-sm text-slate-600">{t('doctor.qualification')}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t('common.regNo', { number: DOCTOR.registrationNumber })}
            <br />
            {t('doctor.council')}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {t('footer.quickLinks')}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ['/', t('nav.home')],
              ['/about', t('footer.aboutLink')],
              ['/services', t('footer.servicesLink')],
              ['/book', t('footer.bookLink')],
              ['/contact', t('nav.contact')],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-600 transition hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            {t('footer.getInTouch')}
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-600 transition hover:text-brand-700"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 break-all text-slate-600 transition hover:text-brand-700"
              >
                <MailIcon className="h-4 w-4 shrink-0" />
                {CONTACT.email}
              </a>
            </li>
          </ul>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            {hours.map(([days, time]) => (
              <p key={days}>
                <span className="font-medium text-slate-800">{days}:</span> {time}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Telemedicine compliance disclaimer — shown on every page. */}
      <div className="border-t border-slate-200">
        <div className="container-page space-y-4 py-8 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="font-semibold text-slate-700">{t('footer.disclaimerLabel')}</strong>{' '}
            {t('footer.disclaimer1')}
          </p>
          <p>{t('footer.disclaimer2')}</p>
          <p>{t('footer.disclaimer3')}</p>

          {/* The English wording is the one the doctor and their lawyer signed off,
              so a translated page says which version governs. */}
          {!isEnglish && <p className="italic">{t('footer.translationNote')}</p>}

          <p className="pt-2 text-slate-400">
            {t('footer.rights', { year, name: t('doctor.name') })} ·{' '}
            <Link to="/admin" className="transition hover:text-slate-600">
              {t('footer.clinicLogin')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
