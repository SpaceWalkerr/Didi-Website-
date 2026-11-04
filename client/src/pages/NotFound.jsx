import { Link } from '../lib/router.jsx';
import { useI18n } from '../i18n/index.jsx';
import Seo from '../components/seo/Seo.jsx';
import { ArrowRightIcon } from '../components/Icons.jsx';

/** A resting trace that flatlines, then finds its rhythm again. */
function LostLine() {
  return (
    <svg viewBox="0 0 600 120" className="mx-auto h-24 w-full max-w-lg" aria-hidden="true">
      <path
        d="M0 70 H180 C200 70 205 70 215 70 L230 70 L240 30 L252 100 L262 70 H600"
        pathLength="1"
        fill="none"
        stroke="rgb(var(--c-brand-500))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ecg-draw"
      />
      <circle cx="600" cy="70" r="5" fill="rgb(var(--c-clay-500))" className="ecg-dot" />
    </svg>
  );
}

export default function NotFound() {
  const { t } = useI18n();

  return (
    <>
      <Seo title={t('notFound.title')} description={t('notFound.body')} noIndex />
      <section className="relative overflow-hidden bg-cream">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_10%,rgb(var(--c-brand-100)),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative py-20 text-center sm:py-28">
          <p className="eyebrow justify-center">{t('notFound.eyebrow')}</p>
          <p className="mt-6 font-display text-[clamp(5rem,18vw,10rem)] font-medium leading-none text-brand-200" aria-hidden="true">
            4<span className="accent-word !text-clay-500">0</span>4
          </p>
          <LostLine />
          <h1 className="display-lg mx-auto mt-6 max-w-xl">{t('notFoundPlus.title')}</h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-600">{t('notFoundPlus.body')}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/book" className="btn-primary btn-lg">
              {t('common.book')}
              <ArrowRightIcon />
            </Link>
            <Link to="/" className="btn-secondary btn-lg">
              {t('common.backHome')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
