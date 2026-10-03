/**
 * Run with:  npm run test:race      (needs the dev server on :4000)
 *
 * These talk to a running server over HTTP rather than importing it, so they
 * exercise the real routing, middleware and rate limiting — not a stub of it.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

import fs from 'node:fs';
const API = 'http://localhost:4000/api';
const soon = (n) => new Intl.DateTimeFormat('en-CA',
  {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'})
  .format(new Date(Date.now() + n*86400000));

let date = null, slot = null;
for (let i = 2; i <= 9 && !date; i++) {
  const r = await fetch(`${API}/bookings/slots?date=${soon(i)}&service=general`).then(r=>r.json());
  const free = (r.slots||[]).filter(s=>s.available);
  if (free.length) { date = soon(i); slot = free[0].time; }
}

const N = 8;
console.log(`\nFiring ${N} simultaneous bookings at ${date} ${slot}\n`);

const results = await Promise.all(
  Array.from({ length: N }, (_, i) =>
    fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date, time: slot, service: 'general', language: 'en',
        patient: {
          name: `Racer ${i}`, age: 30, phone: `98765${String(40000+i)}`,
          email: `r${i}@example.com`,
          symptoms: 'Concurrent booking attempt for the very same slot.',
          consent: true,
        },
      }),
    }).then(async r => ({ status: r.status, body: await r.json().catch(()=>null) }))
  )
);

const created = results.filter(r => r.status === 201);
const conflict = results.filter(r => r.status === 409);
const other    = results.filter(r => ![201,409].includes(r.status));

console.log(`  201 created  : ${created.length}`);
console.log(`  409 conflict : ${conflict.length}`);
console.log(`  anything else: ${other.length}` + (other.length ? ' -> ' + JSON.stringify(other.map(o=>({s:o.status,b:o.body}))) : ''));

// The store must physically contain exactly one live booking for that slot.
const raw = JSON.parse(fs.readFileSync(path.join(REPO, 'server/data/bookings.json'),'utf8'));
const live = raw.bookings.filter(b =>
  b.date===date && b.time===slot && ['pending','confirmed','needs-attention'].includes(b.status));

let ok = true;
const check = (cond, msg) => { console.log(`  ${cond?'PASS':'FAIL'}  ${msg}`); if(!cond) ok=false; };
console.log('');
check(created.length === 1, `exactly one request won (${created.length})`);
check(conflict.length === N-1, `the other ${N-1} got a clean 409 (${conflict.length})`);
check(other.length === 0, 'no 500s — losing a race is a handled outcome, not a crash');
check(live.length === 1, `exactly one live booking persisted for that slot (${live.length})`);
check(conflict.every(c => c.body?.code === 'slotTaken'), 'every loser got code=slotTaken');

console.log(ok ? '\nNo double-booking.\n' : '\nRACE TEST FAILED\n');
process.exit(ok?0:1);
