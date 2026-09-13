import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import { api } from '../lib/api.js';
import { openCheckout } from '../lib/razorpay.js';
import { formatDateTime, formatTime, rupees, upcomingDates } from '../lib/format.js';
import { waLink } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import {
  AlertIcon, ArrowRightIcon, CalendarIcon, ClockIcon, ShieldIcon, WhatsAppIcon,
} from '../components/Icons.jsx';

const emptyPatient = {
  name: '', age: '', gender: '', phone: '', email: '', symptoms: '', consent: false,
};

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, tList, locale, language } = useI18n();

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
  const dates = useMemo(() => upcomingDates(21, locale), [locale]);
  const service = meta?.services.find((s) => s.id === serviceId) || null;

  /** Server errors arrive as codes; turn one into a sentence in this language. */
  const translateError = useCallback(
    (err) => (err.messageKey ? t(err.messageKey, err.params || {}) : err.message),
    [t],
  );

  // Load services, rules and payment mode once.
  useEffect(() => {
    api.meta().then(setMeta).catch((err) => setMetaError(translateError(err)));
  }, [translateError]);

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
      // The language travels with the booking so confirmations can be sent in
      // it, and so the doctor knows which language to expect on the call.
      created = await api.createBooking({ date, time, service: serviceId, patient, language });
    } catch (err) {
      setPaying(false);
      setSubmitError(translateError(err));
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
        doctorName: t('doctor.name'),
        checkoutUnavailable: t('errors.checkoutUnavailable'),
        cancelledMessage: t('errors.paymentCancelled'),
        failedMessage: t('errors.paymentFailed'),
        patient,
      });

      await api.verifyPayment({ bookingId: created.bookingId, ...payment });
      navigate(`/confirmation/${created.bookingId}`);
    } catch (err) {
      setPaying(false);
      setStep(1);
      setSubmitError(err.messageKey ? t(err.messageKey, err.params || {}) : err.message);
      api.cancelPayment(created.bookingId).catch(() => {});
      loadSlots();
    }
  }

  if (metaError) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="text-2xl">{t('booking.unavailableTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t('booking.unavailableBody', { error: metaError })}
          </p>
          <a
            href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t('booking.unavailableCta')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('booking.eyebrow')}
        title={t('booking.title')}
        description={t('booking.description')}
      />

      <div className="container-page py-10 sm:py-14">
        <StepIndicator steps={tList('booking.steps')} current={step} label={t('booking.progressAria')} />

        {meta?.paymentMode === 'mock' && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              <strong className="font-semibold">{t('booking.demoTitle')}</strong> {t('booking.demoBody')}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="min-w-0 space-y-8">
            {/* Step 1 — service, date, slot */}
            <section className="card">
              <h2 className="text-xl">{t('booking.step1Title')}</h2>

              <fieldset className="mt-5 min-w-0">
                <legend className="label">{t('booking.consultationType')}</legend>
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
                      <span className="block text-sm font-semibold text-slate-900">
                        {t(`services.items.${s.id}.name`)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {t('common.minutesShort', { count: s.durationMinutes })} · {rupees(s.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-7 min-w-0">
                <legend className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    {t('booking.date')}
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
                      <span className="w-full truncate text-center text-[11px] font-medium uppercase opacity-80">
                        {d.isToday ? t('booking.today') : d.weekday}
                      </span>
                      <span className="text-lg font-semibold leading-tight">{d.day}</span>
                      <span className="w-full truncate text-center text-[11px] opacity-80">{d.month}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6 min-w-0">
                <legend className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                    {t('booking.availableTimes')}
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
                    {t('booking.noConsultDay')}
                  </p>
                ) : availableCount === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {/* Split on the {link} marker so the anchor lands wherever the
                        sentence puts it — word order differs between languages. */}
                    {t('booking.allBooked').split('{link}').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && (
                          <a
                            href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-brand-700 underline"
                          >
                            {t('booking.allBookedLink')}
                          </a>
                        )}
                      </span>
                    ))}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        title={slot.reason === 'booked' ? t('booking.alreadyBooked') : undefined}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                          time === slot.time
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : slot.available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                        }`}
                      >
                        {formatTime(slot.time, locale)}
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
                  {t('booking.continue')}
                  <ArrowRightIcon />
                </button>
              )}
            </section>

            {/* Step 2 — patient details */}
            {step >= 1 && (
              <section ref={detailsRef} className="card scroll-mt-24">
                <h2 className="text-xl">{t('booking.step2Title')}</h2>
                <p className="mt-1.5 text-sm text-slate-500">{t('booking.step2Body')}</p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="label">{t('booking.fields.name')}</label>
                      <input
                        id="name"
                        className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                        value={patient.name}
                        onChange={updatePatient('name')}
                        autoComplete="name"
                        required
                      />
                      <FieldError code={fieldErrors.name} t={t} />
                    </div>

                    <div>
                      <label htmlFor="age" className="label">{t('booking.fields.age')}</label>
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
                      <FieldError code={fieldErrors.age} t={t} />
                    </div>

                    <div>
                      <label htmlFor="gender" className="label">{t('booking.fields.gender')}</label>
                      <select
                        id="gender"
                        className="input"
                        value={patient.gender}
                        onChange={updatePatient('gender')}
                      >
                        <option value="">{t('booking.fields.genderUnspecified')}</option>
                        <option value="female">{t('booking.fields.genderFemale')}</option>
                        <option value="male">{t('booking.fields.genderMale')}</option>
                        <option value="other">{t('booking.fields.genderOther')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="phone" className="label">{t('booking.fields.phone')}</label>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder={t('booking.fields.phonePlaceholder')}
                        className={`input ${fieldErrors.phone ? 'input-error' : ''}`}
                        value={patient.phone}
                        onChange={updatePatient('phone')}
                        autoComplete="tel"
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">{t('booking.fields.phoneHint')}</p>
                      <FieldError code={fieldErrors.phone} t={t} />
                    </div>

                    <div>
                      <label htmlFor="email" className="label">{t('booking.fields.email')}</label>
                      <input
                        id="email"
                        type="email"
                        className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                        value={patient.email}
                        onChange={updatePatient('email')}
                        autoComplete="email"
                        required
                      />
                      <FieldError code={fieldErrors.email} t={t} />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="symptoms" className="label">{t('booking.fields.symptoms')}</label>
                      <textarea
                        id="symptoms"
                        rows={5}
                        className={`input resize-y ${fieldErrors.symptoms ? 'input-error' : ''}`}
                        placeholder={t('booking.fields.symptomsPlaceholder')}
                        value={patient.symptoms}
                        onChange={updatePatient('symptoms')}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">{t('booking.fields.symptomsHint')}</p>
                      <FieldError code={fieldErrors.symptoms} t={t} />
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
                      {t('booking.consent')}
                      {fieldErrors.consent && (
                        <span className="mt-1 block text-sm text-red-600">
                          {t(`errors.${fieldErrors.consent}`)}
                        </span>
                      )}
                    </span>
                  </label>

                  {submitError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}

                  <button type="submit" disabled={paying} className="btn-primary w-full">
                    {paying
                      ? t('booking.paying')
                      : t('booking.pay', { amount: service ? rupees(service.price) : '' })}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                    <ShieldIcon className="h-4 w-4 shrink-0" />
                    {t('booking.secureNote')}
                  </p>
                </form>
              </section>
            )}
          </div>

          {/* Summary rail */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="card">
              <h2 className="text-base">{t('booking.summaryTitle')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  label={t('booking.summary.consultation')}
                  value={service ? t(`services.items.${service.id}.name`) : '—'}
                />
                <Row
                  label={t('booking.summary.duration')}
                  value={service ? t('common.minutes', { count: service.durationMinutes }) : '—'}
                />
                <Row
                  label={t('booking.summary.when')}
                  value={date && time ? formatDateTime(date, time, locale) : t('booking.summary.notSelected')}
                />
                <div className="flex justify-between border-t border-slate-200 pt-3">
                  <dt className="font-medium text-slate-900">{t('booking.summary.total')}</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {service ? rupees(service.price) : '—'}
                  </dd>
                </div>
              </dl>

              {meta?.rules && (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  {t('booking.holdNote', {
                    hold: meta.rules.pendingHoldMinutes,
                    days: meta.rules.maxDaysAhead,
                    lead: meta.rules.minLeadMinutes,
                  })}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-900">{t('emergency.notice')}</p>
            </div>

            <a
              href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-4 w-full"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              {t('common.needHelp')}
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

/** `code` is a server error code such as 'phone', mapped to `errors.phone`. */
const FieldError = ({ code, t }) =>
  code ? <p className="mt-1 text-sm text-red-600">{t(`errors.${code}`)}</p> : null;
