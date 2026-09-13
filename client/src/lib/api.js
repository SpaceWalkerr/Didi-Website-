/** Thin fetch wrapper. Vite proxies /api to the Express server in development. */
const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (server down, proxy error) — fall through to the throw.
  }

  if (!res.ok) {
    const error = new Error(data?.error || 'We could not reach the clinic server. Please try again.');
    error.status = res.status;
    error.fieldErrors = data?.fieldErrors || null;
    throw error;
  }

  return data;
}

export const api = {
  meta: () => request('/bookings/meta'),
  slots: (date, service) =>
    request(`/bookings/slots?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`),
  createBooking: (payload) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
  verifyPayment: (payload) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),
  mockPay: (orderId) =>
    request('/payments/mock-pay', { method: 'POST', body: JSON.stringify({ orderId }) }),
  cancelPayment: (bookingId) =>
    request('/payments/cancel', { method: 'POST', body: JSON.stringify({ bookingId }) }),

  adminLogin: (token) => request('/admin/login', { method: 'POST', headers: { 'x-admin-token': token } }),
  adminBookings: (token, scope = 'upcoming') =>
    request(`/admin/bookings?scope=${scope}`, { headers: { 'x-admin-token': token } }),
  adminUpdate: (token, id, status) =>
    request(`/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-token': token },
      body: JSON.stringify({ status }),
    }),
};
