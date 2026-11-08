import { db } from '../server/src/db.js';
import { createApp } from '../server/src/app.js';

/**
 * The Vercel entry point: the whole API as one serverless function.
 *
 * vercel.json rewrites every /api/* request here, and Express then routes it
 * exactly as it does on a long-running server. The website itself (client/dist)
 * is served by Vercel's CDN and never reaches this function.
 *
 * Nothing else may live in this folder: every file in api/ becomes a function.
 */
const app = createApp();

/**
 * Makes sure the schema exists before the first request is served. Runs once per
 * function instance and is memoised, so concurrent first requests share one
 * check. A failure is not memoised — the next request retries — so a database
 * that was briefly unreachable at cold start does not poison the instance.
 *
 * In steady state this is a single cheap query; see init() in db/postgres.js.
 */
let ready = null;
const ensureReady = () => {
  ready ??= db.init().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
};

export default async function handler(req, res) {
  try {
    await ensureReady();
  } catch (err) {
    console.error('Database not ready:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Service temporarily unavailable. Please try again.' }));
    return;
  }
  return app(req, res);
}
