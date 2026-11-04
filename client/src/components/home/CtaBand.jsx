import { waLink } from '@shared/practice.config.js';
import { Link } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import Magnetic from '../../design/Magnetic.jsx';
import { ArrowRightIcon, WhatsAppIcon } from '../Icons.jsx';

export default function CtaBand() {
  const { t } = useI18n();

  return (
    <section className="bg-cream pb-20 pt-4 sm:pb-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-deep px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="hero-light pointer-events-none absolute -left-1/4 top-0 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(127,213,201,0.22),transparent)]" aria-hidden="true" />
          <div className="hero-light-2 pointer-events-none absolute -right-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(226,165,135,0.18),transparent)]" aria-hidden="true" />
          <h2 className="display-lg relative mx-auto max-w-2xl !text-white">{t('home.ctaTitle')}</h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">{t('home.ctaBody')}</p>
          <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Magnetic>
              <Link to="/book" className="btn btn-lg w-full bg-[#fffdf9] text-[#0b4a46] hover:bg-[#eef8f5] focus-visible:ring-white sm:w-auto">
                {t('common.book')}
                <ArrowRightIcon />
              </Link>
            </Magnetic>
            <a
              href={waLink(t('whatsapp.booking', { doctor: t('doctor.name') }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg border border-white/30 text-white hover:bg-white/10 focus-visible:ring-white"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t('home.ctaWhatsApp')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
