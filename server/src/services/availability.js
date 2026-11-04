import { AVAILABILITY } from '../config.js';
import { db } from '../db.js';

/**
 * Consulting hours: whatever the doctor saved in the clinic view, otherwise the
 * defaults in shared/practice.config.js. Cached for a few seconds because the
 * slot grid asks every time a patient taps a day.
 */
const SETTING = 'availability';
const TTL_MS = 15_000;
let cached = null;

export async function getAvailability() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const stored = await db.getSetting(SETTING);
  cached = { at: Date.now(), value: stored || AVAILABILITY };
  return cached.value;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Returns an error string, or null when `hours` is a valid {0..6: [[start,end], ...]}. */
export function validateAvailability(hours) {
  if (!hours || typeof hours !== 'object') return 'Hours must be an object keyed by weekday.';
  for (let day = 0; day <= 6; day += 1) {
    const windows = hours[day];
    if (!Array.isArray(windows)) return `Day ${day} is missing.`;
    let previousEnd = '00:00';
    for (const w of windows) {
      if (!Array.isArray(w) || w.length !== 2 || !HHMM.test(w[0]) || !HHMM.test(w[1])) {
        return 'Times must be HH:mm (24-hour).';
      }
      if (w[1] <= w[0]) return 'Each window must end after it starts.';
      if (w[0] < previousEnd) return 'Windows on one day must not overlap.';
      previousEnd = w[1];
    }
  }
  return null;
}

export async function saveAvailability(hours) {
  const clean = {};
  for (let day = 0; day <= 6; day += 1) clean[day] = hours[day].map(([s, e]) => [s, e]);
  await db.setSetting(SETTING, clean);
  cached = null;
  return clean;
}
