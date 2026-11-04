/**
 * Run with:  npm run test:api      (needs the dev server on :4000; set the same DATA_DIR for both, and leave DATABASE_URL empty so no real data is touched)
 *
 * These talk to a running server over HTTP rather than importing it, so they
 * exercise the real routing, middleware and rate limiting — not a stub of it.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const API = 'http://localhost:4000/api';
const ADMIN = (await import('node:fs')).readFileSync(
  path.join(REPO, 'server/.env'),'utf8')
  .split('\n').find(l => l.startsWith('ADMIN_TOKEN=')).slice('ADMIN_TOKEN='.length).trim();
let failures = 0;
const pass = (m) => console.log('  PASS  ' + m);
const fail = (m) => { console.log('  FAIL  ' + m); failures++; };

const call = async (path, opts = {}) => {
  // Spread opts FIRST, then set headers — otherwise opts.headers clobbers the
  // merged object and Content-Type is lost, so Express never parses the body.
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  let body = null; try { body = await res.json(); } catch {}
  return { status: res.status, body, headers: res.headers };
};

// Find a bookable weekday slot a few days out.
const meta = (await call('/meta')).body || (await call('/bookings/meta')).body;
const soon = (n) => { const d = new Date(Date.now() + n*86400000);
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d); };

let date = null, slots = [];
for (let i = 2; i <= 9 && !date; i++) {
  const r = await call(`/bookings/slots?date=${soon(i)}&service=general`);
  const free = (r.body?.slots || []).filter(s => s.available);
  if (free.length > 16) { date = soon(i); slots = free.filter((_, j) => j % 2 === 0); }
}
if (!date) { console.log('no bookable date found'); process.exit(1); }
console.log(`\nUsing ${date} — ${slots.length} non-overlapping slots\n`);

const patient = (n) => ({
  name: `Test Patient ${n}`, age: 30, gender: 'female',
  phone: `98765432${String(n).padStart(2,'0')}`,
  email: `t${n}@example.com`,
  symptoms: 'Testing the booking flow with enough characters to pass validation.',
  consent: true,
});
const book = (time, n, extra = {}) => call('/bookings', { method: 'POST',
  body: JSON.stringify({ date, time, service: 'general', patient: patient(n), language: 'en', ...extra }) });

console.log('── Open days drive the date picker ──');
const openDays = (await call('/bookings/meta')).body?.openDays;
Array.isArray(openDays) && openDays.includes(1) && !openDays.includes(0)
  ? pass('meta lists open weekdays (Sunday closed)') : fail(`unexpected openDays ${JSON.stringify(openDays)}`);

console.log('── Body region is stored and validated ──');
const b1 = await book(slots[0].time, 1, { bodyRegion: 'chest' });
b1.status === 201 ? pass('booking created with bodyRegion=chest') : fail(`create failed ${b1.status} ${JSON.stringify(b1.body)}`);

const admin = await call('/admin/bookings?scope=all', { headers: { 'x-admin-token': ADMIN } });
const stored = admin.body?.bookings?.find(b => b.id === b1.body.bookingId);
// bodyRegion is not yet exposed on the admin payload; read the store directly.
const fsmod = await import('node:fs');
const raw = JSON.parse(fsmod.readFileSync(path.join(process.env.DATA_DIR || path.join(REPO, 'server/data'), 'bookings.json'),'utf8'));
const row = raw.bookings.find(b => b.id === b1.body.bookingId);
row?.bodyRegion === 'chest' ? pass('bodyRegion persisted') : fail(`bodyRegion was ${row?.bodyRegion}`);
row?.holdExpiresAt ? pass('holdExpiresAt set on the pending booking') : fail('holdExpiresAt missing');

const b2 = await book(slots[1].time, 2, { bodyRegion: '"><script>alert(1)</script>' });
const row2 = JSON.parse(fsmod.readFileSync(path.join(process.env.DATA_DIR || path.join(REPO, 'server/data'), 'bookings.json'),'utf8'))
  .bookings.find(b => b.id === b2.body.bookingId);
row2?.bodyRegion === null ? pass('unknown bodyRegion dropped, not stored') : fail(`stored junk: ${row2?.bodyRegion}`);

console.log('\n── Double-booking is refused ──');
const dup = await book(slots[0].time, 3);
dup.status === 409 && dup.body?.code === 'slotTaken'
  ? pass(`same slot rejected 409 ${dup.body.code}`) : fail(`expected 409 slotTaken, got ${dup.status} ${JSON.stringify(dup.body)}`);

console.log('\n── Server is authoritative on price ──');
const cheat = await call('/bookings', { method: 'POST', body: JSON.stringify({
  date, time: slots[2].time, service: 'general', patient: patient(4), language: 'en', amount: 1, price: 1 }) });
cheat.status === 201 && cheat.body.amount === 500
  ? pass(`client-supplied price ignored (charged ₹${cheat.body.amount})`)
  : fail(`price handling wrong: ${cheat.status} ${JSON.stringify(cheat.body)}`);

console.log('\n── Input validation ──');
const bad = await call('/bookings', { method: 'POST', body: JSON.stringify({
  date, time: slots[3].time, service: 'general', language: 'en',
  patient: { name: 'x', phone: '123', email: 'nope', symptoms: 'short', consent: false } }) });
bad.status === 400 && bad.body?.fieldErrors
  ? pass(`invalid patient rejected: ${Object.keys(bad.body.fieldErrors).join(',')}`)
  : fail(`expected 400 with fieldErrors, got ${bad.status}`);

const noConsent = await call('/bookings', { method: 'POST', body: JSON.stringify({
  date, time: slots[3].time, service: 'general', language: 'en',
  patient: { ...patient(5), consent: false } }) });
noConsent.body?.fieldErrors?.consent ? pass('consent is required') : fail('booking accepted without consent');

console.log('\n── Admin auth ──');
(await call('/admin/bookings')).status === 401 ? pass('no token → 401') : fail('unauthenticated admin allowed');
(await call('/admin/bookings', { headers: { 'x-admin-token': 'wrong-token-here-padding' } })).status === 401
  ? pass('wrong token → 401') : fail('bad token accepted');

console.log('\n── Slot blocks hide time from patients ──');
const before = (await call(`/bookings/slots?date=${date}&service=general`)).body.slots.filter(s => s.available).length;
const blk = await call('/admin/blocks', { method: 'POST', headers: { 'x-admin-token': ADMIN },
  body: JSON.stringify({ date, start: '09:00', end: '13:00', reason: 'Test block' }) });
blk.status === 201 ? pass('block created') : fail(`block failed ${blk.status} ${JSON.stringify(blk.body)}`);

const after = (await call(`/bookings/slots?date=${date}&service=general`)).body.slots;
const blocked = after.filter(s => s.reason === 'blocked').length;
const freeAfter = after.filter(s => s.available).length;
blocked > 0 ? pass(`${blocked} slots now reported as blocked`) : fail('block had no effect on slots');
freeAfter < before ? pass(`free slots fell ${before} → ${freeAfter}`) : fail('free slot count unchanged');

const intoBlock = await book(after.find(s => s.reason === 'blocked').time, 6);
intoBlock.status === 409 ? pass(`booking into blocked time refused (${intoBlock.body?.code})`) : fail(`expected 409, got ${intoBlock.status}`);

const del = await call(`/admin/blocks/${blk.body.id}`, { method: 'DELETE', headers: { 'x-admin-token': ADMIN } });
del.status === 200 ? pass('block removed') : fail('block delete failed');
const restored = (await call(`/bookings/slots?date=${date}&service=general`)).body.slots.filter(s => s.available).length;
restored === before ? pass(`free slots restored to ${restored}`) : fail(`expected ${before}, got ${restored}`);

console.log('\n── Block validation ──');
const halfWindow = await call('/admin/blocks', { method: 'POST', headers: { 'x-admin-token': ADMIN },
  body: JSON.stringify({ date, start: '09:00' }) });
halfWindow.status === 400 ? pass('half-specified window rejected') : fail(`got ${halfWindow.status}`);
const backwards = await call('/admin/blocks', { method: 'POST', headers: { 'x-admin-token': ADMIN },
  body: JSON.stringify({ date, start: '13:00', end: '09:00' }) });
backwards.status === 400 ? pass('end-before-start rejected') : fail(`got ${backwards.status}`);

console.log('\n── Rate limiting ──');
let got429 = null, attempts = 0;
for (let i = 0; i < 20 && !got429; i++) {
  attempts++;
  const r = await book(slots[6].time, 50 + i);
  if (r.status === 429) got429 = r;
}
got429
  ? pass(`booking creation throttled after ${attempts} attempts (429 ${got429.body?.code}, retry in ${got429.body?.params?.seconds}s)`)
  : fail('rate limit never fired on /api/bookings');
got429?.headers?.get('retry-after') ? pass('Retry-After header sent') : fail('no Retry-After header');

const readsOk = (await call(`/bookings/slots?date=${date}&service=general`)).status;
readsOk === 200 ? pass('reading slots still works while creates are throttled') : fail(`reads blocked too (${readsOk})`);

console.log(failures ? `\n${failures} CHECK(S) FAILED\n` : '\nAll API checks passed.\n');
process.exit(failures ? 1 : 0);
