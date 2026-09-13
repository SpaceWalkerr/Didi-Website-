import { api } from './api.js';

/**
 * Opens Razorpay Checkout and resolves with the fields the server needs to
 * verify the payment.
 *
 * In mock mode (no Razorpay keys on the server) it asks the server to produce a
 * correctly-signed fake payment instead, so the flow can be tested end to end.
 *
 * Messages are passed in already translated — Razorpay's own checkout UI has its
 * own language setting, but the errors we raise are ours to word.
 */
export function openCheckout({
  order,
  bookingId,
  razorpayKeyId,
  patient,
  paymentMode,
  doctorName,
  checkoutUnavailable,
  cancelledMessage,
  failedMessage,
}) {
  if (paymentMode !== 'razorpay-test') {
    return api.mockPay(order.id);
  }

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error(checkoutUnavailable));
      return;
    }

    const checkout = new window.Razorpay({
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: doctorName,
      description: `Booking ${bookingId}`,
      image: '/favicon.svg',
      prefill: { name: patient.name, email: patient.email, contact: patient.phone },
      notes: { bookingId },
      theme: { color: '#0270c2' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error(cancelledMessage)),
        escape: true,
      },
    });

    checkout.on('payment.failed', (response) =>
      reject(new Error(response?.error?.description || failedMessage)),
    );

    checkout.open();
  });
}
