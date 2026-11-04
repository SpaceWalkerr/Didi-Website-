import { useI18n } from '../i18n/index.jsx';

/**
 * Three-step progress. An ordered list with aria-current on the active step,
 * so the position is available to a screen reader rather than implied by
 * colour alone — which would also fail on a monochrome or high-contrast display.
 */
export default function StepIndicator({ steps, current, label }) {
  const { t } = useI18n();

  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-2 sm:gap-3">
              <span
                aria-current={active ? 'step' : undefined}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold
                            ${
                              done
                                ? 'bg-care-600 text-white'
                                : active
                                  ? 'bg-brand-600 text-white'
                                  : 'border border-slate-300 bg-paper text-slate-500'
                            }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
                <span className="sr-only">
                  {t('booking.stepOf', { current: index + 1, total: steps.length })}
                </span>
              </span>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  active ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={`h-px flex-1 ${done ? 'bg-care-500' : 'bg-slate-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
