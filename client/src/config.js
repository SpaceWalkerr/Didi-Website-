/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EDIT THIS FILE FIRST.
 *  Every piece of text, number and price a non-developer needs to change lives
 *  here. Items marked TODO are placeholders and must be replaced before launch.
 *  Service prices/durations must also match server/src/config.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const DOCTOR = {
  name: 'Dr. [Full Name]', // TODO
  qualification: 'MBBS, MD (General Medicine)', // TODO
  specialty: 'General Physician & Internal Medicine',
  tagline: 'Careful, unhurried online consultations for everyday health concerns.',
  yearsExperience: 12, // TODO
  // Registration details are mandatory on a telemedicine site in India and must
  // be displayed to the patient (2020 Telemedicine Practice Guidelines, 3.7.1).
  registrationNumber: 'XXXXX/2013', // TODO
  medicalCouncil: '[State] Medical Council', // TODO
  languages: ['English', 'Hindi'], // TODO
  photoUrl: '', // TODO: put a photo in client/public/ and set e.g. '/doctor.jpg'
  shortBio:
    'I am a general physician with over a decade of experience in outpatient and internal ' +
    'medicine. I treat common infections, fevers, lifestyle conditions such as diabetes and ' +
    'hypertension, and everyday complaints that do not need a hospital visit — with enough ' +
    'time to actually listen.', // TODO
  longBio: [
    'After completing MBBS and post-graduate training in internal medicine, I spent several ' +
      'years in busy hospital outpatient departments before moving to a practice built around ' +
      'longer, calmer consultations.',
    'Most everyday health problems do not need a waiting room. A structured conversation, a ' +
      'careful history and a look at your reports can resolve a great deal — and when it cannot, ' +
      'I will say so plainly and help you find the right specialist or in-person care.',
    'I consult online for patients across India, and follow the Telemedicine Practice ' +
      'Guidelines issued by the Board of Governors in supersession of the Medical Council of ' +
      'India in March 2020.',
  ], // TODO
  credentials: [
    { title: 'MBBS', detail: '[Medical College Name], [Year]' }, // TODO
    { title: 'MD — General Medicine', detail: '[Institute Name], [Year]' }, // TODO
    { title: 'Senior Resident, Internal Medicine', detail: '[Hospital Name], [Years]' }, // TODO
    { title: 'Certificate in Telemedicine', detail: 'Completed as required for online practice' },
  ],
  focusAreas: [
    'Fever, infections and seasonal illness',
    'Diabetes, blood pressure and thyroid follow-up',
    'Digestive and acidity complaints',
    'Respiratory problems, cough and allergies',
    'Report interpretation and preventive health',
    'Medication review and second opinions',
  ],
};

export const CONTACT = {
  // International format, digits only. 91 = India. TODO: replace.
  whatsappNumber: '919999999999',
  whatsappDisplay: '+91 99999 99999',
  email: 'consult@example.com', // TODO
  phoneDisplay: '+91 99999 99999', // TODO
  // Keep in step with AVAILABILITY in server/src/config.js.
  hours: [
    { days: 'Monday – Friday', time: '9:00 AM – 1:00 PM, 5:00 PM – 8:00 PM' },
    { days: 'Saturday', time: '10:00 AM – 1:00 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],
  responseNote: 'WhatsApp messages are usually answered within a few hours on working days.',
};

/** Pre-filled WhatsApp messages, so the doctor knows why someone is writing. */
export const WHATSAPP_MESSAGES = {
  default: `Hello ${DOCTOR.name}, I found your website and would like to ask about an online consultation.`,
  booking: `Hello ${DOCTOR.name}, I need help booking an online consultation.`,
  contact: `Hello ${DOCTOR.name}, I have a question about your consultation services.`,
};

export const waLink = (message = WHATSAPP_MESSAGES.default) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;

/**
 * Starting fee shown on the home page. Keep it in step with the cheapest
 * service price in server/src/config.js.
 */
export const STARTING_PRICE = 250;

/** Shown on the services page. Server prices are authoritative. */
export const SERVICE_EXTRAS = {
  general: {
    badge: 'Most booked',
    includes: [
      'Video consultation with the doctor',
      'Digital prescription where appropriate',
      'Advice on tests, if any are needed',
      'One free follow-up message within 48 hours',
    ],
  },
  followup: {
    badge: null,
    includes: [
      'For patients consulted in the last 30 days',
      'Review of reports and response to treatment',
      'Adjustment of the existing prescription',
    ],
  },
  'second-opinion': {
    badge: null,
    includes: [
      'Detailed review of your diagnosis and reports',
      'Written summary of the opinion afterwards',
      'Guidance on whether further specialist input is needed',
    ],
  },
};

/** Emergency and scope-of-practice notices required for safe telemedicine. */
export const EMERGENCY_NOTICE =
  'Online consultation is not suitable for emergencies. If you have chest pain, breathlessness, ' +
  'severe bleeding, fainting, a seizure, a serious injury or thoughts of self-harm, call 112 ' +
  '(or 108 for an ambulance) or go to the nearest hospital immediately.';
