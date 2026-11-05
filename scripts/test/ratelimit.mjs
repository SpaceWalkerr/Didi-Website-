/**
 * Rate-limit key: a caller must not get a fresh allowance by changing
 * X-Forwarded-For. Run by `npm test` against a throwaway server.
 *
 * Uses the read limiter (120 a minute on /api/bookings/*): cheap, creates
 * nothing. Locally there is no proxy, so the Cloudflare header stands in for
 * the edge, as it does on Render.
 */
const BASE = `http://localhost:${process.env.PORT || 4000}`;
let failures = 0;
const check = (ok, label) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures++; };
const get = (headers) => fetch(`${BASE}/api/bookings/meta`, { headers });

console.log('\n── Forged X-Forwarded-For does not reset the allowance ──');
let last;
for (let i = 0; i < 121; i++) {
  last = await get({ 'CF-Connecting-IP': '198.51.100.20', 'X-Forwarded-For': `203.0.113.${i % 250}` });
}
check(last.status === 429, `121st request from one visitor is refused (got ${last.status})`);
check(Number(last.headers.get('retry-after')) > 0, 'refusal says when to retry');

console.log('\n── Other visitors are not affected ──');
const other = await get({ 'CF-Connecting-IP': '198.51.100.21', 'X-Forwarded-For': '203.0.113.1' });
check(other.status === 200, `a different visitor still gets through (got ${other.status})`);
const remaining = Number(other.headers.get('ratelimit-remaining'));
check(remaining === 119, `and starts with a full allowance (remaining ${remaining})`);

console.log(failures ? `\n${failures} rate-limit check(s) failed.` : '\nAll rate-limit checks passed.');
process.exit(failures ? 1 : 0);
