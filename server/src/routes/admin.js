import crypto from 'node:crypto';
import { Router } from 'express';
import { config, BOOKING_RULES } from '../config.js';
import { db } from '../db.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';
import { istEpoch, isValidDateString, istToday, istDateString } from '../services/slots.js';

const router = Router();

/**
 * A shared-token guard. Enough for a single doctor checking their own list;
 * if the practice grows, replace this with real per-user auth.
 */
function requireAdmin(req, res, next) {
  const supplied = Buffer.from(String(req.get('x-admin-token') || ''));
  const expected = Buffer.from(config.adminToken);
  const ok = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  if (!ok) return res.status(401).json({ error: 'Invalid admin token.' });
  next();
}

router.post('/login', requireAdmin, (_req, res) => res.json({ ok: true }));

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
        return startsAt >= now - 60 * 60 * 1000 && ['confirmed', 'needs-attention'].includes(b.status);
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
