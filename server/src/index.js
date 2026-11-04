import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config, isProduction } from './config.js';
import { db } from './db.js';
import { paymentMode } from './services/payments.js';
import { whatsappMode } from './services/whatsapp.js';
import { startReminders } from './services/reminders.js';
import { preflight } from './preflight.js';
import { rateLimit } from './middleware/rateLimit.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import accountRouter from './routes/account.js';

// Checked before anything binds a port, so an unsafe production config fails
// the deploy rather than quietly going live.
preflight();

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

/*
 * Gzip everything.
 *
 * This app serves its own JavaScript and CSS in the single-service Render
 * deployment, and Express does not compress by default — so the bundle went
 * out as ~360 KB of uncompressed text on every first visit. Lighthouse put the
 * saving at 248 KiB, which on a mobile connection in India is the difference
 * between a fast page and a slow one.
 *
 * Mounted first so it wraps every later response, API JSON included.
 */
app.use(compression());

// Baseline security headers. No CSP: Razorpay Checkout loads scripts and frames
// from several of its own origins, and a wrong allowlist would break payments.
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...(isProduction && { 'Strict-Transport-Security': 'max-age=15552000' }),
  });
  next();
});

// When the client is served from this same origin the browser sends no Origin
// header and CORS never applies; the list only matters for a split deployment.
app.use(
  cors({
    origin(origin, callback) {
      // `false` simply omits the CORS headers, so the browser blocks the read.
      // Throwing here instead would turn every scanner and stray request into a
      // 500 with a stack trace in the logs.
      callback(null, !origin || config.clientOrigins.includes(origin));
    },
    credentials: false,
  }),
);
// Razorpay signs the raw request bytes, so this one route must not be parsed
// into an object first. Mounted before express.json so it wins for that path.
app.use('/api/payments/webhook', express.raw({ type: '*/*', limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));

/**
 * Reports unhealthy when the database is unreachable, rather than 200-ing while
 * unable to take a single booking. Also the endpoint to point an uptime pinger
 * at: the query keeps a free Postgres from going idle long enough to be paused.
 */
app.get('/api/health', async (_req, res) => {
  const body = {
    ok: true,
    storage: db.kind,
    paymentMode: paymentMode(),
    // Which WhatsApp path is live, so the deployed mode is visible without
    // reading environment variables off the host.
    whatsapp: whatsappMode(),
    time: new Date().toISOString(),
  };

  try {
    await db.ping();
    res.json({ ...body, database: 'up' });
  } catch (err) {
    console.error('Health check: database unreachable —', err.message);
    res.status(503).json({ ...body, ok: false, database: 'down', error: 'Database unreachable.' });
  }
});

/*
 * Rate limits, tightest first.
 *
 * `trust proxy` matters here: on Render, Vercel and similar the socket address
 * is the load balancer's, so without it every visitor would share one bucket
 * and the first busy minute would lock out the whole internet. One hop is what
 * these platforms put in front of the app.
 */
app.set('trust proxy', 1);

/*
 * Creating a booking holds a real slot and costs a Razorpay call, so it is the
 * one endpoint worth limiting hard.
 *
 * Twelve an hour, not six: several patients legitimately share one IP — a
 * family booking one after another, a household, or anyone behind carrier-grade
 * NAT, which is most mobile users in India. A limit tuned to a single person
 * turns into a wall for a mother booking for three children. Twelve still caps
 * a squatter at twelve held slots an hour, which the 15-minute hold then
 * releases anyway.
 */
const createBookingLimit = rateLimit({ name: 'booking-create', windowMs: 60 * 60 * 1000, max: 12 });
// Reading slots is cheap and legitimately repeated as someone browses days.
const readLimit = rateLimit({ name: 'read', windowMs: 60 * 1000, max: 120 });
// Signature-checking endpoints: enough for genuine retries, not for grinding.
const paymentLimit = rateLimit({ name: 'payment', windowMs: 60 * 1000, max: 20 });
// The only thing between a guessed token and every patient's health data.
const adminLimit = rateLimit({ name: 'admin', windowMs: 15 * 60 * 1000, max: 30 });

// Creating a booking is limited hard; browsing slots on the same prefix is not.
app.use(
  '/api/bookings',
  (req, res, next) =>
    req.method === 'POST' && req.path === '/'
      ? createBookingLimit(req, res, next)
      : readLimit(req, res, next),
  bookingsRouter,
);

/*
 * The webhook is exempt. It is Razorpay's servers retrying on our behalf, from
 * their IPs, and a 429 there means a paid booking never gets confirmed. It is
 * authenticated by HMAC signature, which is a far stronger gate than an IP
 * counter anyway.
 */
app.use(
  '/api/payments',
  (req, res, next) => (req.path === '/webhook' ? next() : paymentLimit(req, res, next)),
  paymentsRouter,
);

app.use('/api/admin', adminLimit, adminRouter);

// Sign-in links: few per hour, because each one sends an email.
const loginLinkLimit = rateLimit({ name: 'login-link', windowMs: 60 * 60 * 1000, max: 6 });
const accountLimit = rateLimit({ name: 'account', windowMs: 60 * 1000, max: 60 });
app.use(
  '/api/account',
  (req, res, next) => (req.path === '/login-link' ? loginLinkLimit(req, res, next) : accountLimit(req, res, next)),
  accountRouter,
);

// In production, serve the built client from the same origin.
const clientDist = path.join(here, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  // Vite fingerprints everything under /assets, so it can be cached forever.
  app.use(
    '/assets',
    express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }),
  );
  app.use(express.static(clientDist));
  // Real client routes get the app; anything else gets the same app shell but
  // a true 404, so search engines do not index junk URLs as pages.
  const CLIENT_ROUTES = /^\/(about|services|faq|book|contact|privacy|terms|refund|account|admin)?\/?$|^\/confirmation\/[^/]+\/?$/;
  const PRIVATE_ROUTES = /^\/(book|account|admin|confirmation\/.*)$/;
  app.get(/^(?!\/api).*/, (req, res) =>
    res.set(PRIVATE_ROUTES.test(req.path) ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}).status(CLIENT_ROUTES.test(req.path) ? 200 : 404).sendFile(path.join(clientDist, 'index.html')),
  );
}

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Client mistakes (malformed JSON, oversized body) are 4xx, not our fault.
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.type === 'entity.too.large' ? 'Request too large.' : 'Invalid request.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

// Creates the bookings table if it does not exist. Awaited before listening so
// the first request cannot arrive before the schema is there.
try {
  await db.init();
} catch (err) {
  console.error('\n  Could not reach the database:', err.message, '\n');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`\n  Server ready on http://localhost:${config.port}`);
  console.log(`  Storage    : ${db.kind}`);
  console.log(`  Payments   : ${paymentMode()}`);
  console.log(`  WhatsApp   : ${whatsappMode()}`);
  if (whatsappMode() === 'cloud-api') startReminders();
  if (paymentMode() === 'mock') {
    console.log('               (no Razorpay keys set — payments are simulated)');
  }
  if (!isProduction && config.adminToken === 'change-me-please') {
    console.log('  WARNING    : ADMIN_TOKEN is still the default. Change it in server/.env');
  }
  console.log('');
});
