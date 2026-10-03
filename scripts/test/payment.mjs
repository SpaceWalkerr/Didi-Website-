/**
 * Run with:  npm run test:payment      (needs the dev server on :4000)
 *
 * These talk to a running server over HTTP rather than importing it, so they
 * exercise the real routing, middleware and rate limiting — not a stub of it.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

import fs from 'node:fs';
const API = 'http://localhost:4001/api';
const DATA = process.env.MOCKDATA;
let failures = 0;
const pass = (m) => console.log('  PASS  ' + m);
const fail = (m) => { console.log('  FAIL  ' + m); failures++; };

const call = async (path, opts = {}) => {
  const res = await fetch(API + path, { ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  let body = null; try { body = await res.json(); } catch {}
  return { status: res.status, body };
};
const soon = (n) => new Intl.DateTimeFormat('en-CA',
  {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'})
  .format(new Date(Date.now() + n*86400000));
const store = () => JSON.parse(fs.readFileSync(`${DATA}/bookings.json`,'utf8'));

let date = null, slots = [];
for (let i = 2; i <= 9 && !date; i++) {
  const r = await call(`/bookings/slots?date=${soon(i)}&service=general`);
  const free = (r.body?.slots||[]).filter(s=>s.available);
  if (free.length > 6) { date = soon(i); slots = free.filter((_,j)=>j%2===0); }
}
console.log(`\nMock-mode server, ${date}\n`);

const makeBooking = (time, n) => call('/bookings', { method: 'POST', body: JSON.stringify({
  date, time, service: 'general', language: 'en', bodyRegion: 'head',
  patient: { name: `Pay Test ${n}`, age: 40, phone: `98761000${String(n).padStart(2,'0')}`,
    email: `p${n}@example.com`, symptoms: 'Verifying the payment and confirmation path end to end.',
    consent: true } }) });

console.log('── Happy path: book → pay → verify → confirmed ──');
const created = await makeBooking(slots[0].time, 1);
created.status === 201 ? pass(`booking ${created.body.bookingId} created (pending)`) : fail(`create failed ${created.status}`);
created.body.paymentMode === 'mock' ? pass('server reports mock payment mode') : fail('not in mock mode');

let row = store().bookings.find(b => b.id === created.body.bookingId);
row.status === 'pending' ? pass('starts as pending') : fail(`status ${row.status}`);
row.payment.orderId ? pass('Razorpay order id attached after creation') : fail('no order id');

const mock = await call('/payments/mock-pay', { method: 'POST', body: JSON.stringify({ orderId: created.body.order.id }) });
mock.status === 200 && mock.body.razorpay_signature ? pass('mock payment signed') : fail('mock-pay failed');

const verified = await call('/payments/verify', { method: 'POST', body: JSON.stringify({
  bookingId: created.body.bookingId, ...mock.body }) });
verified.status === 200 && verified.body.status === 'confirmed'
  ? pass('signature verified → confirmed') : fail(`verify failed ${verified.status} ${JSON.stringify(verified.body)}`);
verified.body.whatsappLink?.startsWith('https://wa.me/')
  ? pass('WhatsApp join link returned') : fail('no WhatsApp link');

row = store().bookings.find(b => b.id === created.body.bookingId);
row.status === 'confirmed' ? pass('persisted as confirmed') : fail(`status ${row.status}`);
row.payment.status === 'paid' ? pass('payment marked paid') : fail(`payment ${row.payment.status}`);
row.holdExpiresAt === null ? pass('hold cleared on confirmation') : fail(`hold still ${row.holdExpiresAt}`);
row.bodyRegion === 'head' ? pass('bodyRegion survived the whole flow') : fail(`bodyRegion ${row.bodyRegion}`);

console.log('\n── A forged signature is rejected ──');
const forged = await makeBooking(slots[1].time, 2);
const bad = await call('/payments/verify', { method: 'POST', body: JSON.stringify({
  bookingId: forged.body.bookingId,
  razorpay_order_id: forged.body.order.id,
  razorpay_payment_id: 'pay_fake_00000000',
  razorpay_signature: 'deadbeef'.repeat(8) }) });
bad.status === 400 && bad.body.code === 'paymentUnverified'
  ? pass(`forged signature rejected (${bad.body.code})`) : fail(`expected 400 paymentUnverified, got ${bad.status}`);
store().bookings.find(b=>b.id===forged.body.bookingId).status !== 'confirmed'
  ? pass('forged payment did NOT confirm the booking') : fail('forged payment confirmed a booking');

console.log('\n── Payment for a different booking is rejected ──');
const other = await makeBooking(slots[2].time, 3);
const mism = await call('/payments/verify', { method: 'POST', body: JSON.stringify({
  bookingId: other.body.bookingId,
  razorpay_order_id: created.body.order.id,       // someone else's order
  razorpay_payment_id: 'pay_mock_x', razorpay_signature: 'x' }) });
mism.status === 400 && mism.body.code === 'paymentMismatch'
  ? pass(`order/booking mismatch rejected (${mism.body.code})`) : fail(`got ${mism.status} ${JSON.stringify(mism.body)}`);

console.log('\n── Confirmation is exactly-once ──');
const twice = await makeBooking(slots[3].time, 4);
const m2 = await call('/payments/mock-pay', { method: 'POST', body: JSON.stringify({ orderId: twice.body.order.id }) });
const [r1, r2] = await Promise.all([
  call('/payments/verify', { method: 'POST', body: JSON.stringify({ bookingId: twice.body.bookingId, ...m2.body }) }),
  call('/payments/verify', { method: 'POST', body: JSON.stringify({ bookingId: twice.body.bookingId, ...m2.body }) }),
]);
[r1,r2].every(r => r.status === 200 && r.body.status === 'confirmed')
  ? pass('two simultaneous verifications both report confirmed to the patient') : fail(`got ${r1.status}/${r2.status}`);
const confirmedRows = store().bookings.filter(b => b.id === twice.body.bookingId && b.status === 'confirmed');
confirmedRows.length === 1 ? pass('exactly one confirmed row') : fail(`${confirmedRows.length} rows`);

console.log('\n── Cancelling the payment window releases the slot ──');
const abandoned = await makeBooking(slots[4].time, 5);
await call('/payments/cancel', { method: 'POST', body: JSON.stringify({ bookingId: abandoned.body.bookingId }) });
store().bookings.find(b=>b.id===abandoned.body.bookingId).status === 'cancelled'
  ? pass('booking cancelled') : fail('not cancelled');
const reopened = (await call(`/bookings/slots?date=${date}&service=general`)).body.slots.find(s => s.time === slots[4].time);
reopened?.available ? pass('slot is bookable again') : fail('slot still held after cancellation');

console.log('\n── A lapsed hold is swept and the slot returns ──');
const stale = await makeBooking(slots[5].time, 6);
// Backdate the hold, as if 15 minutes had passed.
const data = store();
data.bookings.find(b => b.id === stale.body.bookingId).holdExpiresAt = new Date(Date.now() - 60000).toISOString();
fs.writeFileSync(`${DATA}/bookings.json`, JSON.stringify(data, null, 2));
const afterSweep = (await call(`/bookings/slots?date=${date}&service=general`)).body.slots.find(s => s.time === slots[5].time);
afterSweep?.available ? pass('expired hold released the slot') : fail('slot still held after the hold lapsed');
store().bookings.find(b=>b.id===stale.body.bookingId).status === 'expired'
  ? pass('booking marked expired by the sweep') : fail('sweep did not mark it expired');

console.log('\n── Confirmation endpoint ──');
const conf = await call(`/bookings/${created.body.bookingId}`);
conf.status === 200 && conf.body.whatsappLink ? pass('confirmed booking exposes its join link') : fail('confirmation payload wrong');
const pend = await call(`/bookings/${forged.body.bookingId}`);
pend.body?.whatsappLink === null ? pass('unpaid booking exposes NO join link') : fail('unpaid booking leaked a join link');

console.log(failures ? `\n${failures} CHECK(S) FAILED\n` : '\nAll payment checks passed.\n');
process.exit(failures ? 1 : 0);
