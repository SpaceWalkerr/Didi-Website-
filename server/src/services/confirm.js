import { db } from '../db.js';
import { validateSlot } from './slots.js';
import { sendBookingConfirmation, notifyDoctor } from './notify.js';

/**
 * Turns a proven-good payment into a confirmed booking.
 *
 * Called from two independent places — the patient's browser returning from
 * Razorpay Checkout, and the Razorpay webhook. Either may arrive first, both
 * may arrive, and one may never arrive at all (a closed tab, a dead phone).
 * The atomic `updateIf` is what keeps that safe: only the first caller to move
 * the booking out of `pending` sends the patient a confirmation.
 *
 * Callers must have verified the payment signature first.
 */
export async function confirmPaidBooking(booking, paymentId) {
  // The 15-minute hold may have lapsed while the patient was paying, and
  // someone else may now own the slot. Better to flag it for the doctor than to
  // double-book the consultation.
  const conflict = await validateSlot(
    booking.date,
    booking.time,
    booking.serviceId,
    Date.now(),
    booking.id,
  );

  if (conflict?.code === 'slotTaken') {
    const flagged = await db.updateIf(booking.id, 'pending', {
      status: 'needs-attention',
      payment: { ...booking.payment, paymentId, status: 'paid' },
      note: 'Paid, but the slot was taken during payment. Refund or reschedule manually.',
    });
    return { outcome: flagged ? 'slot-lost' : 'already-handled', booking: flagged || booking };
  }

  const confirmed = await db.updateIf(booking.id, 'pending', {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    payment: { ...booking.payment, paymentId, status: 'paid' },
  });

  // Lost the race — the other caller already confirmed it and notified the
  // patient. Return the current row so the response is still correct.
  if (!confirmed) {
    return { outcome: 'already-handled', booking: (await db.find(booking.id)) || booking };
  }

  // Fire-and-forget: a notification failure must not fail the confirmation.
  Promise.all([sendBookingConfirmation(confirmed), notifyDoctor(confirmed)]).catch((err) =>
    console.error('Notification failed:', err),
  );

  return { outcome: 'confirmed', booking: confirmed };
}
