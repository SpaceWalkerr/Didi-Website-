import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { db } from '../db.js';
import { whatsappJoinLink, formatWhen } from '../services/notify.js';
import { istEpoch } from '../services/slots.js';

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
 * GET /api/admin/bookings?scope=upcoming|all
 * Upcoming = confirmed or needing attention, from now onwards, soonest first.
 */
router.get('/bookings', requireAdmin, (req, res) => {
  const now = Date.now();
  const scope = req.query.scope === 'all' ? 'all' : 'upcoming';

  const rows = db
    .all()
    .filter((b) => {
      if (scope === 'all') return true;
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
      patient: b.patient,
      payment: b.payment,
      note: b.note || null,
      whatsappLink: b.status === 'confirmed' ? whatsappJoinLink(b) : null,
      createdAt: b.createdAt,
    }))
    .sort((a, b) => (scope === 'all' ? b.startsAt - a.startsAt : a.startsAt - b.startsAt));

  const confirmed = db.all().filter((b) => b.status === 'confirmed');
  res.json({
    scope,
    bookings: rows,
    stats: {
      total: db.all().length,
      confirmed: confirmed.length,
      upcoming: db
        .all()
        .filter((b) => b.status === 'confirmed' && istEpoch(b.date, b.time) >= now).length,
      revenue: confirmed.reduce((sum, b) => sum + b.amount, 0),
    },
  });
});

/** Lets the doctor mark a consultation as completed or cancelled. */
router.patch('/bookings/:id', requireAdmin, (req, res) => {
  const allowed = ['confirmed', 'completed', 'cancelled', 'needs-attention'];
  const { status } = req.body || {};
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Unsupported status.' });

  const updated = db.update(req.params.id.toUpperCase(), { status });
  if (!updated) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ id: updated.id, status: updated.status });
});

export default router;
