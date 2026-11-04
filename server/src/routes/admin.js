import { Router } from 'express';
import { BOOKING_RULES } from '../config.js';
import { db } from '../db.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';
import { confirmPaidBooking } from '../services/confirm.js';
import { adminLogin, requireAdmin } from '../services/auth.js';
import { getAvailability, validateAvailability, saveAvailability } from '../services/availability.js';
import { istEpoch, isValidDateString, istToday, istDateString } from '../services/slots.js';

const router = Router();

/**
 * POST /api/admin/login { email, password } → { token }
 * The token is a signed 12-hour session; send it as the x-admin-token header.
 * (The raw ADMIN_TOKEN still works as an API key, so scripts keep working.)
 */
router.post('/login', (req, res, next) => {
  const { email, password } = req.body || {};
  if (email !== undefined || password !== undefined) {
    const session = adminLogin(email, password);
    if (!session) return res.status(401).json({ error: 'Wrong email or password.' });
    return res.json(session);
  }
  return requireAdmin(req, res, () => res.json({ ok: true }));
});

/**
 * GET /api/admin/bookings?scope=today|upcoming|all
 *
 *   today    — everything still live on today's date, in clock order. This is
 *              the view the doctor actually works from during a session, so it
 *              keeps completed consultations visible rather than hiding them
 *              the moment they are ticked off.
 *   upcoming — confirmed or needing attention, from now onwards.
 *   all      — everything, most recent first.
 */
router.get('/bookings', requireAdmin, async (req, res, next) => {
  try {
    const now = Date.now();
    const requested = String(req.query.scope || 'upcoming');
    const scope = ['today', 'upcoming', 'all'].includes(requested) ? requested : 'upcoming';
    const today = istToday();

    // Fetched once and reused — the stats below used to re-read the whole table
    // three more times, which is free against a JSON file and not against a
    // database.
    const all = await db.all();

    const rows = all
      .filter((b) => {
        if (scope === 'all') return true;
        if (scope === 'today') {
          // Expired holds and cancellations are noise on the day's list.
          return b.date === today && !['expired', 'cancelled'].includes(b.status);
        }
        const startsAt = istEpoch(b.date, b.time);
        // A pending booking with a submitted UTR is a payment waiting on the doctor.
        const awaitingVerification = b.status === 'pending' && Boolean(b.payment?.paymentId);
        return (
          startsAt >= now - 60 * 60 * 1000 &&
          (['confirmed', 'needs-attention'].includes(b.status) || awaitingVerification)
        );
      })
      .map((b) => ({
        id: b.id,
        status: b.status,
        date: b.date,
        time: b.time,
        when: formatWhen(b),
        startsAt: istEpoch(b.date, b.time),
        serviceName: b.serviceName,
        durationMinutes: b.durationMinutes,
        amount: b.amount,
        // Which language the patient booked in — worth knowing before the call.
        language: b.language || 'en',
        // Which part of the body the patient picked on the body map, if they
        // came in that way — useful context before the call, and the raw
        // material for "what do patients actually book about".
        bodyRegion: b.bodyRegion || null,
        patient: b.patient,
        payment: b.payment,
        note: b.note || null,
        doctorNotes: b.doctorNotes || null,
        followUpDate: b.followUpDate || null,
        whatsappLink: b.status === 'confirmed' ? whatsappJoinLink(b) : null,
        createdAt: b.createdAt,
      }))
      .sort((a, b) => (scope === 'all' ? b.startsAt - a.startsAt : a.startsAt - b.startsAt));

    // Today's own numbers, so the header can say "3 left" rather than making
    // the doctor count rows.
    const todays = all.filter((b) => b.date === today && !['expired', 'cancelled'].includes(b.status));

    const confirmed = all.filter((b) => b.status === 'confirmed');

    res.json({
      scope,
      bookings: rows,
      stats: {
        total: all.length,
        confirmed: confirmed.length,
        upcoming: confirmed.filter((b) => istEpoch(b.date, b.time) >= now).length,
        revenue: confirmed.reduce((sum, b) => sum + b.amount, 0),
        today: todays.length,
        todayRemaining: todays.filter(
          (b) => b.status !== 'completed' && istEpoch(b.date, b.time) + b.durationMinutes * 60000 >= now,
        ).length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/bookings/:id/confirm-payment — manual UPI mode.
 * The doctor has seen the money arrive; confirm the booking and notify the patient.
 */
router.post('/bookings/:id/confirm-payment', requireAdmin, async (req, res, next) => {
  try {
    const booking = await db.find(req.params.id.toUpperCase());
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status === 'confirmed') return res.json({ id: booking.id, status: 'confirmed' });
    if (booking.status !== 'pending') {
      return res.status(409).json({ error: `Booking is ${booking.status}; it cannot be confirmed.` });
    }
    const { outcome, booking: result } = await confirmPaidBooking(
      booking,
      booking.payment?.paymentId || `manual_${booking.id}`,
    );
    res.json({ id: result.id, status: result.status, outcome });
  } catch (err) {
    next(err);
  }
});

// ── Dashboard ──────────────────────────────────────────────────────────

const DONE = ['confirmed', 'completed'];
const INACTIVE = ['expired', 'cancelled'];
const awaitingVerification = (b) => b.status === 'pending' && Boolean(b.payment?.paymentId);

const brief = (b) => ({
  id: b.id,
  status: b.status,
  date: b.date,
  time: b.time,
  when: formatWhen(b),
  serviceName: b.serviceName,
  durationMinutes: b.durationMinutes,
  amount: b.amount,
  patientName: b.patient.name,
  phone: b.patient.phone,
  payment: { mode: b.payment?.mode, status: b.payment?.status, paymentId: b.payment?.paymentId || null },
  awaitingVerification: awaitingVerification(b),
});

const addDays = (date, n) => istDateString(new Date(Date.parse(`${date}T12:00:00+05:30`) + n * 86400000));
const weekdayOf = (date) => new Date(`${date}T12:00:00+05:30`).getUTCDay();

/** GET /api/admin/overview — everything the dashboard's first screen needs. */
router.get('/overview', requireAdmin, async (_req, res, next) => {
  try {
    const all = await db.all();
    const now = Date.now();
    const today = istToday();
    const month = today.slice(0, 7);
    const earned = all.filter((b) => DONE.includes(b.status));

    const todays = all
      .filter((b) => b.date === today && !INACTIVE.includes(b.status))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Bookings and money per day, a week back to a week ahead.
    const series = Array.from({ length: 15 }, (_, i) => {
      const date = addDays(today, i - 7);
      const day = earned.filter((b) => b.date === date);
      return { date, bookings: day.length, revenue: day.reduce((sum, b) => sum + b.amount, 0) };
    });

    res.json({
      today,
      todaysBookings: todays.map(brief),
      awaitingVerification: all.filter(awaitingVerification).map(brief),
      stats: {
        todayCount: todays.length,
        todayRemaining: todays.filter(
          (b) => b.status !== 'completed' && istEpoch(b.date, b.time) + b.durationMinutes * 60000 >= now,
        ).length,
        upcoming: earned.filter((b) => b.status === 'confirmed' && istEpoch(b.date, b.time) >= now).length,
        monthRevenue: earned.filter((b) => b.date.startsWith(month)).reduce((s, b) => s + b.amount, 0),
        totalRevenue: earned.reduce((s, b) => s + b.amount, 0),
        completed: all.filter((b) => b.status === 'completed').length,
        patients: new Set(earned.map((b) => b.patient.phone)).size,
        needsAttention: all.filter((b) => b.status === 'needs-attention').length,
      },
      series,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/admin/calendar?from=YYYY-MM-DD&days=7 — bookings, hours and time off per day. */
router.get('/calendar', requireAdmin, async (req, res, next) => {
  try {
    const from = isValidDateString(String(req.query.from || '')) ? String(req.query.from) : istToday();
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 14);
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
    const [all, blocks, hours] = await Promise.all([
      db.all(),
      db.listBlocks(dates[0], dates[days - 1]),
      getAvailability(),
    ]);

    res.json({
      from,
      days: dates.map((date) => ({
        date,
        weekday: weekdayOf(date),
        hours: hours[weekdayOf(date)] || [],
        blocks: blocks.filter((b) => b.date === date),
        bookings: all
          .filter((b) => b.date === date && !INACTIVE.includes(b.status))
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(brief),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** Patients are identified by mobile number, which is what the booking form treats as identity. */
function groupPatients(all) {
  const byPhone = new Map();
  for (const b of all) {
    if (INACTIVE.includes(b.status)) continue;
    const entry = byPhone.get(b.patient.phone) || { phone: b.patient.phone, bookings: [] };
    entry.bookings.push(b);
    byPhone.set(b.patient.phone, entry);
  }
  return [...byPhone.values()].map(({ phone, bookings }) => {
    const latest = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const now = Date.now();
    // A visit has happened: completed, or confirmed with the slot already past.
    const visits = bookings.filter(
      (b) => b.status === 'completed' || (b.status === 'confirmed' && istEpoch(b.date, b.time) < now),
    );
    const lastVisit = visits.map((b) => b.date).sort().pop() || null;
    return {
      phone,
      name: latest.patient.name,
      email: latest.patient.email,
      age: latest.patient.age,
      gender: latest.patient.gender,
      language: latest.language || 'en',
      visits: visits.length,
      lastVisit,
      totalSpent: bookings.filter((b) => DONE.includes(b.status)).reduce((s, b) => s + b.amount, 0),
      bookings,
    };
  });
}

/** GET /api/admin/patients?q= */
router.get('/patients', requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    let list = groupPatients(await db.all());
    if (q) {
      list = list.filter((p) => [p.name, p.phone, p.email].some((v) => String(v).toLowerCase().includes(q)));
    }
    list.sort((a, b) => String(b.lastVisit || '').localeCompare(String(a.lastVisit || '')) || a.name.localeCompare(b.name));
    res.json({ patients: list.map(({ bookings, ...p }) => p) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/admin/patients/:phone — one patient with their full visit history and private notes. */
router.get('/patients/:phone', requireAdmin, async (req, res, next) => {
  try {
    const found = groupPatients(await db.all()).find((p) => p.phone === req.params.phone);
    if (!found) return res.status(404).json({ error: 'Patient not found.' });
    const { bookings, ...patient } = found;
    res.json({
      patient,
      bookings: bookings
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
        .map((b) => ({
          ...brief(b),
          symptoms: b.patient.symptoms,
          bodyRegion: b.bodyRegion || null,
          doctorNotes: b.doctorNotes || null,
          followUpDate: b.followUpDate || null,
        })),
    });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/admin/bookings/:id/notes { doctorNotes, followUpDate } */
router.patch('/bookings/:id/notes', requireAdmin, async (req, res, next) => {
  try {
    const { doctorNotes = null, followUpDate = null } = req.body || {};
    if (doctorNotes !== null && (typeof doctorNotes !== 'string' || doctorNotes.length > 4000)) {
      return res.status(400).json({ error: 'Notes must be text of at most 4000 characters.' });
    }
    if (followUpDate !== null && !isValidDateString(String(followUpDate))) {
      return res.status(400).json({ error: 'Follow-up date must be YYYY-MM-DD.' });
    }
    const updated = await db.update(req.params.id.toUpperCase(), {
      doctorNotes: doctorNotes ? doctorNotes.trim() : null,
      followUpDate: followUpDate || null,
    });
    if (!updated) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ id: updated.id, doctorNotes: updated.doctorNotes, followUpDate: updated.followUpDate });
  } catch (err) {
    next(err);
  }
});

/**
 * GET/PUT /api/admin/availability — consulting hours. Changing them affects
 * which slots patients can book from now on; appointments already booked
 * outside the new hours are left alone.
 */
router.get('/availability', requireAdmin, async (_req, res, next) => {
  try {
    res.json({ hours: await getAvailability(), slotGridMinutes: BOOKING_RULES.slotGridMinutes });
  } catch (err) {
    next(err);
  }
});

router.put('/availability', requireAdmin, async (req, res, next) => {
  try {
    const hours = req.body?.hours;
    const problem = validateAvailability(hours);
    if (problem) return res.status(400).json({ error: problem });
    res.json({ hours: await saveAvailability(hours) });
  } catch (err) {
    next(err);
  }
});

/** Lets the doctor mark a consultation as completed or cancelled. */
router.patch('/bookings/:id', requireAdmin, async (req, res, next) => {
  const allowed = ['confirmed', 'completed', 'cancelled', 'needs-attention'];
  const { status } = req.body || {};
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Unsupported status.' });

  try {
    const updated = await db.update(req.params.id.toUpperCase(), { status });
    if (!updated) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    next(err);
  }
});

/**
 * ── Slot blocks ────────────────────────────────────────────────────────
 * The doctor marking themselves unavailable: a half-day, a day off, being
 * ill. Blocked time disappears from the patient-facing slot list, but does
 * NOT touch appointments already booked into it — cancelling on a patient who
 * has paid has to be a deliberate act, not a side effect of blocking a day.
 *
 * These endpoints exist now so the schema is exercised end to end; the admin
 * interface that drives them is built in the next phase.
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

router.get('/blocks', requireAdmin, async (req, res, next) => {
  try {
    const from = isValidDateString(String(req.query.from || '')) ? String(req.query.from) : istToday();
    const to = isValidDateString(String(req.query.to || ''))
      ? String(req.query.to)
      : istDateString(new Date(Date.now() + BOOKING_RULES.maxDaysAhead * 86400000));

    res.json({ from, to, blocks: await db.listBlocks(from, to) });
  } catch (err) {
    next(err);
  }
});

router.post('/blocks', requireAdmin, async (req, res, next) => {
  const { date, start = null, end = null, reason = null } = req.body || {};

  if (!isValidDateString(String(date || ''))) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  }
  // Both times or neither — the same rule the CHECK constraint enforces.
  if ((start === null) !== (end === null)) {
    return res.status(400).json({ error: 'Give both a start and an end time, or neither.' });
  }
  if (start !== null && (!HHMM.test(start) || !HHMM.test(end))) {
    return res.status(400).json({ error: 'Times must be in HH:mm (24-hour) format.' });
  }
  if (start !== null && end <= start) {
    return res.status(400).json({ error: 'The end time must be after the start time.' });
  }

  try {
    const block = await db.addBlock({
      date: String(date),
      start,
      end,
      reason: reason ? String(reason).slice(0, 200) : null,
    });
    res.status(201).json(block);
  } catch (err) {
    next(err);
  }
});

router.delete('/blocks/:id', requireAdmin, async (req, res, next) => {
  try {
    const removed = await db.removeBlock(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Block not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
