import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import { api } from '../lib/api.js';
import { openCheckout } from '../lib/razorpay.js';
import { formatDateTime, formatTime, rupees, upcomingDates } from '../lib/format.js';
import { EMERGENCY_NOTICE, waLink, WHATSAPP_MESSAGES } from '../config.js';
import {
  AlertIcon, ArrowRightIcon, CalendarIcon, ClockIcon, ShieldIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

const STEPS = ['Choose a slot', 'Your details', 'Payment'];

const emptyPatient = {
  name: '', age: '', gender: '', phone: '', email: '', symptoms: '', consent: false,
};

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);

  const [serviceId, setServiceId] = useState(params.get('service') || 'general');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [patient, setPatient] = useState(emptyPatient);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState(false);

  const detailsRef = useRef(null);
  const dates = useMemo(() => upcomingDates(21), []);
  const service = meta?.services.find((s) => s.id === serviceId) || null;

  // Load services, rules and payment mode once.
  useEffect(() => {
    api.meta().then(setMeta).catch((err) => setMetaError(err.message));
  }, []);

  // Default to the first date once we know the booking window.
  useEffect(() => {
    if (meta && !date) setDate(meta.minDate);
  }, [meta, date]);

  const loadSlots = useCallback(async () => {
    if (!date || !serviceId) return;
    setSlotsLoading(true);
    try {
      const data = await api.slots(date, serviceId);
      setSlots(data.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [date, serviceId]);

  useEffect(() => {
    setTime('');
    loadSlots();
  }, [loadSlots]);

  const availableCount = slots.filter((s) => s.available).length;

  const goToDetails = () => {
    if (!time) return;
    setStep(1);
    // On a phone the form is below the fold after the slot grid.
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const updatePatient = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setPatient((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setPaying(true);

    let created;
    try {
      created = await api.createBooking({ date, time, service: serviceId, patient });
    } catch (err) {
      setPaying(false);
      setSubmitError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      if (err.status === 409) {
        // Someone took the slot while the form was open — send them back to pick again.
        setStep(0);
        setTime('');
        loadSlots();
      }
      return;
    }

    setStep(2);

    try {
      const payment = await openCheckout({
        order: created.order,
        bookingId: created.bookingId,
        amount: created.amount,
        razorpayKeyId: created.razorpayKeyId,
        paymentMode: created.paymentMode,
        patient,
      });

      await api.verifyPayment({ bookingId: created.bookingId, ...payment });
      navigate(`/confirmation/${created.bookingId}`);
    } catch (err) {
      setPaying(false);
      setStep(1);
      setSubmitError(err.message);
      api.cancelPayment(created.bookingId).catch(() => {});
      loadSlots();
    }
  }

  if (metaError) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="text-2xl">Booking is temporarily unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We couldn’t reach the clinic’s booking system ({metaError}). Please message us on
            WhatsApp and we will book your slot manually.
          </p>
          <a
            href={waLink(WHATSAPP_MESSAGES.booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Book over WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Book a consultation"
        title="Choose a time that suits you"
        description="Pick a slot, tell the doctor what’s troubling you, and pay securely. You’ll get a WhatsApp link to join at your scheduled time."
      />

      <div className="container-page py-10 sm:py-14">
        <StepIndicator steps={STEPS} current={step} />

        {meta?.paymentMode === 'mock' && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              <strong className="font-semibold">Demo mode.</strong> No Razorpay keys are configured,
              so payments are simulated and no money will be charged. Add test keys to{' '}
              <code className="rounded bg-amber-100 px-1">server/.env</code> to use Razorpay test
              mode.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="min-w-0 space-y-8">
            {/* Step 1 — service, date, slot */}
            <section className="card">
              <h2 className="text-xl">1. Choose your consultation</h2>

              <fieldset className="mt-5 min-w-0">
                <legend className="label">Consultation type</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(meta?.services || []).map((s) => (
                    <label
                      key={s.id}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        serviceId === s.id
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={s.id}
                        checked={serviceId === s.id}
                        onChange={() => setServiceId(s.id)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-slate-900">{s.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {s.durationMinutes} min · {rupees(s.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-7 min-w-0">
                <legend className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    Date
                  </span>
                </legend>
                {/* Horizontal date strip — thumb-friendly on a phone. */}
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDate(d.value)}
                      className={`flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition ${
                        date === d.value
                          ? 'border-brand-500 bg-brand-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                      }`}
                    >
                      <span className="text-[11px] font-medium uppercase opacity-80">
                        {d.isToday ? 'Today' : d.weekday}
                      </span>
                      <span className="text-lg font-semibold leading-tight">{d.day}</span>
                      <span className="text-[11px] opacity-80">{d.month}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6 min-w-0">
                <legend className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                    Available times (IST)
                  </span>
                </legend>

                {slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    The doctor does not consult on this date. Please pick another day.
                  </p>
                ) : availableCount === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    All slots on this date are taken. Please try another day, or{' '}
                    <a
                      href={waLink(WHATSAPP_MESSAGES.booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 underline"
                    >
                      message the clinic
                    </a>{' '}
                    if it’s urgent.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        title={slot.reason === 'booked' ? 'Already booked' : undefined}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                          time === slot.time
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : slot.available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                        }`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>

              {step === 0 && (
                <button
                  type="button"
                  onClick={goToDetails}
                  disabled={!time}
                  className="btn-primary mt-7 w-full sm:w-auto"
                >
                  Continue
                  <ArrowRightIcon />
                </button>
              )}
            </section>

            {/* Step 2 — patient details */}
            {step >= 1 && (
              <section ref={detailsRef} className="card scroll-mt-24">
                <h2 className="text-xl">2. Patient details</h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Please fill this in for the person who will be consulting.
                </p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="label">Full name *</label>
                      <input
                        id="name"
                        className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                        value={patient.name}
                        onChange={updatePatient('name')}
                        autoComplete="name"
                        required
                      />
                      <FieldError message={fieldErrors.name} />
                    </div>

                    <div>
                      <label htmlFor="age" className="label">Age</label>
                      <input
                        id="age"
                        type="number"
                        min="0"
                        max="120"
                        inputMode="numeric"
                        className={`input ${fieldErrors.age ? 'input-error' : ''}`}
                        value={patient.age}
                        onChange={updatePatient('age')}
                      />
                      <FieldError message={fieldErrors.age} />
                    </div>

                    <div>
                      <label htmlFor="gender" className="label">Gender</label>
                      <select
                        id="gender"
                        className="input"
                        value={patient.gender}
                        onChange={updatePatient('gender')}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="phone" className="label">Mobile number *</label>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="10-digit mobile number"
                        className={`input ${fieldErrors.phone ? 'input-error' : ''}`}
                        value={patient.phone}
                        onChange={updatePatient('phone')}
                        autoComplete="tel"
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Use the number that has WhatsApp — the consultation link goes here.
                      </p>
                      <FieldError message={fieldErrors.phone} />
                    </div>

                    <div>
                      <label htmlFor="email" className="label">Email *</label>
                      <input
                        id="email"
                        type="email"
                        className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                        value={patient.email}
                        onChange={updatePatient('email')}
                        autoComplete="email"
                        required
                      />
                      <FieldError message={fieldErrors.email} />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="symptoms" className="label">
                        What would you like to discuss? *
                      </label>
                      <textarea
                        id="symptoms"
                        rows={5}
                        className={`input resize-y ${fieldErrors.symptoms ? 'input-error' : ''}`}
                        placeholder="Your main complaint, how long it has been going on, any medicines you are taking, and any relevant history."
                        value={patient.symptoms}
                        onChange={updatePatient('symptoms')}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        The more detail you give, the more of the consultation can go into advice.
                        Reports can be sent on WhatsApp before your slot.
                      </p>
                      <FieldError message={fieldErrors.symptoms} />
                    </div>
                  </div>

                  <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={patient.consent}
                      onChange={updatePatient('consent')}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      required
                    />
                    <span className="text-sm leading-relaxed text-slate-700">
                      I consent to an online consultation and confirm the details above are correct.
                      I understand the doctor may advise an in-person examination if the condition
                      needs one, and that this service is not for emergencies.
                      {fieldErrors.consent && (
                        <span className="mt-1 block text-sm text-red-600">{fieldErrors.consent}</span>
                      )}
                    </span>
                  </label>

                  {submitError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}

                  <button type="submit" disabled={paying} className="btn-primary w-full">
                    {paying ? 'Opening secure payment…' : `Pay ${service ? rupees(service.price) : ''} & confirm`}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <ShieldIcon className="h-4 w-4" />
                    Payments are processed by Razorpay. Card details never touch this website.
                  </p>
                </form>
              </section>
            )}
          </div>

          {/* Summary rail */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="card">
              <h2 className="text-base">Booking summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Consultation" value={service?.name || '—'} />
                <Row label="Duration" value={service ? `${service.durationMinutes} minutes` : '—'} />
                <Row label="When" value={date && time ? formatDateTime(date, time) : 'Not selected'} />
                <div className="flex justify-between border-t border-slate-200 pt-3">
                  <dt className="font-medium text-slate-900">Total</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {service ? rupees(service.price) : '—'}
                  </dd>
                </div>
              </dl>

              {meta?.rules && (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Slots are held for {meta.rules.pendingHoldMinutes} minutes while you pay. Bookings
                  open up to {meta.rules.maxDaysAhead} days ahead and close{' '}
                  {meta.rules.minLeadMinutes} minutes before the slot.
                </p>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-900">{EMERGENCY_NOTICE}</p>
            </div>

            <a
              href={waLink(WHATSAPP_MESSAGES.booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-4 w-full"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Need help booking?
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-medium text-slate-900">{value}</dd>
  </div>
);

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
