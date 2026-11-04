/**
 * End-to-end tests. Run with:  npm run test:e2e
 *
 * Builds nothing itself: `npm run test:e2e` builds the client first, then this
 * starts the real Express server (which serves client/dist) in a sandbox — a
 * throwaway JSON store, no database, no email, no WhatsApp API, Razorpay off
 * and a demo UPI ID — so it can never touch real patients or real money.
 * The journey stops at the payment screen.
 */
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4100;
const DATA = path.join(os.tmpdir(), `clinic-e2e-${process.pid}`);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  // One worker: the journeys book real (sandbox) slots, and two at once would
  // race for the same one — which the server correctly refuses.
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'node server/src/index.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      PORT: String(PORT),
      NODE_ENV: 'test',
      DATABASE_URL: '',
      SMTP_URL: '',
      WHATSAPP_PROVIDER: '',
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: '',
      UPI_ID: 'demo-clinic@upi',
      ADMIN_TOKEN: 'e2e-token',
      DATA_DIR: DATA,
      MOCKDATA: DATA,
    },
  },
});
