import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config, isProduction } from './config.js';
import { db } from './db.js';
import { paymentMode } from './services/payments.js';
import { whatsappMode } from './services/whatsapp.js';
import { preflight } from './preflight.js';
import { rateLimit } from './middleware/rateLimit.js';
import { jsonBody, rawBody } from './middleware/body.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import accountRouter from './routes/account.js';
import cronRouter from './routes/cron.js';

/**
 * Builds the Express app — routes and middleware, nothing else. It does not
 * listen, does not touch the database and does not serve the website, so the
 * same app can be started two ways:
 *
 *  · server/src/index.js — a long-running Node server (Render, local dev, the
 *    tests). Initialises the database, serves the built website, listens.
 *  · api/index.js — a Vercel serverless function. Vercel serves the website from
 *    its CDN and calls this app once per request.
 *
 * @param mountAfterApi  A function that adds routes after the API's own — used by
 *                       index.js to serve the built website. It is passed in
 *                       rather than imported here on purpose: this file is part
 *                       of the Vercel function, and importing the static-file
 *                       code would make Vercel bundle the whole of client/dist
 *                       into it.
 */
export function createApp({ mountAfterApi = null } = {}) {
  // Checked before anything can serve a request, so an unsafe production config
  // fails the deploy rather than quietly going live.
  preflight();

  const app = express();

  /*
   * Gzip everything.
   *
   * On a long-running server this app serves its own JavaScript and CSS, and
   * Express does not compress by default — so the bundle went out as ~360 KB of
   * uncompressed text on every first visit. Lighthouse put the saving at
   * 248 KiB, which on a mobile connection in India is the difference between a
   * fast page and a slow one. (On Vercel the CDN compresses static files; this
   * still covers the API's JSON.)
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
  // into an object first. Mounted before jsonBody so it wins for that path.
  // (Our own readers rather than express.json/raw — see middleware/body.js for
  // why they cannot be used on Vercel.)
  const BODY_LIMIT = 100 * 1024;
  app.use('/api/payments/webhook', rawBody({ limit: BODY_LIMIT }));
  app.use(jsonBody({ limit: BODY_LIMIT }));

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
   *
   * `shared: true` keeps the count in the database on Vercel, where requests are
   * spread over many instances (see services/shared-state.js). It is set on the
   * limits that guard something; browsing slots is cheap and stays per-instance.
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
  const createBookingLimit = rateLimit({ name: 'booking-create', windowMs: 60 * 60 * 1000, max: 12, shared: true });
  // Reading slots is cheap and legitimately repeated as someone browses days.
  const readLimit = rateLimit({ name: 'read', windowMs: 60 * 1000, max: 120 });
  // Signature-checking endpoints: enough for genuine retries, not for grinding.
  const paymentLimit = rateLimit({ name: 'payment', windowMs: 60 * 1000, max: 20, shared: true });
  // The only thing between a guessed token and every patient's health data.
  const adminLimit = rateLimit({ name: 'admin', windowMs: 15 * 60 * 1000, max: 30, shared: true });

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
  const loginLinkLimit = rateLimit({ name: 'login-link', windowMs: 60 * 60 * 1000, max: 6, shared: true });
  const accountLimit = rateLimit({ name: 'account', windowMs: 60 * 1000, max: 60 });
  app.use(
    '/api/account',
    (req, res, next) => (req.path === '/login-link' ? loginLinkLimit(req, res, next) : accountLimit(req, res, next)),
    accountRouter,
  );

  // Called by Vercel Cron, not by browsers; authenticated by CRON_SECRET.
  app.use('/api/cron', cronRouter);

  // Only on a long-running server: it is what serves the website there. It must
  // come after the API routes (it answers every other GET) and before the
  // fallbacks below.
  mountAfterApi?.(app);

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Client mistakes (malformed JSON, oversized body) are 4xx, not our fault.
    // `statusCode` is what Vercel's request helpers set on a body they could not
    // parse; `status` is what Express's own body parsers set.
    const status = err.status ?? err.statusCode;
    if (status >= 400 && status < 500) {
      return res.status(status).json({ error: err.type === 'entity.too.large' ? 'Request too large.' : 'Invalid request.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
