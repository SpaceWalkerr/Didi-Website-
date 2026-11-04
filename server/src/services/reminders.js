import { db } from '../db.js';
import { istEpoch } from './slots.js';
import { sendWhatsappTemplate } from './whatsapp.js';

/**
 * WhatsApp reminders, sent REMINDER_MINUTES before each confirmed appointment.
 *
 * A timer rather than a job queue because this is one doctor's diary on one
 * server. Each booking is marked (reminderSentAt) as soon as a send is
 * attempted, success or not: retrying a failing send every few minutes until
 * the appointment would spam a patient and hammer the API. A failure is logged.
 *
 * A booking confirmed inside the reminder window is skipped, since the
 * confirmation message it just received already says everything a reminder would.
 */
const REMINDER_MINUTES = Number(process.env.WHATSAPP_REMINDER_MINUTES || 60);
const TICK_MS = 5 * 60 * 1000;

export async function sendDueReminders(now = Date.now()) {
  const window = REMINDER_MINUTES * 60 * 1000;
  const due = (await db.all()).filter((b) => {
    if (b.status !== 'confirmed' || b.reminderSentAt) return false;
    const startsAt = istEpoch(b.date, b.time);
    return startsAt > now && startsAt - now <= window;
  });

  for (const booking of due) {
    const startsAt = istEpoch(booking.date, booking.time);
    const justConfirmed = booking.confirmedAt && Date.parse(booking.confirmedAt) >= startsAt - window;
    await db.update(booking.id, { reminderSentAt: new Date(now).toISOString() });
    if (!justConfirmed) await sendWhatsappTemplate('reminder', booking);
  }
  return due.length;
}

export function startReminders() {
  const run = () => sendDueReminders().catch((err) => console.error('Reminder sweep failed:', err));
  run();
  return setInterval(run, TICK_MS).unref();
}
