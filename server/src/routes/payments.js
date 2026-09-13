import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { verifySignature, mockSignature, paymentMode } from '../services/payments.js';
import { sendBookingConfirmation, notifyDoctor, whatsappJoinLink, formatWhen }
  from '../services/notify.js';
import { validateSlot } from '../services/slots.js';

const router = Router();

/**
 * POST /api/payments/verify
 * Called by the client after Razorpay Checkout succeeds. The signature check is
 * what actually confirms the booking — never trust the client's word for it.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    const booking = db.find(String(bookingId || '').toUpperCase());
    if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });
    if (booking.status === 'confirmed') {
      return res.json({ status: 'confirmed', whatsappLink: whatsappJoinLink(booking) });
    }
    if (booking.payment.orderId !== razorpay_order_id) {
      return res.status(400).json({ code: 'paymentMismatch', error: 'Payment does not match this booking.' });
    }

    const ok = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!ok) {
      db.update(booking.id, { payment: { ...booking.payment, status: 'failed' } });
      return res
        .status(400)
        .json({ code: 'paymentUnverified', error: 'Payment could not be verified.' });
    }

    // The hold may have lapsed while the patient was paying. Re-check before
    // confirming so we never double-book the doctor.
    const conflict = validateSlot(
      booking.date,
      booking.time,
      booking.serviceId,
      Date.now(),
      booking.id,
    );
    if (conflict?.code === 'slotTaken') {
      db.update(booking.id, {
        status: 'needs-attention',
        payment: { ...booking.payment, paymentId: razorpay_payment_id, status: 'paid' },
        note: 'Paid, but the slot expired. Refund or reschedule manually.',
      });
      return res.status(409).json({
        code: 'slotLostAfterPayment',
        error: 'Paid, but the slot was taken during payment.',
      });
    }

    const confirmed = db.update(booking.id, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      payment: { ...booking.payment, paymentId: razorpay_payment_id, status: 'paid' },
    });

    // Fire-and-forget: a notification failure must not break the confirmation.
    Promise.all([sendBookingConfirmation(confirmed), notifyDoctor(confirmed)]).catch((err) =>
      console.error('Notification failed:', err),
    );

    res.json({
      status: 'confirmed',
      bookingId: confirmed.id,
      when: formatWhen(confirmed),
      whatsappLink: whatsappJoinLink(confirmed),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/mock-pay — MOCK MODE ONLY.
 * Stands in for the Razorpay Checkout popup so the flow can be demoed without keys.
 */
router.post('/mock-pay', (req, res) => {
  if (paymentMode() !== 'mock') {
    return res.status(400).json({ error: 'Mock payments are disabled when Razorpay keys are set.' });
  }

  const { orderId } = req.body || {};
  const booking = db.findByOrderId(String(orderId || ''));
  if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Order not found.' });

  const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
  res.json({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: mockSignature(orderId, paymentId),
  });
});

/** Marks a booking as failed when the patient dismisses the payment window. */
router.post('/cancel', (req, res) => {
  const booking = db.find(String(req.body?.bookingId || '').toUpperCase());
  if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });
  if (booking.status === 'pending') {
    db.update(booking.id, {
      status: 'cancelled',
      payment: { ...booking.payment, status: 'cancelled' },
    });
  }
  res.json({ status: 'cancelled' });
});

export default router;
