import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';

/** Inline field error. Tied to its input by id so it is announced on focus. */
function FieldError({ id, code }) {
  const { t } = useI18n();
  if (!code) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-700">
      {t(`errors.${code}`)}
    </p>
  );
}

/**
 * Patient details.
 *
 * Every input carries an explicit autoComplete value: on a phone this is the
 * difference between one tap and typing a mobile number by hand. `inputMode`
 * brings up the numeric keypad for the number fields.
 */
export default function PatientForm({ patient, errors, onChange, bodyRegion }) {
  const { t } = useI18n();

  const err = (key) => (errors[key] ? 'input-error' : '');
  const describedBy = (key) => (errors[key] ? `${key}-error` : undefined);

  return (
    <div className="space-y-5">
      {/* Shown when the visitor arrived from the body map, so it is obvious
          where the pre-filled first line came from and that it can be edited. */}
      {bodyRegion && (
        <p className="rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-[0.9375rem] text-brand-900">
          {t('booking.fromBodyMap', { area: t(`bodyMap.regions.${bodyRegion}.label`) })}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">{t('booking.fields.name')}</label>
          <input
            id="name" name="name" type="text" maxLength={100} autoComplete="name" required
            className={`input ${err('name')}`}
            value={patient.name} onChange={onChange('name')}
            aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')}
          />
          <FieldError id="name-error" code={errors.name} />
        </div>

        <div>
          <label htmlFor="age" className="label">{t('booking.fields.age')}</label>
          <input
            id="age" name="age" type="number" min="0" max="120" inputMode="numeric"
            className={`input ${err('age')}`}
            value={patient.age} onChange={onChange('age')}
            aria-invalid={Boolean(errors.age)} aria-describedby={describedBy('age')}
          />
          <FieldError id="age-error" code={errors.age} />
        </div>
      </div>

      <div>
        <label htmlFor="gender" className="label">{t('booking.fields.gender')}</label>
        <select id="gender" name="gender" className="input" value={patient.gender} onChange={onChange('gender')}>
          <option value="">{t('booking.fields.genderUnspecified')}</option>
          <option value="female">{t('booking.fields.genderFemale')}</option>
          <option value="male">{t('booking.fields.genderMale')}</option>
          <option value="other">{t('booking.fields.genderOther')}</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">{t('booking.fields.phone')}</label>
          <input
            id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required
            placeholder={t('booking.fields.phonePlaceholder')}
            className={`input ${err('phone')}`}
            value={patient.phone} onChange={onChange('phone')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
          />
          <FieldError id="phone-error" code={errors.phone} />
          {!errors.phone && <p id="phone-hint" className="hint">{t('booking.fields.phoneHint')}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">{t('booking.fields.email')}</label>
          <input
            id="email" name="email" type="email" maxLength={254} autoComplete="email" required
            className={`input ${err('email')}`}
            value={patient.email} onChange={onChange('email')}
            aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')}
          />
          <FieldError id="email-error" code={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="symptoms" className="label">{t('booking.fields.symptoms')}</label>
        <textarea
          id="symptoms" name="symptoms" rows={5} maxLength={2000} required
          className={`input resize-y ${err('symptoms')}`}
          placeholder={t('booking.fields.symptomsPlaceholder')}
          value={patient.symptoms} onChange={onChange('symptoms')}
          aria-invalid={Boolean(errors.symptoms)}
          aria-describedby={errors.symptoms ? 'symptoms-error' : 'symptoms-hint'}
        />
        <FieldError id="symptoms-error" code={errors.symptoms} />
        {!errors.symptoms && <p id="symptoms-hint" className="hint">{t('booking.fields.symptomsHint')}</p>}
      </div>

      {/*
        Consent is a legal requirement under the Telemedicine Practice
        Guidelines, and health data is collected here, so it is an explicit
        unchecked box with the privacy policy linked in reach — never a
        pre-ticked box or an "by continuing you agree" line.
      */}
      <div
        className={`rounded-xl border p-4 ${
          errors.consent ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-surface'
        }`}
      >
        <label htmlFor="consent" className="flex cursor-pointer gap-3">
          <input
            id="consent" name="consent" type="checkbox" required
            className="mt-1 h-5 w-5 shrink-0 rounded border-slate-400 text-brand-600
                       focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            checked={patient.consent} onChange={onChange('consent')}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
          />
          <span className="text-[0.9375rem] leading-relaxed text-slate-700">{t('booking.consent')}</span>
        </label>
        <FieldError id="consent-error" code={errors.consent} />
        <p className="mt-2.5 pl-8 text-sm text-slate-600">
          <Link to="/privacy" className="font-medium text-brand-700 underline">
            {t('legal.privacy.navLabel')}
          </Link>
          {' · '}
          <Link to="/terms" className="font-medium text-brand-700 underline">
            {t('legal.terms.navLabel')}
          </Link>
        </p>
      </div>
    </div>
  );
}
