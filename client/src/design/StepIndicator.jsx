import { useI18n } from '../i18n/index.jsx';

/**
 * Calm three-step progress. An ordered list with aria-current on the active
 * step, so position is announced rather than implied by colour alone. The
 * connecting line fills with transform (scaleX), never width.
 */
export default function StepIndicator({ steps, current, label }) {
  const { t } = useI18n();

  return (
    <nav aria-label={label}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center text-center last:flex-none sm:last:flex-1">
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-[1.2rem] h-px bg-slate-200 max-sm:hidden">
                  <span
                    className="absolute inset-0 origin-left bg-brand-600 transition-transform duration-700 ease-calm"
                    style={{ transform: `scaleX(${done ? 1 : 0})` }}
                  />
                </span>
              )}
              <span
                aria-current={active ? 'step' : undefined}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-[background-color,color,box-shadow] duration-500 ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                      ? 'bg-paper text-brand-700 shadow-glow'
                      : 'border border-slate-300 bg-paper text-slate-500'
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
                <span className="sr-only">{t('booking.stepOf', { current: index + 1, total: steps.length })}</span>
              </span>
              <span className={`mt-2 max-w-[7rem] text-[0.8125rem] font-medium leading-tight sm:text-sm ${active ? 'text-ink' : 'text-slate-500'}`}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
