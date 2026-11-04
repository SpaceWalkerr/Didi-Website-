/**
 * Client-side copy of the server's patient validation
 * (server/src/routes/bookings.js → validatePatient). Same rules, same error
 * codes, so inline messages appear before submitting and the server never
 * rejects something the form accepted. The server still validates every
 * booking itself; this only makes mistakes visible sooner.
 */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''));

export function validateField(key, patient) {
  const v = patient[key];
  switch (key) {
    case 'name': {
      const s = String(v || '');
      return s.trim().length < 2 || s.length > 100 ? 'name' : null;
    }
    case 'phone':
      return isPhone(v || '') ? null : 'phone';
    case 'email': {
      const s = String(v || '');
      return !isEmail(s) || s.length > 254 ? 'email' : null;
    }
    case 'symptoms': {
      const s = String(v || '');
      return s.trim().length < 10 || s.length > 2000 ? 'symptoms' : null;
    }
    case 'age': {
      if (v === undefined || v === null || v === '') return null;
      const age = Number(v);
      return !Number.isFinite(age) || age < 0 || age > 120 ? 'age' : null;
    }
    case 'consent':
      return v ? null : 'consent';
    default:
      return null;
  }
}

export const PATIENT_FIELDS = ['name', 'age', 'phone', 'email', 'symptoms', 'consent'];

export function validatePatient(patient) {
  return Object.fromEntries(
    PATIENT_FIELDS.map((k) => [k, validateField(k, patient)]).filter(([, code]) => code),
  );
}
