import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../lib/api.js';
import { rupees } from '../lib/format.js';
import { SERVICE_EXTRAS, waLink, WHATSAPP_MESSAGES } from '../config.js';
import { ArrowRightIcon, CheckIcon, ClockIcon, WhatsAppIcon } from '../components/Icons.jsx';

const faqs = [
  {
    q: 'How does the consultation actually happen?',
    a: 'Once your payment is confirmed you receive a WhatsApp link by email and SMS. Tap it at your scheduled time and the consultation begins on WhatsApp — audio, video or chat, whichever suits you and the problem.',
  },
  {
    q: 'Will I get a prescription?',
    a: 'Where it is clinically appropriate, yes — a digital prescription signed by the doctor. Some conditions need an in-person examination first, and certain categories of medicine cannot be prescribed over a teleconsultation under the 2020 Telemedicine Practice Guidelines.',
  },
  {
    q: 'What should I keep ready?',
    a: 'A list of your current medicines, any recent test reports or prescriptions, and readings such as blood pressure or sugar if you monitor them at home. Photographs of reports can be sent on WhatsApp before the consultation.',
  },
  {
    q: 'What if I need to reschedule or cancel?',
    a: 'Message the clinic on WhatsApp at least 4 hours before your slot and it will be moved at no extra cost. Cancellations made more than 4 hours ahead are refunded in full; later than that, the fee covers the reserved time.',
  },
  {
    q: 'Is my information private?',
    a: 'Your details are used only for your care. Records are kept confidential in line with the Telemedicine Practice Guidelines and the Digital Personal Data Protection Act, 2023, and are never sold or shared for marketing.',
  },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .meta()
      .then((data) => active && setServices(data.services))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Services & fees"
        title="Consultation types"
        description="Clear, fixed fees. You pay for the doctor’s time — there are no platform charges, subscriptions or hidden extras."
      />

      <section className="container-page py-14 sm:py-16">
        {loading && <p className="text-sm text-slate-500">Loading services…</p>}

        {error && (
          <div className="card border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-900">
              We couldn’t load the current fees ({error}). Please message the clinic on WhatsApp and
              we’ll help you book.
            </p>
            <a
              href={waLink(WHATSAPP_MESSAGES.booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-4"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Message the clinic
            </a>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {services.map((service) => {
            const extra = SERVICE_EXTRAS[service.id] || { includes: [] };
            return (
              <div
                key={service.id}
                className={`card flex flex-col ${extra.badge ? 'ring-2 ring-brand-500' : ''}`}
              >
                {extra.badge && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    {extra.badge}
                  </span>
                )}

                <h2 className="text-xl">{service.name}</h2>

                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <ClockIcon className="h-4 w-4" />
                  {service.durationMinutes} minutes
                </p>

                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {rupees(service.price)}
                  <span className="ml-1.5 text-sm font-normal text-slate-500">per consultation</span>
                </p>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">{service.description}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {extra.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-care-600" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/book?service=${service.id}`}
                  className={`${extra.badge ? 'btn-primary' : 'btn-secondary'} mt-6 w-full`}
                >
                  Book this consultation
                  <ArrowRightIcon />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Payment & refund terms */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg">Payment</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Fees are paid online at the time of booking through Razorpay, which accepts UPI, cards,
              net banking and wallets. Card details are handled entirely by the payment gateway and
              never reach this website.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg">Rescheduling & refunds</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Reschedule free of charge up to 4 hours before your slot. Cancel more than 4 hours
              ahead for a full refund. If the doctor has to cancel, you are refunded in full or
              offered the next available slot, whichever you prefer.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl">Common questions</h2>
          <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-slate-900 hover:bg-slate-50">
                  {faq.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
