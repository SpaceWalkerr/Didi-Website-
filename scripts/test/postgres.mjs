/**
 * Run with:  npm run test:postgres
 *
 * What changes when the site runs on Vercel, checked against a real Postgres
 * engine (PGlite, in memory — nothing real is touched):
 *
 *  1. init() is cheap and safe. Once the schema is current a start does no DDL,
 *     and several instances starting at once do not trip over each other.
 *  2. The shared counter (db.hit) counts exactly, resets, and keeps keys apart.
 *  3. Two SEPARATE server processes — standing in for two function instances —
 *     share one database. A rate limit used up across both is used up on both,
 *     and a one-time sign-in link redeemed on one is dead on the other.
 *
 * What this CANNOT show: PGlite is a single database session, and its socket
 * layer interleaves every connection's queries into it, so two connections'
 * BEGIN…COMMIT blocks collide in a way real Postgres never allows. Anything that
 * depends on true concurrent transactions is therefore left to Postgres itself
 * — the advisory lock in init(), and the exclusion constraint that stops two
 * patients booking one slot (which schema.mjs checks directly). Everything below
 * is sequential, single-statement or single-transaction at a time.
 *
 * PGlite is deliberately not a dependency, to keep it out of the production
 * install; the first run prints the one command to install it.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let PGlite, btree_gist, PGLiteSocketServer;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
  ({ btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist'));
  ({ PGLiteSocketServer } = await import('@electric-sql/pglite-socket'));
} catch {
  console.log(
    '\n  This test needs PGlite, which is not installed (deliberately — it would\n' +
      '  otherwise be pulled into the production build).\n\n' +
      '      npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket\n\n' +
      '  then run it again.\n',
  );
  process.exit(0);
}

let failures = 0;
const check = (ok, label) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One pool connection per store keeps PGlite's single-session model simple.
process.env.PG_POOL_MAX = '1';
// Must be set before auth.js is imported: the signing key is derived from it.
process.env.SESSION_SECRET = 'postgres-test-secret-not-used-anywhere-else';

const { createPostgresStore } = await import('../../server/src/db/postgres.js');

const pg = await PGlite.create({ extensions: { btree_gist } });
const socket = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1', maxConnections: 8 });
await socket.start();
const URL_ = `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`;

const stores = [];
const newStore = () => {
  const s = createPostgresStore(URL_);
  stores.push(s);
  return s;
};
const q = async (sql, params) => (await pg.query(sql, params)).rows;

// ── 1. init() ───────────────────────────────────────────────────────────────
console.log('\n── init(): fingerprinted, lock-protected ──');
const a = newStore();
await a.init();
const [{ n: rules }] = await q('SELECT count(*)::int AS n FROM availability_rules');
const [{ n: doctors }] = await q('SELECT count(*)::int AS n FROM doctors');
const [fp] = await q(`SELECT value FROM settings WHERE key = 'schema_fingerprint'`);
check(rules > 0 && doctors === 1, `fresh database: schema applied and seeded (${rules} hour rows, ${doctors} doctor)`);
check(typeof fp?.value === 'string' && fp.value.length === 64, 'fingerprint recorded');
check((await q(`SELECT to_regclass('public.rate_limits') AS t`))[0].t !== null, 'rate_limits table exists');

await q('DELETE FROM availability_rules WHERE id = (SELECT min(id) FROM availability_rules)');
await newStore().init();
const [{ n: afterSkip }] = await q('SELECT count(*)::int AS n FROM availability_rules');
check(afterSkip === rules - 1, 'schema already current → init() does no work (a deleted seed row stays deleted)');

await q(`UPDATE settings SET value = '"stale"'::jsonb WHERE key = 'schema_fingerprint'`);
await newStore().init();
const [{ n: afterReapply }] = await q('SELECT count(*)::int AS n FROM availability_rules');
check(afterReapply === rules, 'fingerprint changed → init() re-applies and restores the seed rows');

// ── 2. db.hit() ─────────────────────────────────────────────────────────────
console.log('\n── db.hit(): the shared counter ──');
const s1 = await a.hit('t:one', 60_000);
const s2 = await a.hit('t:one', 60_000);
const s3 = await a.hit('t:one', 60_000);
check([s1.count, s2.count, s3.count].join() === '1,2,3', `counts 1, 2, 3 (got ${s1.count}, ${s2.count}, ${s3.count})`);
check(s3.resetInMs > 59_000 && s3.resetInMs <= 60_000, `reports time left in the window (${Math.round(s3.resetInMs)} ms)`);
check((await a.hit('t:two', 60_000)).count === 1, 'a different key starts at 1');

const burst = await Promise.all(Array.from({ length: 12 }, () => a.hit('t:burst', 60_000)));
check(
  // Single-statement upserts: PGlite runs them one at a time, which is all this can show.
  [...new Set(burst.map((r) => r.count))].sort((x, y) => x - y).join() === Array.from({ length: 12 }, (_, i) => i + 1).join(),
  'twelve hits issued together count 1…12 with no duplicates and no gaps',
);

await a.hit('t:short', 200);
await a.hit('t:short', 200);
await sleep(350);
check((await a.hit('t:short', 200)).count === 1, 'the count starts over once the window has passed');

// ── 3. Two server processes, one database ───────────────────────────────────
console.log('\n── Two server instances sharing one database ──');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'clinic-pg-'));
const servers = [];
// However this script ends — a failed check, a crash — never leave servers behind.
process.on('exit', () => servers.forEach((s) => s.kill()));
const startServer = async (port) => {
  const proc = spawn('node', ['server/src/index.js'], {
    cwd: REPO,
    // stderr stays visible: a server that refuses to start says why there.
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      DATABASE_URL: URL_,
      STATE_STORE: 'database',
      PG_POOL_MAX: '2',
      SMTP_URL: '',
      UPI_ID: 'demo-clinic@upi',
      DATA_DIR: data,
      PORT: String(port),
    },
  });
  servers.push(proc);
  for (let i = 0; i < 75; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/api/health`)).ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`server on :${port} did not start`);
};

await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'); // let the servers build it themselves
const A = 4012;
const B = 4013;
// One after the other: the first builds the schema, the second must find it current.
await startServer(A);
await startServer(B);
const api = (port) => (route, init = {}) =>
  fetch(`http://localhost:${port}/api${route}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null), headers: r.headers }));
const onA = api(A);
const onB = api(B);

const health = await onB('/health');
check(health.body?.storage === 'postgres' && health.body?.database === 'up', 'both started against the same Postgres (the second found the schema current)');

// login-link allows 6 an hour per visitor. Spend them across BOTH servers.
const link = (call) => call('/account/login-link', { method: 'POST', body: JSON.stringify({ email: 'nobody@example.com' }) });
const spent = [];
for (let i = 0; i < 3; i++) spent.push((await link(onA)).status);
for (let i = 0; i < 3; i++) spent.push((await link(onB)).status);
check(spent.every((s) => s === 200), `6 sign-in-link requests split across two instances are all allowed (${spent.join(' ')})`);
const seventhA = await link(onA);
const seventhB = await link(onB);
check(seventhA.status === 429 && seventhB.status === 429, `the 7th is refused on BOTH instances (${seventhA.status}, ${seventhB.status})`);
check(Number(seventhB.headers.get('retry-after')) > 0, 'and says when to retry');
check((await q(`SELECT count(*)::int AS n FROM rate_limits WHERE key LIKE 'login-link:%'`))[0].n >= 1, 'the count is a row in the database, not a per-process variable');

// A sign-in link works once, whichever instance the second click lands on.
const { createLoginLink } = await import('../../server/src/services/auth.js');
const token = createLoginLink('patient@example.com');
const first = await onA('/account/session', { method: 'POST', body: JSON.stringify({ token }) });
const replayOnB = await onB('/account/session', { method: 'POST', body: JSON.stringify({ token }) });
const replayOnA = await onA('/account/session', { method: 'POST', body: JSON.stringify({ token }) });
check(first.status === 200 && first.body?.token, 'one-time link redeemed on instance A signs the patient in');
check(replayOnB.status === 401, `replayed on instance B → refused (${replayOnB.status})`);
check(replayOnA.status === 401, `replayed on instance A → refused (${replayOnA.status})`);

// ── Clean up ────────────────────────────────────────────────────────────────
for (const s of servers) s.kill();
await Promise.all(stores.map((s) => s.close().catch(() => {})));
await socket.stop();
await pg.close();
fs.rmSync(data, { recursive: true, force: true });

console.log(failures ? `\n${failures} Postgres check(s) failed.` : '\nAll Postgres checks passed.');
process.exit(failures ? 1 : 0);
