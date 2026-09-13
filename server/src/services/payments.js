import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { config } from '../config.js';

/**
 * Razorpay in test mode, with a mock fallback.
 *
 * With RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET set (use the *test* keys from the
 * Razorpay dashboard), this creates real test-mode orders and verifies the
 * signature Razorpay sends back.
 *
 * Without keys it runs in mock mode: orders are generated locally and
 * "verified" against the same HMAC scheme using a local secret, so the booking
 * flow can be demoed end to end before the account exists.
 */
const client = config.razorpay.enabled
  ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
  : null;

const MOCK_SECRET = 'mock_secret_do_not_use_in_production';

export const paymentMode = () => (config.razorpay.enabled ? 'razorpay-test' : 'mock');

/** Amount is in rupees; Razorpay expects the smallest currency unit (paise). */
export async function createOrder({ amountInRupees, receipt, notes }) {
  if (!client) {
    return {
      id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountInRupees * 100,
      currency: 'INR',
      receipt,
      mock: true,
    };
  }

  const order = await client.orders.create({
    amount: amountInRupees * 100,
    currency: 'INR',
    receipt,
    notes,
  });
  return { ...order, mock: false };
}

/** Razorpay signs `order_id|payment_id` with the key secret. */
export function verifySignature({ orderId, paymentId, signature }) {
  const secret = config.razorpay.enabled ? config.razorpay.keySecret : MOCK_SECRET;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Mock mode only: stands in for the signature Razorpay Checkout would return. */
export function mockSignature(orderId, paymentId) {
  return crypto.createHmac('sha256', MOCK_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}
