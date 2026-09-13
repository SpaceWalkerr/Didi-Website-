import { Link } from 'react-router-dom';
import { DOCTOR, CONTACT, EMERGENCY_NOTICE, waLink, WHATSAPP_MESSAGES } from '../config.js';
import { AlertIcon, MailIcon, WhatsAppIcon } from './Icons.jsx';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      {/* Emergency notice sits above everything else — it is the most important
          thing on the page for the small number of people who need it. */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="container-page flex items-start gap-3 py-4">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">Not for emergencies.</strong> {EMERGENCY_NOTICE}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{DOCTOR.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{DOCTOR.qualification}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Registration No. <span className="font-medium text-slate-800">{DOCTOR.registrationNumber}</span>
            <br />
            {DOCTOR.medicalCouncil}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ['/', 'Home'],
              ['/about', 'About the doctor'],
              ['/services', 'Services & fees'],
              ['/book', 'Book a consultation'],
              ['/contact', 'Contact'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-slate-600 transition hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={waLink(WHATSAPP_MESSAGES.contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-600 transition hover:text-brand-700"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 text-slate-600 transition hover:text-brand-700"
              >
                <MailIcon className="h-4 w-4" />
                {CONTACT.email}
              </a>
            </li>
          </ul>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            {CONTACT.hours.map((h) => (
              <p key={h.days}>
                <span className="font-medium text-slate-800">{h.days}:</span> {h.time}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Telemedicine compliance disclaimer — shown on every page. */}
      <div className="border-t border-slate-200">
        <div className="container-page space-y-4 py-8 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="font-semibold text-slate-700">Telemedicine disclaimer.</strong>{' '}
            Consultations offered through this website are provided in accordance with the
            Telemedicine Practice Guidelines notified on 25 March 2020 by the Board of Governors in
            supersession of the Medical Council of India, which form Appendix 5 to the Indian
            Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002. The
            consulting doctor is a registered medical practitioner and their registration number and
            council are displayed above. Patient consent is recorded at the time of booking.
          </p>
          <p>
            The doctor decides, at their professional discretion, whether a condition can be managed
            over a teleconsultation or requires an in-person examination, and may advise you to seek
            physical care instead. Prescriptions are issued only where clinically appropriate, and
            medicines listed as prohibited for telemedicine (including Schedule X drugs and narcotic
            and psychotropic substances) will not be prescribed. Information you share is treated as
            confidential and handled under the Digital Personal Data Protection Act, 2023.
          </p>
          <p>
            Content on this website is for general information and does not replace a consultation,
            diagnosis or treatment by a qualified doctor. Fees paid cover the doctor’s professional
            time; outcomes cannot be guaranteed. Please read the cancellation and refund terms before
            booking.
          </p>
          <p className="pt-2 text-slate-400">
            © {year} {DOCTOR.name}. All rights reserved. ·{' '}
            <Link to="/admin" className="transition hover:text-slate-600">
              Clinic login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
