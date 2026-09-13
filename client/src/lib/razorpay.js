import { api } from './api.js';
import { DOCTOR } from '../config.js';

/**
 * Opens Razorpay Checkout and resolves with the fields the server needs to
 * verify the payment.
 *
 * In mock mode (no Razorpay keys on the server) it asks the server to produce a
 * correctly-signed fake payment instead, so the flow can be tested end to end.
 */
export function openCheckout({ order, bookingId, amount, razorpayKeyId, patient, paymentMode }) {
  if (paymentMode !== 'razorpay-test') {
    return api.mockPay(order.id);
  }

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('The payment window could not load. Please check your connection and retry.'));
      return;
    }

    const checkout = new window.Razorpay({
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: DOCTOR.name,
      description: `Online consultation · Booking ${bookingId}`,
      image: '/favicon.svg',
      prefill: { name: patient.name, email: patient.email, contact: patient.phone },
      notes: { bookingId },
      theme: { color: '#0270c2' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled. Your slot has been released.')),
        escape: true,
      },
    });

    checkout.on('payment.failed', (response) =>
      reject(new Error(response?.error?.description || 'The payment failed. You have not been charged.')),
    );

    checkout.open();
  });
}
