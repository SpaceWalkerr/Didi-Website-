import { Router } from 'express';
import { config, PRACTICE } from '../config.js';
import { db } from '../db.js';
import { whatsappJoinLink, formatWhen, sendLoginLink } from '../services/notify.js';
import { createLoginLink, redeemLoginLink, requirePatient, normaliseEmail } from '../services/auth.js';
import { istEpoch, validateSlot, isValidDateString } from '../services/slots.js';
import { sendRescheduleNotice } from '../services/notify.js';
import { SlotConflictError } from '../db/errors.js';
import { background } from '../services/background.js';

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
      background(
        sendLoginLink({ email, link, name: bookings[0].patient.name, language }),
        'Login link email',
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/account/session { token } — swaps a one-time link token for a session. */
router.post('/session', async (req, res, next) => {
  try {
    const session = await redeemLoginLink(String(req.body?.token || ''));
    if (!session) {
      return res.status(401).json({ code: 'linkInvalid', error: 'This sign-in link has expired or was already used.' });
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
});

const RESCHEDULE_LEAD_MS = 4 * 60 * 60 * 1000; // matches the refund policy
const MAX_RESCHEDULES = 2;
const canReschedule = (b, now = Date.now()) =>
  b.status === 'confirmed' &&
  (b.rescheduleCount || 0) < MAX_RESCHEDULES &&
  istEpoch(b.date, b.time) - now >= RESCHEDULE_LEAD_MS;

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
  canReschedule: canReschedule(b),
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

/**
 * POST /api/account/bookings/:id/reschedule { date, time }
 *
 * A confirmed booking can be moved to another free slot, up to twice and no
 * later than 4 hours before it starts — the same terms as the refund policy.
 * The new slot is validated like a fresh booking; the booking's own current
 * slot is ignored so it cannot collide with itself.
 */
router.post('/bookings/:id/reschedule', requirePatient, async (req, res, next) => {
  try {
    const booking = await db.find(req.params.id.toUpperCase());
    if (!booking || normaliseEmail(booking.patient.email) !== req.patientEmail) {
      return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });
    }
    if (!canReschedule(booking)) {
      return res.status(409).json({ code: 'cannotReschedule', error: 'Please message the clinic to change this booking.' });
    }

    const date = String(req.body?.date || '');
    const time = String(req.body?.time || '');
    if (!isValidDateString(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ code: 'slotInvalidDate', error: 'Choose a valid date and time.' });
    }
    if (date === booking.date && time === booking.time) {
      return res.status(409).json({ code: 'slotSame', error: 'That is already your slot.' });
    }
    const slotError = await validateSlot(date, time, booking.serviceId, Date.now(), booking.id);
    if (slotError) {
      return res.status(409).json({ code: slotError.code, params: slotError.params || null, error: 'That slot is not available.' });
    }

    const previousWhen = formatWhen(booking);
    let updated;
    try {
      updated = await db.update(booking.id, {
        date,
        time,
        rescheduleCount: (booking.rescheduleCount || 0) + 1,
        reminderSentAt: null, // the reminder is for the new time
      });
    } catch (err) {
      if (err instanceof SlotConflictError) {
        return res.status(409).json({ code: 'slotTaken', error: 'That slot has just been taken.' });
      }
      throw err;
    }
    background(sendRescheduleNotice(updated, previousWhen), 'Reschedule notice');
    res.json(present(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
