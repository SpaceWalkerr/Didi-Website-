import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { CONTACT, DOCTOR, EMERGENCY_NOTICE, waLink, WHATSAPP_MESSAGES } from '../config.js';
import {
  AlertIcon, ArrowRightIcon, ClockIcon, MailIcon, PhoneIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

export default function Contact() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="WhatsApp is the quickest way to reach the clinic for anything that isn’t a booking — questions about fees, rescheduling, or whether an online consultation is right for your problem."
      />

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div className="space-y-6">
            {/* WhatsApp — the primary channel, so it gets the most weight. */}
            <div className="card border-[#25D366]/30 bg-[#25D366]/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl">WhatsApp</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Tap to open a chat with a message already written. {CONTACT.responseNote}
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-900">{CONTACT.whatsappDisplay}</p>
              <a
                href={waLink(WHATSAPP_MESSAGES.contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp mt-5 w-full sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MailIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg">Email</h2>
                <p className="mt-2 text-sm text-slate-600">
                  For reports, documents and anything you would rather write out in full.
                </p>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="mt-3 inline-block break-all text-sm font-medium text-brand-700 hover:underline"
                >
                  {CONTACT.email}
                </a>
              </div>

              <div className="card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg">Phone</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Calls are answered during consulting hours only; WhatsApp is usually faster.
                </p>
                <a
                  href={`tel:+${CONTACT.whatsappNumber}`}
                  className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-base text-amber-900">In an emergency</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">{EMERGENCY_NOTICE}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-care-50 text-care-700">
                <ClockIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg">Clinic hours</h2>
              <p className="mt-1 text-xs text-slate-500">All times are Indian Standard Time.</p>
              <dl className="mt-4 divide-y divide-slate-200">
                {CONTACT.hours.map((h) => (
                  <div key={h.days} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm font-medium text-slate-900">{h.days}</dt>
                    <dd className="mt-0.5 text-sm text-slate-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card">
              <h2 className="text-lg">Booking is self-service</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                You don’t need to call to get an appointment — available slots are shown live on the
                booking page and confirmed the moment payment goes through.
              </p>
              <Link to="/book" className="btn-primary mt-5 w-full">
                Book a consultation
                <ArrowRightIcon />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
              <p className="font-medium text-slate-900">{DOCTOR.name}</p>
              <p className="mt-1">{DOCTOR.qualification}</p>
              <p className="mt-2">
                Reg. No. {DOCTOR.registrationNumber}
                <br />
                {DOCTOR.medicalCouncil}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                This is an online-only practice. Consultations take place over WhatsApp; there is no
                walk-in clinic address.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
