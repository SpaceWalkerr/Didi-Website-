import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { CONTACT, EMERGENCY_NOTICE, waLink, WHATSAPP_MESSAGES } from '../config.js';
import { AlertIcon, CheckIcon, ClockIcon, WhatsAppIcon } from '../components/Icons.jsx';

export default function Confirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getBooking(bookingId).then(setBooking).catch((err) => setError(err.message));
  }, [bookingId]);

  if (error) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="text-2xl">We couldn’t find that booking</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <a
            href={waLink(WHATSAPP_MESSAGES.booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Message the clinic
          </a>
        </div>
      </div>
    );
  }

  if (!booking) {
    return <p className="container-page py-20 text-center text-sm text-slate-500">Loading your booking…</p>;
  }

  const confirmed = booking.status === 'confirmed';

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              confirmed ? 'bg-care-100 text-care-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {confirmed ? <CheckIcon className="h-8 w-8" /> : <ClockIcon className="h-8 w-8" />}
          </span>

          <h1 className="mt-5 text-2xl sm:text-3xl">
            {confirmed ? 'Your consultation is confirmed' : 'Payment not completed'}
          </h1>

          <p className="mt-3 leading-relaxed text-slate-600">
            {confirmed ? (
              <>
                A confirmation has been sent to <strong>{booking.patientEmail}</strong> and by SMS to{' '}
                <strong>{booking.patientPhone}</strong>. Please be ready a few minutes early.
              </>
            ) : (
              <>
                This booking is still marked as <strong>{booking.status}</strong>. If money was
                deducted, message the clinic with your booking ID and it will be sorted out.
              </>
            )}
          </p>

          <dl className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 text-left">
            {[
              ['Booking ID', booking.id],
              ['Patient', booking.patientName],
              ['Consultation', `${booking.serviceName} (${booking.durationMinutes} min)`],
              ['Date & time', `${booking.when} IST`],
              ['Amount', rupees(booking.amount)],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4 ${
                  i % 2 ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          {confirmed && booking.whatsappLink && (
            <div className="mt-8 rounded-2xl border border-care-200 bg-care-50 p-6">
              <h2 className="text-lg text-care-900">How to join</h2>
              <p className="mt-2 text-sm leading-relaxed text-care-900/80">
                At <strong>{booking.when}</strong>, tap the button below. It opens WhatsApp with a
                message already written — just send it, and the doctor will start the consultation.
              </p>
              <a
                href={booking.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp mt-5 w-full"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Join on WhatsApp at your slot time
              </a>
              <p className="mt-3 text-xs text-care-900/70">
                Save this page or the email — the same link works any time before your slot.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 card">
          <h2 className="text-lg">Before your consultation</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            {[
              'Send any reports, prescriptions or photographs on WhatsApp beforehand so the doctor can review them.',
              'Keep a list of the medicines you currently take, with doses.',
              'Find a quiet spot with a decent network connection.',
              'To reschedule, message the clinic at least 4 hours before your slot.',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={waLink(`Hello, I have a question about my booking ${booking.id}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Message the clinic
            </a>
            <Link to="/" className="btn-secondary flex-1">
              Back to home
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            {EMERGENCY_NOTICE} For non-urgent queries, WhatsApp {CONTACT.whatsappDisplay}.
          </p>
        </div>
      </div>
    </div>
  );
}
