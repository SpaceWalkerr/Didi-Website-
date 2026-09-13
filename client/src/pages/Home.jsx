import { Link } from 'react-router-dom';
import { DOCTOR, CONTACT, STARTING_PRICE, waLink, WHATSAPP_MESSAGES } from '../config.js';
import {
  ArrowRightIcon, CalendarIcon, CheckIcon, ClockIcon, ShieldIcon, StethoscopeIcon,
  VideoIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

const steps = [
  {
    icon: CalendarIcon,
    title: 'Pick a time',
    body: 'Choose a consultation type and a slot that suits you, up to 30 days ahead.',
  },
  {
    icon: ShieldIcon,
    title: 'Share your details & pay',
    body: 'A short form about your symptoms, then a secure payment. Your slot is held while you pay.',
  },
  {
    icon: WhatsAppIcon,
    title: 'Consult on WhatsApp',
    body: 'You get a WhatsApp link by email and SMS. Tap it at the scheduled time to begin.',
  },
];

const trustPoints = [
  { icon: StethoscopeIcon, title: `${DOCTOR.yearsExperience}+ years in practice`, body: 'Outpatient and internal medicine experience across hospital and clinic settings.' },
  { icon: ClockIcon, title: 'Unhurried consultations', body: 'Slots are long enough for a proper history — not a two-minute conversation.' },
  { icon: ShieldIcon, title: 'Registered & compliant', body: `Reg. No. ${DOCTOR.registrationNumber}, ${DOCTOR.medicalCouncil}. Practising under the 2020 Telemedicine Practice Guidelines.` },
  { icon: VideoIcon, title: 'Consult from anywhere', body: 'All you need is WhatsApp and a stable connection. No apps to install, no travel.' },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 via-brand-50/40 to-white">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-care-200 bg-care-50 px-3 py-1 text-xs font-semibold text-care-800">
              <span className="h-1.5 w-1.5 rounded-full bg-care-500" />
              Accepting online consultations
            </span>

            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
              {DOCTOR.name}
              <span className="mt-2 block text-xl font-medium text-brand-700 sm:text-2xl">
                {DOCTOR.specialty}
              </span>
            </h1>

            <p className="mt-3 text-sm font-medium text-slate-500">
              {DOCTOR.qualification} · Reg. No. {DOCTOR.registrationNumber}, {DOCTOR.medicalCouncil}
            </p>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{DOCTOR.shortBio}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/book" className="btn-primary text-base">
                Book Consultation
                <ArrowRightIcon />
              </Link>
              <a
                href={waLink(WHATSAPP_MESSAGES.default)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                Ask a question
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
              {[
                [`${DOCTOR.yearsExperience}+`, 'Years of practice'],
                ['20 min', 'Typical consultation'],
                [`₹${STARTING_PRICE}`, 'Starting fee'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-semibold text-slate-900">{value}</dt>
                  <dd className="mt-0.5 text-xs text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Photo placeholder — swap DOCTOR.photoUrl in src/config.js */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
              {DOCTOR.photoUrl ? (
                <img
                  src={DOCTOR.photoUrl}
                  alt={`Portrait of ${DOCTOR.name}`}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-100 to-care-50 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-brand-600 shadow-sm">
                    <StethoscopeIcon className="h-9 w-9" />
                  </span>
                  <p className="px-6 text-sm font-medium text-brand-800">
                    Doctor’s photograph
                    <span className="mt-1 block text-xs font-normal text-brand-700/70">
                      Add an image to client/public/ and set photoUrl in src/config.js
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:max-w-[15rem]">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckIcon className="h-4 w-4 text-care-600" />
                Consulting today
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{CONTACT.hours[0].time}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl">Three steps, about two minutes</h2>
          <p className="mt-3 text-slate-600">
            The whole process is designed for a phone. No account to create, no app to download.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="card relative">
              <span className="absolute right-6 top-6 text-4xl font-bold text-brand-50">{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Why patients choose this practice</p>
            <h2 className="mt-2 text-3xl">Real medicine, delivered calmly</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex gap-4 rounded-2xl bg-white p-6 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-care-50 text-care-700">
                  <point.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base">{point.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{point.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions treated */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">What I treat</p>
            <h2 className="mt-2 text-3xl">Everyday problems that don’t need a waiting room</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              If your concern needs a physical examination, imaging or hospital care, I will tell you
              so during the consultation and point you to the right next step.
            </p>
            <Link to="/services" className="btn-secondary mt-6">
              See services & fees
              <ArrowRightIcon />
            </Link>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {DOCTOR.focusAreas.map((area) => (
              <li
                key={area}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              >
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-care-600" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-4">
        <div className="rounded-3xl bg-brand-700 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl text-white">Ready to talk to a doctor?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Pick a slot that works for you. You’ll get a WhatsApp link to join at the scheduled time.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/book" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Book Consultation
              <ArrowRightIcon />
            </Link>
            <a
              href={waLink(WHATSAPP_MESSAGES.default)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-brand-500 text-white hover:bg-brand-600"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Message on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
