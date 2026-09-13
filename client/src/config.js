/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Practice configuration — facts, not wording.
 *
 *  All display TEXT now lives in src/i18n/ (en.js is the reference; every other
 *  language mirrors it). This file holds only the things that are the same in
 *  every language: numbers, the registration number, the photo path.
 *
 *  Service prices and durations come from the server (server/src/config.js),
 *  which stays authoritative so a patient cannot be charged a price they were
 *  never shown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const DOCTOR = {
  registrationNumber: '52532',
  yearsExperience: 2,
  // Replace client/public/images/doctor-photo.png with the real photograph,
  // keeping the filename. Set this to '' to fall back to an illustrated placeholder.
  photoUrl: '/images/doctor-photo.jpg',
  // Shown beside the qualifications on the About page. Set to '' to hide it.
  gradPhotoUrl: '/images/about.jpeg',
};

export const CONTACT = {
  // International format, digits only. 91 = India.
  whatsappNumber: '919117851233',
  whatsappDisplay: '+91 91178 51233',
  email: 'drricha7273@gmail.com',
  phoneDisplay: '+91 91178 51233',
};

/**
 * Starting fee shown on the home page. Keep it in step with the cheapest
 * service price in server/src/config.js.
 */
export const STARTING_PRICE = 250;

/** Which service card carries the "Most booked" flag. Text is in i18n. */
export const HIGHLIGHTED_SERVICE = 'general';

/** Builds a wa.me click-to-chat link with a pre-filled message. */
export const waLink = (message) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
