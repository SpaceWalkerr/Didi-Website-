import { useEffect, useRef, useState } from 'react';
import { getService } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import { rupees } from '../../lib/format.js';
import { usePrefersReducedMotion } from '../../lib/hooks.js';
import { BrandMark, CalendarIcon, CheckIcon, ClockIcon, LockIcon, WhatsAppIcon } from '../Icons.jsx';

/* ── Phone screens: plain, generic UI. No names, no dialogue, nothing that
      could be read as a real booking or a review. ─────────────────────── */

function ScreenSlot({ t, locale }) {
  // A generic week (10–13 of some month), weekday names in the reader's language.
  const days = [10, 11, 12, 13].map((n, i) => [
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))),
    n,
  ]);
  const times = ['9:30', '10:00', '10:30', '11:00', '5:00', '5:30'];
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('story.screen.chooseTime')}</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {days.map(([d, n], i) => (
          <div key={d} className={`rounded-xl py-2 text-center ${i === 1 ? 'bg-action text-white' : 'bg-slate-100 text-slate-700'}`}>
            <span className="block truncate text-[0.6rem] uppercase tracking-wider opacity-80">{d}</span>
            <span className="block text-base font-semibold leading-tight">{n}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {times.map((time, i) => (
          <div
            key={time}
            className={`rounded-lg border py-2 text-center text-[0.8rem] font-medium ${
              i === 2 ? 'story-pick border-action bg-action text-white' : i === 0 ? 'border-slate-200 text-slate-400 line-through' : 'border-slate-200 text-slate-700'
            }`}
          >
            {time}
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-xl bg-action py-2.5 text-center text-sm font-semibold text-white">→</div>
    </div>
  );
}

function ScreenPay({ t, price }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="rounded-2xl bg-slate-100 p-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('story.screen.fee')}</p>
        <p className="mt-1 font-display text-3xl font-medium text-ink">{rupees(price)}</p>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--c-slate-200))" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--c-clay-500))" strokeWidth="3" strokeDasharray="94.2" strokeDashoffset="24" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium text-ink">{t('story.screen.held')}</span>
        <ClockIcon className="ml-auto h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-action py-3 text-sm font-semibold text-white">
        <LockIcon className="h-4 w-4" />
        {t('story.screen.payNow')} {rupees(price)}
      </div>
    </div>
  );
}

function ScreenLink({ t }) {
  return (
    <div className="flex h-full flex-col justify-center bg-[radial-gradient(circle_at_50%_30%,rgb(var(--c-care-50)),transparent_70%)] p-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-care-100 text-care-700">
        <CheckIcon className="h-7 w-7" />
      </div>
      <p className="mt-4 text-center font-display text-xl leading-snug text-ink">{t('story.screen.confirmed')}</p>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-paper p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarIcon className="h-4 w-4" />
          <span className="h-2 w-16 rounded-full bg-slate-200" />
          <span className="h-2 w-10 rounded-full bg-slate-200" />
        </div>
        <p className="mt-2 text-xs text-slate-600">{t('story.screen.linkNote')}</p>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-semibold text-white">
        <WhatsAppIcon className="h-4 w-4" />
        {t('story.screen.join')}
      </div>
    </div>
  );
}

function ScreenConsult({ t }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-deep p-4 text-white">
      <div className="relative">
        <span className="story-ring absolute inset-0 rounded-full border border-white/40" aria-hidden="true" />
        <span className="story-ring story-ring-2 absolute inset-0 rounded-full border border-white/30" aria-hidden="true" />
        <BrandMark className="relative h-20 w-20" />
      </div>
      <p className="mt-6 text-center font-display text-lg">{t('story.screen.inProgress')}</p>
      <p className="mt-1 text-sm tabular-nums text-white/70">{t('common.minutesShort', { count: 20 })}</p>
      <div className="mt-8 flex gap-4" aria-hidden="true">
        {['bg-white/15', 'bg-white/15', 'bg-[#c2683f]'].map((c, i) => (
          <span key={i} className={`h-11 w-11 rounded-full ${c}`} />
        ))}
      </div>
    </div>
  );
}

function Phone({ active, t, price, label, locale }) {
  const screens = [ScreenSlot, ScreenPay, ScreenLink, ScreenConsult];
  return (
    <figure
      className="relative mx-auto"
      style={{ width: 'min(16.5rem, 60vw, calc((100svh - var(--header-height) - 15.5rem) * 0.486))' }}
    >
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-brand-100)),transparent)]" aria-hidden="true" />
      <div className="relative aspect-[9/18.5] rounded-[2.6rem] border border-slate-300/80 bg-ink p-[0.55rem] shadow-lift">
        <div className="relative h-full overflow-hidden rounded-[2.1rem] bg-paper">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" aria-hidden="true" />
          <div className="absolute inset-0 pt-9">
            {screens.map((Screen, i) => (
              <div
                key={i}
                className="absolute inset-0 pt-9 transition-[opacity,transform] duration-700 ease-calm"
                style={{ opacity: active === i ? 1 : 0, transform: `translateY(${active === i ? 0 : active > i ? -14 : 14}px) scale(${active === i ? 1 : 0.98})` }}
                aria-hidden={active !== i}
              >
                <Screen t={t} price={price} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs text-slate-500">{label}</figcaption>
    </figure>
  );
}

/**
 * Signature moment 4 — "A consultation, start to finish".
 *
 * A pinned story: the phone stays in place while the four steps scroll past,
 * and its screen changes with them. Progress comes from four invisible
 * sentinels and an IntersectionObserver (no scroll handlers). With reduced
 * motion it becomes a static list of the four steps.
 *
 * The real how-it-works copy is always in the DOM as an ordered list for
 * screen readers; the animated layer is decorative.
 */
export default function ConsultStory() {
  const { t, tList, locale } = useI18n();
  const reduced = usePrefersReducedMotion();
  const steps = tList('story.steps');
  const [active, setActive] = useState(0);
  const sentinels = useRef([]);
  const price = getService('general')?.price;

  useEffect(() => {
    if (reduced || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.dataset.step));
        });
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sentinels.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [reduced, steps.length]);

  const header = (
    <div className="max-w-2xl">
      <p className="eyebrow">{t('story.eyebrow')}</p>
      <h2 id="story-heading" className="display-lg mt-4">{t('story.title')}</h2>
      <p className="mt-5 text-lg leading-relaxed text-slate-600">{t('story.lede')}</p>
    </div>
  );

  if (reduced) {
    return (
      <section id="how-it-works" aria-labelledby="story-heading" className="section bg-paper">
        <div className="container-page">
          {header}
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="card">
                <span className="font-display text-3xl text-clay-700">0{i + 1}</span>
                <h3 className="mt-3 font-sans text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id="how-it-works" aria-labelledby="story-heading" className="relative bg-paper pt-20 sm:pt-24 lg:pt-28">
      <div className="container-page">{header}</div>

      {/* Screen-reader version of the story. */}
      <ol className="sr-only">
        {steps.map((step) => (
          <li key={step.title}>
            {step.title}. {step.body}
          </li>
        ))}
      </ol>

      <div className="relative" style={{ height: `${steps.length * 72}svh` }} aria-hidden="true">
        {steps.map((_, i) => (
          <div
            key={i}
            ref={(el) => (sentinels.current[i] = el)}
            data-step={i}
            className="absolute inset-x-0"
            style={{ top: `${(i / steps.length) * 100}%`, height: `${100 / steps.length}%` }}
          />
        ))}

        <div className="sticky top-[var(--header-height)] flex h-[calc(100svh-var(--header-height))] items-center">
          <div className="container-page grid w-full items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
            {/* Desktop: the steps as a list, the active one in full colour. */}
            <ol className="hidden space-y-7 lg:block">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-5 transition-opacity duration-500" style={{ opacity: active === i ? 1 : 0.32 }}>
                  <span className="font-display text-2xl leading-none text-clay-700 tabular-nums">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-2xl text-ink">{step.title}</h3>
                    <p className={`mt-2 max-w-sm leading-relaxed text-slate-600 transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-0'}`}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Phone active={active} t={t} price={price} locale={locale} label={t('story.illustration')} />

            {/* Progress rail (desktop) / active step text (mobile). */}
            <div className="hidden h-64 justify-start lg:flex">
              <div className="relative w-px bg-slate-200">
                <div
                  className="absolute inset-x-0 top-0 h-full origin-top bg-clay-500 transition-transform duration-700 ease-calm"
                  style={{ transform: `scaleY(${(active + 1) / steps.length})` }}
                />
              </div>
            </div>

            <div className="relative min-h-[9.5rem] lg:hidden">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="absolute inset-x-0 top-0 text-center transition-[opacity,transform] duration-500 ease-calm"
                  style={{ opacity: active === i ? 1 : 0, transform: `translateY(${active === i ? 0 : 10}px)` }}
                >
                  <p className="font-display text-sm text-clay-700 tabular-nums">
                    0{i + 1} / 0{steps.length}
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-ink">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
