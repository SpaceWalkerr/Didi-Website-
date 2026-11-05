import { DOCTOR, waLink } from '@shared/practice.config.js';
import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { usePauseOffscreen } from '../../lib/hooks.js';
import { greetingKey } from '../../lib/greeting.js';
import Magnetic from '../../design/Magnetic.jsx';
import SplitWords from '../hero/SplitWords.jsx';
import EcgLine from '../hero/EcgLine.jsx';
import NextSlotChip from '../hero/NextSlotChip.jsx';
import { ArrowRightIcon, ClockIcon, ShieldIcon, StethoscopeIcon, WhatsAppIcon } from '../Icons.jsx';

/** Soft pebble, in objectBoundingBox units so it fits any portrait size. */
const BLOB =
  'M0.5,0.015 C0.76,0.01 0.975,0.17 0.985,0.43 C0.995,0.7 0.86,0.965 0.56,0.985 C0.27,1.005 0.03,0.84 0.018,0.56 C0.006,0.27 0.23,0.02 0.5,0.015 Z';

function Portrait({ t }) {
  const sizes = '(min-width: 1024px) 460px, (min-width: 640px) 380px, 72vw';
  return (
    <div className="relative mx-auto w-[min(76vw,23rem)] lg:w-full lg:max-w-[28rem]">
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <clipPath id="portrait-blob" clipPathUnits="objectBoundingBox">
          <path d={BLOB} />
        </clipPath>
      </svg>

      {/* Slow light behind the portrait: two soft gradients drifting (transform only). */}
      <div className="pointer-events-none absolute -inset-[18%] -z-10" aria-hidden="true">
        <div className="hero-light absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-brand-200)/0.85),transparent)]" />
        <div className="hero-light-2 absolute inset-[12%] translate-x-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-clay-300)/0.38),transparent)]" />
      </div>

      {/* A second, slightly larger outline orbiting very slowly: the shape feels alive. */}
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="portrait-orbit pointer-events-none absolute -inset-[5%] h-[110%] w-[110%] text-brand-300" aria-hidden="true">
        <path d={BLOB} fill="none" stroke="currentColor" strokeWidth="0.0035" />
      </svg>

      <div className="portrait-breathe relative aspect-[4/5] w-full">
        <div className="h-full w-full bg-brand-100" style={{ clipPath: 'url(#portrait-blob)' }}>
          {DOCTOR.photoUrl ? (
            <picture>
              <source type="image/avif" srcSet="/images/opt/doctor-480.avif 480w, /images/opt/doctor-720.avif 720w, /images/opt/doctor-960.avif 960w" sizes={sizes} />
              <source type="image/webp" srcSet="/images/opt/doctor-480.webp 480w, /images/opt/doctor-720.webp 720w, /images/opt/doctor-960.webp 960w" sizes={sizes} />
              <img
                src="/images/opt/doctor-720.jpg"
                srcSet="/images/opt/doctor-480.jpg 480w, /images/opt/doctor-720.jpg 720w, /images/opt/doctor-960.jpg 960w"
                sizes={sizes}
                alt={t('doctor.photoAlt', { name: t('doctor.name') })}
                width="720"
                height="900"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </picture>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <StethoscopeIcon className="h-12 w-12 text-brand-500" />
            </div>
          )}
        </div>
      </div>

      {/* Name card resting on the portrait. */}
      <div className="absolute -bottom-3 left-0 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-paper/95 px-4 py-3 shadow-lift backdrop-blur sm:-left-6">
        <span className="leading-tight">
          <span className="block font-display text-[0.95rem] font-semibold text-ink">{t('doctor.name')}</span>
          <span className="block text-xs text-slate-600">
            {t('doctor.qualification')} · {t('hero.photoCaption')}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Signature moment 1 — the living hero.
 *
 * Above the fold: who the doctor is, the promise (time to listen), and the two
 * things a visitor might do next. The portrait breathes, light drifts behind
 * it, and a heartbeat trace draws once and settles. All ambient motion pauses
 * when the hero scrolls away, and none of it runs under reduced motion.
 */
export default function Hero() {
  const { t } = useI18n();
  const ref = usePauseOffscreen();

  const trust = [
    { icon: ShieldIcon, text: t('common.regNo', { number: DOCTOR.registrationNumber }), sub: t('doctor.council') },
    { icon: ClockIcon, text: t('hero.trustMinutes', { count: 20 }), sub: t('doctor.specialty') },
    { icon: WhatsAppIcon, text: t('hero.trustWhatsApp'), sub: t('doctor.qualification') },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream" aria-labelledby="hero-title">
      {/* Very soft wash so the cream is not flat. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,rgb(var(--c-brand-100)/0.7),transparent_70%),radial-gradient(40%_40%_at_0%_100%,rgb(var(--c-sand-100)),transparent_70%)]" aria-hidden="true" />

      {/* Symbol watermark: whole, uncropped, with clear space around it. */}
      <img
        src="/images/logo-mark.svg"
        alt=""
        width="100"
        height="100"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-[46%] hidden h-40 w-40 opacity-[0.07] lg:block"
      />

      <div className="container-page relative pb-6 pt-8 sm:pt-14 lg:pb-0 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="min-w-0">
            <p className="eyebrow" style={{ animation: 'fade .8s ease-out both' }}>
              {t(greetingKey())}
            </p>

            <SplitWords
              template={t('hero.title')}
              accent={t('hero.titleAccent')}
              id="hero-title"
              className="display-xl mt-5 max-w-[14ch] lg:max-w-[12ch]"
            />

            <p className="lede mt-6 max-w-[34rem] text-[1.1875rem]" style={{ animation: 'rise .9s var(--ease-calm) .55s both' }}>
              {t('hero.lede')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animation: 'rise .9s var(--ease-calm) .7s both' }}>
              <Magnetic>
                <Link to="/book" className="btn-primary btn-lg w-full sm:w-auto">
                  {t('common.book')}
                  <ArrowRightIcon />
                </Link>
              </Magnetic>
              <a
                href={waLink(t('whatsapp.default', { doctor: t('doctor.name') }))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-lg"
              >
                <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                {t('common.chatWhatsApp')}
              </a>
            </div>

            {/* Space is reserved so the chip arriving after load moves nothing. */}
            <div className="min-h-[4.25rem]">
              <NextSlotChip />
            </div>
          </div>

          <div className="relative pb-6 lg:pb-16">
            <Portrait t={t} />
          </div>
        </div>
      </div>

      {/* The heartbeat, full width, settling under the hero. */}
      <EcgLine className="relative -mt-2 w-[calc(100%-1.5rem)] xl:-mt-10" />

      {/* Trust strip — registration first, as the guidelines intend. */}
      <div className="container-page relative pb-14 pt-4 sm:pb-20">
        <ul className="grid gap-px overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-200/80 sm:grid-cols-3">
          {trust.map(({ icon: Icon, text, sub }) => (
            <li key={text} className="flex items-center gap-3.5 bg-paper/90 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 leading-snug">
                <span className="block font-semibold text-ink">{text}</span>
                <span className="block text-sm text-slate-600">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
