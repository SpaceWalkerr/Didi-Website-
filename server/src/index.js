import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config, isProduction } from './config.js';
import { db } from './db.js';
import { paymentMode } from './services/payments.js';
import { preflight } from './preflight.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';

// Checked before anything binds a port, so an unsafe production config fails
// the deploy rather than quietly going live.
preflight();

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

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
app.use(express.json({ limit: '100kb' }));

/**
 * Reports unhealthy when the database is unreachable, rather than 200-ing while
 * unable to take a single booking. Also the endpoint to point an uptime pinger
 * at: the query keeps a free Postgres from going idle long enough to be paused.
 */
app.get('/api/health', async (_req, res) => {
  const body = { ok: true, storage: db.kind, paymentMode: paymentMode(), time: new Date().toISOString() };

  try {
    await db.ping();
    res.json({ ...body, database: 'up' });
  } catch (err) {
    console.error('Health check: database unreachable —', err.message);
    res.status(503).json({ ...body, ok: false, database: 'down', error: 'Database unreachable.' });
  }
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);

// In production, serve the built client from the same origin.
const clientDist = path.join(here, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
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
  if (paymentMode() === 'mock') {
    console.log('               (no Razorpay keys set — payments are simulated)');
  }
  if (!isProduction && config.adminToken === 'change-me-please') {
    console.log('  WARNING    : ADMIN_TOKEN is still the default. Change it in server/.env');
  }
  console.log('');
});
