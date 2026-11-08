import { hit, _resetMemoryCounters } from '../services/shared-state.js';

/**
 * Fixed-window rate limiting.
 *
 * Deliberately not a dependency: this is one doctor's booking site, and a
 * counter per visitor is the right size of solution. Where the counters live is
 * decided in services/shared-state.js — in memory on a single long-running
 * server, in Postgres on Vercel, where every request may land on a different
 * instance and a per-process count would let a visitor use the whole allowance
 * once per instance.
 *
 * What it is actually protecting:
 *  · POST /api/bookings     — each call creates a row and a Razorpay order,
 *                             and holds a real slot for 15 minutes. Left open,
 *                             a script could hold every slot in the diary.
 *  · /api/payments/*        — signature-checking endpoints; cheap to call,
 *                             expensive to let someone brute-force.
 *  · /api/admin/*           — the only thing between a guessed token and every
 *                             patient's name, phone and symptoms.
 */

/**
 * Which address a request is counted against.
 *
 * X-Forwarded-For cannot be used as sent: Render (behind Cloudflare) appends
 * to whatever the caller supplied, so its FIRST entry is caller-controlled.
 * Keying on it let a script get a fresh bucket per request just by changing
 * that header (verified against the live site, November 2026).
 *
 * 1. CLIENT_IP_HEADER. On Render the default is `cf-connecting-ip`: Cloudflare
 *    sets it to the address that connected to it and overwrites any value the
 *    caller sent, so it cannot be forged through Cloudflare. That is ONLY true
 *    behind Cloudflare — anywhere else the caller writes this header, and
 *    trusting it hands every visitor an unlimited number of fresh buckets. So
 *    on Vercel the default is empty and the header is ignored. Set it
 *    explicitly only if you know a proxy you control sets and overwrites it.
 * 2. Otherwise `req.ip`, which Express derives from X-Forwarded-For counting
 *    `trust proxy` hops from the right (the entries the infrastructure added),
 *    never the caller's own prefix. Vercel puts the client's address there.
 *
 * Still best-effort: an attacker with many real IPs defeats any IP counter.
 */
export function clientKey(req) {
  // Read per call, not at import, so .env is loaded whatever the import order.
  const header = (process.env.CLIENT_IP_HEADER ?? (process.env.VERCEL ? '' : 'cf-connecting-ip')).trim();
  const fromEdge = header && req.get(header);
  if (fromEdge) return fromEdge.trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * @param shared  Keep the count where every server instance can see it. Use it
 *                for limits that guard something (creating bookings, signing
 *                in); leave it off for cheap reads, where a per-instance count
 *                is enough and a database call per request is not worth it.
 */
export function rateLimit({ windowMs, max, name, shared = false }) {
  return async (req, res, next) => {
    try {
      const { count, resetInMs } = await hit(`${name}:${clientKey(req)}`, windowMs, { shared });
      const retryAfter = Math.max(1, Math.ceil(resetInMs / 1000));

      res.set('RateLimit-Limit', String(max));
      res.set('RateLimit-Remaining', String(Math.max(0, max - count)));
      res.set('RateLimit-Reset', String(Math.ceil(resetInMs / 1000)));

      if (count > max) {
        res.set('Retry-After', String(retryAfter));
        // `code` maps to an errors.* key so the client can translate it — the
        // server never sends a user-facing sentence in one fixed language.
        return res.status(429).json({
          code: 'tooManyRequests',
          params: { seconds: retryAfter },
          error: 'Too many requests. Please wait a moment and try again.',
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/** Exposed for tests. */
export const _resetRateLimits = _resetMemoryCounters;
