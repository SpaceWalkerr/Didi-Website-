import { Link } from 'react-router-dom';
import { CONTACT, DOCTOR, LEGAL_UPDATED, waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import { MailIcon, WhatsAppIcon } from '../components/Icons.jsx';

/**
 * Renders one policy from `legal.<key>` in the active language.
 *
 * The three policies share this component because they share a shape:
 * heading, lede, numbered sections of prose, then how to get in touch. Facts
 * (name, registration, contact details) are interpolated from the shared
 * config rather than written into the translated text, so correcting a
 * registration number in one place corrects it in twelve.
 */
export default function LegalPage({ docKey }) {
  const { t, tList, isEnglish } = useI18n();

  const vars = {
    doctor: t('doctor.name'),
    qualification: t('doctor.qualification'),
    reg: DOCTOR.registrationNumber,
    council: t('doctor.council'),
    email: CONTACT.email,
    phone: CONTACT.whatsappDisplay,
  };

  const fill = (text) =>
    text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));

  const sections = tList(`legal.${docKey}.sections`);

  return (
    <>
      <PageIntro
        eyebrow={t('footer.legalTitle')}
        title={t(`legal.${docKey}.title`)}
        lede={t(`legal.${docKey}.lede`)}
      >
        <p className="mt-6 text-sm text-slate-500">
          {t('legal.updated', { date: LEGAL_UPDATED })}
        </p>
      </PageIntro>

      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* A translated policy has to say which language version governs. */}
          {!isEnglish && (
            <p className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px] leading-relaxed text-amber-900">
              {t('legal.authoritative')}
            </p>
          )}

          <div className="prose-legal">
            {sections.map((section, index) => (
              <section key={section.h} aria-labelledby={`${docKey}-${index}`}>
                <h2 id={`${docKey}-${index}`}>
                  {index + 1}. {fill(section.h)}
                </h2>
                {section.p.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{fill(paragraph)}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
            <h2 className="font-sans text-lg font-semibold">{t('legal.contactTitle')}</h2>
            <p className="mt-2 leading-relaxed text-slate-700">
              {fill(t('legal.contactBody'))}
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <a href={`mailto:${CONTACT.email}`} className="btn-secondary">
                <MailIcon className="h-4 w-4" />
                {CONTACT.email}
              </a>
              <a
                href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {CONTACT.whatsappDisplay}
              </a>
            </div>
          </div>

          <nav aria-label={t('footer.legalTitle')} className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            {[
              ['/privacy', t('legal.privacy.navLabel'), 'privacy'],
              ['/terms', t('legal.terms.navLabel'), 'terms'],
              ['/refund', t('legal.refund.navLabel'), 'refund'],
            ]
              .filter(([, , key]) => key !== docKey)
              .map(([to, label]) => (
                <Link key={to} to={to} className="btn-ghost">
                  {label}
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </>
  );
}
