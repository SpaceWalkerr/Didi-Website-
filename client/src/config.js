/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Compatibility shim.
 *
 *  Practice facts now live in /shared/practice.config.js, which the Express
 *  server imports too — one file to edit, and the server stays authoritative
 *  on anything a patient is charged for.
 *
 *  This module re-exports the pieces the client uses under their old names so
 *  existing pages keep working. Prefer importing from '@shared/practice.config.js'
 *  in new code.
 * ─────────────────────────────────────────────────────────────────────────
 */
export {
  BRAND,
  DOCTOR,
  CONTACT,
  SERVICES,
  STARTING_PRICE,
  AVAILABILITY,
  BOOKING_RULES,
  waLink,
  getService,
} from '@shared/practice.config.js';

/** Which service card carries the "Most booked" flag. Text is in i18n. */
export const HIGHLIGHTED_SERVICE = 'general';
