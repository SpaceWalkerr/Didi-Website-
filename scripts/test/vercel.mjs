/**
 * Run with:  npm run test:vercel
 *
 * Runs api/index.js — the serverless entry point — through Vercel's own Node
 * runtime (the dev server that ships inside @vercel/node), against a real
 * Postgres engine (PGlite, in memory), with VERCEL=1 set so the app takes the
 * same code paths it takes in production.
 *
 * Vercel's runtime wraps each request: it reads the body up front, replays it,
 * and bolts helpers onto the request and response (res.status, res.json, a lazy
 * req.body). Those can break an Express app in subtle ways — a webhook signature
 * computed over re-serialised JSON, a body parser that finds the stream already
 * drained — so everything is run twice, with the helpers on (the default) and
 * off (NODEJS_HELPERS=0), and must behave the same both times.
 *
 * It cannot show vercel.json routing, the CDN, Cron or waitUntil: those exist
 * only on Vercel. See "After deploying" in DEPLOY.md for the checks that cover
 * them.
 *
 * @vercel/node and PGlite are deliberately not dependencies, to keep them out of
 * the production install. Install them TOGETHER — npm removes unsaved packages
 * the next time it installs anything:
 *
 *     npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket @vercel/node@30.0.0
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);

let PGlite, btree_gist, PGLiteSocketServer, devServer;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
  ({ btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist'));
  ({ PGLiteSocketServer } = await import('@electric-sql/pglite-socket'));
  devServer = path.join(path.dirname(require.resolve('@vercel/node')), 'dev-server.mjs');
} catch {
  console.log(
    '\n  This test needs PGlite and @vercel/node, which are not installed\n' +
      '  (deliberately — they would otherwise be pulled into the production build).\n\n' +
      '      npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket @vercel/node@30.0.0\n\n' +
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

const WEBHOOK_SECRET = 'whsec_test_0123456789abcdef';
const CRON_SECRET = 'cron-secret-0123456789';
const ADMIN_TOKEN = 'a-test-admin-token-of-sufficient-length';
const ADMIN_EMAIL = 'test-admin@example.com';

const children = [];
process.on('exit', () => children.forEach((c) => c.kill()));

async function run(helpersOn, port) {
  console.log(`\n━━ Vercel runtime, request helpers ${helpersOn ? 'ON (default)' : 'OFF (NODEJS_HELPERS=0)'} ━━`);

  const pg = await PGlite.create({ extensions: { btree_gist } });
  const socket = new PGLiteSocketServer({ db: pg, port: 0, host: '127.0.0.1', maxConnections: 4 });
  await socket.start();
  const dbUrl = `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`;

  const proc = spawn(process.execPath, [devServer], {
    cwd: REPO,
    // stderr stays visible: if the function cannot load, this is where it says so.
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      VERCEL: '1',
      // Relative to cwd, which is how the runtime resolves it.
      VERCEL_DEV_ENTRYPOINT: 'api/index.js',
      VERCEL_DEV_CONFIG: '{}',
      VERCEL_DEV_BUILD_ENV: JSON.stringify(helpersOn ? {} : { NODEJS_HELPERS: '0' }),
      VERCEL_DEV_PORT: String(port),
      DATABASE_URL: dbUrl,
      PG_POOL_MAX: '2',
      SMTP_URL: '',
      UPI_ID: 'demo-clinic@upi',
      ADMIN_TOKEN,
      ADMIN_EMAIL,
      SESSION_SECRET: 'vercel-test-session-secret',
      RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      CRON_SECRET,
      // Must be empty here: a stray value in the developer's shell would hide
      // the very thing being tested (that the Cloudflare header is ignored).
      CLIENT_IP_HEADER: '',
      STATE_STORE: '',
    },
  });
  children.push(proc);

  const call = async (route, init = {}) => {
    const r = await fetch(`http://127.0.0.1:${port}${route}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    return { status: r.status, body, text, headers: r.headers };
  };

  try {
    // The first request pays for loading the function and building the schema.
    let health;
    for (let i = 0; i < 100; i++) {
      health = await call('/api/health').catch(() => null);
      if (health?.status === 200) break;
      await sleep(250);
    }
    check(health?.status === 200 && health.body?.storage === 'postgres', 'function loads, builds the schema on first request, reports Postgres');
    check(health?.headers.get('x-content-type-options') === 'nosniff', 'Express security headers survive Vercel\'s response wrapper');

    // ── Client IP ──────────────────────────────────────────────────────────
    // On Vercel nothing sits in front that overwrites cf-connecting-ip, so a
    // caller can write it. It must not buy a fresh allowance.
    const statuses = [];
    for (let i = 0; i < 7; i++) {
      const r = await call('/api/account/login-link', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': `203.0.113.${i + 1}` },
        body: JSON.stringify({ email: 'nobody@example.com' }),
      });
      statuses.push(r.status);
    }
    check(
      statuses.slice(0, 6).every((s) => s === 200) && statuses[6] === 429,
      `a forged CF-Connecting-IP does not reset the allowance: 6 allowed, 7th refused (${statuses.join(' ')})`,
    );

    // ── Bodies ─────────────────────────────────────────────────────────────
    const wrongPassword = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_EMAIL, password: 'nope' }) });
    const rightPassword = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_TOKEN }) });
    check(wrongPassword.status === 401, 'JSON body parsed: wrong password → 401');
    check(rightPassword.status === 200 && typeof rightPassword.body?.token === 'string', 'JSON body parsed: right password → session token');

    const overview = await call('/api/admin/overview', { headers: { 'x-admin-token': rightPassword.body?.token || '' } });
    check(overview.status === 200, 'the session token works against Postgres-backed routes');

    const malformed = await call('/api/admin/login', { method: 'POST', body: '{ this is not json' });
    check(malformed.status === 400, `malformed JSON → 400, not 500 (got ${malformed.status})`);

    // ── Razorpay webhook: the signature covers the exact bytes ──────────────
    // Pretty-printed and with a non-ASCII character, so that re-serialising the
    // parsed object (what a body helper would hand over) cannot reproduce it.
    const payload = JSON.stringify(
      { event: 'payment.captured', note: 'Rāhul – café', payload: { payment: { entity: { id: 'pay_test', order_id: 'order_does_not_exist' } } } },
      null,
      2,
    );
    const sign = (text) => crypto.createHmac('sha256', WEBHOOK_SECRET).update(text).digest('hex');
    const hook = (text, signature) =>
      call('/api/payments/webhook', { method: 'POST', headers: signature ? { 'x-razorpay-signature': signature } : {}, body: text });

    const good = await hook(payload, sign(payload));
    check(good.status === 200 && good.body?.ignored === 'unknown order', `a correctly signed webhook is accepted (${good.status} ${good.text.slice(0, 60)})`);
    const tampered = await hook(payload + ' ', sign(payload));
    check(tampered.status === 400, 'the same signature on a body changed by one byte is rejected');
    const unsigned = await hook(payload, null);
    check(unsigned.status === 400, 'no signature is rejected');

    // ── Cron ───────────────────────────────────────────────────────────────
    const cronNone = await call('/api/cron/reminders');
    const cronWrong = await call('/api/cron/reminders', { headers: { Authorization: 'Bearer not-the-secret-at-all' } });
    const cronOk = await call('/api/cron/reminders', { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
    check(cronNone.status === 401 && cronWrong.status === 401, 'cron endpoint refuses a missing or wrong secret');
    check(cronOk.status === 200 && cronOk.body?.sent === 0, 'and accepts Vercel Cron\'s Bearer secret');

    const unknown = await call('/api/nope');
    check(unknown.status === 404 && unknown.body?.error, 'unknown API paths get a JSON 404');
  } finally {
    proc.kill();
    await sleep(200);
    await socket.stop().catch(() => {});
    await pg.close().catch(() => {});
  }
}

await run(true, 4021);
await run(false, 4022);

console.log(failures ? `\n${failures} Vercel runtime check(s) failed.` : '\nAll Vercel runtime checks passed.');
process.exit(failures ? 1 : 0);
