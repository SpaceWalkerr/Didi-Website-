import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { SERVICES, getService, PRACTICE, BOOKING_RULES, config } from '../config.js';
import { db } from '../db.js';
import { getSlots, validateSlot, isValidDateString, istToday, istDateString, bookingRules }
  from '../services/slots.js';
import { createOrder, paymentMode } from '../services/payments.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';

// Human-friendly booking IDs the patient can quote on the phone.
const newId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

const router = Router();

/** Everything the booking page needs to render itself. */
router.get('/meta', (_req, res) => {
  const now = Date.now();
  res.json({
    services: SERVICES,
    practice: PRACTICE,
    rules: bookingRules,
    paymentMode: paymentMode(),
    minDate: istToday(),
    maxDate: istDateString(new Date(now + BOOKING_RULES.maxDaysAhead * 86400000)),
  });
});

/** GET /api/bookings/slots?date=2026-09-20&service=general */
router.get('/slots', (req, res) => {
  const { date, service } = req.query;

  if (!isValidDateString(String(date || ''))) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  }
  if (!getService(String(service || ''))) {
    return res.status(400).json({ error: 'A valid service is required.' });
  }

  res.json({ date, service, slots: getSlots(String(date), String(service)) });
});

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));
const normalisePhone = (v) => String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

function validatePatient(patient = {}) {
  const errors = {};
  if (!patient.name || String(patient.name).trim().length < 2) {
    errors.name = 'Please enter the patient’s full name.';
  }
  if (!isPhone(patient.phone || '')) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
  }
  if (!isEmail(patient.email || '')) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!patient.symptoms || String(patient.symptoms).trim().length < 10) {
    errors.symptoms = 'Please describe the symptoms in at least a sentence.';
  }
  if (patient.age && (Number(patient.age) < 0 || Number(patient.age) > 120)) {
    errors.age = 'Please enter a valid age.';
  }
  if (!patient.consent) {
    errors.consent = 'Patient consent is required under the Telemedicine Practice Guidelines.';
  }
  return errors;
}

/**
 * POST /api/bookings
 * Creates a PENDING booking and a payment order. The slot is held until
 * payment succeeds or the hold expires.
 */
router.post('/', async (req, res, next) => {
  try {
    const { date, time, service: serviceId, patient = {} } = req.body || {};

    const fieldErrors = validatePatient(patient);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({ error: 'Please correct the highlighted fields.', fieldErrors });
    }

    const slotError = validateSlot(String(date), String(time), String(serviceId));
    if (slotError) return res.status(409).json({ error: slotError });

    const service = getService(serviceId);
    const id = newId();

    const order = await createOrder({
      amountInRupees: service.price,
      receipt: `rcpt_${id}`,
      notes: { bookingId: id, service: service.name },
    });

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
      patient: {
        name: String(patient.name).trim(),
        age: patient.age ? Number(patient.age) : null,
        gender: patient.gender || null,
        phone: normalisePhone(patient.phone),
        email: String(patient.email).trim().toLowerCase(),
        symptoms: String(patient.symptoms).trim(),
        consent: true,
        consentAt: new Date().toISOString(),
      },
      payment: {
        mode: paymentMode(),
        orderId: order.id,
        paymentId: null,
        status: 'created',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.insert(booking);

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
router.get('/:id', (req, res) => {
  const booking = db.find(req.params.id.toUpperCase());
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  res.json({
    id: booking.id,
    status: booking.status,
    date: booking.date,
    time: booking.time,
    when: formatWhen(booking),
    serviceName: booking.serviceName,
    durationMinutes: booking.durationMinutes,
    amount: booking.amount,
    patientName: booking.patient.name,
    patientEmail: booking.patient.email,
    patientPhone: booking.patient.phone,
    whatsappLink: booking.status === 'confirmed' ? whatsappJoinLink(booking) : null,
  });
});

export default router;
