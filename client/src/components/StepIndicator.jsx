import { CheckIcon } from './Icons.jsx';

export default function StepIndicator({ steps, current, label = 'Booking progress' }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label={label}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                done
                  ? 'bg-care-600 text-white'
                  : active
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`hidden text-sm font-medium sm:block ${
                active ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
