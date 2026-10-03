/**
 * In-memory fixed-window rate limiting.
 *
 * Deliberately not a dependency: this is one doctor's booking site on a single
 * small instance, and a Map of counters is the right size of solution. The
 * trade-off is that the window is per-process — if the app is ever scaled to
 * more than one instance, move this to Redis or the database, because two
 * processes would each allow the full quota.
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

const buckets = new Map();

/**
 * Behind Render, Vercel and most hosts the socket address is the proxy's, so
 * the client IP arrives in X-Forwarded-For. Only the FIRST entry is meaningful
 * — the rest can be forged by the caller.
 *
 * This is best-effort: an attacker on a rotating IP defeats it, and that is
 * accepted. It exists to stop casual abuse and runaway retry loops, not a
 * determined adversary.
 */
function clientKey(req) {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Drops expired windows so the Map cannot grow without bound. */
function sweep(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

let lastSweep = 0;
const SWEEP_EVERY_MS = 60_000;

export function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const now = Date.now();

    if (now - lastSweep > SWEEP_EVERY_MS) {
      sweep(now);
      lastSweep = now;
    }

    const key = `${name}:${clientKey(req)}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
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
  };
}

/** Exposed for tests. */
export const _resetRateLimits = () => buckets.clear();
