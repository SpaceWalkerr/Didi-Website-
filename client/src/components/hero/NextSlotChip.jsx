import { useEffect, useState } from 'react';
import { FEATURES } from '@shared/practice.config.js';
import { Link } from '../../lib/router.jsx';
import { onIdle } from '../../lib/hooks.js';
import { findNextSlot } from '../../lib/nextSlot.js';
import { formatTime } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { ArrowRightIcon } from '../Icons.jsx';

/**
 * "Next available · Today, 5:15 pm" — live from the booking API.
 *
 * Fetched only once the page is idle, so it never competes with the first
 * paint, and rendered only if the API answers with a real free slot. Its
 * space is not reserved: it fades in below the buttons without moving
 * anything above it. Tapping it opens booking with that date and time chosen.
 */
export default function NextSlotChip() {
  const { t, locale } = useI18n();
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    if (!FEATURES.nextSlotChip) return undefined;
    let live = true;
    const cancel = onIdle(() => {
      findNextSlot().then((found) => live && setSlot(found));
    });
    return () => {
      live = false;
      cancel();
    };
  }, []);

  if (!slot) return null;

  const day =
    slot.offset === 0
      ? t('hero.today')
      : slot.offset === 1
        ? t('hero.tomorrow')
        : new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(
            new Date(`${slot.date}T12:00:00+05:30`),
          );
  const params = new URLSearchParams({ service: slot.service, date: slot.date, time: slot.time });

  return (
    <Link
      to={`/book?${params}`}
      className="group mt-6 inline-flex min-h-[2.75rem] max-w-full items-center gap-3 rounded-3xl border border-brand-200 bg-paper/80 py-1.5 pl-3 pr-4 text-sm shadow-card backdrop-blur transition-[transform,border-color] duration-300 hover:border-brand-400 active:scale-[0.98]"
      style={{ animation: 'rise .7s var(--ease-calm) both' }}
    >
      <span className="live-dot relative h-2 w-2 shrink-0 rounded-full bg-care-500 text-care-500" aria-hidden="true" />
      {/* Wraps rather than truncating: the time is the point of the chip. */}
      <span className="min-w-0">
        <span className="text-slate-600">{t('hero.nextSlot')}</span>
        <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span>
        <span className="whitespace-nowrap font-semibold text-ink">
          {day}, {formatTime(slot.time, locale)}
        </span>
      </span>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-brand-700 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}
