import { useI18n } from '../../i18n/index.jsx';
import { DOCTOR } from '@shared/practice.config.js';
import Section from '../../design/Section.jsx';
import { RevealGroup, RevealItem } from '../../design/Reveal.jsx';
import { ClockIcon, ShieldIcon, StethoscopeIcon, VideoIcon } from '../Icons.jsx';

const ICONS = [StethoscopeIcon, ClockIcon, ShieldIcon, VideoIcon];

export default function TrustStrip() {
  const { t, tList } = useI18n();

  const points = tList('home.trust').map((point, index) => ({
    ...point,
    // The registration line interpolates live values so it can never drift
    // from the config the rest of the site is built from.
    title: point.title.replace('{years}', String(DOCTOR.yearsExperience)),
    body: point.body
      .replace('{reg}', DOCTOR.registrationNumber)
      .replace('{council}', t('doctor.council')),
    Icon: ICONS[index] || ShieldIcon,
  }));

  return (
    <Section id="trust" eyebrow={t('home.trustEyebrow')} title={t('home.trustTitle')}>
      <RevealGroup as="ul" className="mt-12 grid gap-6 sm:grid-cols-2">
        {points.map(({ title, body, Icon }) => (
          <RevealItem as="li" key={title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-sans text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 leading-relaxed text-slate-600">{body}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
