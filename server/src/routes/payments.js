import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { verifySignature, mockSignature, paymentMode } from '../services/payments.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';
import { confirmPaidBooking } from '../services/confirm.js';
import { config } from '../config.js';

const router = Router();

/**
 * POST /api/payments/verify
 * Called by the client after Razorpay Checkout succeeds. The signature check is
 * what actually confirms the booking — never trust the client's word for it.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    const booking = await db.find(String(bookingId || '').toUpperCase());
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
      await db.update(booking.id, { payment: { ...booking.payment, status: 'failed' } });
      return res
        .status(400)
        .json({ code: 'paymentUnverified', error: 'Payment could not be verified.' });
    }

    const { outcome, booking: result } = await confirmPaidBooking(booking, razorpay_payment_id);

    if (outcome === 'slot-lost') {
      return res.status(409).json({
        code: 'slotLostAfterPayment',
        error: 'Paid, but the slot was taken during payment.',
      });
    }

    // 'already-handled' means the webhook got here first — which is a success
    // from the patient's point of view, so report it as one.
    if (result.status !== 'confirmed') {
      return res.status(409).json({
        code: 'slotLostAfterPayment',
        error: 'Paid, but the booking needs attention.',
      });
    }

    res.json({
      status: 'confirmed',
      bookingId: result.id,
      when: formatWhen(result),
      whatsappLink: whatsappJoinLink(result),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/webhook — called by Razorpay's servers, not the browser.
 *
 * Without this, a booking is only confirmed if the patient's browser survives
 * the round trip back from Checkout. If they close the tab, lose signal or
 * their phone dies in that window, Razorpay has their money while the booking
 * silently expires and releases the slot — and nobody is told.
 *
 * Configure at Razorpay Dashboard -> Settings -> Webhooks:
 *   URL    : https://<your-api>/api/payments/webhook
 *   Events : payment.captured, payment.failed
 *   Secret : whatever you set, also as RAZORPAY_WEBHOOK_SECRET
 *
 * Note this route reads a raw body (see index.js) — the signature is computed
 * over the exact bytes Razorpay sent, so a re-serialised JSON object will not
 * match.
 */
router.post('/webhook', async (req, res) => {
  const secret = config.razorpay.webhookSecret;
  if (!secret) {
    console.warn('Webhook received but RAZORPAY_WEBHOOK_SECRET is not set — ignoring.');
    return res.status(503).json({ error: 'Webhook not configured.' });
  }

  const signature = String(req.get('x-razorpay-signature') || '');
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Malformed payload.' });
  }

  // Anything unrecognised gets a 200: Razorpay retries non-2xx responses, and
  // retrying an event we will never act on is just noise.
  try {
    const payment = event?.payload?.payment?.entity;
    if (!payment?.order_id) return res.json({ received: true, ignored: event?.event });

    const booking = await db.findByOrderId(payment.order_id);
    if (!booking) return res.json({ received: true, ignored: 'unknown order' });

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      if (booking.status !== 'pending') {
        return res.json({ received: true, outcome: 'already-handled' });
      }
      const { outcome } = await confirmPaidBooking(booking, payment.id);
      console.log(`Webhook ${event.event}: booking ${booking.id} -> ${outcome}`);
      return res.json({ received: true, outcome });
    }

    if (event.event === 'payment.failed' && booking.status === 'pending') {
      await db.updateIf(booking.id, 'pending', {
        status: 'cancelled',
        payment: { ...booking.payment, paymentId: payment.id, status: 'failed' },
      });
      return res.json({ received: true, outcome: 'cancelled' });
    }

    return res.json({ received: true, ignored: event.event });
  } catch (err) {
    // A 500 tells Razorpay to retry, which is what we want for a transient
    // database failure — the event is not lost.
    console.error('Webhook processing failed:', err);
    return res.status(500).json({ error: 'Processing failed.' });
  }
});

/**
 * POST /api/payments/mock-pay — MOCK MODE ONLY.
 * Stands in for the Razorpay Checkout popup so the flow can be demoed without keys.
 */
router.post('/mock-pay', async (req, res, next) => {
  if (paymentMode() !== 'mock') {
    return res.status(400).json({ error: 'Mock payments are disabled when Razorpay keys are set.' });
  }

  const { orderId } = req.body || {};
  let booking;
  try {
    booking = await db.findByOrderId(String(orderId || ''));
  } catch (err) {
    return next(err);
  }
  if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Order not found.' });

  const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
  res.json({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: mockSignature(orderId, paymentId),
  });
});

/** Marks a booking as failed when the patient dismisses the payment window. */
router.post('/cancel', async (req, res, next) => {
  try {
    const booking = await db.find(String(req.body?.bookingId || '').toUpperCase());
    if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });
    if (booking.status === 'pending') {
      await db.update(booking.id, {
        status: 'cancelled',
        payment: { ...booking.payment, status: 'cancelled' },
      });
    }
    res.json({ status: 'cancelled' });
  } catch (err) {
    next(err);
  }
});

export default router;
