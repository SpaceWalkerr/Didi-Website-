import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  AVAILABILITY as SHARED_AVAILABILITY,
  BOOKING_RULES as SHARED_BOOKING_RULES,
  CONTACT,
  DOCTOR,
  SERVICES as SHARED_SERVICES,
} from '../../shared/practice.config.js';

/**
 * Load server/.env explicitly rather than via `dotenv/config`, which resolves
 * relative to the current working directory. The Dockerfile and DEPLOY.md both
 * start the app as `node server/src/index.js` from the repo root, where a bare
 * import would look for ./.env and silently find nothing — so the server would
 * boot with no configuration at all and blame a missing ADMIN_TOKEN.
 *
 * In production the real values come from the host's own secrets; dotenv is a
 * no-op when the file is absent.
 */
dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'),
});

/**
 * Single source of truth for the practice. Everything a non-developer would
 * need to change (name, fees, clinic hours) lives here or in client/src/config.js.
 */
export const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT || 4000),
  isProduction,
  /**
   * Allowed browser origins, comma-separated. More than one matters when the
   * client is hosted separately from the API — the SPA on Vercel, this server
   * on Render — and for Vercel's per-branch preview URLs.
   */
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminToken: process.env.ADMIN_TOKEN || 'change-me-please',

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    // Set in the Razorpay dashboard when creating the webhook. Distinct from
    // the API key secret above, and used only to verify webhook signatures.
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    /** True once real money can move — live keys rather than test keys. */
    get isLive() {
      return this.keyId.startsWith('rzp_live_');
    },
    // Mock mode lets the whole booking flow run before the doctor's
    // Razorpay account exists. No money moves, nothing is called externally.
    get enabled() {
      return Boolean(this.keyId && this.keySecret);
    },
  },

  notify: {
    emailFrom: process.env.NOTIFY_EMAIL_FROM || 'clinic@example.com',
    smsSender: process.env.NOTIFY_SMS_SENDER || 'DRCLNC',
  },
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Practice facts come from /shared/practice.config.js, which the browser app
 *  imports too. One file to edit — and because the server reads it directly,
 *  it stays the authority on price and duration. A patched client that posts
 *  its own price is simply ignored: the amount charged is looked up here.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Services offered. `price` is in rupees; Razorpay works in paise. */
export const SERVICES = SHARED_SERVICES;

export const getService = (id) => SERVICES.find((s) => s.id === id);

/**
 * Consulting hours in IST, keyed by day of week (0 = Sunday).
 * Each entry is a [start, end) window in 24h "HH:mm".
 */
export const AVAILABILITY = SHARED_AVAILABILITY;

export const BOOKING_RULES = SHARED_BOOKING_RULES;

/**
 * Practice details used in confirmation messages and the WhatsApp join link.
 */
export const PRACTICE = {
  doctorName: DOCTOR.name,
  /**
   * The name in each published script, so a message written in Hindi or Punjabi
   * does not switch to Latin halfway through. Falls back to doctorName.
   */
  doctorNameByLanguage: {
    hi: 'डॉ. रिचा रानी',
    pa: 'ਡਾ. ਰਿਚਾ ਰਾਣੀ',
    ru: 'Д-р Рича Рани',
  },
  qualification: DOCTOR.qualification,
  whatsappNumber: CONTACT.whatsappNumber,
  email: CONTACT.email,
};
