import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SlotConflictError } from './errors.js';

/**
 * JSON-file store, used for local development so the site runs with no cloud
 * dependency. Production uses Postgres — see ./postgres.js, and note that
 * preflight.js refuses to start a production server without DATABASE_URL.
 *
 * The methods are async only to match the Postgres adapter's interface; the
 * work itself is synchronous, which is also what makes the overlap check in
 * `insert` safe here: Node runs the read, the check and the write with no
 * await between them, so nothing can interleave within this process.
 *
 * That is NOT equivalent to the database-level exclusion constraint Postgres
 * enforces. It holds for one dev process and would not survive two.
 */
const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bookings.json');

const EMPTY = { bookings: [], blocks: [], nextBlockId: 1, settings: {} };

function read() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...EMPTY };
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

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Statuses that occupy a slot — mirrors the WHERE clause of the SQL constraint. */
const LIVE = ['pending', 'confirmed', 'needs-attention'];

/** Do two appointments' time ranges intersect? Mirrors `tsrange && tsrange`. */
const overlaps = (a, b) => {
  if (a.date !== b.date) return false;
  const aStart = toMinutes(a.time);
  const bStart = toMinutes(b.time);
  return aStart < bStart + b.durationMinutes && bStart < aStart + a.durationMinutes;
};

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

    /** Counterpart to the Postgres sweep — releases unpaid holds that lapsed. */
    async expireStale(now = new Date()) {
      const data = read();
      let changed = 0;
      for (const booking of data.bookings) {
        if (
          booking.status === 'pending' &&
          booking.holdExpiresAt &&
          new Date(booking.holdExpiresAt) < now
        ) {
          booking.status = 'expired';
          booking.updatedAt = new Date().toISOString();
          changed += 1;
        }
      }
      if (changed) write(data);
      return changed;
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

      // Same rule the database enforces in production, so a slot conflict
      // behaves identically in development rather than only showing up live.
      const clash = data.bookings.some((b) => LIVE.includes(b.status) && overlaps(b, booking));
      if (clash) throw new SlotConflictError();

      data.bookings.push(booking);
      write(data);
      return booking;
    },

    async update(id, patch) {
      return applyPatch(id, null, patch);
    },

    /** Conditional counterpart to the Postgres adapter's atomic update. */
    async updateIf(id, expectedStatus, patch) {
      return applyPatch(id, expectedStatus, patch);
    },

    // ── Settings ─────────────────────────────────────────────────────────

    async getSetting(key) {
      return read().settings?.[key] ?? null;
    },

    async setSetting(key, value) {
      const data = read();
      data.settings = { ...(data.settings || {}), [key]: value };
      write(data);
    },

    // ── Slot blocks ──────────────────────────────────────────────────────

    async blocksOnDate(date) {
      return read().blocks.filter((b) => b.date === date);
    },

    async listBlocks(from, to) {
      return read()
        .blocks.filter((b) => b.date >= from && b.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date) || String(a.start).localeCompare(String(b.start)));
    },

    async addBlock({ date, start = null, end = null, reason = null }) {
      const data = read();
      const block = {
        id: String(data.nextBlockId),
        date,
        start,
        end,
        reason,
        wholeDay: !start,
      };
      data.nextBlockId += 1;
      data.blocks.push(block);
      write(data);
      return block;
    },

    async removeBlock(id) {
      const data = read();
      const before = data.blocks.length;
      data.blocks = data.blocks.filter((b) => b.id !== String(id));
      if (data.blocks.length === before) return false;
      write(data);
      return true;
    },

    async close() {},
  };
}

function applyPatch(id, expectedStatus, patch) {
  const data = read();
  const index = data.bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;
  if (expectedStatus !== null && data.bookings[index].status !== expectedStatus) return null;

  const current = data.bookings[index];
  const updated = {
    ...current,
    ...patch,
    // A payment patch replaces the sub-object wholesale, matching the
    // Postgres adapter's COALESCE-per-field behaviour closely enough.
    payment: patch.payment ? { ...current.payment, ...patch.payment } : current.payment,
    updatedAt: new Date().toISOString(),
  };
  // Confirmed bookings are no longer on hold, so the sweep must skip them.
  if (patch.status === 'confirmed') updated.holdExpiresAt = null;

  data.bookings[index] = updated;
  write(data);
  return updated;
}
