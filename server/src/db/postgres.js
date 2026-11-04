import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { AVAILABILITY, DOCTOR } from '../../../shared/practice.config.js';
import { EXCLUSION_VIOLATION, SlotConflictError } from './errors.js';

/**
 * Postgres store — used in production.
 *
 * Bookings are normalised across `patients`, `appointments` and `payments`,
 * but the rest of the application still works with one flat `booking` object.
 * This module is the only place that knows about the difference: it maps the
 * domain object onto the tables on the way in, and joins them back on the way
 * out. Routes and services never see a column name.
 *
 * Works with any Postgres: Neon, Supabase, Render, or one you run yourself.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');

/** The single doctor row everything hangs off. */
const DOCTOR_SLUG = 'primary';

/** A local database is almost never running TLS; a hosted one always is. */
const isLocal = (url) => /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);

const toRupees = (paise) => Math.round(paise) / 100;
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

/** "2026-09-28T00:00:00.000Z" (a DATE column) → "2026-09-28". */
const dateString = (value) =>
  value instanceof Date
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : String(value).slice(0, 10);

/** "09:00:00" → "09:00". */
const hhmm = (value) => String(value).slice(0, 5);

/**
 * One joined row → the flat booking object the rest of the app expects.
 * Shape must stay identical to what the JSON store returns.
 */
const toBooking = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    date: dateString(row.appt_date),
    time: hhmm(row.start_time),
    serviceId: row.service_id,
    serviceName: row.service_name,
    durationMinutes: row.duration_minutes,
    amount: toRupees(row.amount_paise),
    currency: row.currency,
    bodyRegion: row.body_region || null,
    patient: {
      name: row.patient_name,
      age: row.age,
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      symptoms: row.concern,
      consent: Boolean(row.consent_at),
      consentAt: row.consent_at ? row.consent_at.toISOString() : null,
    },
    payment: {
      mode: row.pay_mode,
      orderId: row.order_id,
      paymentId: row.payment_id,
      status: row.pay_status,
      signatureVerified: row.signature_verified ?? false,
    },
    language: row.language,
    doctorNotes: row.doctor_notes || null,
    followUpDate: row.follow_up_date ? dateString(row.follow_up_date) : null,
    reminderSentAt: row.reminder_sent_at ? row.reminder_sent_at.toISOString() : null,
    rescheduleCount: row.reschedule_count || 0,
    note: row.note || null,
    confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

/**
 * Appointment joined to its patient and its most recent payment attempt.
 * LATERAL rather than a plain join because an appointment can accumulate
 * several payment rows (a failure, then a success) and only the last matters.
 */
const SELECT_BOOKING = `
  SELECT a.*,
         p.name  AS patient_name, p.phone, p.email, p.age, p.gender,
         pay.mode AS pay_mode, pay.order_id, pay.payment_id,
         pay.status AS pay_status, pay.signature_verified
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    LEFT JOIN LATERAL (
      SELECT * FROM payments WHERE appointment_id = a.id ORDER BY id DESC LIMIT 1
    ) pay ON true
`;

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

  /** Cached after the first lookup — it never changes while the process lives. */
  let doctorId = null;

  async function getDoctorId(client = pool) {
    if (doctorId) return doctorId;
    const { rows } = await client.query('SELECT id FROM doctors WHERE slug = $1', [DOCTOR_SLUG]);
    doctorId = rows[0]?.id;
    if (!doctorId) throw new Error('Doctor row is missing — did init() run?');
    return doctorId;
  }

  return {
    kind: 'postgres',

    async init() {
      try {
        await pool.query(SCHEMA);
      } catch (err) {
        // btree_gist is what lets the overlap constraint mix an equality
        // column with a range. Most managed Postgres (Neon, Supabase, Render,
        // RDS) allow it, but a locked-down instance may not.
        //
        // This deliberately refuses to start rather than carrying on without
        // the constraint. Without it two patients can be sold the same
        // consultation slot, and the first anyone knows is when both join the
        // call. A site that will not boot is a far better failure than that.
        if (/btree_gist|permission denied to create extension/i.test(err.message)) {
          throw new Error(
            'Could not create the btree_gist extension, which the appointment ' +
              'overlap constraint depends on.\n' +
              '    Run this once as a superuser on your database:\n' +
              '        CREATE EXTENSION IF NOT EXISTS btree_gist;\n' +
              '    then start the app again. Neon and Supabase both allow this ' +
              'from their SQL editor.\n' +
              `    Original error: ${err.message}`,
          );
        }
        throw err;
      }

      // Seed the single doctor. Details are refreshed on every boot so editing
      // shared/practice.config.js is genuinely the only place to change them.
      const { rows } = await pool.query(
        `INSERT INTO doctors (slug, name, qualification, reg_no, council)
              VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE
              SET name = EXCLUDED.name, qualification = EXCLUDED.qualification,
                  reg_no = EXCLUDED.reg_no, council = EXCLUDED.council
           RETURNING id`,
        [DOCTOR_SLUG, DOCTOR.name, DOCTOR.qualification, DOCTOR.registrationNumber, DOCTOR.council],
      );
      doctorId = rows[0].id;

      // Seed consulting hours. ON CONFLICT DO NOTHING keeps this idempotent;
      // rows the doctor later edits in the database are left alone.
      for (const [weekday, windows] of Object.entries(AVAILABILITY)) {
        for (const [start, end] of windows) {
          await pool.query(
            `INSERT INTO availability_rules (doctor_id, weekday, start_time, end_time)
                  VALUES ($1, $2, $3, $4)
             ON CONFLICT (doctor_id, weekday, start_time, end_time) DO NOTHING`,
            [doctorId, Number(weekday), start, end],
          );
        }
      }
    },

    /** Cheap liveness check for /api/health. */
    async ping() {
      await pool.query('SELECT 1');
    },

    /**
     * Releases slots held by bookings that were never paid for.
     *
     * Called before any slot calculation. Without it the exclusion constraint
     * would keep an abandoned 15-minute hold blocking its slot permanently,
     * because the constraint has no concept of time passing.
     */
    async expireStale(now = new Date()) {
      const { rowCount } = await pool.query(
        `UPDATE appointments
            SET status = 'expired', updated_at = now()
          WHERE status = 'pending' AND hold_expires_at IS NOT NULL AND hold_expires_at < $1`,
        [now],
      );
      return rowCount;
    },

    async all() {
      const { rows } = await pool.query(`${SELECT_BOOKING} ORDER BY a.created_at DESC`);
      return rows.map(toBooking);
    },

    /** Bookings on one date — the hot path when rendering available slots. */
    async onDate(date) {
      const { rows } = await pool.query(`${SELECT_BOOKING} WHERE a.appt_date = $1`, [date]);
      return rows.map(toBooking);
    },

    async find(id) {
      const { rows } = await pool.query(`${SELECT_BOOKING} WHERE a.id = $1`, [id]);
      return toBooking(rows[0]);
    },

    async findByOrderId(orderId) {
      const { rows } = await pool.query(`${SELECT_BOOKING} WHERE pay.order_id = $1`, [orderId]);
      return toBooking(rows[0]);
    },

    /**
     * Writes a booking across all three tables in one transaction.
     *
     * If the exclusion constraint rejects the appointment, the whole
     * transaction rolls back — no orphaned patient row, no orphaned payment —
     * and a SlotConflictError is thrown for the route to turn into a 409.
     */
    async insert(booking) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const doctor = await getDoctorId(client);

        // Same phone = same patient. Their details are refreshed, because the
        // most recent booking is the most current information we have.
        const { rows: patientRows } = await client.query(
          `INSERT INTO patients (name, phone, email, age, gender, language)
                VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (phone) DO UPDATE
                SET name = EXCLUDED.name, email = EXCLUDED.email,
                    age = COALESCE(EXCLUDED.age, patients.age),
                    gender = COALESCE(EXCLUDED.gender, patients.gender),
                    language = EXCLUDED.language, updated_at = now()
             RETURNING id`,
          [
            booking.patient.name,
            booking.patient.phone,
            booking.patient.email,
            booking.patient.age,
            booking.patient.gender,
            booking.language,
          ],
        );

        await client.query(
          `INSERT INTO appointments
             (id, doctor_id, patient_id, service_id, service_name, appt_date, start_time,
              duration_minutes, status, concern, body_region, amount_paise, currency,
              language, consent_at, hold_expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            booking.id,
            doctor,
            patientRows[0].id,
            booking.serviceId,
            booking.serviceName,
            booking.date,
            booking.time,
            booking.durationMinutes,
            booking.status,
            booking.patient.symptoms,
            booking.bodyRegion || null,
            toPaise(booking.amount),
            booking.currency,
            booking.language,
            booking.patient.consentAt,
            booking.holdExpiresAt || null,
          ],
        );

        await client.query(
          `INSERT INTO payments (appointment_id, mode, order_id, amount_paise, status)
                VALUES ($1, $2, $3, $4, $5)`,
          [
            booking.id,
            booking.payment.mode,
            booking.payment.orderId,
            toPaise(booking.amount),
            booking.payment.status,
          ],
        );

        await client.query('COMMIT');
        return booking;
      } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === EXCLUSION_VIOLATION) throw new SlotConflictError();
        throw err;
      } finally {
        client.release();
      }
    },

    async update(id, patch) {
      return applyPatch(pool, id, null, patch);
    },

    /**
     * Applies a patch only if the booking is still in `expectedStatus`.
     *
     * This is what makes confirmation exactly-once: the browser returning from
     * Checkout and the Razorpay webhook can arrive at the same moment, and
     * without an atomic check both would confirm and both would send the
     * patient a confirmation. Returns null if the status had already moved on.
     */
    async updateIf(id, expectedStatus, patch) {
      return applyPatch(pool, id, expectedStatus, patch);
    },

    // ── Settings ─────────────────────────────────────────────────────────
    async getSetting(key) {
      const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
      return rows[0] ? rows[0].value : null;
    },

    async setSetting(key, value) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    },

    // ── Slot blocks ──────────────────────────────────────────────────────

    /** Blocks covering a date. A row with NULL times blocks the whole day. */
    async blocksOnDate(date) {
      const { rows } = await pool.query(
        `SELECT id, block_date, start_time, end_time, reason
           FROM slot_blocks WHERE block_date = $1 ORDER BY start_time NULLS FIRST`,
        [date],
      );
      return rows.map(toBlock);
    },

    async listBlocks(from, to) {
      const { rows } = await pool.query(
        `SELECT id, block_date, start_time, end_time, reason
           FROM slot_blocks
          WHERE block_date BETWEEN $1 AND $2
          ORDER BY block_date, start_time NULLS FIRST`,
        [from, to],
      );
      return rows.map(toBlock);
    },

    async addBlock({ date, start = null, end = null, reason = null }) {
      const doctor = await getDoctorId();
      const { rows } = await pool.query(
        `INSERT INTO slot_blocks (doctor_id, block_date, start_time, end_time, reason)
              VALUES ($1, $2, $3, $4, $5)
           RETURNING id, block_date, start_time, end_time, reason`,
        [doctor, date, start, end, reason],
      );
      return toBlock(rows[0]);
    },

    async removeBlock(id) {
      const { rowCount } = await pool.query('DELETE FROM slot_blocks WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async close() {
      await pool.end();
    },
  };
}

const toBlock = (row) =>
  row && {
    id: String(row.id),
    date: dateString(row.block_date),
    start: row.start_time ? hhmm(row.start_time) : null,
    end: row.end_time ? hhmm(row.end_time) : null,
    reason: row.reason || null,
    wholeDay: !row.start_time,
  };

/**
 * Shared body of update() and updateIf().
 *
 * A patch is the flat booking shape, so it is translated back into the two
 * tables it actually spans. Both statements run in one transaction: a patch
 * that confirms a booking and marks its payment paid must not half-apply.
 *
 * `expectedStatus` of null means an unconditional update.
 */
async function applyPatch(pool, id, expectedStatus, patch) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sets = ['updated_at = now()'];
    const values = [id];
    const add = (column, value) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (patch.status !== undefined) add('status', patch.status);
    if (patch.note !== undefined) add('note', patch.note);
    if (patch.confirmedAt !== undefined) add('confirmed_at', patch.confirmedAt);
    if (patch.bodyRegion !== undefined) add('body_region', patch.bodyRegion);
    if (patch.doctorNotes !== undefined) add('doctor_notes', patch.doctorNotes);
    if (patch.followUpDate !== undefined) add('follow_up_date', patch.followUpDate);
    if (patch.reminderSentAt !== undefined) add('reminder_sent_at', patch.reminderSentAt);
    if (patch.date !== undefined) add('appt_date', patch.date);
    if (patch.time !== undefined) add('start_time', patch.time);
    if (patch.rescheduleCount !== undefined) add('reschedule_count', patch.rescheduleCount);
    if (patch.holdExpiresAt !== undefined) add('hold_expires_at', patch.holdExpiresAt);
    // Clearing the hold on confirmation stops the expiry sweep from ever
    // touching a booking that has actually been paid for.
    if (patch.status === 'confirmed') sets.push('hold_expires_at = NULL');

    let where = 'id = $1';
    if (expectedStatus !== null) {
      values.push(expectedStatus);
      where += ` AND status = $${values.length}`;
    }

    const { rows } = await client.query(
      `UPDATE appointments SET ${sets.join(', ')} WHERE ${where} RETURNING id`,
      values,
    );

    // Either the booking is gone, or its status moved on before we got here.
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    if (patch.payment) {
      await client.query(
        `UPDATE payments
            SET order_id = COALESCE($2, order_id),
                payment_id = COALESCE($3, payment_id),
                status = COALESCE($4, status),
                signature_verified = COALESCE($5, signature_verified),
                updated_at = now()
          WHERE id = (SELECT id FROM payments WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1)`,
        [
          id,
          patch.payment.orderId ?? null,
          patch.payment.paymentId ?? null,
          patch.payment.status ?? null,
          patch.payment.signatureVerified ?? null,
        ],
      );
    }

    await client.query('COMMIT');

    const { rows: fresh } = await client.query(`${SELECT_BOOKING} WHERE a.id = $1`, [id]);
    return toBooking(fresh[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    // Moving a booking onto a taken slot trips the same no-overlap constraint as inserting one.
    if (err.code === EXCLUSION_VIOLATION) throw new SlotConflictError();
    throw err;
  } finally {
    client.release();
  }
}
