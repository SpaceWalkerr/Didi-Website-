import { Link } from '../../lib/router.jsx';
import { CONTACT, DOCTOR, waLink } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import BrandLogo from '../BrandLogo.jsx';
import { AlertIcon, MailIcon, ShieldIcon, WhatsAppIcon } from '../Icons.jsx';

/** A flat resting trace: the end of the heartbeat that opens the site. */
function RestingLine() {
  return (
    <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="h-8 w-full text-brand-300" aria-hidden="true">
      <path
        d="M0 20 H230 l10 -10 l12 22 l9 -18 l7 6 H600"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Footer() {
  const { t, isEnglish } = useI18n();
  const year = new Date().getFullYear();

  const hours = [
    [t('hours.weekdays'), t('hours.weekdaysTime')],
    [t('hours.saturday'), t('hours.saturdayTime')],
    [t('hours.sunday'), t('hours.sundayTime')],
  ];

  const quickLinks = [
    ['/about', t('footer.aboutLink')],
    ['/services', t('footer.servicesLink')],
    ['/faq', t('footer.faqLink')],
    ['/book', t('footer.bookLink')],
    ['/account', t('nav.account')],
    ['/contact', t('nav.contact')],
  ];

  const policyLinks = [
    ['/privacy', t('legal.privacy.navLabel')],
    ['/terms', t('legal.terms.navLabel')],
    ['/refund', t('legal.refund.navLabel')],
  ];

  const heading = 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-500';

  return (
    <footer className="mt-auto bg-surface">
      {/* The emergency notice comes first: for the few who need it, it is the
          most important thing on the page. */}
      <div className="border-y border-amber-200 bg-amber-50">
        <div className="container-page flex items-start gap-3 py-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-[0.9375rem] leading-relaxed text-amber-900">
            <strong className="font-semibold">{t('emergency.label')}</strong> {t('emergency.notice')}
          </p>
        </div>
      </div>

      <div className="container-page pb-10 pt-16 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <BrandLogo variant="horizontal" alt={t('doctor.name')} className="h-12 w-auto max-w-full" />
            <p className="display-lg mt-6">{t('footerPlus.statement')}</p>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">{t('footerPlus.statementBody')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/book" className="btn-primary btn-lg">
                {t('common.book')}
              </Link>
              <a
                href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-lg"
              >
                <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                {t('common.chatWhatsApp')}
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-paper p-5">
              <h2 className={heading}>{t('footerPlus.registrationTitle')}</h2>
              <p className="mt-3 font-display text-lg text-ink">{t('doctor.name')}</p>
              <p className="text-[0.9375rem] text-slate-600">
                {t('doctor.qualification')} · {t('doctor.specialty')}
              </p>
              <p className="mt-3 flex items-start gap-2 text-[0.9375rem] leading-relaxed text-slate-700">
                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                <span>
                  {t('common.regNo', { number: DOCTOR.registrationNumber })}
                  <br />
                  {t('doctor.council')}
                </span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-paper p-5">
              <h2 className={heading}>{t('footerPlus.contactTitle')}</h2>
              <ul className="mt-3 space-y-1 text-[0.9375rem]">
                <li>
                  <a
                    href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[2.75rem] items-center gap-2 text-slate-700 transition-colors hover:text-brand-700"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                    {CONTACT.whatsappDisplay}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="inline-flex min-h-[2.75rem] items-center gap-2 break-all text-slate-700 transition-colors hover:text-brand-700"
                  >
                    <MailIcon className="h-4 w-4 shrink-0" />
                    {CONTACT.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-paper p-5 sm:col-span-2">
              <h2 className={heading}>{t('footerPlus.hoursTitle')}</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-[0.9375rem] sm:grid-cols-3">
                {hours.map(([days, time]) => (
                  <div key={days}>
                    <dt className="font-medium text-ink">{days}</dt>
                    <dd className="text-slate-600">{time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <RestingLine />
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <nav aria-label={t('footer.quickLinks')}>
            <h2 className={heading}>{t('footer.quickLinks')}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 text-[0.9375rem] min-[420px]:grid-cols-2">
              {quickLinks.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center text-slate-700 transition-colors hover:text-brand-700">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('footer.legalTitle')}>
            <h2 className={heading}>{t('footer.legalTitle')}</h2>
            <ul className="mt-3 text-[0.9375rem]">
              {policyLinks.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center text-slate-700 transition-colors hover:text-brand-700">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Telemedicine compliance disclaimer — shown on every page. */}
      <div className="border-t border-slate-200/80">
        <div className="container-page space-y-3 py-8 text-sm leading-relaxed text-slate-600">
          <p>
            <strong className="font-semibold text-slate-700">{t('footer.disclaimerLabel')}</strong>{' '}
            {t('footer.disclaimer1')}
          </p>
          <p>{t('footer.disclaimer2')}</p>
          <p>{t('footer.disclaimer3')}</p>
          {!isEnglish && <p className="italic">{t('footer.translationNote')}</p>}
          <p className="pt-2 text-slate-500">{t('footer.rights', { year, name: t('doctor.name') })}</p>
        </div>
      </div>
    </footer>
  );
}
