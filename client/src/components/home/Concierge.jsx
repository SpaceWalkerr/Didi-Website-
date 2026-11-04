import { useEffect, useRef, useState } from 'react';
import { SERVICES } from '@shared/practice.config.js';
import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { rupees } from '../../lib/format.js';
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, RefreshIcon, SparkIcon } from '../Icons.jsx';

/**
 * The rules. Deliberately simple and visible — this chooses a booking TYPE,
 * never a diagnosis:
 *
 *   new problem  → already have a diagnosis/reports to review? → Second opinion : General
 *   seen before  → within the last 30 days?                    → Follow-up      : General
 *
 * (Follow-up is defined on the Services page as "for patients seen in the
 * last 30 days", so anything older is a General Consultation.)
 */
const decide = (answers) => {
  if (answers.kind === 'new') return answers.review ? 'second-opinion' : 'general';
  return answers.recent ? 'followup' : 'general';
};

function Choice({ children, onClick, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="group flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-paper px-5 py-3.5 text-left text-base font-medium text-ink shadow-card
                 transition-[transform,border-color,background-color] duration-300 ease-calm hover:-translate-y-0.5 hover:border-brand-300 active:scale-[0.98]
                 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <span>{children}</span>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-brand-700 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  );
}

/**
 * Signature moment 3 — "Which consultation is right for me?"
 *
 * Two taps to a suggested booking type with its fee and duration from the
 * shared config, then straight into booking with that type selected. Every
 * step is focus-managed and announced, so it works by keyboard and screen
 * reader exactly as it does by touch.
 */
export default function Concierge() {
  const { t } = useI18n();
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0: kind, 1: follow-up question, 2: result
  const [moved, setMoved] = useState(false);
  const liveRef = useRef(null);

  const result = step === 2 ? decide(answers) : null;
  const service = result ? SERVICES.find((s) => s.id === result) : null;

  const answer = (patch, next) => {
    setAnswers((a) => ({ ...a, ...patch }));
    setStep(next);
    setMoved(true);
  };
  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    setMoved(true);
  };
  const restart = () => {
    setAnswers({});
    setStep(0);
    setMoved(true);
  };

  const question =
    step === 0
      ? t('concierge.q1', { doctor: t('doctor.name') })
      : answers.kind === 'new'
        ? t('concierge.q2New')
        : t('concierge.q2Seen');

  return (
    <section id="concierge" aria-labelledby="concierge-heading" className="section bg-cream">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-deep px-5 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          {/* Slow light in the panel. */}
          <div className="hero-light pointer-events-none absolute -right-1/4 -top-1/3 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(closest-side,rgba(127,213,201,0.28),transparent)]" aria-hidden="true" />

          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="eyebrow !text-[#9fe0d5]">{t('concierge.eyebrow')}</p>
              <h2 id="concierge-heading" className="display-lg mt-4 !text-white">
                {t('concierge.title')}
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">{t('concierge.lede')}</p>

              {/* Progress: two questions, then the answer. */}
              <ol className="mt-8 flex items-center gap-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className={`h-1.5 rounded-full transition-[background-color,width] duration-500 ${
                      i <= step ? 'w-10 bg-[#e2a587]' : 'w-5 bg-white/20'
                    }`}
                  />
                ))}
              </ol>
            </div>

            <div className="min-h-[18rem]">
              <p ref={liveRef} className="sr-only" aria-live="polite">
                {step < 2 ? `${t('concierge.step', { current: step + 1, total: 2 })}. ${question}` : `${t('concierge.resultEyebrow')}: ${t(`services.items.${result}.name`)}`}
              </p>

              {step < 2 ? (
                <div key={`q${step}-${answers.kind || ''}`} className="rounded-3xl bg-paper p-5 text-slate-700 sm:p-7" style={{ animation: 'rise .55s var(--ease-calm) both' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {t('concierge.step', { current: step + 1, total: 2 })}
                  </p>
                  <p className="mt-3 font-display text-[1.5rem] leading-snug text-ink">{question}</p>
                  <div className="mt-6 grid gap-3">
                    {step === 0 ? (
                      <>
                        <Choice autoFocus={moved} onClick={() => answer({ kind: 'new' }, 1)}>{t('concierge.q1New')}</Choice>
                        <Choice onClick={() => answer({ kind: 'seen' }, 1)}>{t('concierge.q1Seen')}</Choice>
                      </>
                    ) : (
                      <>
                        <Choice autoFocus={moved} onClick={() => answer(answers.kind === 'new' ? { review: true } : { recent: true }, 2)}>
                          {t('concierge.yes')}
                        </Choice>
                        <Choice onClick={() => answer(answers.kind === 'new' ? { review: false } : { recent: false }, 2)}>
                          {t('concierge.no')}
                        </Choice>
                      </>
                    )}
                  </div>
                  {step > 0 && (
                    <button type="button" onClick={back} className="btn-ghost mt-4 -ml-2 !min-h-[2.75rem] text-sm">
                      <ArrowLeftIcon />
                      {t('concierge.back')}
                    </button>
                  )}
                </div>
              ) : (
                <div key={result} className="relative rounded-3xl bg-paper p-6 text-slate-700 shadow-lift sm:p-8" style={{ animation: 'rise .6s var(--ease-calm) both' }}>
                  <p className="eyebrow">{t('concierge.resultEyebrow')}</p>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <h3 className="display-md">{t(`services.items.${result}.name`)}</h3>
                    <p className="font-display text-[2.25rem] font-medium leading-none text-brand-700">{rupees(service.price)}</p>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <ClockIcon className="h-4 w-4 text-brand-700" />
                    {t('common.minutes', { count: service.durationMinutes })}
                    <span aria-hidden="true">·</span>
                    {t('common.perConsultation')}
                  </p>
                  <p className="mt-4 leading-relaxed text-slate-600">{t(`concierge.why.${result}`)}</p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to={`/book?service=${result}`} className="btn-primary btn-lg flex-1">
                      {t('services.bookThis')}
                      <ArrowRightIcon />
                    </Link>
                    <button type="button" onClick={restart} className="btn-secondary btn-lg">
                      <RefreshIcon />
                      {t('concierge.restart')}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-white/75">
                <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#e2a587]" />
                {t('concierge.disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
