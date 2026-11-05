/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THE PLACEHOLDER FILE — edit this, and only this, to change practice facts.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Imported by BOTH the browser app and the Express server, so a fee or a
 *  consulting hour is defined exactly once. The server keeps validating every
 *  booking against these values, so a tampered request from a patched client
 *  cannot buy a consultation at a price it invented.
 *
 *  Anything marked  ⚠ PLACEHOLDER  is not yet confirmed and should be checked
 *  with the doctor before the site goes live.
 *
 *  Display WORDING lives in client/src/i18n/ (en.js is the reference). This
 *  file holds only what is identical in every language: numbers, registration
 *  details, file paths, phone numbers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** ⚠ PLACEHOLDER — the practice has no brand name yet; confirm or leave as the doctor's name. */
export const BRAND = {
  name: 'Dr. Richa Rani',
  shortName: 'Dr. Richa Rani',
  /** Used in <title>, Open Graph and the schema.org markup. */
  tagline: 'Online Consultation — General Physician',
  /** The live domain (no trailing slash). Drives canonical URLs, OG tags, schema.org and sitemap.xml. */
  siteUrl: 'https://richarani.in',
};

export const DOCTOR = {
  name: 'Dr. Richa Rani',
  /**
   * MBBS only. An MD is a postgraduate degree and must not appear here unless
   * it has actually been awarded — this is a registration claim, not marketing.
   */
  qualification: 'MBBS',
  specialty: 'General Physician',
  registrationNumber: '52532',
  council: 'Bihar State Medical Council',
  yearsExperience: 2,
  /** ⚠ PLACEHOLDER — replace the file, keep the filename. '' shows an illustrated fallback. */
  photoUrl: '/images/doctor-photo.jpg',
  /** Secondary photo on the About page. '' hides it. */
  gradPhotoUrl: '/images/about.jpeg',
};

/** ⚠ PLACEHOLDER — confirm both are current and that WhatsApp is active on the number. */
export const CONTACT = {
  /** International format, digits only. 91 = India. */
  whatsappNumber: '919117851233',
  whatsappDisplay: '+91 91178 51233',
  phoneDisplay: '+91 91178 51233',
  email: 'drricha7273@gmail.com',
};

/**
 * ⚠ PLACEHOLDER — fees in whole rupees. The server converts to paise for
 * Razorpay and is the only authority on what a patient is charged.
 */
export const SERVICES = [
  {
    id: 'general',
    /** English, for Razorpay notes, stored records and the doctor's own alerts.
     *  What the patient sees comes from i18n, keyed by `id`. */
    name: 'General Consultation',
    durationMinutes: 20,
    price: 500,
    highlighted: true,
  },
  {
    id: 'followup',
    name: 'Follow-up Consultation',
    durationMinutes: 10,
    price: 250,
    highlighted: false,
  },
  {
    id: 'second-opinion',
    name: 'Second Opinion',
    durationMinutes: 30,
    price: 900,
    highlighted: false,
  },
];

/** Cheapest fee, shown as "from ₹…" on the home page. Derived, never hand-edited. */
export const STARTING_PRICE = Math.min(...SERVICES.map((s) => s.price));

/**
 * ⚠ PLACEHOLDER — consulting hours in IST, keyed by day of week (0 = Sunday).
 * Each entry is a [start, end) window in 24-hour "HH:mm".
 */
export const AVAILABILITY = {
  0: [],
  1: [['09:00', '13:00'], ['17:00', '20:00']],
  2: [['09:00', '13:00'], ['17:00', '20:00']],
  3: [['09:00', '13:00'], ['17:00', '20:00']],
  4: [['09:00', '13:00'], ['17:00', '20:00']],
  5: [['09:00', '13:00'], ['17:00', '20:00']],
  6: [['10:00', '13:00']],
};

export const BOOKING_RULES = {
  slotGridMinutes: 15,
  minLeadMinutes: 60,
  maxDaysAhead: 30,
  pendingHoldMinutes: 15,
  timeZone: 'Asia/Kolkata',
  utcOffset: '+05:30',
};

/**
 * ⚠ PLACEHOLDER — the date shown on the privacy, terms and refund pages.
 * Bump this whenever the wording of any policy actually changes.
 */
export const LEGAL_UPDATED = '20 September 2026';

/** Builds a wa.me click-to-chat link with a pre-filled message. */
export const waLink = (message) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const getService = (id) => SERVICES.find((s) => s.id === id);

/**
 * Optional sections that stay hidden until there is real content for them.
 * Nothing on the site is ever filled with invented material to make a section
 * look complete.
 */
export const FEATURES = {
  /**
   * Patient feedback. Turn on only once TESTIMONIALS below holds genuine
   * feedback that each patient has agreed in writing to publish. The section
   * also stays hidden while the list is empty, whatever this flag says.
   */
  testimonials: false,
  /** "Next available slot" chip in the hero, read live from the booking API. */
  nextSlotChip: true,
  /**
   * "Most booked" badge on the Services page. Off: it is a claim about how
   * patients book, and there is no booking data behind it yet. Turn on only
   * if the dashboard shows it is true.
   */
  mostBookedBadge: false,
};

/**
 * ⚠ EMPTY ON PURPOSE — real, consented patient feedback only.
 * Shape: { quote: '…', name: 'First name + initial', meta: 'Consultation type · Month Year' }
 * Never include clinical details, and keep each patient's written consent on file.
 */
export const TESTIMONIALS = [];
