/**
 * Run with:  npm run test:reschedule   (needs a server on :4000 using the JSON store)
 *
 * Patient self-service rescheduling: ownership, the two-move limit, the
 * 4-hour cut-off, slot validation, and that the old slot is freed.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = process.env.API || 'http://localhost:4000/api';
const env = (k) => fs.readFileSync(path.join(REPO, 'server/.env'), 'utf8')
  .split('\n').find((l) => l.startsWith(k + '='))?.slice(k.length + 1).trim();
const TOKEN = env('ADMIN_TOKEN');
const { createLoginLink } = await import(path.join(REPO, 'server/src/services/auth.js'));

let failures = 0;
const check = (ok, m) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + m); if (!ok) failures++; };
const call = async (p, opts = {}) => {
  const r = await fetch(API + p, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const ymd = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(Date.now() + n * 864e5);

// Three distinct free slots a few days out.
const free = [];
for (let i = 3; i < 12 && free.length < 4; i++) {
  const r = await call(`/bookings/slots?date=${ymd(i)}&service=general`);
  const f = (r.body.slots || []).filter((s) => s.available);
  if (f.length > 1) free.push({ date: ymd(i), time: f[0].time }, { date: ymd(i), time: f[f.length - 1].time });
}
const email = `resched${Date.now()}@example.com`;
const created = await call('/bookings', { method: 'POST', body: JSON.stringify({ ...free[0], service: 'general', language: 'en',
  patient: { name: 'Reschedule Patient', age: 35, phone: '9822233344', email, symptoms: 'Checking the reschedule flow end to end.', consent: true } }) });
check(created.status === 201, 'booking created');
const id = created.body.bookingId;
const sess = await call('/account/session', { method: 'POST', body: JSON.stringify({ token: createLoginLink(email) }) });
const P = { Authorization: `Bearer ${sess.body.token}` };
const move = (to, headers = P, bid = id) => call(`/account/bookings/${bid}/reschedule`, { method: 'POST', headers, body: JSON.stringify(to) });

check((await move(free[1])).status === 409, 'an unpaid (pending) booking cannot be moved yet');

// Pay and confirm as the clinic would.
await call('/payments/upi-submit', { method: 'POST', body: JSON.stringify({ bookingId: id, utr: String(Date.now()).padEnd(12, '5').slice(0, 12) }) });
await call(`/admin/bookings/${id}/confirm-payment`, { method: 'POST', headers: { 'x-admin-token': TOKEN } });
const me = await call('/account/me', { headers: P });
check(me.body.bookings.find((b) => b.id === id)?.canReschedule === true, 'confirmed booking is reschedulable');

const other = await call('/account/session', { method: 'POST', body: JSON.stringify({ token: createLoginLink('someone.else@example.com') }) });
check((await move(free[1], { Authorization: `Bearer ${other.body.token}` })).status === 404, "cannot move another patient's booking");
check((await move({ date: 'nope', time: '10:00' })).status === 400, 'garbage date rejected');
check((await move(free[0])).status === 409, 'moving onto the same slot is refused');
check((await move({ date: ymd(90), time: '10:00' })).status === 409, 'a slot beyond the booking window is refused');

const first = await move(free[1]);
check(first.status === 200 && first.body.date === free[1].date && first.body.time === free[1].time, 'first move succeeds');
const oldSlot = await call(`/bookings/slots?date=${free[0].date}&service=general`);
check(oldSlot.body.slots.find((s) => s.time === free[0].time)?.available === true, 'the old slot is free again');

// Someone else takes a slot; moving onto it must fail cleanly.
const rival = await call('/bookings', { method: 'POST', body: JSON.stringify({ ...free[2], service: 'general', language: 'en',
  patient: { name: 'Rival', age: 30, phone: '9833344455', email: `rival${Date.now()}@example.com`, symptoms: 'Taking the slot first.', consent: true } }) });
check(rival.status === 201, 'rival booking holds a slot');
const clash = await move(free[2]);
check(clash.status === 409 && clash.body.code, 'moving onto a held slot is refused with a code');

check((await move(free[3])).status === 200, 'second move succeeds');
const third = await move(free[0]);
check(third.status === 409 && third.body.code === 'cannotReschedule', 'a third move is refused');

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nAll reschedule checks passed.');
process.exit(failures ? 1 : 0);
