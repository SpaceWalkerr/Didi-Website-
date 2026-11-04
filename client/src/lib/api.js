/** Thin fetch wrapper. Vite proxies /api to the Express server in development. */
const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  // `options` is spread FIRST and `headers` rebuilt afterwards. The other way
  // round, any caller passing its own headers — every admin call does, for the
  // token — replaced the merged object wholesale and lost Content-Type, so
  // Express never parsed the body and the server saw an empty request.
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (server down, proxy error) — fall through to the throw.
  }

  // An expired clinic session: let the admin shell send the doctor back to the login form.
  if (res.status === 401 && path.startsWith('/admin') && path !== '/admin/login') {
    window.dispatchEvent(new Event('admin-unauthorized'));
  }

  if (!res.ok) {
    // The server sends a `code` rather than a sentence, because it does not know
    // what language the patient is reading. Callers translate `messageKey`;
    // `message` is the English fallback for logs and unexpected failures.
    const error = new Error(data?.error || 'We could not reach the clinic server.');
    error.status = res.status;
    error.code = data?.code || null;
    error.params = data?.params || null;
    error.messageKey = data?.code ? `errors.${data.code}` : 'errors.network';
    // { field: errorCode } — each code maps to an `errors.*` translation key.
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
  upiSubmit: (bookingId, utr) =>
    request('/payments/upi-submit', { method: 'POST', body: JSON.stringify({ bookingId, utr }) }),
  cancelPayment: (bookingId) =>
    request('/payments/cancel', { method: 'POST', body: JSON.stringify({ bookingId }) }),

  adminLogin: (email, password) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminOverview: (token) => request('/admin/overview', { headers: { 'x-admin-token': token } }),
  adminCalendar: (token, from, days = 7) =>
    request(`/admin/calendar?from=${from}&days=${days}`, { headers: { 'x-admin-token': token } }),
  adminPatients: (token, q = '') =>
    request(`/admin/patients?q=${encodeURIComponent(q)}`, { headers: { 'x-admin-token': token } }),
  adminPatient: (token, phone) =>
    request(`/admin/patients/${encodeURIComponent(phone)}`, { headers: { 'x-admin-token': token } }),
  adminNotes: (token, id, body) =>
    request(`/admin/bookings/${id}/notes`, {
      method: 'PATCH',
      headers: { 'x-admin-token': token },
      body: JSON.stringify(body),
    }),
  adminAvailability: (token) =>
    request('/admin/availability', { headers: { 'x-admin-token': token } }),
  adminSaveAvailability: (token, hours) =>
    request('/admin/availability', {
      method: 'PUT',
      headers: { 'x-admin-token': token },
      body: JSON.stringify({ hours }),
    }),
  adminBookings: (token, scope = 'upcoming') =>
    request(`/admin/bookings?scope=${scope}`, { headers: { 'x-admin-token': token } }),
  adminUpdate: (token, id, status) =>
    request(`/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-token': token },
      body: JSON.stringify({ status }),
    }),

  adminConfirmPayment: (token, id) =>
    request(`/admin/bookings/${id}/confirm-payment`, {
      method: 'POST',
      headers: { 'x-admin-token': token },
    }),

  // ── Patient account ──
  accountLoginLink: (email) =>
    request('/account/login-link', { method: 'POST', body: JSON.stringify({ email }) }),
  accountSession: (token) =>
    request('/account/session', { method: 'POST', body: JSON.stringify({ token }) }),
  accountMe: (session) =>
    request('/account/me', { headers: { Authorization: `Bearer ${session}` } }),
  accountCancel: (session, id) =>
    request(`/account/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session}` },
    }),

  // ── Slot blocks: the doctor marking themselves unavailable ──
  adminBlocks: (token, from, to) =>
    request(`/admin/blocks${from ? `?from=${from}&to=${to}` : ''}`, {
      headers: { 'x-admin-token': token },
    }),
  adminAddBlock: (token, block) =>
    request('/admin/blocks', {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: JSON.stringify(block),
    }),
  adminRemoveBlock: (token, id) =>
    request(`/admin/blocks/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    }),
};
