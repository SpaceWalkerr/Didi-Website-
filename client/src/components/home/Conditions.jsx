import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import Section from '../../design/Section.jsx';
import { RevealGroup, RevealItem } from '../../design/Reveal.jsx';
import { ArrowRightIcon, CheckIcon } from '../Icons.jsx';

/** Conditions and services a general physician handles. */
export default function Conditions() {
  const { t, tList } = useI18n();

  return (
    <Section
      id="conditions"
      tone="warm"
      eyebrow={t('conditions.eyebrow')}
      title={t('conditions.title')}
      lede={t('conditions.lede')}
    >
      <RevealGroup as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tList('conditions.items').map((item) => (
          <RevealItem
            as="li"
            key={item.title}
            className="rounded-2xl border border-surface-300/70 bg-white p-6 shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <CheckIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-sans text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{item.body}</p>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="mt-10 text-center">
        <Link to="/services" className="btn-secondary">
          {t('common.seeServices')}
          <ArrowRightIcon />
        </Link>
      </div>
    </Section>
  );
}
