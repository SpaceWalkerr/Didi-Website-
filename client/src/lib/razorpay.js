import { api } from './api.js';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Loads Razorpay Checkout on demand.
 *
 * It used to be a <script defer> in index.html, which meant every visitor —
 * including everyone who only ever reads the home page — downloaded and parsed
 * a third-party payment script. Fetching it at the moment the patient actually
 * presses Pay costs them nothing extra and takes it off the critical path for
 * the mobile Lighthouse score.
 */
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();

  const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('checkout-load-failed')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('checkout-load-failed'));
    document.head.appendChild(script);
  });
}

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
export async function openCheckout({
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

  try {
    await loadCheckout();
  } catch {
    throw new Error(checkoutUnavailable);
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
      theme: { color: '#0f8078' },
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
