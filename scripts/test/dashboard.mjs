/**
 * Run with:  npm run test:dashboard
 *
 * Needs a server on :4000 using the JSON store (leave DATABASE_URL empty so no
 * real data is touched) with the same server/.env this script reads. It checks
 * the admin login and dashboard endpoints and the patient sign-in flow.
 * The sign-in link normally arrives by email; here it is minted with the same
 * signing key the server derives from .env.
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

console.log('\n── Admin login ──');
const bad = await call('/admin/login', { method: 'POST', body: JSON.stringify({ email: 'x@y.z', password: 'nope' }) });
check(bad.status === 401, 'wrong credentials → 401');
const login = await call('/admin/login', { method: 'POST', body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'drricha7273@gmail.com', password: TOKEN }) });
check(login.status === 200 && login.body.token, 'email + password → session token');
const A = { 'x-admin-token': login.body?.token || '' };
check((await call('/admin/overview', { headers: A })).status === 200, 'session token opens the dashboard');
check((await call('/admin/overview', { headers: { 'x-admin-token': 'forged.token' } })).status === 401, 'forged token rejected');
check((await call('/admin/overview', { headers: { 'x-admin-token': TOKEN } })).status === 200, 'raw ADMIN_TOKEN still works as an API key');

console.log('\n── Make a confirmed booking to look at ──');
let date, time;
for (let i = 2; i < 10 && !time; i++) {
  const r = await call(`/bookings/slots?date=${ymd(i)}&service=general`);
  const f = (r.body.slots || []).find((s) => s.available);
  if (f) { date = ymd(i); time = f.time; }
}
const email = `dash${Date.now()}@example.com`;
const created = await call('/bookings', { method: 'POST', body: JSON.stringify({ date, time, service: 'general', language: 'en',
  patient: { name: 'Dash Patient', age: 41, phone: '9811122233', email, symptoms: 'Checking the dashboard flow end to end.', consent: true } }) });
check(created.status === 201, 'booking created');
const id = created.body.bookingId;

console.log('\n── Patient sign-in ──');
check((await call('/account/me')).status === 401, 'no session → 401');
check((await call('/account/login-link', { method: 'POST', body: JSON.stringify({ email: 'bad' }) })).status === 400, 'invalid email rejected');
const unknown = await call('/account/login-link', { method: 'POST', body: JSON.stringify({ email: 'nobody@example.com' }) });
const known = await call('/account/login-link', { method: 'POST', body: JSON.stringify({ email }) });
check(unknown.status === 200 && known.status === 200 && JSON.stringify(unknown.body) === JSON.stringify(known.body), 'same answer for known and unknown emails');
const link = createLoginLink(email);
const sess = await call('/account/session', { method: 'POST', body: JSON.stringify({ token: link }) });
check(sess.status === 200 && sess.body.token, 'link → patient session');
check((await call('/account/session', { method: 'POST', body: JSON.stringify({ token: link }) })).status === 401, 'link works only once');
const P = { Authorization: `Bearer ${sess.body.token}` };
const me = await call('/account/me', { headers: P });
check(me.status === 200 && me.body.bookings.some((b) => b.id === id && b.canCancel), 'dashboard lists the booking, cancellable while unpaid');
check(!JSON.stringify(me.body).includes('doctorNotes'), 'patient view never carries private notes');
const other = createLoginLink('someone.else@example.com');
const otherSess = await call('/account/session', { method: 'POST', body: JSON.stringify({ token: other }) });
check((await call(`/account/bookings/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${otherSess.body.token}` } })).status === 404, "cannot cancel another patient's booking");

console.log('\n── Pay, confirm, then notes ──');
await call('/payments/upi-submit', { method: 'POST', body: JSON.stringify({ bookingId: id, utr: String(Date.now()).padEnd(12, '7').slice(0, 12) }) });
check((await call(`/account/bookings/${id}/cancel`, { method: 'POST', headers: P })).status === 409, 'patient cannot cancel once a UTR is submitted');
const ov = await call('/admin/overview', { headers: A });
check(ov.body.awaitingVerification.some((b) => b.id === id), 'overview flags the payment to verify');
await call(`/admin/bookings/${id}/confirm-payment`, { method: 'POST', headers: A });
const notes = await call(`/admin/bookings/${id}/notes`, { method: 'PATCH', headers: A, body: JSON.stringify({ doctorNotes: 'Advised rest and fluids.', followUpDate: ymd(14) }) });
check(notes.status === 200 && notes.body.doctorNotes, 'doctor note saved');
check((await call(`/admin/bookings/${id}/notes`, { method: 'PATCH', headers: A, body: JSON.stringify({ followUpDate: 'soon' }) })).status === 400, 'bad follow-up date rejected');
const me2 = await call('/account/me', { headers: P });
const mine = me2.body.bookings.find((b) => b.id === id);
check(mine.status === 'confirmed' && mine.whatsappLink && mine.followUpDate === ymd(14), 'patient sees confirmed + follow-up date');
check(!JSON.stringify(me2.body).includes('Advised rest'), 'but not the private note');

console.log('\n── Cancelling a paid booking ──');
check((await call(`/admin/bookings/${id}/refunded`, { method: 'POST', headers: A })).status === 409, 'cannot mark refunded before cancelling');
await call(`/admin/bookings/${id}`, { method: 'PATCH', headers: A, body: JSON.stringify({ status: 'cancelled' }) });
const ov2 = await call('/admin/overview', { headers: A });
check(ov2.body.refundsDue.some((b) => b.id === id) && ov2.body.stats.refundsDue >= 1, 'cancelled paid booking shows as a refund to send');
check((await call(`/admin/bookings/${id}/refunded`, { method: 'POST', headers: A })).body.payment === 'refunded', 'doctor marks it refunded');
const ov3 = await call('/admin/overview', { headers: A });
check(!ov3.body.refundsDue.some((b) => b.id === id), 'no longer listed as due');
// bring it back so the later checks still have a confirmed booking
await call(`/admin/bookings/${id}`, { method: 'PATCH', headers: A, body: JSON.stringify({ status: 'confirmed' }) });

console.log('\n── Admin views ──');
const pats = await call('/admin/patients?q=dash', { headers: A });
check(pats.body.patients.some((p) => p.phone === '9811122233' && p.visits === 0 && p.totalSpent === 500), 'patients list aggregates spend (a future booking is not yet a visit)');
const detail = await call('/admin/patients/9811122233', { headers: A });
check(detail.body.bookings[0].doctorNotes === 'Advised rest and fluids.', 'patient history carries private notes');
const cal = await call(`/admin/calendar?from=${date}&days=3`, { headers: A });
check(cal.body.days.length === 3 && cal.body.days[0].bookings.some((b) => b.id === id), 'calendar shows the booking on its day');

console.log('\n── Consulting hours ──');
const cur = (await call('/admin/availability', { headers: A })).body.hours;
check((await call('/admin/availability', { method: 'PUT', headers: A, body: JSON.stringify({ hours: { ...cur, 1: [['10:00', '09:00']] } }) })).status === 400, 'end-before-start rejected');
check((await call('/admin/availability', { method: 'PUT', headers: A, body: JSON.stringify({ hours: { ...cur, 1: [['09:00', '12:00'], ['11:00', '13:00']] } }) })).status === 400, 'overlapping windows rejected');
const allClosed = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, []]));
check((await call('/admin/availability', { method: 'PUT', headers: A, body: JSON.stringify({ hours: allClosed }) })).status === 200, 'hours saved');
await new Promise((r) => setTimeout(r, 100));
const closed = await call(`/bookings/slots?date=${ymd(3)}&service=general`);
check(closed.body.slots.length === 0, 'patients see no slots when every day is closed');
check((await call('/admin/availability', { method: 'PUT', headers: A, body: JSON.stringify({ hours: cur }) })).status === 200, 'hours restored');

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll dashboard checks passed.');
process.exit(failures ? 1 : 0);
