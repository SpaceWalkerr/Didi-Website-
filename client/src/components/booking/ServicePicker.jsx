import { rupees } from '../../lib/format.js';
import { useI18n } from '../../i18n/index.jsx';
import { ClockIcon } from '../Icons.jsx';

/**
 * Consultation type. A real radio group, so arrow keys move between options
 * and a screen reader announces "2 of 3".
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
              className={`relative grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-3xl border p-4 sm:flex sm:flex-col sm:items-stretch transition-[transform,border-color,background-color,box-shadow] duration-300 ease-calm active:scale-[0.98]
                          focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 ${
                            selected
                              ? 'border-brand-600 bg-brand-50 shadow-glow'
                              : 'border-slate-200 bg-paper hover:border-brand-300'
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
              <span
                aria-hidden="true"
                className={`absolute right-4 top-4 hidden sm:flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                  selected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                }`}
              >
                <span className={`h-2 w-2 rounded-full bg-paper transition-transform duration-300 ${selected ? 'scale-100' : 'scale-0'}`} />
              </span>
              <span className="font-display text-lg leading-snug text-ink sm:pr-7">{t(`services.items.${service.id}.name`)}</span>
              <span className="row-span-2 font-display text-2xl font-medium text-brand-700 sm:order-last sm:mt-3">
                {rupees(service.price)}
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-600 sm:mt-1">
                <ClockIcon className="h-4 w-4" />
                {t('common.minutesShort', { count: service.durationMinutes })}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
