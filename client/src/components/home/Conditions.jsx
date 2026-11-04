import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import Section from '../../design/Section.jsx';
import { ArrowRightIcon } from '../Icons.jsx';

/** What a general physician handles — an editorial list, not a card grid. */
export default function Conditions() {
  const { t, tList } = useI18n();

  return (
    <Section
      id="conditions"
      tone="warm"
      eyebrow={t('conditions.eyebrow')}
      title={t('conditions.title')}
      lede={t('conditions.lede')}
      aside={
        <Link to="/services" className="btn-secondary shrink-0 self-start lg:self-end">
          {t('common.seeServices')}
          <ArrowRightIcon />
        </Link>
      }
    >
      <ul className="mt-14 grid border-t border-slate-300/70 sm:grid-cols-2 lg:grid-cols-3">
        {tList('conditions.items').map((item, i) => (
          <li
            key={item.title}
            className="reveal group border-b border-slate-300/70 py-7 sm:pr-8"
            style={{ transitionDelay: `${(i % 3) * 90}ms` }}
          >
            <span className="font-display text-sm text-clay-700 tabular-nums">0{i + 1}</span>
            <h3 className="mt-3 font-display text-[1.6rem] leading-tight text-ink">{item.title}</h3>
            <p className="mt-3 max-w-sm leading-relaxed text-slate-600">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
