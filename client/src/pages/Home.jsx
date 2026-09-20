import { useI18n } from '../i18n/index.jsx';
import Section from '../design/Section.jsx';
import Hero from '../components/home/Hero.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import Conditions from '../components/home/Conditions.jsx';
import TrustStrip from '../components/home/TrustStrip.jsx';
import Testimonials from '../components/home/Testimonials.jsx';
import FaqAccordion from '../components/home/FaqAccordion.jsx';
import CtaBand from '../components/home/CtaBand.jsx';
import BodyMap from '../components/bodymap/BodyMap.jsx';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons.jsx';

export default function Home() {
  const { t, tList } = useI18n();

  return (
    <>
      <Hero />

      {/* Signature feature — placed straight after the hero because it is the
          fastest route from "something hurts" to "book a consultation". */}
      <Section
        id="body-map"
        tone="plain"
        eyebrow={t('bodyMap.eyebrow')}
        title={t('bodyMap.title')}
        lede={t('bodyMap.lede')}
      >
        <BodyMap />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          {t('bodyMap.footnote')}
        </p>
      </Section>

      <Conditions />
      <HowItWorks />
      <TrustStrip />
      <Testimonials />

      <Section id="faq" eyebrow={t('faq.eyebrow')} title={t('faq.title')} lede={t('faq.lede')}>
        {/* Only the first four here; the rest live on the FAQ page. */}
        <FaqAccordion items={tList('faq.items')} limit={4} />
        <div className="mt-8 text-center">
          <Link to="/faq" className="btn-secondary">
            {t('footer.faqLink')}
            <ArrowRightIcon />
          </Link>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
