import pg from 'pg';

/**
 * Postgres store — used in production.
 *
 * The full booking object is kept in a JSONB column, with the few fields we
 * actually query promoted to real indexed columns. That keeps the rest of the
 * app working with exactly the same booking shape as before, while the slot
 * lookup (by date) and the admin list (by status) stay indexed.
 *
 * Works with any Postgres: Neon, Supabase, Render, or one you run yourself.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    id            TEXT PRIMARY KEY,
    booking_date  TEXT NOT NULL,
    status        TEXT NOT NULL,
    order_id      TEXT,
    data          JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS bookings_date_idx   ON bookings (booking_date);
  CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
  CREATE INDEX IF NOT EXISTS bookings_order_idx  ON bookings (order_id);
`;

/** Rows carry the booking object verbatim in `data`. */
const toBooking = (row) => (row ? row.data : null);

/** A local database is almost never running TLS; a hosted one always is. */
const isLocal = (url) => /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);

export function createPostgresStore(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    // Neon, Supabase and Render all require TLS but present certificates Node
    // will not verify against its default CA bundle. Forcing it on for a local
    // database would just fail to connect.
    ssl: isLocal(connectionString) ? false : { rejectUnauthorized: false },
    // Small on purpose: free Postgres tiers cap connections hard, and this app
    // serves one doctor's diary, not a busy API.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // A pool error outside a query (a dropped connection) is emitted here; without
  // a listener Node would treat it as unhandled and kill the process.
  pool.on('error', (err) => console.error('Postgres pool error:', err.message));

  return {
    kind: 'postgres',

    async init() {
      await pool.query(SCHEMA);
    },

    /** Cheap liveness check for /api/health. */
    async ping() {
      await pool.query('SELECT 1');
    },

    async all() {
      const { rows } = await pool.query('SELECT data FROM bookings ORDER BY created_at DESC');
      return rows.map(toBooking);
    },

    /** Bookings on one date — the hot path when rendering available slots. */
    async onDate(date) {
      const { rows } = await pool.query('SELECT data FROM bookings WHERE booking_date = $1', [date]);
      return rows.map(toBooking);
    },

    async find(id) {
      const { rows } = await pool.query('SELECT data FROM bookings WHERE id = $1', [id]);
      return toBooking(rows[0]);
    },

    async findByOrderId(orderId) {
      const { rows } = await pool.query('SELECT data FROM bookings WHERE order_id = $1', [orderId]);
      return toBooking(rows[0]);
    },

    async insert(booking) {
      await pool.query(
        `INSERT INTO bookings (id, booking_date, status, order_id, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.id, booking.date, booking.status, booking.payment?.orderId || null, booking],
      );
      return booking;
    },

    async update(id, patch) {
      // Read-modify-write inside a transaction, with the row locked, so two
      // concurrent updates cannot overwrite each other's fields.
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query('SELECT data FROM bookings WHERE id = $1 FOR UPDATE', [id]);
        if (!rows[0]) {
          await client.query('ROLLBACK');
          return null;
        }

        const updated = { ...rows[0].data, ...patch, updatedAt: new Date().toISOString() };
        await client.query(
          `UPDATE bookings
              SET data = $2, status = $3, order_id = $4, booking_date = $5, updated_at = now()
            WHERE id = $1`,
          [id, updated, updated.status, updated.payment?.orderId || null, updated.date],
        );
        await client.query('COMMIT');
        return updated;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    /**
     * Applies a patch only if the row is still in `expectedStatus`, in one
     * statement. Returns the updated booking, or null if the status had already
     * moved on.
     *
     * This is what makes confirmation exactly-once: the browser returning from
     * Checkout and the Razorpay webhook can arrive at the same moment, and
     * without an atomic check both would confirm and both would send the
     * patient a confirmation.
     *
     * `data || patch` is a shallow merge, so nested objects in the patch replace
     * their counterpart wholesale — callers pass complete sub-objects.
     */
    async updateIf(id, expectedStatus, patch) {
      const merged = JSON.stringify({ ...patch, updatedAt: new Date().toISOString() });
      const { rows } = await pool.query(
        `UPDATE bookings
            SET data       = data || $3::jsonb,
                status     = COALESCE($3::jsonb->>'status', status),
                order_id   = COALESCE($3::jsonb->'payment'->>'orderId', order_id),
                updated_at = now()
          WHERE id = $1 AND status = $2
          RETURNING data`,
        [id, expectedStatus, merged],
      );
      return toBooking(rows[0]);
    },

    async close() {
      await pool.end();
    },
  };
}
