import { api } from './api.js';

const KEY = 'clinic-next-slot';
const FRESH_MS = 2 * 60 * 1000;

const istDate = (offsetDays) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(Date.now() + offsetDays * 86400000),
  );

/**
 * The next bookable General Consultation slot, read from the same public API
 * the booking page uses. Looks a few open days ahead and stops at the first
 * free slot. Cached for two minutes per tab so moving between pages does not
 * re-ask. Resolves null on any failure: the chip simply does not appear.
 */
export async function findNextSlot({ service = 'general', daysAhead = 6 } = {}) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < FRESH_MS) return cached.slot;
  } catch {
    // Storage blocked: just fetch.
  }

  try {
    const meta = await api.meta();
    const open = new Set(meta.openDays || []);
    for (let i = 0; i <= daysAhead; i++) {
      const date = istDate(i);
      if (date < meta.minDate || (meta.maxDate && date > meta.maxDate)) continue;
      const dow = new Date(`${date}T12:00:00+05:30`).getUTCDay();
      if (open.size && !open.has(dow)) continue;
      const { slots } = await api.slots(date, service);
      const free = slots.find((s) => s.available);
      if (free) {
        const slot = { date, time: free.time, offset: i, service };
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), slot }));
        } catch {
          // Fine without the cache.
        }
        return slot;
      }
    }
  } catch {
    // Server asleep or offline: no chip.
  }
  return null;
}
