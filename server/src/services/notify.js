import nodemailer from 'nodemailer';
import { PRACTICE, config } from '../config.js';
import { formatWhen } from './time.js';
import { whatsappJoinLink } from './whatsapp.js';
import { BRAND } from '../../../shared/practice.config.js';

const ADMIN_URL = `${BRAND.siteUrl}/admin`;

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

const LOGIN_COPY = {
  en: { subject: 'Your sign-in link — {doctor}', body: 'Hello {name},\n\nUse this link to see your bookings. It works once and expires in 15 minutes:\n\n{link}\n\nIf you did not ask for this, you can ignore this email.' },
  hi: { subject: 'आपका साइन-इन लिंक — {doctor}', body: 'नमस्ते {name},\n\nअपनी बुकिंग देखने के लिए यह लिंक इस्तेमाल करें। यह एक बार चलता है और 15 मिनट में समाप्त हो जाता है:\n\n{link}\n\nअगर आपने यह नहीं मांगा तो इस ईमेल को अनदेखा करें।' },
  pa: { subject: 'ਤੁਹਾਡਾ ਸਾਈਨ-ਇਨ ਲਿੰਕ — {doctor}', body: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {name},\n\nਆਪਣੀਆਂ ਬੁਕਿੰਗਾਂ ਦੇਖਣ ਲਈ ਇਹ ਲਿੰਕ ਵਰਤੋ। ਇਹ ਇੱਕ ਵਾਰ ਚੱਲਦਾ ਹੈ ਅਤੇ 15 ਮਿੰਟ ਵਿੱਚ ਖਤਮ ਹੋ ਜਾਂਦਾ ਹੈ:\n\n{link}\n\nਜੇ ਤੁਸੀਂ ਇਹ ਨਹੀਂ ਮੰਗਿਆ ਤਾਂ ਇਸ ਈਮੇਲ ਨੂੰ ਅਣਡਿੱਠਾ ਕਰੋ।' },
  ru: { subject: 'Ваша ссылка для входа — {doctor}', body: 'Здравствуйте, {name}!\n\nИспользуйте эту ссылку, чтобы увидеть свои записи. Она работает один раз и действует 15 минут:\n\n{link}\n\nЕсли вы не запрашивали ссылку, проигнорируйте это письмо.' },
};

/** The patient's one-time sign-in link, in the language they booked in. */
export async function sendLoginLink({ email, link, name, language }) {
  // Without SMTP the email is only logged. A sign-in link in a production log would
  // be a working credential, so there it is dropped rather than printed.
  if (!emailEnabled() && config.isProduction) {
    console.warn(`Sign-in link requested for ${email} but SMTP_URL is not set, so nothing was sent.`);
    return;
  }
  const copy = LOGIN_COPY[language] || LOGIN_COPY.en;
  const fill = (s) => s.replace('{doctor}', PRACTICE.doctorName).replace('{name}', name).replace('{link}', link);
  await sendEmail(email, fill(copy.subject), fill(copy.body));
}

/**
 * Tells the patient their booking was cancelled by the clinic. When they had
 * paid, says plainly that a refund is coming, since nothing else will.
 */
export async function sendCancellationNotice(booking) {
  const when = formatWhen(booking);
  const paid = booking.payment?.status === 'paid';
  await sendEmail(
    booking.patient.email,
    `Your consultation on ${when} has been cancelled`,
    [
      `Dear ${booking.patient.name},`,
      '',
      `Your ${booking.serviceName} booking (ID ${booking.id}) for ${when} IST has been cancelled by the clinic.`,
      paid
        ? `The Rs. ${booking.amount} you paid will be refunded by UPI to the account you paid from. ` +
          'You will get another email when it has been sent.'
        : 'You had not completed payment, so nothing is due.',
      '',
      'You are welcome to book another time:',
      `${BRAND.siteUrl}/book`,
      '',
      PRACTICE.doctorName,
    ].join('\n'),
  );
}

export async function sendRefundNotice(booking) {
  await sendEmail(
    booking.patient.email,
    `Refund sent for booking ${booking.id}`,
    [
      `Dear ${booking.patient.name},`,
      '',
      `We have sent your refund of Rs. ${booking.amount} for booking ${booking.id} by UPI to the account you paid from.`,
      'It can take a few working days to show, depending on your bank.',
      '',
      PRACTICE.doctorName,
    ].join('\n'),
  );
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
      `clinic view and press "Confirm payment". The slot is held until you do.`,
      ADMIN_URL,
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
      '',
      `All bookings: ${ADMIN_URL}`,
    ].join('\n'),
  );
}

/** Tells the patient and the doctor that a confirmed booking moved. */
export async function sendRescheduleNotice(booking, previousWhen) {
  const when = formatWhen(booking);
  await sendEmail(
    booking.patient.email,
    `Your consultation has moved to ${when}`,
    [
      `Dear ${booking.patient.name},`,
      '',
      `Your ${booking.serviceName} booking (ID ${booking.id}) has been moved from ${previousWhen} IST to ${when} IST.`,
      `Join on WhatsApp at the new time: ${whatsappJoinLink(booking)}`,
      '',
      PRACTICE.doctorName,
    ].join('\n'),
  );
  await sendEmail(
    PRACTICE.email,
    `Rescheduled: ${booking.patient.name} — now ${when}`,
    [`${booking.patient.name} (${booking.patient.phone}) moved booking ${booking.id}.`, `Was: ${previousWhen} IST`, `Now: ${when} IST`].join('\n'),
  );
}

/**
 * Re-exported so existing callers keep one import for "everything about
 * telling the patient". The implementations live in ./time.js and
 * ./whatsapp.js — see those for why.
 */
export { formatWhen, whatsappJoinLink };
