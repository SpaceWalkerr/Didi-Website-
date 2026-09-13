import { PRACTICE, config } from '../config.js';

/**
 * Notification placeholders.
 *
 * Right now these log to the console so the flow is complete and testable.
 * To go live, drop a provider call into each function — the rest of the app
 * does not need to change:
 *
 *   Email : Resend / SendGrid / Amazon SES / Nodemailer + the clinic's SMTP
 *   SMS   : MSG91 / Twilio / Gupshup   (DLT template registration is required in India)
 *   WhatsApp: the WhatsApp Business Cloud API, if the doctor wants automated reminders
 *             instead of the patient tapping the click-to-chat link.
 */

const log = (channel, to, subject, body) => {
  console.log(
    [
      '',
      `── ${channel} (placeholder — not actually sent) ─────────────`,
      `to      : ${to}`,
      subject ? `subject : ${subject}` : null,
      body,
      '────────────────────────────────────────────────────────────',
    ]
      .filter(Boolean)
      .join('\n'),
  );
};

/**
 * The message pre-filled in the patient's WhatsApp when they tap the join link,
 * in the language they booked in — it would be odd to read the site in Punjabi
 * and then be handed an English sentence to send.
 *
 * The booking ID, name and time are interpolated in every language, so the
 * doctor can act on the message whichever one arrives.
 */
const JOIN_MESSAGES = {
  en: ({ doctor, name, service, when, id }) =>
    `Hello ${doctor}, this is ${name}. I have a ${service} booked for ${when} ` +
    `(Booking ID: ${id}). I'm ready for the consultation.`,
  hi: ({ doctor, name, when, id }) =>
    `नमस्ते ${doctor}, मैं ${name} हूँ। मेरा परामर्श ${when} के लिए बुक है ` +
    `(बुकिंग आईडी: ${id})। मैं तैयार हूँ।`,
  bho: ({ doctor, name, when, id }) =>
    `नमस्ते ${doctor}, हम ${name} बानी। हमार सलाह ${when} खातिर बुक बा ` +
    `(बुकिंग आईडी: ${id})। हम तइयार बानी।`,
  bgc: ({ doctor, name, when, id }) =>
    `नमस्ते ${doctor}, मैं ${name} सूं। मेरी सलाह ${when} खातर बुक सै ` +
    `(बुकिंग आईडी: ${id})। मैं त्यार सूं।`,
  pa: ({ doctor, name, when, id }) =>
    `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${doctor}, ਮੈਂ ${name} ਹਾਂ। ਮੇਰੀ ਸਲਾਹ ${when} ਲਈ ਬੁੱਕ ਹੈ ` +
    `(ਬੁਕਿੰਗ ਆਈਡੀ: ${id})। ਮੈਂ ਤਿਆਰ ਹਾਂ।`,
  ru: ({ doctor, name, when, id }) =>
    `Здравствуйте, ${doctor}! Это ${name}. У меня назначена консультация на ${when} ` +
    `(номер записи: ${id}). Я готов(а) начать.`,
};

/** wa.me deep link the patient taps at the appointment time. */
export function whatsappJoinLink(booking) {
  const build = JOIN_MESSAGES[booking.language] || JOIN_MESSAGES.en;
  const message = build({
    doctor: PRACTICE.doctorNameByLanguage?.[booking.language] || PRACTICE.doctorName,
    name: booking.patient.name,
    service: booking.serviceName,
    when: formatWhen(booking, booking.language),
    id: booking.id,
  });
  return `https://wa.me/${PRACTICE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Bhojpuri and Haryanvi have no CLDR locale, so they borrow Hindi's. */
const LOCALES = { en: 'en-IN', hi: 'hi-IN', bho: 'hi-IN', bgc: 'hi-IN', pa: 'pa-IN', ru: 'ru-RU' };

export function formatWhen(booking, language = 'en') {
  const when = new Date(`${booking.date}T${booking.time}:00+05:30`);
  return new Intl.DateTimeFormat(LOCALES[language] || 'en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(when);
}

export async function sendBookingConfirmation(booking) {
  const when = formatWhen(booking);
  const joinLink = whatsappJoinLink(booking);

  log(
    'EMAIL',
    booking.patient.email,
    `Your consultation with ${PRACTICE.doctorName} is confirmed — ${when}`,
    [
      `Dear ${booking.patient.name},`,
      '',
      `Your ${booking.serviceName} (${booking.durationMinutes} min) is confirmed for ${when} IST.`,
      `Booking ID: ${booking.id}`,
      `Amount paid: Rs. ${booking.amount}`,
      '',
      `Join on WhatsApp at the scheduled time: ${joinLink}`,
      '',
      'Please keep any previous prescriptions and reports handy.',
      `From: ${config.notify.emailFrom}`,
    ].join('\n'),
  );

  log(
    'SMS',
    booking.patient.phone,
    null,
    `${PRACTICE.doctorName}: Consultation confirmed for ${when} IST. ` +
      `Booking ${booking.id}. Join on WhatsApp: ${joinLink} -${config.notify.smsSender}`,
  );

  return { email: 'queued', sms: 'queued' };
}

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  bho: 'Bhojpuri',
  bgc: 'Haryanvi',
  ru: 'Russian',
};

export async function notifyDoctor(booking) {
  const language = LANGUAGE_NAMES[booking.language] || 'English';

  log(
    'EMAIL',
    PRACTICE.email,
    `New booking: ${booking.patient.name} — ${formatWhen(booking)}`,
    [
      `${booking.serviceName} (${booking.durationMinutes} min)`,
      `Patient : ${booking.patient.name}, ${booking.patient.age || '-'} / ${booking.patient.gender || '-'}`,
      `Phone   : ${booking.patient.phone}`,
      `Email   : ${booking.patient.email}`,
      // The patient booked in this language, so they likely expect to consult in it.
      `Language: ${language}`,
      '',
      'Symptom summary:',
      booking.patient.symptoms,
    ].join('\n'),
  );
}
