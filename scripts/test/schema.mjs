/**
 * Verifies server/src/db/schema.sql against a real Postgres — in particular
 * the exclusion constraint that prevents double-booking.
 *
 * Run with:  npm run test:schema
 *
 * Uses PGlite (Postgres compiled to WebAssembly), so no database has to be
 * installed and nothing touches your real data. It is NOT listed as a
 * dependency, to keep it out of the production install; the first run will
 * tell you the one command to install it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let PGlite, btree_gist;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
  ({ btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist'));
} catch {
  console.log(
    '\n  This test needs PGlite, which is not installed (deliberately — it would\n' +
      '  otherwise be pulled into the production build).\n\n' +
      '      npm i -D @electric-sql/pglite -w server\n\n' +
      '  then run it again.\n',
  );
  process.exit(0);
}

const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/db/schema.sql'), 'utf8');
const db = await PGlite.create({ extensions: { btree_gist } });

let failures = 0;
const pass = (m) => console.log('  PASS  ' + m);
const fail = (m) => { console.log('  FAIL  ' + m); failures++; };

console.log('\n── schema.sql applies, and re-applies cleanly on every boot ──');
await db.exec(SCHEMA);
pass('applied');
await db.exec(SCHEMA);
pass('idempotent');

await db.exec(`
  INSERT INTO doctors (slug,name,qualification,reg_no,council)
    VALUES ('primary','Dr. Richa Rani','MBBS','52532','Bihar State Medical Council')
    ON CONFLICT (slug) DO NOTHING;
  INSERT INTO patients (name,phone,email) VALUES ('Test','9000000001','t@example.com')
    ON CONFLICT (phone) DO NOTHING;`);

const book = (id, date, time, mins, status = 'confirmed') => db.query(
  `INSERT INTO appointments
     (id,doctor_id,patient_id,service_id,service_name,appt_date,start_time,
      duration_minutes,status,concern,amount_paise)
   VALUES ($1,(SELECT id FROM doctors WHERE slug='primary'),
     (SELECT id FROM patients WHERE phone='9000000001'),
     'general','General Consultation',$2,$3,$4,$5,'test',50000)`,
  [id, date, time, mins, status]);

const rejects = async (label, fn) => {
  try { await fn(); fail(label + ' — was ACCEPTED'); }
  catch (e) { e.code === '23P01' ? pass(`${label} (${e.code})`) : fail(`${label} — wrong error ${e.code}`); }
};

console.log('\n── Double-booking ──');
await book('T0000001', '2026-10-01', '09:00', 20);
pass('first 20-minute booking at 09:00 accepted');
await rejects('identical slot rejected', () => book('T0000002', '2026-10-01', '09:00', 20));
// The case a UNIQUE(date, start_time) index would let through:
await rejects('overlap 08:45+30m vs 09:00+20m rejected', () => book('T0000003', '2026-10-01', '08:45', 30));
await rejects('overlap 09:15+10m inside 09:00+20m rejected', () => book('T0000004', '2026-10-01', '09:15', 10));

console.log('\n── Adjacency is still allowed ──');
await book('T0000005', '2026-10-01', '09:20', 10);
pass('back-to-back 09:20 accepted');

console.log('\n── Dead bookings release their slot ──');
await book('T0000010', '2026-10-02', '10:00', 20, 'pending');
await rejects('a pending hold blocks the slot', () => book('T0000011', '2026-10-02', '10:00', 20));
await db.query(`UPDATE appointments SET status='expired' WHERE id='T0000010'`);
await book('T0000012', '2026-10-02', '10:00', 20);
pass('expired hold frees the slot');
await db.query(`UPDATE appointments SET status='cancelled' WHERE id='T0000012'`);
await book('T0000013', '2026-10-02', '10:00', 20);
pass('cancelled booking frees the slot');

console.log('\n── CHECK constraints ──');
const rejects4 = async (label, sql) => {
  try { await db.query(sql); fail(label + ' — was ACCEPTED'); }
  catch (e) { pass(`${label} (${e.code})`); }
};
await rejects4('block with only a start time rejected',
  `INSERT INTO slot_blocks (doctor_id,block_date,start_time,end_time)
   VALUES ((SELECT id FROM doctors WHERE slug='primary'),'2026-10-05','10:00',NULL)`);
await rejects4('block ending before it starts rejected',
  `INSERT INTO slot_blocks (doctor_id,block_date,start_time,end_time)
   VALUES ((SELECT id FROM doctors WHERE slug='primary'),'2026-10-05','12:00','11:00')`);
await rejects4('unknown appointment status rejected',
  `UPDATE appointments SET status='banana' WHERE id='T0000005'`);

await db.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED\n` : '\nAll schema checks passed.\n');
process.exit(failures ? 1 : 0);
