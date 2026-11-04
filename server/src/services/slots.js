import { BOOKING_RULES, getService } from '../config.js';
import { getAvailability } from './availability.js';
import { db } from '../db.js';

const { slotGridMinutes, minLeadMinutes, maxDaysAhead, pendingHoldMinutes, utcOffset } =
  BOOKING_RULES;

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Epoch ms for a "YYYY-MM-DD" + "HH:mm" pair interpreted in IST. */
export const istEpoch = (date, time) => Date.parse(`${date}T${time}:00${utcOffset}`);

/** Today's date in IST as "YYYY-MM-DD". */
export const istToday = () => istDateString(new Date());

export const istDateString = (d) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_RULES.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

export const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

/** Day of week (0 = Sunday) for a "YYYY-MM-DD" date in IST. */
const dayOfWeek = (date) => new Date(`${date}T12:00:00${utcOffset}`).getUTCDay();

/**
 * A booking still occupies its slot if it is confirmed, or if it is pending
 * payment and the hold hasn't expired yet.
 */
const isBlocking = (booking, now) => {
  if (booking.status === 'confirmed') return true;
  if (booking.status !== 'pending') return false;
  return now - Date.parse(booking.createdAt) < pendingHoldMinutes * 60 * 1000;
};

/**
 * Ranges on a given date that are unavailable, as [start, end) minute pairs.
 *
 * Two sources, deliberately kept separate in the result so the UI can say
 * "already booked" versus "the doctor is unavailable" — a patient reads those
 * very differently:
 *   · live bookings (confirmed, or pending with an unexpired hold)
 *   · slot blocks the doctor has set (leave, a half-day, being ill)
 *
 * `excludeId` lets a booking ignore its own hold when it re-checks its slot.
 * Only this date is fetched, not the whole table — it runs every time a
 * patient taps a different day.
 */
const busyRanges = async (date, now, excludeId) => {
  const [bookings, blocks] = await Promise.all([db.onDate(date), db.blocksOnDate(date)]);

  const booked = bookings
    .filter((b) => b.id !== excludeId && isBlocking(b, now))
    .map((b) => {
      const start = toMinutes(b.time);
      return [start, start + b.durationMinutes];
    });

  // A whole-day block is stored with NULL times; treat it as the entire day.
  const blocked = blocks.map((b) =>
    b.wholeDay || !b.start ? [0, 24 * 60] : [toMinutes(b.start), toMinutes(b.end)],
  );

  return { booked, blocked };
};

const overlaps = (aStart, aEnd, ranges) =>
  ranges.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd);

/**
 * Every bookable start time for a date and service.
 * Returns [{ time, available, reason }] so the UI can grey out taken slots
 * rather than making them disappear — patients find that less confusing.
 */
export async function getSlots(date, serviceId, now = Date.now(), excludeId = null) {
  const service = getService(serviceId);
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  // Release holds that lapsed while nobody was looking. Without this an
  // abandoned booking would keep its slot forever: the database constraint
  // has no concept of time passing, so something has to move the row out of
  // `pending` before the slot can be sold again.
  await db.expireStale(new Date(now));

  const windows = (await getAvailability())[dayOfWeek(date)] || [];
  const { booked, blocked } = await busyRanges(date, now, excludeId);
  const earliest = now + minLeadMinutes * 60 * 1000;
  const slots = [];

  for (const [open, close] of windows) {
    const openMin = toMinutes(open);
    const closeMin = toMinutes(close);

    for (let start = openMin; start + service.durationMinutes <= closeMin; start += slotGridMinutes) {
      const time = toHHMM(start);
      const startsAt = istEpoch(date, time);

      const end = start + service.durationMinutes;
      let available = true;
      let reason = null;
      if (startsAt < earliest) {
        available = false;
        reason = 'past';
      } else if (overlaps(start, end, blocked)) {
        available = false;
        reason = 'blocked';
      } else if (overlaps(start, end, booked)) {
        available = false;
        reason = 'booked';
      }

      slots.push({ time, available, reason });
    }
  }

  return slots;
}

/**
 * Guard used before creating a booking, so two patients can't grab one slot.
 *
 * Returns null when the slot is fine, otherwise `{ code, params }`. Codes map to
 * keys under `errors.*` in the client's translation files — the server never
 * sends a user-facing sentence, because it does not know what language the
 * patient is reading.
 */
export async function validateSlot(date, time, serviceId, now = Date.now(), excludeId = null) {
  if (!isValidDateString(date)) return { code: 'slotInvalidDate' };

  const service = getService(serviceId);
  if (!service) return { code: 'serviceInvalid' };

  const maxDate = istDateString(new Date(now + maxDaysAhead * 24 * 60 * 60 * 1000));
  if (date < istToday()) return { code: 'slotInvalidDate' };
  if (date > maxDate) return { code: 'slotTooFar', params: { days: maxDaysAhead } };

  const slots = await getSlots(date, serviceId, now, excludeId);
  const slot = slots.find((s) => s.time === time);
  if (!slot) return { code: 'slotOutsideHours' };
  if (slot.reason === 'past') return { code: 'slotPast' };
  if (slot.reason === 'blocked') return { code: 'slotBlocked' };
  if (!slot.available) return { code: 'slotTaken' };

  return null;
}

export const bookingRules = { maxDaysAhead, minLeadMinutes, pendingHoldMinutes };
