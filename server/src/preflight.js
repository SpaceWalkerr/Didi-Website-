import { config, isProduction } from './config.js';
import { paymentMode } from './services/payments.js';

/**
 * Refuses to start a production server that is not safe to expose.
 *
 * These are failures, not warnings, on purpose. Each one is the kind of thing
 * that looks fine in a deploy log and is discovered later by a patient:
 *
 *  - a default admin token means anyone who finds /admin can read every
 *    patient's name, phone, email and symptom summary;
 *  - simulated payments mean patients book real appointments the doctor is
 *    expected to honour, having paid nothing.
 *
 * In development none of this applies — mock payments are the point there.
 */
const DEFAULT_ADMIN_TOKEN = 'change-me-please';
const MIN_TOKEN_LENGTH = 24;

export function preflight() {
  if (!isProduction) return;

  const errors = [];

  if (!config.adminToken || config.adminToken === DEFAULT_ADMIN_TOKEN) {
    errors.push(
      'ADMIN_TOKEN is unset or still the default. The admin view exposes patient\n' +
        '    health data, so this must be a secret value.\n' +
        '    Generate one with:  node -e "console.log(crypto.randomUUID())"',
    );
  } else if (config.adminToken.length < MIN_TOKEN_LENGTH) {
    errors.push(
      `ADMIN_TOKEN is only ${config.adminToken.length} characters. Use at least ${MIN_TOKEN_LENGTH};\n` +
        '    it is the sole protection on patient health data.',
    );
  }

  // Without this, a free-tier deploy writes bookings to the container's own
  // filesystem, which is wiped on every deploy and every idle restart. The site
  // looks like it is working right up until the diary is empty and a patient
  // turns up for an appointment nobody has a record of.
  if (!process.env.DATA_DIR) {
    errors.push(
      'DATA_DIR is not set. Bookings would be written to the container\'s own\n' +
        '    filesystem, which is erased on every deploy and restart.\n' +
        '    Point it at a mounted disk (on Render: Settings -> Disks, then set\n' +
        '    DATA_DIR to the mount path). Free tiers have no disk.',
    );
  }

  if (paymentMode() === 'mock' && process.env.ALLOW_DEMO_PAYMENTS !== 'true') {
    errors.push(
      'No Razorpay keys are set, so payments would be simulated. Patients would\n' +
        '    book real appointments without paying, and the booking page would tell\n' +
        '    them so.\n' +
        '    Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or — only for a staging\n' +
        '    site nobody will book on — set ALLOW_DEMO_PAYMENTS=true.',
    );
  }

  if (errors.length) {
    console.error('\n  Refusing to start in production:\n');
    errors.forEach((message, i) => console.error(`  ${i + 1}. ${message}\n`));
    process.exit(1);
  }
}
