import crypto from 'node:crypto';
import { Router } from 'express';
import { sendDueReminders } from '../services/reminders.js';
import { whatsappMode } from '../services/whatsapp.js';

const router = Router();

/**
 * Vercel Cron calls these with `Authorization: Bearer <CRON_SECRET>`.
 *
 * Refused outright when CRON_SECRET is unset or short, rather than left open:
 * these endpoints send WhatsApp messages to patients, so "no secret configured"
 * must mean "nobody can call it", never "anybody can".
 */
const MIN_SECRET_LENGTH = 16;

function authorised(req) {
  const secret = process.env.CRON_SECRET || '';
  if (secret.length < MIN_SECRET_LENGTH) return false;
  const given = Buffer.from(String(req.get('authorization') || ''));
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/**
 * GET /api/cron/reminders — sends any WhatsApp reminders that have come due.
 *
 * A long-running server does this on a timer (services/reminders.js). A
 * serverless function cannot hold a timer, so Vercel Cron calls this every five
 * minutes instead. Both go through the same sendDueReminders(), which marks each
 * booking as it is attempted, so running both would still send once.
 */
router.get('/reminders', async (req, res, next) => {
  if (!authorised(req)) return res.status(401).json({ error: 'Unauthorised.' });
  if (whatsappMode() !== 'cloud-api') {
    return res.json({ skipped: 'WhatsApp automation is off.', sent: 0 });
  }
  try {
    res.json({ sent: await sendDueReminders() });
  } catch (err) {
    next(err);
  }
});

export default router;
