import nodemailer from 'nodemailer';
import { PRACTICE, config } from '../config.js';
import { formatWhen } from './time.js';
import { whatsappJoinLink } from './whatsapp.js';

/**
 * Notifications.
 *
 * Email is sent over SMTP when SMTP_URL is set, and logged otherwise so local
 * development needs nothing. SMS is still log-only:
 *
 *   SMS   : MSG91 / Twilio / Gupshup   (DLT template registration is required in India)
 *   WhatsApp: the WhatsApp Business Cloud API, if the doctor wants automated reminders
 *             instead of the patient tapping the click-to-chat link.
 */

let transport = null;
export const emailEnabled = () => Boolean(config.notify.smtpUrl);

/**
 * Sends through SMTP when SMTP_URL is set, otherwise logs. Never throws: a
 * failed email must not fail a confirmed, paid booking.
 */
async function sendEmail(to, subject, text) {
  if (!emailEnabled()) return log('EMAIL', to, subject, text);
  try {
    transport ||= nodemailer.createTransport(config.notify.smtpUrl);
    await transport.sendMail({
      from: config.notify.emailFrom || PRACTICE.email,
      to,
      subject,
      text,
      replyTo: PRACTICE.email,
    });
  } catch (err) {
    console.error(`Email to ${to} failed:`, err.message);
  }
}

const log = (channel, to, subject, body) => {
  console.log(
    [
      '',
      `── ${channel} (SMS not sent — no provider configured) ─────────────`,
      `to      : ${to}`,
      subject ? `subject : ${subject}` : null,
      body,
      '────────────────────────────────────────────────────────────',
    ]
      .filter(Boolean)
      .join('\n'),
  );
};

export async function sendBookingConfirmation(booking) {
  const when = formatWhen(booking);
  const joinLink = whatsappJoinLink(booking);

  await sendEmail(
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
      '',
      `${PRACTICE.doctorName}`,
    ].join('\n'),
  );

  log(
    'SMS',
    booking.patient.phone,
    null,
    `${PRACTICE.doctorName}: Consultation confirmed for ${when} IST. ` +
      `Booking ${booking.id}. Join on WhatsApp: ${joinLink} -${config.notify.smsSender}`,
  );

  return { email: emailEnabled() ? 'sent' : 'logged', sms: 'logged' };
}

/** Manual UPI: tells the doctor a patient says they have paid and needs checking. */
export async function notifyPaymentSubmitted(booking) {
  await sendEmail(
    PRACTICE.email,
    `Verify UPI payment: ${booking.patient.name} — ${formatWhen(booking)}`,
    [
      `${booking.patient.name} says they paid Rs. ${booking.amount} for ${booking.serviceName}.`,
      `Booking ID : ${booking.id}`,
      `UTR        : ${booking.payment.paymentId}`,
      `Slot       : ${formatWhen(booking)} IST`,
      '',
      'Check your bank/UPI app for this amount and reference, then open the',
      'clinic view (/admin) and press "Confirm payment". The slot is held until you do.',
    ].join('\n'),
  );
}

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  ru: 'Russian',
};

export async function notifyDoctor(booking) {
  const language = LANGUAGE_NAMES[booking.language] || 'English';

  await sendEmail(
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

/**
 * Re-exported so existing callers keep one import for "everything about
 * telling the patient". The implementations live in ./time.js and
 * ./whatsapp.js — see those for why.
 */
export { formatWhen, whatsappJoinLink };
