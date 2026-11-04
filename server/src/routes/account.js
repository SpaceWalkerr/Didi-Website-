import { Router } from 'express';
import { config, PRACTICE } from '../config.js';
import { db } from '../db.js';
import { whatsappJoinLink, formatWhen, sendLoginLink } from '../services/notify.js';
import { createLoginLink, redeemLoginLink, requirePatient, normaliseEmail } from '../services/auth.js';
import { istEpoch } from '../services/slots.js';

const router = Router();

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const byEmail = async (email) =>
  (await db.all()).filter((b) => normaliseEmail(b.patient.email) === email);

/**
 * POST /api/account/login-link { email }
 *
 * Emails a one-time sign-in link, but only to an address that already has a
 * booking, so this cannot be used to send mail to arbitrary people. The answer
 * is the same either way, so it cannot be used to discover who is a patient.
 */
router.post('/login-link', async (req, res, next) => {
  try {
    const email = normaliseEmail(req.body?.email);
    if (!isEmail(email)) {
      return res.status(400).json({ code: 'email', error: 'Please enter a valid email address.' });
    }
    const bookings = await byEmail(email);
    if (bookings.length) {
      const origin = config.clientOrigins[0];
      const link = `${origin}/account?token=${encodeURIComponent(createLoginLink(email))}`;
      const language = bookings[0].language || 'en';
      sendLoginLink({ email, link, name: bookings[0].patient.name, language }).catch((err) =>
        console.error('Login link email failed:', err.message),
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/account/session { token } — swaps a one-time link token for a session. */
router.post('/session', (req, res) => {
  const session = redeemLoginLink(String(req.body?.token || ''));
  if (!session) {
    return res.status(401).json({ code: 'linkInvalid', error: 'This sign-in link has expired or was already used.' });
  }
  res.json(session);
});

/** What a patient may see of a booking: never the doctor's private notes. */
const present = (b) => ({
  id: b.id,
  status: b.status,
  date: b.date,
  time: b.time,
  when: formatWhen(b),
  startsAt: istEpoch(b.date, b.time),
  serviceId: b.serviceId,
  serviceName: b.serviceName,
  durationMinutes: b.durationMinutes,
  amount: b.amount,
  followUpDate: b.followUpDate || null,
  paymentSubmitted: b.status === 'pending' && Boolean(b.payment?.paymentId),
  // Only a booking that has not been paid for can be dropped by the patient;
  // after that, a refund is a conversation with the clinic.
  canCancel: b.status === 'pending' && !b.payment?.paymentId,
  whatsappLink: b.status === 'confirmed' ? whatsappJoinLink(b) : null,
});

/** GET /api/account/me */
router.get('/me', requirePatient, async (req, res, next) => {
  try {
    const rows = (await byEmail(req.patientEmail)).filter((b) => b.status !== 'expired');
    const latest = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    res.json({
      email: req.patientEmail,
      name: latest?.patient.name || '',
      phone: latest?.patient.phone || '',
      clinic: { whatsapp: PRACTICE.whatsappNumber },
      bookings: rows.map(present).sort((a, b) => b.startsAt - a.startsAt),
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/account/bookings/:id/cancel — the patient's own unpaid booking only. */
router.post('/bookings/:id/cancel', requirePatient, async (req, res, next) => {
  try {
    const booking = await db.find(req.params.id.toUpperCase());
    if (!booking || normaliseEmail(booking.patient.email) !== req.patientEmail) {
      return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });
    }
    if (!present(booking).canCancel) {
      return res.status(409).json({ code: 'cannotCancel', error: 'Please message the clinic to change this booking.' });
    }
    await db.update(booking.id, { status: 'cancelled', payment: { ...booking.payment, status: 'cancelled' } });
    res.json({ id: booking.id, status: 'cancelled' });
  } catch (err) {
    next(err);
  }
});

export default router;
