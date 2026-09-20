import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">{t('notFound.eyebrow')}</p>
      <h1 className="mt-2.5 text-4xl">{t('notFound.title')}</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-600">{t('notFound.body')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-secondary">
          {t('common.backHome')}
        </Link>
        <Link to="/book" className="btn-primary">
          {t('common.book')}
        </Link>
      </div>
    </div>
  );
}
