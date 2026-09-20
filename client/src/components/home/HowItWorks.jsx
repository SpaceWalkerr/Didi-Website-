import { useI18n } from '../../i18n/index.jsx';
import Section from '../../design/Section.jsx';
import { RevealGroup, RevealItem } from '../../design/Reveal.jsx';
import { CalendarIcon, CheckIcon, VideoIcon } from '../Icons.jsx';

const ICONS = [CalendarIcon, CheckIcon, VideoIcon];

export default function HowItWorks() {
  const { t, tList } = useI18n();

  return (
    <Section
      id="how-it-works"
      eyebrow={t('home.stepsEyebrow')}
      title={t('home.stepsTitle')}
      lede={t('home.stepsBody')}
    >
      <RevealGroup as="ol" className="mt-12 grid gap-6 md:grid-cols-3">
        {tList('home.steps').map((step, index) => {
          const Icon = ICONS[index] || CheckIcon;
          return (
            <RevealItem as="li" key={step.title} className="card relative">
              <span
                aria-hidden="true"
                className="absolute right-5 top-4 font-display text-5xl font-semibold text-brand-50"
              >
                {index + 1}
              </span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-4 font-sans text-lg font-semibold">{step.title}</h3>
              <p className="relative mt-2 leading-relaxed text-slate-600">{step.body}</p>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
