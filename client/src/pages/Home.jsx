import { Link } from 'react-router-dom';
import { DOCTOR, STARTING_PRICE, waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import {
  ArrowRightIcon, CalendarIcon, CheckIcon, ClockIcon, ShieldIcon, StethoscopeIcon,
  VideoIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

const STEP_ICONS = [CalendarIcon, ShieldIcon, WhatsAppIcon];
const TRUST_ICONS = [StethoscopeIcon, ClockIcon, ShieldIcon, VideoIcon];

export default function Home() {
  const { t, tList } = useI18n();

  const trust = tList('home.trust').map((point, i) => ({
    ...point,
    title: t(`home.trust.${i}.title`, { years: DOCTOR.yearsExperience }),
    body: t(`home.trust.${i}.body`, {
      reg: DOCTOR.registrationNumber,
      council: t('doctor.council'),
    }),
    icon: TRUST_ICONS[i],
  }));

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 via-brand-50/40 to-white">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-care-200 bg-care-50 px-3 py-1 text-xs font-semibold text-care-800">
              <span className="h-1.5 w-1.5 rounded-full bg-care-500" />
              {t('home.badge')}
            </span>

            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              {t('doctor.name')}
              <span className="mt-2 block text-xl font-medium text-brand-700 sm:text-2xl">
                {t('doctor.specialty')}
              </span>
            </h1>

            <p className="mt-3 text-sm font-medium text-slate-500">
              {t('doctor.qualification')} · {t('common.regNo', { number: DOCTOR.registrationNumber })},{' '}
              {t('doctor.council')}
            </p>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{t('doctor.shortBio')}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/book" className="btn-primary text-base">
                {t('common.book')}
                <ArrowRightIcon />
              </Link>
              <a
                href={waLink(t('whatsapp.default', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {t('common.askQuestion')}
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
              {[
                [`${DOCTOR.yearsExperience}+`, t('home.stats.experience')],
                [t('common.minutesShort', { count: 20 }), t('home.stats.typical')],
                [`₹${STARTING_PRICE}`, t('home.stats.starting')],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-semibold text-slate-900">{value}</dt>
                  <dd className="mt-0.5 text-xs text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Photo — swap the file at client/public/images/doctor-photo.jpg */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
              {DOCTOR.photoUrl ? (
                <img
                  src={DOCTOR.photoUrl}
                  alt={t('about.title', { name: t('doctor.name') })}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-100 to-care-50 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-brand-600 shadow-sm">
                    <StethoscopeIcon className="h-9 w-9" />
                  </span>
                  <p className="px-6 text-sm font-medium text-brand-800">
                    {t('home.photoPlaceholder')}
                    <span className="mt-1 block text-xs font-normal text-brand-700/70">
                      {t('home.photoHint')}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:max-w-[15rem]">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckIcon className="h-4 w-4 shrink-0 text-care-600" />
                {t('home.consultingToday')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('hours.weekdaysTime')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">{t('home.stepsEyebrow')}</p>
          <h2 className="mt-2 text-3xl">{t('home.stepsTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('home.stepsBody')}</p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {tList('home.steps').map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={step.title} className="card relative">
                <span className="absolute right-6 top-6 text-4xl font-bold text-brand-50">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Trust */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('home.trustEyebrow')}</p>
            <h2 className="mt-2 text-3xl">{t('home.trustTitle')}</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {trust.map((point) => (
              <div key={point.title} className="flex gap-4 rounded-2xl bg-white p-6 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-care-50 text-care-700">
                  <point.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{point.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions treated */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">{t('home.focusEyebrow')}</p>
            <h2 className="mt-2 text-3xl">{t('home.focusTitle')}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{t('home.focusBody')}</p>
            <Link to="/services" className="btn-secondary mt-6">
              {t('common.seeServices')}
              <ArrowRightIcon />
            </Link>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {tList('doctor.focusAreas').map((area) => (
              <li
                key={area}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              >
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-care-600" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-4">
        <div className="rounded-3xl bg-brand-700 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl text-white">{t('home.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">{t('home.ctaBody')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/book" className="btn bg-white text-brand-700 hover:bg-brand-50">
              {t('common.book')}
              <ArrowRightIcon />
            </Link>
            <a
              href={waLink(t('whatsapp.default', { doctor: t('doctor.name') }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-brand-500 text-white hover:bg-brand-600"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t('home.ctaWhatsApp')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
