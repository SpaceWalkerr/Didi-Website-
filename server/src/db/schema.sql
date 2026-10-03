-- ════════════════════════════════════════════════════════════════════════
--  Booking schema.
--
--  Applied on every boot; every statement is idempotent, so starting the
--  server against an existing database is a no-op.
--
--  The previous single `bookings` table (one JSONB blob per booking) is
--  deliberately NOT dropped. If a deployment already has rows in it, they
--  are still there to migrate; nothing here reads or writes it.
-- ════════════════════════════════════════════════════════════════════════

-- Needed for the appointment overlap constraint further down: it lets a GiST
-- index mix a plain equality column (doctor_id) with a range column.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── Doctors ────────────────────────────────────────────────────────────
-- One row today. It exists so availability, blocks and appointments hang off
-- a real key rather than an implied single doctor, which is what makes the
-- overlap constraint correct if a second doctor is ever added.
CREATE TABLE IF NOT EXISTS doctors (
  id            SMALLSERIAL PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  qualification TEXT        NOT NULL,
  reg_no        TEXT        NOT NULL,
  council       TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Patients ───────────────────────────────────────────────────────────
-- Keyed by phone: the same person booking again is the same patient row, so
-- the doctor can see a history rather than three disconnected strangers who
-- happen to share a number.
CREATE TABLE IF NOT EXISTS patients (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL UNIQUE,
  email      TEXT,
  age        SMALLINT,
  gender     TEXT,
  language   TEXT        NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Recurring availability ─────────────────────────────────────────────
-- Seeded from shared/practice.config.js on boot. Kept in the database so the
-- admin page can eventually edit consulting hours without a redeploy.
CREATE TABLE IF NOT EXISTS availability_rules (
  id         BIGSERIAL PRIMARY KEY,
  doctor_id  SMALLINT  NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  weekday    SMALLINT  NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME      NOT NULL,
  end_time   TIME      NOT NULL,
  active     BOOLEAN   NOT NULL DEFAULT true,
  CHECK (end_time > start_time),
  UNIQUE (doctor_id, weekday, start_time, end_time)
);

-- ── One-off blocks ─────────────────────────────────────────────────────
-- The doctor marking themselves unavailable. NULL start/end means the whole
-- day, which is the common case (leave, a wedding, being ill).
CREATE TABLE IF NOT EXISTS slot_blocks (
  id         BIGSERIAL PRIMARY KEY,
  doctor_id  SMALLINT    NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  block_date DATE        NOT NULL,
  start_time TIME,
  end_time   TIME,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Either both times are set (a window) or neither is (the whole day).
  CHECK ((start_time IS NULL) = (end_time IS NULL)),
  CHECK (end_time IS NULL OR end_time > start_time)
);
CREATE INDEX IF NOT EXISTS slot_blocks_date_idx ON slot_blocks (block_date);

-- ── Appointments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               TEXT        PRIMARY KEY,           -- 8 chars, quotable on the phone
  doctor_id        SMALLINT    NOT NULL REFERENCES doctors(id),
  patient_id       BIGINT      NOT NULL REFERENCES patients(id),
  service_id       TEXT        NOT NULL,
  service_name     TEXT        NOT NULL,
  appt_date        DATE        NOT NULL,
  start_time       TIME        NOT NULL,
  duration_minutes SMALLINT    NOT NULL CHECK (duration_minutes > 0),
  status           TEXT        NOT NULL CHECK (status IN
                     ('pending','confirmed','completed','cancelled','expired','needs-attention')),
  concern          TEXT        NOT NULL,
  body_region      TEXT,                              -- carried in from the body map
  amount_paise     INTEGER     NOT NULL CHECK (amount_paise >= 0),
  currency         TEXT        NOT NULL DEFAULT 'INR',
  language         TEXT        NOT NULL DEFAULT 'en',
  consent_at       TIMESTAMPTZ,
  hold_expires_at  TIMESTAMPTZ,                       -- unpaid bookings only
  confirmed_at     TIMESTAMPTZ,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_date_idx    ON appointments (appt_date);
CREATE INDEX IF NOT EXISTS appointments_status_idx  ON appointments (status);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments (patient_id);

-- ════════════════════════════════════════════════════════════════════════
--  THE constraint that prevents double-booking.
--
--  Services are 10, 20 and 30 minutes long on a 15-minute grid, so two
--  appointments can overlap WITHOUT sharing a start time — a 30-minute slot
--  at 09:00 and a 10-minute one at 09:15 collide, and a unique index on
--  (date, start_time) would happily accept both.
--
--  This excludes any two live appointments for the same doctor whose time
--  ranges intersect at all. It is enforced by the database, so it holds no
--  matter how the requests race, how many server processes are running, or
--  whether someone inserts a row by hand.
--
--  Cancelled, expired and completed rows are excluded from the constraint,
--  which is what frees a slot again when a hold lapses.
-- ════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap
    EXCLUDE USING gist (
      doctor_id WITH =,
      tsrange(
        (appt_date + start_time),
        (appt_date + start_time + (duration_minutes * INTERVAL '1 minute'))
      ) WITH &&
    ) WHERE (status IN ('pending','confirmed','needs-attention'));
EXCEPTION
  WHEN duplicate_table THEN NULL;   -- constraint already present
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Payments ───────────────────────────────────────────────────────────
-- Separate from the appointment because one appointment can have more than
-- one payment attempt, and a refund is another row rather than a lost field.
CREATE TABLE IF NOT EXISTS payments (
  id                 BIGSERIAL PRIMARY KEY,
  appointment_id     TEXT        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  provider           TEXT        NOT NULL DEFAULT 'razorpay',
  mode               TEXT        NOT NULL,            -- 'razorpay-test' | 'razorpay-live' | 'mock'
  order_id           TEXT        UNIQUE,
  payment_id         TEXT,
  amount_paise       INTEGER     NOT NULL,
  status             TEXT        NOT NULL CHECK (status IN
                        ('created','paid','failed','cancelled','refunded')),
  signature_verified BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_appointment_idx ON payments (appointment_id);
CREATE INDEX IF NOT EXISTS payments_order_idx       ON payments (order_id);
