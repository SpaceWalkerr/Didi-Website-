import { DOCTOR } from '@shared/practice.config.js';
import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { ArrowRightIcon, LockIcon, ShieldIcon } from '../Icons.jsx';

/**
 * Who the patient will be speaking to: approach, registration and privacy.
 * Every fact here comes from shared/practice.config.js or the doctor's own
 * bio in i18n — nothing is added for effect.
 */
export default function HomeTrust() {
  const { t, tList } = useI18n();
  const bio = tList('doctor.longBio');

  const rows = [
    [t('about.rows.qualification'), t('doctor.qualification')],
    [t('about.rows.specialty'), t('doctor.specialty')],
    [t('about.rows.registration'), DOCTOR.registrationNumber],
    [t('about.rows.council'), t('doctor.council')],
    [t('about.rows.languages'), t('doctor.languagesSpoken')],
  ];

  return (
    <section id="about-doctor" aria-labelledby="about-doctor-heading" className="section bg-cream">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="reveal">
          {DOCTOR.gradPhotoUrl && (
            <figure className="relative mx-auto max-w-sm lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-[2rem] bg-sand-100 shadow-lift">
                <picture>
                  <source type="image/avif" srcSet="/images/opt/about-480.avif 480w, /images/opt/about-800.avif 800w" sizes="(min-width: 1024px) 380px, 80vw" />
                  <source type="image/webp" srcSet="/images/opt/about-480.webp 480w, /images/opt/about-800.webp 800w" sizes="(min-width: 1024px) 380px, 80vw" />
                  <img
                    src="/images/opt/about-480.jpg"
                    srcSet="/images/opt/about-480.jpg 480w, /images/opt/about-800.jpg 800w"
                    sizes="(min-width: 1024px) 380px, 80vw"
                    alt={t('homeTrust.gradAlt')}
                    width="480"
                    height="480"
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                </picture>
              </div>
              <span className="absolute -bottom-4 -right-3 rotate-[-4deg] rounded-full bg-clay-100 px-4 py-2 font-display text-sm text-clay-700 shadow-card">
                {t('doctor.qualification')}
              </span>
            </figure>
          )}
        </div>

        <div className="reveal" style={{ transitionDelay: '120ms' }}>
          <p className="eyebrow">{t('homeTrust.eyebrow')}</p>
          <h2 id="about-doctor-heading" className="display-lg mt-4">
            {t('homeTrust.title')}
          </h2>

          <h3 className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('homeTrust.approachTitle')}</h3>
          <div className="mt-3 space-y-4 text-lg leading-relaxed text-slate-700">
            {bio.slice(1, 2).map((p) => (
              <p key={p.slice(0, 30)} className="font-display text-[1.35rem] leading-snug text-ink">
                “{p}”
              </p>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-paper p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <ShieldIcon className="h-4 w-4 text-brand-700" />
                {t('homeTrust.registrationTitle')}
              </h3>
              <dl className="mt-3 space-y-2 text-[0.9375rem]">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-sand-100 p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <LockIcon className="h-4 w-4 text-brand-700" />
                {t('homeTrust.privacyTitle')}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-700">{t('homeTrust.privacyBody')}</p>
              <Link to="/privacy" className="mt-auto inline-flex min-h-[2.75rem] items-center gap-1.5 pt-3 text-[0.9375rem] font-semibold text-brand-700 hover:underline">
                {t('homeTrust.privacyLink')}
                <ArrowRightIcon />
              </Link>
            </div>
          </div>

          <Link to="/about" className="btn-secondary mt-8">
            {t('homeTrust.aboutLink')}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
