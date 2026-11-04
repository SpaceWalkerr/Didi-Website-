import crypto from 'node:crypto';
import { config, PRACTICE } from '../config.js';

/**
 * Signed, expiring tokens, with no session table.
 *
 * A token is `base64url(payload).base64url(hmac)`. Nothing is stored, so there
 * is no session table to migrate, and every token dies on its own `exp`.
 * The signing key is derived from the admin credentials, so changing
 * ADMIN_TOKEN / ADMIN_PASSWORD (or setting SESSION_SECRET) signs everyone out.
 *
 * Roles:
 *   admin   — the doctor, after email + password
 *   link    — a single-use sign-in link emailed to a patient (15 minutes)
 *   patient — a patient's dashboard session (30 days)
 */
const key = () =>
  process.env.SESSION_SECRET ||
  crypto
    .createHash('sha256')
    .update(`clinic-session|${config.adminToken}|${process.env.ADMIN_PASSWORD || ''}`)
    .digest();

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sign = (body) => crypto.createHmac('sha256', key()).update(body).digest();

export function signToken(payload, ttlMs) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }));
  return `${body}.${b64(sign(body))}`;
}

/** Returns the payload if the signature and expiry hold, otherwise null. */
export function verifyToken(token, role) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const expected = sign(body);
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now() || (role && payload.role !== role)) return null;
    return payload;
  } catch {
    return null;
  }
}

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ── Admin ───────────────────────────────────────────────────────────────
export const adminEmail = () => (process.env.ADMIN_EMAIL || PRACTICE.email).trim().toLowerCase();
// ADMIN_PASSWORD is optional: without it the existing ADMIN_TOKEN is the password,
// so a deployment keeps working with no new setting.
const adminPassword = () => process.env.ADMIN_PASSWORD || config.adminToken;

const ADMIN_TTL = 12 * 60 * 60 * 1000;

export function adminLogin(email, password) {
  const emailOk = same(String(email || '').trim().toLowerCase(), adminEmail());
  const passwordOk = same(password || '', adminPassword());
  if (!(emailOk && passwordOk)) return null;
  return {
    token: signToken({ role: 'admin', sub: adminEmail() }, ADMIN_TTL),
    email: adminEmail(),
    expiresAt: new Date(Date.now() + ADMIN_TTL).toISOString(),
  };
}

/** Express guard: a session token, or the raw ADMIN_TOKEN as an API key. */
export function requireAdmin(req, res, next) {
  const supplied = String(req.get('x-admin-token') || '');
  if (verifyToken(supplied, 'admin') || same(supplied, config.adminToken)) return next();
  return res.status(401).json({ error: 'Invalid admin token.' });
}

// ── Patients ────────────────────────────────────────────────────────────
const LINK_TTL = 15 * 60 * 1000;
const PATIENT_TTL = 30 * 24 * 60 * 60 * 1000;

export const normaliseEmail = (e) => String(e || '').trim().toLowerCase();

export const createLoginLink = (email) =>
  signToken({ role: 'link', sub: normaliseEmail(email), jti: crypto.randomUUID() }, LINK_TTL);

// A link works once. Held in memory, so a restart forgets it; the 15-minute
// expiry bounds that, and a replayed link only ever opens one patient's own page.
const spent = new Map();

export function redeemLoginLink(token) {
  const payload = verifyToken(token, 'link');
  if (!payload) return null;
  const now = Date.now();
  for (const [jti, exp] of spent) if (exp < now) spent.delete(jti);
  if (spent.has(payload.jti)) return null;
  spent.set(payload.jti, payload.exp);
  return {
    token: signToken({ role: 'patient', sub: payload.sub }, PATIENT_TTL),
    email: payload.sub,
    expiresAt: new Date(now + PATIENT_TTL).toISOString(),
  };
}

/** Express guard for patient routes: sets req.patientEmail. */
export function requirePatient(req, res, next) {
  const header = String(req.get('authorization') || '');
  const payload = verifyToken(header.replace(/^Bearer\s+/i, ''), 'patient');
  if (!payload) return res.status(401).json({ code: 'sessionExpired', error: 'Please sign in again.' });
  req.patientEmail = payload.sub;
  return next();
}
