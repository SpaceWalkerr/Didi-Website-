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
 * Which address a request is counted against.
 *
 * X-Forwarded-For cannot be used as sent: Render (behind Cloudflare) appends
 * to whatever the caller supplied, so its FIRST entry is caller-controlled.
 * Keying on it let a script get a fresh bucket per request just by changing
 * that header (verified against the live site, November 2026).
 *
 * 1. CLIENT_IP_HEADER (default `cf-connecting-ip`). Cloudflare sets this to
 *    the address that connected to it and overwrites any value the caller
 *    sent, so it cannot be forged through Cloudflare. Set CLIENT_IP_HEADER to
 *    an empty string to ignore it, e.g. if the site moves off Cloudflare.
 * 2. Otherwise `req.ip`, which Express derives from X-Forwarded-For counting
 *    `trust proxy` hops from the right (the entries the infrastructure added),
 *    never the caller's own prefix.
 *
 * Still best-effort: an attacker with many real IPs defeats any IP counter.
 */
export function clientKey(req) {
  // Read per call, not at import, so .env is loaded whatever the import order.
  const header = (process.env.CLIENT_IP_HEADER ?? 'cf-connecting-ip').trim();
  const fromEdge = header && req.get(header);
  if (fromEdge) return fromEdge.trim();
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
