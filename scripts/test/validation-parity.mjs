/**
 * Run with:  npm test   (or: node scripts/test/validation-parity.mjs with a server on :4000)
 *
 * The booking form now checks patient details in the browser before it sends
 * them (client/src/lib/validate.js). That is only safe if the browser and the
 * server agree exactly: a stricter browser would block bookings the server
 * accepts. This sends each case to the real API with an impossible date — the
 * server validates the patient BEFORE the slot, so an invalid patient gets
 * 400 + fieldErrors and a valid one gets a slot error, and nothing is booked —
 * then compares the server's error codes with the browser function's.
 */
import { validatePatient } from '../../client/src/lib/validate.js';

const API = process.env.API || 'http://localhost:4000/api';
const ok = { name: 'Asha Verma', phone: '9876543210', email: 'asha@example.com', symptoms: 'A cough for two weeks.', consent: true, age: '' };
const CASES = [
  ok,
  { ...ok, name: '' }, { ...ok, name: ' A ' }, { ...ok, name: 'Al' }, { ...ok, name: 'x'.repeat(100) }, { ...ok, name: 'x'.repeat(101) },
  { ...ok, phone: '' }, { ...ok, phone: '12345' }, { ...ok, phone: '5876543210' }, { ...ok, phone: '+91 98765 43210' },
  { ...ok, phone: '919876543210' }, { ...ok, phone: '098765 43210' }, { ...ok, phone: '98765-43210' },
  { ...ok, email: '' }, { ...ok, email: 'a@b' }, { ...ok, email: 'a@b.c' }, { ...ok, email: 'a@b.co' }, { ...ok, email: 'a b@c.com' },
  { ...ok, email: `${'a'.repeat(245)}@ex.com` }, { ...ok, email: `${'a'.repeat(250)}@ex.com` },
  { ...ok, symptoms: '' }, { ...ok, symptoms: 'short' }, { ...ok, symptoms: '   123456789   ' }, { ...ok, symptoms: '1234567890' },
  { ...ok, symptoms: 'y'.repeat(2000) }, { ...ok, symptoms: 'y'.repeat(2001) },
  { ...ok, age: '0' }, { ...ok, age: '120' }, { ...ok, age: '121' }, { ...ok, age: '-1' }, { ...ok, age: 'abc' }, { ...ok, age: '41' },
  { ...ok, consent: false },
  { name: '', phone: '', email: '', symptoms: '', consent: false, age: '' },
];

let failures = 0;
for (const [i, patient] of CASES.entries()) {
  const res = await fetch(`${API}/bookings`, {
    method: 'POST',
    // A distinct test address per case, so the booking rate limit (12 an hour
    // per client) does not cut the run short. Only the throwaway test server
    // sees these requests.
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.99.0.${i + 1}` },
    body: JSON.stringify({ date: '1999-01-01', time: '09:00', service: 'general', language: 'en', patient }),
  });
  const body = await res.json();
  const server = res.status === 400 && body.code === 'fieldsInvalid' ? body.fieldErrors : {};
  if (res.status !== 400 && res.status !== 409) {
    console.log(`  FAIL  case ${i}: unexpected status ${res.status}`);
    failures++;
    continue;
  }
  const client = validatePatient(patient);
  const same = JSON.stringify(Object.keys(server).sort()) === JSON.stringify(Object.keys(client).sort());
  console.log(`${same ? '  PASS  ' : '  FAIL  '}case ${String(i).padStart(2)}: server ${JSON.stringify(Object.keys(server))} browser ${JSON.stringify(Object.keys(client))}`);
  if (!same) failures++;
}
console.log(failures ? `\n${failures} case(s) disagree.` : '\nBrowser and server validation agree on every case.');
process.exit(failures ? 1 : 0);
