import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { SERVICES, getService, PRACTICE, BOOKING_RULES, config } from '../config.js';
import { db } from '../db.js';
import { getAvailability } from '../services/availability.js';
import { getSlots, validateSlot, isValidDateString, istToday, istDateString, bookingRules }
  from '../services/slots.js';
import { createOrder, paymentMode, upiLink } from '../services/payments.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';
import { SlotConflictError } from '../db/errors.js';
import { isBodyRegion } from '../../../shared/body-regions.js';

// Human-friendly booking IDs the patient can quote on the phone.
const newId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

const router = Router();

/** Everything the booking page needs to render itself. */
router.get('/meta', async (_req, res, next) => {
  const now = Date.now();
  let hours;
  try {
    hours = await getAvailability();
  } catch (err) {
    return next(err);
  }
  res.json({
    // Weekdays (0 = Sunday) with at least one consulting window, so the date picker can skip closed days.
    openDays: [0, 1, 2, 3, 4, 5, 6].filter((d) => (hours[d] || []).length > 0),
    services: SERVICES,
    practice: PRACTICE,
    rules: bookingRules,
    paymentMode: paymentMode(),
    upiEnabled: config.upi.enabled,
    minDate: istToday(),
    maxDate: istDateString(new Date(now + BOOKING_RULES.maxDaysAhead * 86400000)),
  });
});

/** GET /api/bookings/slots?date=2026-09-20&service=general */
router.get('/slots', async (req, res, next) => {
  const { date, service } = req.query;

  if (!isValidDateString(String(date || ''))) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  }
  if (!getService(String(service || ''))) {
    return res.status(400).json({ error: 'A valid service is required.' });
  }

  try {
    res.json({ date, service, slots: await getSlots(String(date), String(service)) });
  } catch (err) {
    next(err);
  }
});

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));
const normalisePhone = (v) => String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

/**
 * Returns { field: errorCode }. Codes match keys under `errors.*` in the
 * client's translation files — the server stays language-agnostic.
 */
function validatePatient(patient = {}) {
  const errors = {};
  if (!patient.name || String(patient.name).trim().length < 2) errors.name = 'name';
  if (!isPhone(patient.phone || '')) errors.phone = 'phone';
  if (!isEmail(patient.email || '')) errors.email = 'email';
  if (!patient.symptoms || String(patient.symptoms).trim().length < 10) errors.symptoms = 'symptoms';
  if (String(patient.name || '').length > 100) errors.name = 'name';
  if (String(patient.email || '').length > 254) errors.email = 'email';
  if (String(patient.symptoms || '').length > 2000) errors.symptoms = 'symptoms';
  if (patient.age !== undefined && patient.age !== null && patient.age !== '') {
    const age = Number(patient.age);
    if (!Number.isFinite(age) || age < 0 || age > 120) errors.age = 'age';
  }
  if (!patient.consent) errors.consent = 'consent';
  return errors;
}

/** Languages the site is published in; anything else is stored as 'en'. */
const LANGUAGES = ['en', 'hi', 'pa', 'ru'];
const GENDERS = ['female', 'male', 'other'];

/** Shows enough for the patient to recognise their own details, not enough to harvest them. */
const maskEmail = (e = '') => e.replace(/^(.).*(@.*)$/, '$1***$2');
const maskPhone = (p = '') => (p.length > 4 ? `${'•'.repeat(p.length - 4)}${p.slice(-4)}` : p);

/**
 * POST /api/bookings
 * Creates a PENDING booking and a payment order. The slot is held until
 * payment succeeds or the hold expires.
 */
router.post('/', async (req, res, next) => {
  try {
    const { date, time, service: serviceId, patient = {}, language, bodyRegion } = req.body || {};

    const fieldErrors = validatePatient(patient);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({
        code: 'fieldsInvalid',
        error: 'Please correct the highlighted fields.',
        fieldErrors,
      });
    }

    const slotError = await validateSlot(String(date), String(time), String(serviceId));
    if (slotError) {
      return res.status(409).json({
        code: slotError.code,
        params: slotError.params || null,
        error: 'That slot is not available.',
      });
    }

    const service = getService(serviceId);
    const id = newId();
    const holdExpiresAt = new Date(
      Date.now() + BOOKING_RULES.pendingHoldMinutes * 60 * 1000,
    ).toISOString();

    const booking = {
      id,
      status: 'pending',
      date,
      time,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      amount: service.price,
      currency: 'INR',
      // Only an id the body map actually publishes is stored; anything else
      // arrived from a hand-edited URL and is dropped rather than persisted.
      bodyRegion: isBodyRegion(bodyRegion) ? bodyRegion : null,
      holdExpiresAt,
      patient: {
        name: String(patient.name).trim(),
        age: patient.age ? Number(patient.age) : null,
        gender: GENDERS.includes(patient.gender) ? patient.gender : null,
        phone: normalisePhone(patient.phone),
        email: String(patient.email).trim().toLowerCase(),
        symptoms: String(patient.symptoms).trim(),
        consent: true,
        consentAt: new Date().toISOString(),
      },
      payment: {
        mode: paymentMode(),
        // Filled in below, once the slot is actually ours.
        orderId: null,
        paymentId: null,
        status: 'created',
      },
      language: LANGUAGES.includes(language) ? language : 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    /*
     * Claim the slot BEFORE talking to Razorpay.
     *
     * The validateSlot() check above is a courtesy — it gives a fast, friendly
     * error in the ordinary case. This insert is the real gate: the database's
     * exclusion constraint rejects anything overlapping a live appointment, so
     * two patients racing for the last slot cannot both win regardless of how
     * the requests interleave.
     *
     * Doing it first also means a lost race costs nothing: no Razorpay order is
     * created, so there is no abandoned order to reconcile later.
     */
    try {
      await db.insert(booking);
    } catch (err) {
      if (err instanceof SlotConflictError) {
        return res.status(409).json({ code: 'slotTaken', error: 'That slot has just been taken.' });
      }
      throw err;
    }

    // Manual UPI: no gateway order exists. The patient pays the doctor's UPI ID
    // and submits the UTR, which the doctor then confirms in /admin.
    if (paymentMode() === 'upi') {
      return res.status(201).json({
        bookingId: booking.id,
        amount: service.price,
        currency: 'INR',
        order: null,
        paymentMode: 'upi',
        upi: {
          id: config.upi.id,
          payeeName: config.upi.payeeName,
          link: upiLink({ amountInRupees: service.price, bookingId: booking.id }),
        },
        holdMinutes: BOOKING_RULES.pendingHoldMinutes,
      });
    }

    let order;
    try {
      order = await createOrder({
        amountInRupees: service.price,
        receipt: `rcpt_${id}`,
        notes: { bookingId: id, service: service.name },
      });
    } catch (err) {
      // The slot is held by a booking that can never be paid for. Release it
      // rather than leaving it to sit out the full hold window.
      await db.update(id, { status: 'cancelled', payment: { status: 'failed' } });
      throw err;
    }

    await db.update(id, { payment: { ...booking.payment, orderId: order.id } });

    res.status(201).json({
      bookingId: booking.id,
      amount: service.price,
      currency: 'INR',
      order: { id: order.id, amount: order.amount, currency: order.currency, mock: order.mock },
      paymentMode: paymentMode(),
      razorpayKeyId: config.razorpay.enabled ? config.razorpay.keyId : null,
      holdMinutes: BOOKING_RULES.pendingHoldMinutes,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/bookings/:id — the confirmation page. Only confirmed bookings expose the join link. */
router.get('/:id', async (req, res, next) => {
  let booking;
  try {
    booking = await db.find(req.params.id.toUpperCase());
  } catch (err) {
    return next(err);
  }
  if (!booking) return res.status(404).json({ code: 'bookingNotFound', error: 'Booking not found.' });

  res.json({
    id: booking.id,
    status: booking.status,
    date: booking.date,
    time: booking.time,
    when: formatWhen(booking),
    // The client re-formats `when` and looks up the service name in the
    // patient's language; these English values stay for email and logs.
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    durationMinutes: booking.durationMinutes,
    amount: booking.amount,
    patientName: booking.patient.name,
    patientEmail: maskEmail(booking.patient.email),
    patientPhone: maskPhone(booking.patient.phone),
    // A UTR has been submitted and the doctor has yet to confirm the payment.
    paymentSubmitted: booking.status === 'pending' && Boolean(booking.payment?.paymentId),
    whatsappLink: booking.status === 'confirmed' ? whatsappJoinLink(booking) : null,
  });
});

export default router;
