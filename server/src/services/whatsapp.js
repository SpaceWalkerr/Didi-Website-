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
 * ── Provider: WhatsApp Business Cloud API ───────────────────────────────
 *
 * Sends pre-approved TEMPLATE messages from the clinic's number, so the clinic
 * can message first: "payment received", "confirmed" and a reminder before the
 * slot. Outside a 24-hour customer-service window WhatsApp permits nothing but
 * approved templates, which is why every message here is one.
 *
 * Setup (see DEPLOY.md): Meta business account, a number registered on the
 * Cloud API, a permanent access token, and three approved templates. Each takes
 * four body variables in this order:
 *     {{1}} patient name   {{2}} date and time (IST)   {{3}} service   {{4}} booking ID
 *
 * Failures are reported, not hidden: a patient who is never told their
 * appointment is confirmed cannot know anything went wrong. Callers treat sends
 * as best-effort so a failed message never fails a paid booking, and the
 * wa.me link on the confirmation page and in the email stays as the fallback.
 */
const API_BASE = process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com/v21.0';

const cloud = {
  get phoneNumberId() { return process.env.WHATSAPP_PHONE_NUMBER_ID || ''; },
  get token() { return process.env.WHATSAPP_TOKEN || ''; },
  /** Languages a template has been approved in; anything else falls back to English. */
  get languages() {
    return (process.env.WHATSAPP_TEMPLATE_LANGS || 'en')
      .split(',').map((l) => l.trim()).filter(Boolean);
  },
  templates: {
    received: process.env.WHATSAPP_TEMPLATE_RECEIVED || 'booking_received',
    confirmed: process.env.WHATSAPP_TEMPLATE_CONFIRMED || 'booking_confirmed',
    reminder: process.env.WHATSAPP_TEMPLATE_REMINDER || 'booking_reminder',
  },
};

export const cloudApiConfigured = () => Boolean(cloud.phoneNumberId && cloud.token);

async function postTemplate(to, name, language, params) {
  const res = await fetch(`${API_BASE}/${cloud.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cloud.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: language },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message || `WhatsApp API returned ${res.status}`);
    err.code = body?.error?.code;
    throw err;
  }
  return body?.messages?.[0]?.id || null;
}

/** Patient numbers are stored as 10 digits; WhatsApp wants the country code too. */
const toInternational = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
};

async function sendTemplate(kind, booking) {
  const name = cloud.templates[kind];
  // The date is written in the language of the template actually sent, so an
  // English fallback never carries a Hindi date.
  const paramsFor = (lang) => [
    booking.patient.name,
    formatWhen(booking, lang),
    booking.serviceName,
    booking.id,
  ];
  const to = toInternational(booking.patient.phone);
  const wanted = cloud.languages.includes(booking.language) ? booking.language : 'en';

  try {
    const id = await postTemplate(to, name, wanted, paramsFor(wanted));
    return { delivered: true, via: 'cloud-api', messageId: id, language: wanted };
  } catch (err) {
    // 132001: no such template in that language. English is always registered.
    if (err.code === 132001 && wanted !== 'en') {
      const id = await postTemplate(to, name, 'en', paramsFor('en'));
      return { delivered: true, via: 'cloud-api', messageId: id, language: 'en' };
    }
    throw err;
  }
}

const CloudApiProvider = {
  name: 'cloud-api',

  joinLink(booking) {
    // The link stays useful with the API on: the patient can still tap it to open the chat.
    return ClickToChatProvider.joinLink(booking);
  },

  /** Called when a booking is confirmed. */
  async send(booking) {
    return sendTemplate('confirmed', booking);
  },

  sendTemplate,
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

/**
 * Sends a non-confirmation message ('received' or 'reminder'). A no-op unless
 * the Cloud API is the active provider; never throws.
 */
export async function sendWhatsappTemplate(kind, booking) {
  if (provider !== CloudApiProvider) return { delivered: false, via: provider.name };
  try {
    return await CloudApiProvider.sendTemplate(kind, booking);
  } catch (err) {
    console.error(`WhatsApp ${kind} failed for booking ${booking.id}:`, err.message);
    return { delivered: false, via: 'cloud-api', error: err.message };
  }
}
