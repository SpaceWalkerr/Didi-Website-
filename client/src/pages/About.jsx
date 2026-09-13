import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { DOCTOR, CONTACT } from '../config.js';
import { ArrowRightIcon, CheckIcon, ShieldIcon, StethoscopeIcon } from '../components/Icons.jsx';

const registrationRows = [
  ['Full name', DOCTOR.name],
  ['Qualification', DOCTOR.qualification],
  ['Specialty', DOCTOR.specialty],
  ['Registration number', DOCTOR.registrationNumber],
  ['Registered with', DOCTOR.medicalCouncil],
  ['Years of experience', `${DOCTOR.yearsExperience} years`],
  ['Languages', DOCTOR.languages.join(', ')],
];

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About the doctor"
        title={`Meet ${DOCTOR.name}`}
        description={DOCTOR.tagline}
      />

      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[20rem_1fr]">
          {/* Photo + registration card */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
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
                    Photograph placeholder
                    <span className="mt-1 block text-xs font-normal text-brand-700/70">
                      Set <code>photoUrl</code> in src/config.js
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-care-200 bg-care-50 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-care-900">
                <ShieldIcon className="h-4 w-4" />
                Verified registration
              </p>
              <p className="mt-2 text-sm leading-relaxed text-care-900/80">
                Registration details are published as required by the Telemedicine Practice
                Guidelines, 2020. They can be checked on the National Medical Commission register.
              </p>
            </div>
          </div>

          {/* Bio + credentials */}
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl">Background</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-slate-600">
                {DOCTOR.longBio.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl">Registration & credentials</h2>
              <dl className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                {registrationRows.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-4 ${
                      i % 2 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <dt className="text-sm font-medium text-slate-500">{label}</dt>
                    <dd className="text-sm font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h2 className="text-2xl">Qualifications & training</h2>
              <ul className="mt-4 space-y-3">
                {DOCTOR.credentials.map((item) => (
                  <li key={item.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl">Areas of focus</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {DOCTOR.focusAreas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-sm text-brand-800"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg">Consulting hours</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {CONTACT.hours.map((h) => (
                  <div key={h.days} className="flex flex-wrap justify-between gap-2">
                    <dt className="font-medium text-slate-700">{h.days}</dt>
                    <dd className="text-slate-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
              <Link to="/book" className="btn-primary mt-6 w-full sm:w-auto">
                Book a consultation
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
