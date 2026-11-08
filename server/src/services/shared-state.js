import { db } from '../db.js';

/**
 * Counters that more than one server instance has to agree on.
 *
 * Rate limits and one-time sign-in links both need "how many times has this key
 * been seen in the last N ms". On a single long-running server a Map answers
 * that. On Vercel there is no single server: requests are spread over however
 * many function instances happen to be warm, each with its own Map, so a visitor
 * could use the whole allowance once per instance — and a sign-in link marked
 * "spent" on one instance would still work on the next.
 *
 * So on Vercel the counters live in Postgres, where every instance sees the same
 * rows. Elsewhere (Render, local, tests) the Map is kept: it is faster, and with
 * one process it is exactly as correct.
 *
 * STATE_STORE overrides the choice: `database` or `memory`.
 */

const memory = new Map();
let lastSweep = 0;
const SWEEP_EVERY_MS = 60_000;

/** True when counters should be kept in the database. */
export function sharedStateInDatabase() {
  // The JSON store (local development) has no shared counters to offer.
  if (typeof db.hit !== 'function') return false;
  const choice = (process.env.STATE_STORE || '').trim().toLowerCase();
  if (choice) return choice === 'database';
  return Boolean(process.env.VERCEL);
}

function hitMemory(key, windowMs) {
  const now = Date.now();

  // Drop expired windows so the Map cannot grow without bound.
  if (now - lastSweep > SWEEP_EVERY_MS) {
    for (const [k, bucket] of memory) if (bucket.resetAt <= now) memory.delete(k);
    lastSweep = now;
  }

  let bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    memory.set(key, bucket);
  }
  bucket.count += 1;
  return { count: bucket.count, resetInMs: bucket.resetAt - now };
}

/**
 * Counts one occurrence of `key` in a fixed window of `windowMs` and returns
 * `{ count, resetInMs }` — `count` includes this occurrence.
 *
 * `shared: false` is for cheap, low-stakes counters (browsing slots), where a
 * per-instance count is plenty and a database round trip per request is not
 * worth it.
 *
 * If the database is unreachable this falls back to the per-instance count and
 * says so in the log: a limiter that fails open to "somewhat weaker" is better
 * than one that turns a database blip into a refusal for every visitor.
 */
export async function hit(key, windowMs, { shared = true } = {}) {
  if (shared && sharedStateInDatabase()) {
    try {
      return await db.hit(key, windowMs);
    } catch (err) {
      console.error('Shared counter unavailable, counting on this instance only:', err.message);
    }
  }
  return hitMemory(key, windowMs);
}

/** Exposed for tests. */
export const _resetMemoryCounters = () => memory.clear();
