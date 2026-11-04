import { rupees } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { ClockIcon } from '../Icons.jsx';

/**
 * Consultation type. A real radio group, so arrow keys move between options
 * and a screen reader announces "2 of 3" — which a div with a click handler
 * does not.
 */
export default function ServicePicker({ services, value, onChange }) {
  const { t } = useI18n();

  return (
    <fieldset>
      <legend className="label">{t('booking.consultationType')}</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {services.map((service) => {
          const selected = value === service.id;
          return (
            <label
              key={service.id}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors
                          focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 ${
                            selected
                              ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-300'
                              : 'border-slate-300 bg-paper hover:border-brand-300 hover:bg-brand-50/40'
                          }`}
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={selected}
                onChange={() => onChange(service.id)}
                className="sr-only"
              />
              <span className="font-medium text-slate-900">
                {t(`services.items.${service.id}.name`)}
              </span>
              <span className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                <ClockIcon className="h-4 w-4 text-brand-600" />
                {t('common.minutesShort', { count: service.durationMinutes })}
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-brand-800">{rupees(service.price)}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
