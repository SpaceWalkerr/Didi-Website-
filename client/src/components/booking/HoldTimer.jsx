import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';

const R = 22;
const C = 2 * Math.PI * R;

/**
 * "Your slot is held" — a ring that empties over the hold window.
 *
 * The server holds a slot for `minutes` from the moment the booking is
 * created; this shows that same window, counted from when the browser got
 * the server's answer. It is a display only — the server enforces the hold —
 * so a slightly fast or slow phone clock changes nothing that matters.
 *
 * The ring updates once a second (no animation frame loop). The accessible
 * text is announced once, on mount, and again only when it expires.
 */
export default function HoldTimer({ startedAt, minutes, onExpire }) {
  const { t } = useI18n();
  const total = minutes * 60;
  const [left, setLeft] = useState(() => Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000)));

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000));
      setLeft(next);
      if (next === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, total, onExpire]);

  const mm = String(Math.floor(left / 60));
  const ss = String(left % 60).padStart(2, '0');
  const expired = left === 0;
  const low = left < 120;

  return (
    <div
      className={`flex items-center gap-4 rounded-3xl border p-4 transition-colors duration-500 ${
        expired ? 'border-amber-300 bg-amber-50' : 'border-brand-200 bg-brand-50/70'
      }`}
    >
      <div className="relative h-14 w-14 shrink-0" aria-hidden="true">
        <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
          <circle cx="28" cy="28" r={R} fill="none" stroke="rgb(var(--c-slate-200))" strokeWidth="4" />
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            stroke={low ? 'rgb(var(--c-clay-500))' : 'rgb(var(--c-brand-600))'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - left / total)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-semibold tabular-nums text-ink">
          {mm}:{ss}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{expired ? t('hold.expired') : t('hold.title')}</p>
        {!expired && (
          <p className="text-sm text-slate-600">{t('hold.remaining', { time: `${mm}:${ss}` })}</p>
        )}
        <p className="sr-only" role="status">
          {expired ? t('hold.expired') : t('hold.aria', { minutes })}
        </p>
      </div>
    </div>
  );
}
