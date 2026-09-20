import { Link } from 'react-router-dom';
import { waLink } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';
import Reveal from '../../design/Reveal.jsx';
import { ArrowRightIcon, WhatsAppIcon } from '../Icons.jsx';

export default function CtaBand() {
  const { t } = useI18n();

  return (
    <section className="container-page pb-16 pt-4 sm:pb-20">
      <Reveal className="rounded-3xl bg-brand-700 px-6 py-14 text-center sm:px-12">
        <h2 className="mx-auto max-w-xl text-3xl text-white sm:text-[2.1rem]">{t('home.ctaTitle')}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-brand-100">
          {t('home.ctaBody')}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/book"
            className="btn bg-white text-base text-brand-800 hover:bg-brand-50 focus-visible:ring-white"
          >
            {t('common.book')}
            <ArrowRightIcon />
          </Link>
          <a
            href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border border-brand-400 text-base text-white hover:bg-brand-600 focus-visible:ring-white"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t('home.ctaWhatsApp')}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
