import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * JSON-file store, used for local development so the site runs with no cloud
 * dependency. Production uses Postgres — see ./postgres.js.
 *
 * The methods are async only to match the Postgres adapter's interface; the
 * work itself is synchronous.
 */
const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bookings.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { bookings: [] };
    throw err;
  }
}

function write(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // Write to a temp file first so a crash mid-write cannot corrupt the store.
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export function createJsonStore() {
  return {
    kind: 'json',

    async init() {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    },

    /** Matches the Postgres adapter's interface; reads the file to prove it parses. */
    async ping() {
      read();
    },

    async all() {
      return read().bookings;
    },

    /** Bookings on one date — the hot path when rendering available slots. */
    async onDate(date) {
      return read().bookings.filter((b) => b.date === date);
    },

    async find(id) {
      return read().bookings.find((b) => b.id === id) || null;
    },

    async findByOrderId(orderId) {
      return read().bookings.find((b) => b.payment?.orderId === orderId) || null;
    },

    async insert(booking) {
      const data = read();
      data.bookings.push(booking);
      write(data);
      return booking;
    },

    async update(id, patch) {
      const data = read();
      const index = data.bookings.findIndex((b) => b.id === id);
      if (index === -1) return null;
      data.bookings[index] = {
        ...data.bookings[index],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      write(data);
      return data.bookings[index];
    },

    async close() {},
  };
}
