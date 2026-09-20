import { Link } from 'react-router-dom';
import { DOCTOR } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import { RevealGroup, RevealItem } from '../design/Reveal.jsx';
import { ArrowRightIcon, CheckIcon, ShieldIcon, StethoscopeIcon } from '../components/Icons.jsx';

export default function About() {
  const { t, tList } = useI18n();

  const rows = [
    [t('about.rows.name'), t('doctor.name')],
    [t('about.rows.qualification'), t('doctor.qualification')],
    [t('about.rows.specialty'), t('doctor.specialty')],
    [t('about.rows.registration'), DOCTOR.registrationNumber],
    [t('about.rows.council'), t('doctor.council')],
    [t('about.rows.experience'), t('about.yearsValue', { years: DOCTOR.yearsExperience })],
    [t('about.rows.languages'), t('doctor.languagesSpoken')],
  ];

  return (
    <>
      <PageIntro
        eyebrow={t('about.eyebrow')}
        title={t('about.title', { name: t('doctor.name') })}
        lede={t('doctor.shortBio')}
      />

      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* ── Photo + verification ─────────────────────────────────── */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              {DOCTOR.photoUrl ? (
                <img
                  src={DOCTOR.photoUrl}
                  alt={t('doctor.photoAlt', { name: t('doctor.name') })}
                  width="640"
                  height="780"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-brand-50 p-8 text-center">
                  <StethoscopeIcon className="h-10 w-10 text-brand-400" />
                  <p className="font-medium text-brand-900">{t('about.photoPlaceholder')}</p>
                  <p className="text-sm text-brand-700">{t('about.photoHint')}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-care-200 bg-care-50 p-5">
              <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-care-900">
                <ShieldIcon className="h-5 w-5 text-care-700" />
                {t('about.verifiedTitle')}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-care-900/80">
                {t('about.verifiedBody')}
              </p>
              <p className="mt-3 font-medium text-care-900">
                {t('common.regNo', { number: DOCTOR.registrationNumber })} · {t('doctor.council')}
              </p>
            </div>

            {DOCTOR.gradPhotoUrl && (
              <img
                src={DOCTOR.gradPhotoUrl}
                alt={t('about.gradPhotoAlt')}
                width="640"
                height="480"
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl border border-slate-200 object-cover shadow-card"
              />
            )}
          </div>

          {/* ── Narrative + credentials ──────────────────────────────── */}
          <div>
            <section aria-labelledby="about-background">
              <h2 id="about-background" className="text-2xl">
                {t('about.backgroundTitle')}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-slate-700">
                {tList('doctor.longBio').map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section aria-labelledby="about-registration" className="mt-12">
              <h2 id="about-registration" className="text-2xl">
                {t('about.registrationTitle')}
              </h2>
              <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
                    <dt className="text-[15px] text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="about-credentials" className="mt-12">
              <h2 id="about-credentials" className="text-2xl">
                {t('about.credentialsTitle')}
              </h2>
              <RevealGroup as="ul" className="mt-4 space-y-3">
                {tList('doctor.credentials').map((credential) => (
                  <RevealItem as="li" key={credential.title} className="flex gap-3">
                    <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-care-600" />
                    <div>
                      <p className="font-medium text-slate-900">{credential.title}</p>
                      {credential.detail && (
                        <p className="text-[15px] text-slate-600">{credential.detail}</p>
                      )}
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>

            <section aria-labelledby="about-focus" className="mt-12">
              <h2 id="about-focus" className="text-2xl">
                {t('about.focusTitle')}
              </h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {tList('doctor.focusAreas').map((area) => (
                  <li key={area} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {area}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="about-hours" className="mt-12">
              <h2 id="about-hours" className="text-2xl">
                {t('about.hoursTitle')}
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
            </section>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Link to="/book" className="btn-primary">
                {t('common.book')}
                <ArrowRightIcon />
              </Link>
              <Link to="/services" className="btn-secondary">
                {t('common.seeServices')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
