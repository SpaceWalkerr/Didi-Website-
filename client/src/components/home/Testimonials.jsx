import { FEATURES, TESTIMONIALS } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import Section from '../../design/Section.jsx';

/**
 * Patient feedback — hidden until it is real.
 *
 * Renders nothing unless FEATURES.testimonials is on AND TESTIMONIALS (in
 * shared/practice.config.js) holds genuine feedback that each patient agreed
 * in writing to publish. No placeholder or invented review is ever shown:
 * fabricating testimonials for a medical practice misleads patients and puts
 * the doctor's registration at risk under the professional conduct rules.
 */
export default function Testimonials() {
  const { t } = useI18n();
  if (!FEATURES.testimonials || !TESTIMONIALS.length) return null;

  return (
    <Section id="testimonials" tone="warm" eyebrow={t('testimonials.eyebrow')} title={t('testimonials.title')}>
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <li key={item.quote} className="flex flex-col rounded-3xl border border-slate-200/80 bg-paper p-7 shadow-card">
            <span aria-hidden="true" className="font-display text-5xl leading-none text-clay-500">“</span>
            <blockquote className="mt-2 flex-1 font-display text-xl leading-snug text-ink">{item.quote}</blockquote>
            <p className="mt-6 border-t border-slate-200/80 pt-4 text-[0.9375rem]">
              <span className="block font-semibold text-ink">{item.name}</span>
              {item.meta && <span className="block text-sm text-slate-600">{item.meta}</span>}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[0.9375rem] text-slate-600">{t('testimonials.consentNote')}</p>
    </Section>
  );
}
