/**
 * Run with:  npm test
 *
 * Starts throwaway servers itself — JSON store in a temp folder, no database,
 * no SMTP — so it can never touch real patient data, whatever server/.env says.
 * Each suite gets a fresh server because some suites deliberately exhaust the
 * rate limiter.
 *
 * Run with:  npm run test:postgres   (the --pglite flag)
 *
 * The same servers, but backed by a real Postgres engine (PGlite, in memory)
 * instead of the JSON file, with shared counters kept in the database as they
 * are on Vercel. Three suites read or write the JSON file directly, so they are
 * skipped there. Needs PGlite, which is deliberately not a dependency — the
 * first run prints the one command to install it.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PGLITE = process.argv.includes('--pglite');
// These open bookings.json themselves, which only exists with the JSON store.
const JSON_FILE_SUITES = new Set(['api', 'race', 'payment']);
const SUITES = [
  { name: 'api', file: 'api.mjs', port: 4000 },
  { name: 'race', file: 'race.mjs', port: 4000 },
  { name: 'dashboard', file: 'dashboard.mjs', port: 4000 },
  { name: 'reschedule', file: 'reschedule.mjs', port: 4000 },
  { name: 'validation', file: 'validation-parity.mjs', port: 4000 },
  { name: 'ratelimit', file: 'ratelimit.mjs', port: 4000 },
  { name: 'body', file: 'body.mjs', port: 4000 },
  { name: 'payment', file: 'payment.mjs', port: 4001, mock: true },
].filter((s) => !(PGLITE && JSON_FILE_SUITES.has(s.name)));

/** A fresh in-memory Postgres per suite, reachable over a local socket. */
async function startPglite() {
  let PGlite, btree_gist, PGLiteSocketServer;
  try {
    ({ PGlite } = await import('@electric-sql/pglite'));
    ({ btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist'));
    ({ PGLiteSocketServer } = await import('@electric-sql/pglite-socket'));
  } catch {
    console.error(
      '\n  --pglite needs PGlite, which is not installed (deliberately — it would\n' +
        '  otherwise be pulled into the production build).\n\n' +
        '      npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket\n',
    );
    process.exit(1);
  }
  const pg = await PGlite.create({ extensions: { btree_gist } });
  const socket = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1', maxConnections: 8 });
  await socket.start();
  // getServerConn() is "host:port"; the driver wants a full URL. PGlite does not
  // check the password, but the URL needs a user.
  const url = `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`;
  return { url, stop: async () => { await socket.stop(); await pg.close(); } };
}

if (!fs.existsSync(path.join(REPO, 'server/.env'))) {
  fs.copyFileSync(path.join(REPO, 'server/.env.example'), path.join(REPO, 'server/.env'));
  console.log('Created server/.env from the example.');
}

const wait = async (port) => {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://localhost:${port}/api/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server on :${port} did not start`);
};

let failed = [];
for (const s of SUITES) {
  // A server already on the port would be tested instead of ours, with stale data.
  if (await fetch(`http://localhost:${s.port}/api/health`).then(() => true, () => false)) {
    console.error(`Port ${s.port} is already in use — stop that server first.`);
    process.exit(1);
  }
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'clinic-test-'));
  const pglite = PGLITE ? await startPglite() : null;
  const env = { ...process.env, DATABASE_URL: pglite?.url ?? '', SMTP_URL: '', DATA_DIR: data, MOCKDATA: data, PORT: String(s.port),
    // `database` keeps rate limits and one-time links in Postgres, as on Vercel.
    STATE_STORE: PGLITE ? 'database' : '',
    // Every suite gets an explicit payment setup instead of whatever server/.env
    // holds. CI builds .env from .env.example, which has no UPI_ID, so without
    // this the dashboard suite ran with UPI switched off and its UPI steps failed.
    ...(s.mock
      ? { RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', UPI_ID: '' }
      : { UPI_ID: 'demo-clinic@upi' }) };
  const server = spawn('node', ['server/src/index.js'], { cwd: REPO, env, stdio: 'ignore' });
  try {
    await wait(s.port);
    console.log(`\n━━ ${s.name} ━━`);
    // Not spawnSync: that would block this process's event loop, and with --pglite
    // the in-process database lives here and has to keep answering the server.
    const status = await new Promise((resolve) =>
      spawn('node', [path.join('scripts/test', s.file)], { cwd: REPO, env, stdio: 'inherit' })
        .on('exit', (code) => resolve(code ?? 1)),
    );
    if (status !== 0) failed.push(s.name);
  } finally {
    server.kill();
    await pglite?.stop();
    fs.rmSync(data, { recursive: true, force: true });
  }
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : '\nAll suites passed.');
process.exit(failed.length ? 1 : 0);
