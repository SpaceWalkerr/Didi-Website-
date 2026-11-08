import { config, isProduction } from './config.js';
import { db } from './db.js';
import { paymentMode } from './services/payments.js';
import { whatsappMode } from './services/whatsapp.js';
import { startReminders } from './services/reminders.js';
import { createApp } from './app.js';
import { mountClient } from './client.js';

/**
 * The long-running server: Render, local development and the test suite.
 *
 * The routes live in app.js. This file adds what only a process that stays up
 * can do — serve the built website, initialise the database once, listen on a
 * port, and run the reminder timer. On Vercel none of that applies; see
 * api/index.js.
 */
const app = createApp({ mountAfterApi: mountClient });

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
  console.log(`  WhatsApp   : ${whatsappMode()}`);
  if (whatsappMode() === 'cloud-api') startReminders();
  if (paymentMode() === 'mock') {
    console.log('               (no Razorpay keys set — payments are simulated)');
  }
  if (!isProduction && config.adminToken === 'change-me-please') {
    console.log('  WARNING    : ADMIN_TOKEN is still the default. Change it in server/.env');
  }
  console.log('');
});
