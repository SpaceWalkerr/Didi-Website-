import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { CONTACT, DOCTOR, STARTING_PRICE, waLink } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import { fadeUp, maybe, stagger } from '../../site/motion.js';
import Counter from '../../design/Counter.jsx';
import Badge from '../../design/Badge.jsx';
import { ArrowRightIcon, ShieldIcon, StethoscopeIcon, WhatsAppIcon } from '../Icons.jsx';

/**
 * Above the fold: who the doctor is, what they promise, and the two things a
 * visitor might want to do next.
 *
 * The photo is eager-loaded with explicit dimensions — it is the largest
 * contentful paint on mobile, so lazy-loading it would delay LCP rather than
 * help, and a missing intrinsic size would shift the layout when it arrives.
 */
export default function Hero() {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-brand-50/30 to-white">
      <div className="container-page py-14 sm:py-20">
        <m.div
          initial="hidden"
          animate="show"
          variants={reduced ? { hidden: {}, show: {} } : stagger(0.09)}
          className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* ── Copy ─────────────────────────────────────────────────── */}
          <div>
            <m.div variants={maybe(fadeUp, reduced)}>
              <Badge tone="care">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-care-500 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-care-600" />
                </span>
                {t('home.badge')}
              </Badge>
            </m.div>

            <m.h1
              variants={maybe(fadeUp, reduced)}
              className="mt-5 text-[2.5rem] leading-[1.12] sm:text-5xl lg:text-[3.4rem]"
            >
              {t('doctor.tagline')}
            </m.h1>

            <m.p variants={maybe(fadeUp, reduced)} className="lede mt-5 max-w-xl">
              {t('doctor.shortBio')}
            </m.p>

            <m.div variants={maybe(fadeUp, reduced)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/book" className="btn-primary text-base">
                {t('common.book')}
                <ArrowRightIcon />
              </Link>
              <a
                href={waLink(t('whatsapp.default', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp text-base"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t('common.chatWhatsApp')}
              </a>
            </m.div>

            {/* ── Trust strip ────────────────────────────────────────── */}
            <m.dl
              variants={maybe(fadeUp, reduced)}
              className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-brand-200/70 pt-6"
            >
              {[
                {
                  value: <Counter value={DOCTOR.yearsExperience} suffix="+" />,
                  label: t('home.stats.experience'),
                },
                { value: t('common.minutesShort', { count: 20 }), label: t('home.stats.typical') },
                {
                  value: <Counter value={STARTING_PRICE} prefix="₹" />,
                  label: t('home.stats.starting'),
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-2xl font-semibold text-brand-800 sm:text-3xl">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-slate-600">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </m.dl>

            <m.p
              variants={maybe(fadeUp, reduced)}
              className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-slate-600"
            >
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>
                {t('doctor.qualification')} · {t('doctor.specialty')} ·{' '}
                {t('common.regNo', { number: DOCTOR.registrationNumber })}, {t('doctor.council')}
              </span>
            </m.p>
          </div>

          {/* ── Photo ────────────────────────────────────────────────── */}
          <m.div variants={maybe(fadeUp, reduced)} className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift">
              {DOCTOR.photoUrl ? (
                <img
                  src={DOCTOR.photoUrl}
                  alt={t('doctor.photoAlt', { name: t('doctor.name') })}
                  width="640"
                  height="780"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-brand-50 p-8 text-center">
                  <StethoscopeIcon className="h-10 w-10 text-brand-400" />
                  <p className="font-medium text-brand-900">{t('home.photoPlaceholder')}</p>
                  <p className="text-sm text-brand-700">{t('home.photoHint')}</p>
                </div>
              )}
            </div>

            <div className="absolute -bottom-4 left-1/2 w-[min(20rem,90%)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                {CONTACT.whatsappDisplay}
              </p>
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
