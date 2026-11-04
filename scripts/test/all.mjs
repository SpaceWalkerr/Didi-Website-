/**
 * Run with:  npm test
 *
 * Starts throwaway servers itself — JSON store in a temp folder, no database,
 * no SMTP — so it can never touch real patient data, whatever server/.env says.
 * Each suite gets a fresh server because some suites deliberately exhaust the
 * rate limiter.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SUITES = [
  { name: 'api', file: 'api.mjs', port: 4000 },
  { name: 'race', file: 'race.mjs', port: 4000 },
  { name: 'dashboard', file: 'dashboard.mjs', port: 4000 },
  { name: 'reschedule', file: 'reschedule.mjs', port: 4000 },
  { name: 'payment', file: 'payment.mjs', port: 4001, mock: true },
];

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
  const env = { ...process.env, DATABASE_URL: '', SMTP_URL: '', DATA_DIR: data, MOCKDATA: data, PORT: String(s.port),
    ...(s.mock && { RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', UPI_ID: '' }) };
  const server = spawn('node', ['server/src/index.js'], { cwd: REPO, env, stdio: 'ignore' });
  try {
    await wait(s.port);
    console.log(`\n━━ ${s.name} ━━`);
    const r = spawnSync('node', [path.join('scripts/test', s.file)], { cwd: REPO, env, stdio: 'inherit' });
    if (r.status !== 0) failed.push(s.name);
  } finally {
    server.kill();
    fs.rmSync(data, { recursive: true, force: true });
  }
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : '\nAll suites passed.');
process.exit(failed.length ? 1 : 0);
