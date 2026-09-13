import { createJsonStore } from './db/json.js';
import { createPostgresStore } from './db/postgres.js';

/**
 * Storage lives behind this one module, so nothing else in the app knows or
 * cares where bookings are kept.
 *
 * Postgres when DATABASE_URL is set — which production requires — and a JSON
 * file otherwise, so the site still runs locally with no database to install.
 * Both adapters implement the same async interface.
 */
export const db = process.env.DATABASE_URL
  ? createPostgresStore(process.env.DATABASE_URL)
  : createJsonStore();
