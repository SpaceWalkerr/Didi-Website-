import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A tiny JSON-file store. Bookings for a solo practice are low volume, so this
 * keeps deployment to "copy the folder and run node".
 *
 * Everything goes through this module, so swapping in Postgres, SQLite or
 * Firestore later means rewriting this file only.
 */
/**
 * DATA_DIR must point at persistent storage in production — a host's own
 * filesystem is discarded on every deploy and restart, which would silently
 * erase every booking. On Render that means a mounted disk (see render.yaml);
 * the server refuses to start in production without DATA_DIR set.
 */
const DATA_DIR =
  process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
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
  // Write to a temp file first so a crash mid-write can't corrupt the store.
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export const db = {
  all() {
    return read().bookings;
  },

  find(id) {
    return read().bookings.find((b) => b.id === id) || null;
  },

  findByOrderId(orderId) {
    return read().bookings.find((b) => b.payment?.orderId === orderId) || null;
  },

  insert(booking) {
    const data = read();
    data.bookings.push(booking);
    write(data);
    return booking;
  },

  update(id, patch) {
    const data = read();
    const index = data.bookings.findIndex((b) => b.id === id);
    if (index === -1) return null;
    data.bookings[index] = { ...data.bookings[index], ...patch, updatedAt: new Date().toISOString() };
    write(data);
    return data.bookings[index];
  },
};
