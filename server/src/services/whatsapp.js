import { PRACTICE } from '../config.js';
import { formatWhen } from './time.js';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  WhatsApp, behind one seam.
 *
 *  Today the practice runs on click-to-chat: the patient taps a wa.me link
 *  with the message already written, and sends it themselves. That needs no
 *  account, no approval and no per-message cost, which is exactly right for a
 *  single doctor starting out.
 *
 *  The WhatsApp Business Cloud API is the upgrade — it lets the clinic send
 *  first (confirmations, reminders the morning of the appointment) instead of
 *  waiting for the patient to open the chat. It needs a Meta Business account,
 *  a verified number and pre-approved message templates, so it is a decision
 *  the doctor makes later, not a switch to flip now.
 *
 *  Everything above this layer calls sendJoinInstructions() and does not care
 *  which provider is active. To move: implement CloudApiProvider below and set
 *  WHATSAPP_PROVIDER=cloud-api.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * The message pre-filled in the patient's WhatsApp, in the language they
 * booked in — it would be odd to read the site in Punjabi and then be handed
 * an English sentence to send.
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
  pa: ({ doctor, name, when, id }) =>
    `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${doctor}, ਮੈਂ ${name} ਹਾਂ। ਮੇਰੀ ਸਲਾਹ ${when} ਲਈ ਬੁੱਕ ਹੈ ` +
    `(ਬੁਕਿੰਗ ਆਈਡੀ: ${id})। ਮੈਂ ਤਿਆਰ ਹਾਂ।`,
  ru: ({ doctor, name, when, id }) =>
    `Здравствуйте, ${doctor}! Это ${name}. У меня назначена консультация на ${when} ` +
    `(номер записи: ${id}). Я готов(а) начать.`,
};

/** The doctor's name in the patient's own script, falling back to the default. */
const doctorNameFor = (language) =>
  PRACTICE.doctorNameByLanguage?.[language] || PRACTICE.doctorName;

/** The text of the join message for a booking, in the booking's language. */
export function buildJoinMessage(booking) {
  const build = JOIN_MESSAGES[booking.language] || JOIN_MESSAGES.en;
  return build({
    doctor: doctorNameFor(booking.language),
    name: booking.patient.name,
    service: booking.serviceName,
    when: formatWhen(booking, booking.language),
    id: booking.id,
  });
}

/** Digits only, no leading +, which is what wa.me expects. */
const normalise = (number) => String(number).replace(/\D/g, '');

/**
 * ── Provider: click-to-chat (current) ───────────────────────────────────
 *
 * Produces a link. Sending is the patient's own action, from their own
 * WhatsApp, which is why send() here is a no-op that reports what happened
 * rather than pretending a message went out.
 */
const ClickToChatProvider = {
  name: 'click-to-chat',

  /** wa.me deep link the patient taps at the appointment time. */
  joinLink(booking) {
    const message = buildJoinMessage(booking);
    return `https://wa.me/${normalise(PRACTICE.whatsappNumber)}?text=${encodeURIComponent(message)}`;
  },

  async send() {
    // Nothing to send: the patient initiates. The link reaches them through the
    // confirmation page, the email and the SMS instead.
    return { delivered: false, via: 'click-to-chat', reason: 'patient-initiated' };
  },
};

/**
 * ── Provider: WhatsApp Business Cloud API (not yet enabled) ─────────────
 *
 * Deliberately a stub that throws rather than silently doing nothing. A
 * half-working notification path on a medical booking site is worse than an
 * obviously missing one: a patient who is never told their appointment moved
 * has no way to know anything failed.
 *
 * To implement:
 *   1. Meta Business account, verified sender number, permanent access token.
 *   2. Register message templates — outside a 24-hour customer service window
 *      WhatsApp only permits pre-approved templates, so the confirmation and
 *      reminder wording must be submitted and approved first.
 *   3. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_TOKEN, then POST to
 *      https://graph.facebook.com/v21.0/<phone-number-id>/messages
 *      with { messaging_product: 'whatsapp', to, type: 'template', template }.
 *   4. Keep joinLink() working — it stays the fallback whenever a template is
 *      rejected or the patient has never messaged the clinic.
 */
const CloudApiProvider = {
  name: 'cloud-api',

  joinLink(booking) {
    // Identical to click-to-chat; the link stays useful even with the API on.
    return ClickToChatProvider.joinLink(booking);
  },

  async send() {
    throw new Error(
      'WHATSAPP_PROVIDER is set to "cloud-api", but the Cloud API client has not ' +
        'been implemented yet. See server/src/services/whatsapp.js. Unset the ' +
        'variable to go back to click-to-chat links.',
    );
  },
};

const PROVIDERS = {
  'click-to-chat': ClickToChatProvider,
  'cloud-api': CloudApiProvider,
};

export const provider =
  PROVIDERS[process.env.WHATSAPP_PROVIDER || 'click-to-chat'] || ClickToChatProvider;

/** wa.me deep link the patient taps at the appointment time. */
export const whatsappJoinLink = (booking) => provider.joinLink(booking);

/**
 * Tells the patient how to join, by whatever means the active provider has.
 *
 * A failure here must never fail a confirmation — the booking is paid for and
 * valid whether or not a message went out — so callers treat this as
 * best-effort and the result reports what actually happened.
 */
export async function sendJoinInstructions(booking) {
  try {
    return await provider.send(booking, buildJoinMessage(booking));
  } catch (err) {
    console.error(`WhatsApp (${provider.name}) failed for booking ${booking.id}:`, err.message);
    return { delivered: false, via: provider.name, error: err.message };
  }
}

/** Reported on /api/health so the deployed mode is visible without guessing. */
export const whatsappMode = () => provider.name;
