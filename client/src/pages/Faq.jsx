import { waLink } from '@shared/practice.config.js';
import { useI18n } from '../i18n/index.jsx';
import PageIntro from '../design/PageIntro.jsx';
import FaqAccordion from '../components/home/FaqAccordion.jsx';
import { WhatsAppIcon } from '../components/Icons.jsx';

export default function Faq() {
  const { t, tList } = useI18n();

  return (
    <>
      <PageIntro eyebrow={t('faq.eyebrow')} title={t('faq.title')} lede={t('faq.lede')} />

      <div className="container-page py-12 sm:py-16">
        <FaqAccordion items={tList('faq.items')} />

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50/60 p-6 text-center sm:p-8">
          <h2 className="font-sans text-xl font-semibold">{t('faq.stillStuckTitle')}</h2>
          <p className="mx-auto mt-2.5 max-w-xl leading-relaxed text-slate-700">
            {t('faq.stillStuckBody')}
          </p>
          <a
            href={waLink(t('whatsapp.contact', { doctor: t('doctor.name') }))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t('common.chatWhatsApp')}
          </a>
        </div>
      </div>
    </>
  );
}
