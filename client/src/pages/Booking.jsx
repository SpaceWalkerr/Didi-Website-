import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateField, validatePatient } from '../lib/validate.js';
import HoldTimer from '../components/booking/HoldTimer.jsx';
import { api } from '../lib/api.js';
import { openCheckout } from '../lib/razorpay.js';
import { rupees, upcomingDates } from '../lib/format.js';
import { waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import StepIndicator from '../design/StepIndicator.jsx';
import ServicePicker from '../components/booking/ServicePicker.jsx';
import DatePicker from '../components/booking/DatePicker.jsx';
import SlotGrid from '../components/booking/SlotGrid.jsx';
import PatientForm from '../components/booking/PatientForm.jsx';
import UpiPayment from '../components/booking/UpiPayment.jsx';
import Summary from '../components/booking/Summary.jsx';
import { REGION_IDS } from '../components/bodymap/regions.js';
import { AlertIcon, ArrowRightIcon, WhatsAppIcon } from '../components/Icons.jsx';
import Seo from '../components/seo/Seo.jsx';
import { Bone } from '../design/Skeleton.jsx';

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
  // ?date=&time= arrive from the hero's "Next available" chip. Both are only
  // suggestions: the date must be bookable and the time must still be free.
  const [date, setDate] = useState(() => (/^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') ? params.get('date') : ''));
  const [time, setTime] = useState('');
  const wantedTime = useRef(/^\d{2}:\d{2}$/.test(params.get('time') || '') ? params.get('time') : null);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  /**
   * The body map sends the visitor here as ?area=chest&topic=Palpitations.
   * The area is validated against the published region list, so a hand-edited
   * URL cannot inject text into the form — and the same id is sent to the API,
   * which validates it again against the shared list before storing it.
   */
  const bodyRegion = useMemo(() => {
    const area = params.get('area');
    return REGION_IDS.includes(area) ? area : null;
  }, [params]);

  const [patient, setPatient] = useState(() => {
    if (!bodyRegion) return emptyPatient;
    const label = t(`bodyMap.regions.${bodyRegion}.label`);
    const topic = params.get('topic');
    // Only a concern the region actually offers is accepted.
    const known = tList(`bodyMap.regions.${bodyRegion}.concerns`).includes(topic);
    return {
      ...emptyPatient,
      symptoms: known
        ? t('booking.prefillTopic', { area: label, topic })
        : t('booking.prefillArea', { area: label }),
    };
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  // Set when the server claims the slot; drives the "slot held" ring.
  const [hold, setHold] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState(false);
  // Set once a booking is created in manual-UPI mode; replaces the details form.
  const [upiBooking, setUpiBooking] = useState(null);

  const detailsRef = useRef(null);
  const errorRef = useRef(null);
  const dates = useMemo(() => upcomingDates(31, locale), [locale]);
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
    if (!meta) return;
    if (date) {
      const ok = date >= meta.minDate && date <= meta.maxDate && dates.some((d) => d.value === date && (!meta.openDays?.length || meta.openDays.includes(d.dow)));
      if (ok) return;
    }
    const firstOpen = dates.find(
      (d) => d.value >= meta.minDate && (!meta.openDays?.length || meta.openDays.includes(d.dow)),
    );
    setDate(firstOpen?.value || meta.minDate);
  }, [meta, date, dates]);

  const loadSlots = useCallback(async () => {
    if (!date || !serviceId) return;
    setSlotsLoading(true);
    try {
      const data = await api.slots(date, serviceId);
      setSlots(data.slots);
      // Honour a time carried in from the hero chip, once, if it is still free.
      if (wantedTime.current) {
        const wanted = data.slots.find((sl) => sl.time === wantedTime.current && sl.available);
        wantedTime.current = null;
        if (wanted) setTime(wanted.time);
      }
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

  // Move focus to a submission error so it is announced rather than silently
  // appearing above the fold the patient is no longer looking at.
  useEffect(() => {
    if (submitError) errorRef.current?.focus();
  }, [submitError]);

  const goToDetails = () => {
    if (!time) return;
    setStep(1);
    // On a phone the form is below the fold after the slot grid.
    requestAnimationFrame(() =>
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const updatePatient = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setPatient((prev) => {
      const next = { ...prev, [key]: value };
      // Once a field has been visited, re-check it as the patient types, so
      // an error clears the moment it is fixed (and a tick appears).
      if (touched[key] || key === 'consent') {
        setFieldErrors((errs) => ({ ...errs, [key]: validateField(key, next) || undefined }));
      } else {
        setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
      }
      return next;
    });
  };

  /** Inline validation on leaving a field — never while the patient is still typing it. */
  const blurPatient = (key) => () => {
    const value = patient[key];
    if (key !== 'consent' && (value === '' || value === undefined)) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldErrors((errs) => ({ ...errs, [key]: validateField(key, patient) || undefined }));
  };

  const validFields = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(touched).map((k) => [k, touched[k] && !validateField(k, patient) && patient[k] !== '']),
      ),
    [touched, patient],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);

    // Same rules as the server: show every problem now, focus the first.
    const problems = validatePatient(patient);
    if (Object.keys(problems).length) {
      setFieldErrors(problems);
      setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(problems).map((k) => [k, true])) }));
      setSubmitError(t('errors.fieldsInvalid'));
      const first = ['name', 'age', 'phone', 'email', 'symptoms', 'consent'].find((k) => problems[k]);
      requestAnimationFrame(() => document.getElementById(first)?.focus());
      return;
    }

    setFieldErrors({});
    setPaying(true);

    let created;
    try {
      // The language travels with the booking so confirmations can be sent in
      // it, and so the doctor knows which language to expect on the call.
      // bodyRegion goes too, which is what makes "which areas do patients
      // actually book about" answerable later.
      created = await api.createBooking({
        date, time, service: serviceId, patient, language, bodyRegion,
      });
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
    setHold({ startedAt: Date.now(), minutes: created.holdMinutes || meta?.rules?.pendingHoldMinutes || 15 });

    if (created.paymentMode === 'upi') {
      setPaying(false);
      setUpiBooking(created);
      return;
    }

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
      navigate(`/confirmation/${created.bookingId}`, { viewTransition: true });
    } catch (err) {
      setPaying(false);
      setStep(1);
      setHold(null);
      setSubmitError(err.messageKey ? t(err.messageKey, err.params || {}) : err.message);
      api.cancelPayment(created.bookingId).catch(() => {});
      loadSlots();
    }
  }

  async function submitUtr(utr) {
    setSubmitError(null);
    setPaying(true);
    try {
      await api.upiSubmit(upiBooking.bookingId, utr);
      navigate(`/confirmation/${upiBooking.bookingId}`, { viewTransition: true });
    } catch (err) {
      setPaying(false);
      setSubmitError(translateError(err));
    }
  }

  async function cancelUpi() {
    const id = upiBooking.bookingId;
    setUpiBooking(null);
    setHold(null);
    setSubmitError(null);
    setStep(0);
    setTime('');
    await api.cancelPayment(id).catch(() => {});
    loadSlots();
  }

  if (metaError) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg text-center">
          <h1 className="text-2xl">{t('booking.unavailableTitle')}</h1>
          <p className="mt-3 leading-relaxed text-slate-600">
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
      <Seo title={t('booking.title')} description={t('booking.description')} noIndex />
      <PageIntro compact eyebrow={t('booking.eyebrow')} title={t('booking.title')} lede={t('booking.description')} />

      <div className="container-page pb-16 pt-6 sm:pb-20 sm:pt-8">
        <StepIndicator steps={tList('booking.steps')} current={step} label={t('booking.progressAria')} />

        {meta?.paymentMode === 'mock' && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-[0.9375rem] leading-relaxed text-amber-900">
              <strong className="font-semibold">{t('booking.demoTitle')}</strong>{' '}
              {t('booking.demoBody')}
            </p>
          </div>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            {/* ── Step 1: slot ─────────────────────────────────────────── */}
            <section aria-labelledby="step1" className="card sm:p-8">
              <h2 id="step1" className="display-md !text-[1.5rem]">{t('booking.step1Title')}</h2>

              <div className="mt-5 space-y-6">
                {meta ? (
                  <ServicePicker services={meta.services} value={serviceId} onChange={setServiceId} />
                ) : (
                  // Same footprint as the picker, so nothing below moves when it arrives.
                  <div aria-hidden="true">
                    <Bone className="h-5 w-40 rounded-full" />
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[0, 1, 2].map((i) => (
                        <Bone key={i} className="h-[4.75rem] rounded-3xl sm:h-[7.25rem]" />
                      ))}
                    </div>
                  </div>
                )}

                <DatePicker
                  dates={dates}
                  value={date}
                  onChange={setDate}
                  minDate={meta?.minDate}
                  maxDate={meta?.maxDate}
                  openDays={meta?.openDays}
                />

                <div>
                  <p className="label">{t('booking.availableTimes')}</p>
                  <SlotGrid slots={slots} loading={slotsLoading} value={time} onChange={setTime} />
                </div>
              </div>

              {step === 0 && (
                // Sticks to the bottom of the screen on a phone while the slot
                // card is in view, so Continue is never a scroll away.
                <div className={`z-10 mt-6 rounded-full sm:static ${time ? 'sticky bottom-3 shadow-lift' : ''}`}>
                  <button type="button" onClick={goToDetails} disabled={!time} className="btn-primary btn-lg w-full sm:w-auto">
                    {t('booking.continue')}
                    <ArrowRightIcon />
                  </button>
                </div>
              )}
            </section>

            {/* ── Step 2: details + pay ────────────────────────────────── */}
            {step >= 1 && (
              <section aria-labelledby="step2" ref={detailsRef} className="card scroll-mt-24 sm:p-8" style={{ animation: 'rise .6s var(--ease-calm) both' }}>
                <h2 id="step2" className="display-md !text-[1.5rem]">{t('booking.step2Title')}</h2>
                <p className="mt-2 text-slate-600">
                  {upiBooking ? t('booking.upi.intro') : t('booking.step2Body')}
                </p>

                {submitError && (
                  <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-[0.9375rem] leading-relaxed text-red-900"
                  >
                    {submitError}
                  </div>
                )}

                {hold && (upiBooking || paying) && (
                  <div className="mt-5">
                    <HoldTimer startedAt={hold.startedAt} minutes={hold.minutes} />
                  </div>
                )}

                {upiBooking && (
                  <UpiPayment
                    upi={upiBooking.upi}
                    amount={upiBooking.amount}
                    bookingId={upiBooking.bookingId}
                    onSubmit={submitUtr}
                    onCancel={cancelUpi}
                    busy={paying}
                    error={null}
                  />
                )}

                {!upiBooking && (
                <form onSubmit={handleSubmit} className="mt-6" noValidate>
                  <PatientForm
                    patient={patient}
                    errors={fieldErrors}
                    onChange={updatePatient}
                    onBlur={blurPatient}
                    valid={validFields}
                    bodyRegion={bodyRegion}
                  />

                  <button type="submit" disabled={paying} className="btn-primary btn-lg mt-7 w-full">
                    {paying
                      ? t('booking.paying')
                      : t(meta?.paymentMode === 'upi' ? 'booking.payUpi' : 'booking.pay', {
                          amount: service ? rupees(service.price) : '',
                        })}
                  </button>
                </form>
                )}
              </section>
            )}
          </div>

          <Summary service={service} date={date} time={time} rules={meta?.rules} paymentMode={meta?.paymentMode} held={Boolean(hold)} />
        </div>
      </div>
    </>
  );
}
