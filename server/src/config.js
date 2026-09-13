import 'dotenv/config';

/**
 * Single source of truth for the practice. Everything a non-developer would
 * need to change (name, fees, clinic hours) lives here or in client/src/config.js.
 */
export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminToken: process.env.ADMIN_TOKEN || 'change-me-please',

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    // Mock mode lets the whole booking flow run before the doctor's
    // Razorpay account exists. No money moves, nothing is called externally.
    get enabled() {
      return Boolean(this.keyId && this.keySecret);
    },
  },

  notify: {
    emailFrom: process.env.NOTIFY_EMAIL_FROM || 'clinic@example.com',
    smsSender: process.env.NOTIFY_SMS_SENDER || 'DRCLNC',
  },
};

/** Services offered. `price` is in rupees; Razorpay works in paise. */
export const SERVICES = [
  {
    id: 'general',
    name: 'General Consultation',
    description:
      'For a new health concern — fever, infections, aches, digestive issues, skin problems, lifestyle disease review and prescriptions.',
    durationMinutes: 20,
    price: 500,
  },
  {
    id: 'followup',
    name: 'Follow-up Consultation',
    description:
      'For patients seen in the last 30 days. Review of reports, response to treatment and adjustment of an existing prescription.',
    durationMinutes: 10,
    price: 250,
  },
  {
    id: 'second-opinion',
    name: 'Second Opinion',
    description:
      'A detailed review of an existing diagnosis, prescription or investigation reports, with a written summary of the opinion.',
    durationMinutes: 30,
    price: 900,
  },
];

export const getService = (id) => SERVICES.find((s) => s.id === id);

/**
 * Consulting hours in IST, keyed by day of week (0 = Sunday).
 * Each entry is a [start, end) window in 24h "HH:mm".
 */
export const AVAILABILITY = {
  0: [], // Sunday — closed
  1: [['09:00', '13:00'], ['17:00', '20:00']],
  2: [['09:00', '13:00'], ['17:00', '20:00']],
  3: [['09:00', '13:00'], ['17:00', '20:00']],
  4: [['09:00', '13:00'], ['17:00', '20:00']],
  5: [['09:00', '13:00'], ['17:00', '20:00']],
  6: [['10:00', '13:00']], // Saturday — morning only
};

export const BOOKING_RULES = {
  slotGridMinutes: 15,      // slots start every 15 minutes
  minLeadMinutes: 60,       // can't book less than an hour ahead
  maxDaysAhead: 30,         // booking window
  pendingHoldMinutes: 15,   // how long an unpaid booking blocks a slot
  timeZone: 'Asia/Kolkata',
  utcOffset: '+05:30',      // India has no DST, so a fixed offset is safe
};

/**
 * Practice details used in confirmation messages and the WhatsApp join link.
 * REPLACE the placeholders below with the doctor's real details.
 * The number is in international format, digits only (91 = India).
 */
export const PRACTICE = {
  doctorName: 'Dr. Richa Rani',
  /**
   * The name in each published script, so a message written in Bhojpuri or
   * Punjabi does not switch to Latin halfway through. Falls back to doctorName.
   */
  doctorNameByLanguage: {
    hi: 'डॉ. रिचा रानी',
    bho: 'डॉ. रिचा रानी',
    bgc: 'डॉ. रिचा रानी',
    pa: 'ਡਾ. ਰਿਚਾ ਰਾਣੀ',
    ru: 'Д-р Рича Рани',
  },
  qualification: 'MBBS (MD)',
  whatsappNumber: '919117851233',
  email: 'drricha7273@gmail.com',
};
