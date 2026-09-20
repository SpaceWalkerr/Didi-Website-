import { useI18n } from '../../i18n/index.jsx';
import Section from '../../design/Section.jsx';
import Badge from '../../design/Badge.jsx';
import { RevealGroup, RevealItem } from '../../design/Reveal.jsx';
import { AlertIcon, UserIcon } from '../Icons.jsx';

/**
 * ⚠ PLACEHOLDER CONTENT.
 *
 * These are layout placeholders, not reviews. No invented patient feedback
 * appears anywhere on this site: fabricating testimonials for a medical
 * practice misleads patients making a health decision, and in India it would
 * also put the doctor's registration at risk under the advertising provisions
 * of the professional conduct regulations.
 *
 * To go live: replace `testimonials.items` in each i18n file with real,
 * consented feedback and delete the placeholder notice below.
 */
export default function Testimonials() {
  const { t, tList } = useI18n();

  return (
    <Section
      id="testimonials"
      tone="warm"
      eyebrow={t('testimonials.eyebrow')}
      title={t('testimonials.title')}
    >
      {/* Visible, unmissable, and in the patient's own language. */}
      <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <Badge tone="amber">{t('testimonials.placeholderLabel')}</Badge>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-900">
            {t('testimonials.placeholderBody')}
          </p>
        </div>
      </div>

      <RevealGroup as="ul" className="mt-10 grid gap-6 md:grid-cols-3">
        {tList('testimonials.items').map((item, index) => (
          <RevealItem
            as="li"
            key={index}
            className="flex flex-col rounded-2xl border border-dashed border-surface-300 bg-white/70 p-6"
          >
            <blockquote className="flex-1 text-[15px] italic leading-relaxed text-slate-500">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-surface-200 pt-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-slate-400">
                <UserIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-medium text-slate-500">{item.name}</span>
                <span className="block text-sm text-slate-400">{item.meta}</span>
              </span>
            </figcaption>
          </RevealItem>
        ))}
      </RevealGroup>

      <p className="mt-8 text-center text-sm text-slate-500">{t('testimonials.consentNote')}</p>
    </Section>
  );
}
