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

/** wa.me deep link the patient taps at the appointment time. */
export function whatsappJoinLink(booking) {
  const message =
    `Hello ${PRACTICE.doctorName}, this is ${booking.patient.name}. ` +
    `I have a ${booking.serviceName} booked for ${formatWhen(booking)} ` +
    `(Booking ID: ${booking.id}). I'm ready for the consultation.`;
  return `https://wa.me/${PRACTICE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function formatWhen(booking) {
  const when = new Date(`${booking.date}T${booking.time}:00+05:30`);
  return new Intl.DateTimeFormat('en-IN', {
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

export async function notifyDoctor(booking) {
  log(
    'EMAIL',
    PRACTICE.email,
    `New booking: ${booking.patient.name} — ${formatWhen(booking)}`,
    [
      `${booking.serviceName} (${booking.durationMinutes} min)`,
      `Patient : ${booking.patient.name}, ${booking.patient.age || '-'} / ${booking.patient.gender || '-'}`,
      `Phone   : ${booking.patient.phone}`,
      `Email   : ${booking.patient.email}`,
      '',
      'Symptom summary:',
      booking.patient.symptoms,
    ].join('\n'),
  );
}
